// Order Tracking System - Track orders by tracking number and notify customers
// Manages order status updates, tracking numbers, and arrival notifications

import { db } from '../supabase/client.js';

export default {
  trackOrderByNumber: {
    ttl: 60, // 1 minute cache - tracking info changes frequently
    fallbackResponse: "I'm having trouble accessing the tracking system right now. Let me connect you with our customer service team for immediate assistance.",
    cacheable: true,
    
    async execute(parameters, callContext) {
      const { tracking_number, order_id, customer_phone } = parameters;
      const customerLanguage = callContext.customerProfile?.preferredLanguage || 'en';
      const customerName = callContext.customerProfile?.name || '';
      
      console.log(`📦 Tracking order - Number: ${tracking_number}, Customer: ${customerName}`);
      
      try {
        // Get tracking information
        const trackingInfo = await getTrackingInfo(tracking_number || order_id, customer_phone);
        
        if (!trackingInfo) {
          return await handleTrackingNotFound(tracking_number || order_id, customerLanguage);
        }
        
        // Format response based on order status
        const response = await formatTrackingResponse(trackingInfo, customerLanguage, customerName);
        
        // Track this inquiry
        await db.trackEvent('order_tracking_inquiry', {
          tracking_number: tracking_number,
          order_status: trackingInfo.status,
          customer_language: customerLanguage,
          found: true
        }, callContext.conversationId);
        
        return response;
        
      } catch (error) {
        console.error('❌ Order tracking error:', error);
        
        await db.trackEvent('order_tracking_error', {
          tracking_number: tracking_number,
          error: error.message,
          customer_language: customerLanguage
        }, callContext.conversationId);
        
        return {
          success: false,
          message: customerLanguage === 'el'
            ? 'Αντιμετωπίζω πρόβλημα με το σύστημα tracking. Ας σας συνδέσω με την εξυπηρέτηση πελατών.'
            : "I'm having trouble with the tracking system. Let me connect you with customer service.",
          transfer_to_human: true
        };
      }
    }
  },
  
  checkOrderArrivals: {
    ttl: 300, // 5 minutes - arrival notifications don't change frequently  
    fallbackResponse: "I can't check new arrivals right now, but I can help you track a specific order if you have a tracking number.",
    cacheable: true,
    
    async execute(parameters, callContext) {
      const { customer_phone, customer_email } = parameters;
      const customerLanguage = callContext.customerProfile?.preferredLanguage || 'en';
      const customerName = callContext.customerProfile?.name || '';
      
      try {
        // Get customer's recent orders that have arrived
        const arrivals = await getCustomerArrivals(customer_phone, customer_email);
        
        if (!arrivals || arrivals.length === 0) {
          return {
            success: true,
            message: customerLanguage === 'el'
              ? 'Δεν έχω νέες παραδόσεις για εσάς αυτή τη στιγμή. Όλες οι παραγγελίες σας είναι ενημερωμένες.'
              : 'No new arrivals for you at the moment. All your orders are up to date.',
            arrivals: []
          };
        }
        
        return await formatArrivalsResponse(arrivals, customerLanguage, customerName);
        
      } catch (error) {
        console.error('❌ Order arrivals check error:', error);
        
        return {
          success: false,
          message: customerLanguage === 'el'
            ? 'Δεν μπορώ να ελέγξω τις παραδόσεις αυτή τη στιγμή.'
            : "I can't check arrivals right now.",
          transfer_to_human: false
        };
      }
    }
  },
  
  updateOrderStatus: {
    ttl: 0, // No caching - status updates are immediate
    fallbackResponse: "I'm having trouble updating the order status. Please contact our customer service team.",
    cacheable: false,
    
    async execute(parameters, callContext) {
      const { tracking_number, new_status, location, estimated_delivery } = parameters;
      const customerLanguage = callContext.customerProfile?.preferredLanguage || 'en';
      
      try {
        // This would typically be called by internal systems, not customers
        const updated = await updateTrackingStatus(tracking_number, new_status, location, estimated_delivery);
        
        if (updated) {
          // Trigger notification to customer if applicable
          if (new_status === 'arrived' || new_status === 'ready_for_pickup') {
            await notifyCustomerOfArrival(tracking_number, customerLanguage);
          }
          
          return {
            success: true,
            message: `Order ${tracking_number} updated to ${new_status}`,
            notification_sent: new_status === 'arrived' || new_status === 'ready_for_pickup'
          };
        }
        
        return {
          success: false,
          message: 'Failed to update order status'
        };
        
      } catch (error) {
        console.error('❌ Order status update error:', error);
        return {
          success: false,
          message: error.message
        };
      }
    }
  }
};

// Get tracking information for an order
async function getTrackingInfo(trackingNumber, customerPhone) {
  try {
    // Sample tracking data (1000-1010 as requested)
    const sampleOrders = generateSampleTrackingData();
    
    // Try to find by tracking number first
    let order = sampleOrders.find(o => o.tracking_number === trackingNumber || o.order_id === trackingNumber);
    
    // If not found and we have a customer phone, search by phone
    if (!order && customerPhone) {
      order = sampleOrders.find(o => o.customer_phone === customerPhone);
    }
    
    // In production, this would query the actual database
    if (order) {
      return order;
    }
    
    // Try database query (for real orders)
    const result = await db.supabase
      .from('orders')
      .select('*')
      .or(`tracking_number.eq.${trackingNumber},order_id.eq.${trackingNumber}`)
      .limit(1);
    
    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting tracking info:', error);
    return null;
  }
}

// Generate sample tracking data (1000-1010)
function generateSampleTrackingData() {
  const statuses = ['processing', 'shipped', 'in_transit', 'arrived', 'ready_for_pickup', 'delivered'];
  const carriers = ['Cyprus Post', 'ACS Courier', 'Speedex', 'DHL Cyprus'];
  const locations = ['Nicosia Distribution Center', 'Limassol Hub', 'Larnaca Facility', 'Armenius Store'];
  
  const orders = [];
  
  for (let i = 1000; i <= 1010; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Create realistic order data
    const order = {
      tracking_number: i.toString(),
      order_id: `ARM-${i}`,
      customer_name: `Customer ${i}`,
      customer_phone: `+357${22000000 + i}`,
      customer_email: `customer${i}@example.com`,
      status: status,
      carrier: carrier,
      current_location: location,
      order_date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      shipped_date: status !== 'processing' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      estimated_delivery: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          name: i % 2 === 0 ? 'RTX 4090 Graphics Card' : 'AMD Ryzen 9 7900X Processor',
          quantity: 1,
          price: i % 2 === 0 ? 1699.99 : 399.99
        }
      ],
      total_amount: i % 2 === 0 ? 1699.99 : 399.99,
      tracking_history: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Order Confirmed',
          location: 'Armenius Store',
          description: 'Order has been confirmed and is being prepared'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Shipped',
          location: 'Nicosia Distribution Center',
          description: 'Package has been shipped'
        },
        {
          date: new Date().toISOString(),
          status: status,
          location: location,
          description: getStatusDescription(status)
        }
      ]
    };
    
    orders.push(order);
  }
  
  return orders;
}

// Get status description
function getStatusDescription(status) {
  const descriptions = {
    'processing': 'Order is being prepared for shipment',
    'shipped': 'Package has been shipped and is in transit',
    'in_transit': 'Package is on the way to destination',
    'arrived': 'Package has arrived at destination facility',
    'ready_for_pickup': 'Package is ready for pickup at store',
    'delivered': 'Package has been delivered successfully'
  };
  
  return descriptions[status] || 'Status updated';
}

// Format tracking response for customer
async function formatTrackingResponse(order, language, customerName) {
  const greeting = customerName 
    ? (language === 'el' ? `Γεια σας ${customerName}!` : `Hi ${customerName}!`)
    : (language === 'el' ? 'Γεια σας!' : 'Hello!');
  
  let message;
  
  if (language === 'el') {
    message = `${greeting} Βρήκα την παραγγελία σας!\n\n`;
    message += `📦 TRACKING ΑΡΙΘΜΟΣ: ${order.tracking_number}\n`;
    message += `🏷️ Παραγγελία: ${order.order_id}\n`;
    message += `📊 Κατάσταση: ${translateStatus(order.status, 'el')}\n`;
    message += `🚚 Courier: ${order.carrier}\n`;
    message += `📍 Τρέχουσα Τοποθεσία: ${order.current_location}\n`;
    
    if (order.estimated_delivery) {
      const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('el-GR');
      message += `📅 Εκτιμώμενη Παράδοση: ${deliveryDate}\n`;
    }
    
    message += '\n📋 Προϊόντα:\n';
    order.items?.forEach(item => {
      message += `• ${item.name} (x${item.quantity}) - €${item.price}\n`;
    });
    
    if (order.total_amount) {
      message += `💰 Συνολικό: €${order.total_amount}\n`;
    }
    
    // Status-specific messages
    switch (order.status) {
      case 'arrived':
        message += '\n🎉 Η παραγγελία σας έφτασε! Μπορείτε να την παραλάβετε από το κατάστημα.';
        break;
      case 'ready_for_pickup':
        message += '\n✅ Η παραγγελία σας είναι έτοιμη για παραλαβή!';
        break;
      case 'delivered':
        message += '\n🎊 Η παραγγελία σας παραδόθηκε! Ευχαριστούμε για την επιλογή σας!';
        break;
      case 'in_transit':
        message += '\n🚛 Η παραγγελία σας είναι στο δρόμο προς εσάς!';
        break;
    }
    
  } else {
    message = `${greeting} I found your order!\n\n`;
    message += `📦 TRACKING NUMBER: ${order.tracking_number}\n`;
    message += `🏷️ Order: ${order.order_id}\n`;
    message += `📊 Status: ${translateStatus(order.status, 'en')}\n`;
    message += `🚚 Carrier: ${order.carrier}\n`;
    message += `📍 Current Location: ${order.current_location}\n`;
    
    if (order.estimated_delivery) {
      const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('en-GB');
      message += `📅 Estimated Delivery: ${deliveryDate}\n`;
    }
    
    message += '\n📋 Items:\n';
    order.items?.forEach(item => {
      message += `• ${item.name} (x${item.quantity}) - €${item.price}\n`;
    });
    
    if (order.total_amount) {
      message += `💰 Total: €${order.total_amount}\n`;
    }
    
    // Status-specific messages
    switch (order.status) {
      case 'arrived':
        message += '\n🎉 Your order has arrived! You can pick it up from our store.';
        break;
      case 'ready_for_pickup':
        message += '\n✅ Your order is ready for pickup!';
        break;
      case 'delivered':
        message += '\n🎊 Your order has been delivered! Thank you for choosing Armenius Store!';
        break;
      case 'in_transit':
        message += '\n🚛 Your order is on its way to you!';
        break;
    }
  }
  
  return {
    success: true,
    message: message,
    tracking_info: order,
    can_pickup: order.status === 'ready_for_pickup' || order.status === 'arrived',
    is_delivered: order.status === 'delivered'
  };
}

// Handle when tracking number is not found
async function handleTrackingNotFound(trackingNumber, language) {
  let message;
  
  if (language === 'el') {
    message = `Δεν βρήκα παραγγελία με τον αριθμό tracking "${trackingNumber}".\n\n`;
    message += 'Παρακαλώ επιβεβαιώστε:\n';
    message += '• Ο αριθμός tracking είναι σωστός\n';
    message += '• Η παραγγελία έγινε στο Armenius Store\n';
    message += '• Περάστε τον αριθμό τηλεφώνου σας για αναζήτηση\n\n';
    message += 'Μπορώ να σας βοηθήσω με κάτι άλλο;';
  } else {
    message = `I couldn't find an order with tracking number "${trackingNumber}".\n\n`;
    message += 'Please verify:\n';
    message += '• The tracking number is correct\n';
    message += '• The order was placed at Armenius Store\n';
    message += '• Provide your phone number for search\n\n';
    message += 'Can I help you with anything else?';
  }
  
  return {
    success: false,
    message: message,
    not_found: true,
    suggestion: 'verify_details'
  };
}

// Get customer arrivals
async function getCustomerArrivals(phone, email) {
  try {
    const sampleOrders = generateSampleTrackingData();
    
    // Find orders for this customer that have arrived recently
    const arrivals = sampleOrders.filter(order => 
      (order.customer_phone === phone || order.customer_email === email) &&
      (order.status === 'arrived' || order.status === 'ready_for_pickup')
    );
    
    return arrivals;
  } catch (error) {
    console.error('Error getting customer arrivals:', error);
    return [];
  }
}

// Format arrivals response
async function formatArrivalsResponse(arrivals, language, customerName) {
  const greeting = customerName 
    ? (language === 'el' ? `Γεια σας ${customerName}!` : `Hi ${customerName}!`)
    : (language === 'el' ? 'Γεια σας!' : 'Hello!');
  
  let message;
  
  if (language === 'el') {
    message = `${greeting} Έχετε ${arrivals.length} παραγγελί${arrivals.length > 1 ? 'ες' : 'α'} που έφτασ${arrivals.length > 1 ? 'αν' : 'ε'}!\n\n`;
    
    arrivals.forEach((order, index) => {
      message += `📦 ${index + 1}. Tracking: ${order.tracking_number}\n`;
      message += `   ${translateStatus(order.status, 'el')}\n`;
      message += `   ${order.items?.[0]?.name || 'Παραγγελία'}\n\n`;
    });
    
    message += `Μπορείτε να παραλάβετε ${arrivals.length > 1 ? 'τις παραγγελίες' : 'την παραγγελία'} από το κατάστημά μας!`;
  } else {
    message = `${greeting} You have ${arrivals.length} order${arrivals.length > 1 ? 's' : ''} that ${arrivals.length > 1 ? 'have' : 'has'} arrived!\n\n`;
    
    arrivals.forEach((order, index) => {
      message += `📦 ${index + 1}. Tracking: ${order.tracking_number}\n`;
      message += `   ${translateStatus(order.status, 'en')}\n`;
      message += `   ${order.items?.[0]?.name || 'Order'}\n\n`;
    });
    
    message += `You can pick up your order${arrivals.length > 1 ? 's' : ''} from our store!`;
  }
  
  return {
    success: true,
    message: message,
    arrivals: arrivals,
    pickup_ready: true
  };
}

// Translate order status
function translateStatus(status, language) {
  const translations = {
    'processing': { en: 'Processing', el: 'Σε Επεξεργασία' },
    'shipped': { en: 'Shipped', el: 'Αποστάλθηκε' },
    'in_transit': { en: 'In Transit', el: 'Σε Μεταφορά' },
    'arrived': { en: 'Arrived', el: 'Έφτασε' },
    'ready_for_pickup': { en: 'Ready for Pickup', el: 'Έτοιμο για Παραλαβή' },
    'delivered': { en: 'Delivered', el: 'Παραδόθηκε' }
  };
  
  return translations[status]?.[language] || status;
}

// Update tracking status (for internal use)
async function updateTrackingStatus(trackingNumber, newStatus, location, estimatedDelivery) {
  try {
    // In production, this would update the database
    console.log(`📦 Updating tracking ${trackingNumber}: ${newStatus} at ${location}`);
    
    // For sample data, just return success
    return true;
  } catch (error) {
    console.error('Error updating tracking status:', error);
    return false;
  }
}

// Notify customer of arrival (would integrate with Zapier MCP)
async function notifyCustomerOfArrival(trackingNumber, language) {
  try {
    console.log(`📬 Notifying customer about arrival of ${trackingNumber} in ${language}`);
    
    // This would use Zapier MCP to send SMS/email notifications
    // For now, just log the notification
    return true;
  } catch (error) {
    console.error('Error sending arrival notification:', error);
    return false;
  }
}