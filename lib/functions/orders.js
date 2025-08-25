import { db } from '../supabase/client.js';

// Helper function to detect language
function detectLanguage(text) {
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  return greekRegex.test(text) ? 'el' : 'en';
}

// Helper to format order status in local language
function formatOrderStatus(status, language) {
  const statusMap = {
    en: {
      'pending': 'Pending Payment',
      'paid': 'Paid - Processing',
      'processing': 'Being Prepared',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    },
    el: {
      'pending': 'Εκκρεμεί Πληρωμή',
      'paid': 'Πληρωμένο - Επεξεργασία',
      'processing': 'Προετοιμάζεται',
      'shipped': 'Στάλθηκε',
      'delivered': 'Παραδόθηκε',
      'cancelled': 'Ακυρώθηκε',
      'refunded': 'Επιστράφηκε'
    }
  };
  
  return statusMap[language]?.[status] || status;
}

// Mock orders data (in real implementation, this would be from the orders table)
const mockOrders = [
  {
    id: 'ORD-2024-001234',
    customer_phone: '+35799123456',
    items: [
      { name: 'NVIDIA GeForce RTX 4090 MSI Gaming X Trio 24GB', quantity: 1, price: 1699.99 }
    ],
    total: 1699.99,
    status: 'shipped',
    order_date: '2024-01-15',
    estimated_delivery: '2024-01-18',
    tracking_number: 'CY123456789',
    payment_method: 'Credit Card'
  },
  {
    id: 'ORD-2024-001235',
    customer_phone: '+35799234567',
    items: [
      { name: 'Intel Core i9-13900K', quantity: 1, price: 589.99 },
      { name: 'ASUS ROG Maximus Z790 Hero', quantity: 1, price: 499.99 }
    ],
    total: 1089.98,
    status: 'processing',
    order_date: '2024-01-16',
    estimated_delivery: '2024-01-20'
  }
];

const orderFunctions = {
  checkOrderStatus: {
    ttl: 120, // Cache for 2 minutes (order status changes)
    fallbackResponse: "I'm having trouble accessing our order system right now. Please call us at 77-111-104 with your order number.",
    
    async execute(params, context) {
      const { order_number, customer_phone } = params;
      const customerContext = context.customerContext || {};
      const customerProfile = context.customerProfile;
      
      // Use customer context for streamlined experience
      if (!order_number && !customer_phone && customerProfile) {
        // For known customers, we can check their orders automatically
        const phoneForLookup = context.customerNumber;
        const language = customerProfile.preferredLanguage || 'en';
        
        try {
          // Query the actual orders table for this customer
          const customerOrders = await db.getCustomerOrderHistory(phoneForLookup, 3);
          
          if (customerOrders.length === 0) {
            return {
              found: false,
              message: language === 'el'
                ? `${customerProfile.name}, δεν βρήκα καμία παραγγελία για εσάς στο σύστημά μας.`
                : `${customerProfile.name}, I don't see any orders for you in our system.`
            };
          }

          if (customerOrders.length === 1) {
            const order = customerOrders[0];
            const statusText = formatOrderStatus(order.status, language);
            
            let message = language === 'el'
              ? `${customerProfile.name}, βρήκα την παραγγελία σας ${order.reference_number}. Κατάσταση: ${statusText}.`
              : `${customerProfile.name}, I found your order ${order.reference_number}. Status: ${statusText}.`;
              
            if (order.tracking_number) {
              message += language === 'el'
                ? ` Κωδικός παρακολούθησης: ${order.tracking_number}.`
                : ` Tracking number: ${order.tracking_number}.`;
            }

            return {
              found: true,
              order: order,
              message: message,
              language: language
            };
          }

          // Multiple recent orders - show list
          const ordersList = customerOrders.map((order, index) => 
            `${index + 1}. ${order.reference_number} - ${formatOrderStatus(order.status, language)} (€${order.total})`
          ).join('\n');

          return {
            found: true,
            multipleOrders: true,
            orders: customerOrders,
            message: language === 'el'
              ? `${customerProfile.name}, βρήκα τις πρόσφατες παραγγελίες σας:\n${ordersList}\nΓια ποια θέλετε περισσότερες πληροφορίες;`
              : `${customerProfile.name}, here are your recent orders:\n${ordersList}\nWhich one would you like more information about?`,
            language: language
          };

        } catch (error) {
          console.error('Customer order lookup error:', error);
          // Fall back to requesting order number
        }
      }
      
      if (!order_number && !customer_phone) {
        const language = customerProfile?.preferredLanguage || 'en';
        return {
          found: false,
          message: language === 'el'
            ? 'Χρειάζομαι τον αριθμό παραγγελίας ή τον αριθμό τηλεφώνου σας για να ελέγξω την κατάσταση της παραγγελίας. Τι στοιχεία μπορείτε να μου δώσετε;'
            : 'I need either your order number or phone number to check your order status. What information can you provide?',
          requiresInput: true
        };
      }

      const language = customerProfile?.preferredLanguage || detectLanguage(order_number || customer_phone || '');

      try {
        let matchingOrders = [];
        
        if (order_number) {
          // Query actual orders table by reference number
          const { data, error } = await db.supabase
            .from('orders')
            .select('*')
            .ilike('reference_number', `%${order_number}%`)
            .order('order_date', { ascending: false });
            
          if (error) throw error;
          matchingOrders = data || [];
        } else if (customer_phone) {
          matchingOrders = await db.getCustomerOrderHistory(customer_phone, 5);
        }

        if (matchingOrders.length === 0) {
          return {
            found: false,
            message: language === 'el'
              ? 'Δεν βρήκα καμία παραγγελία με αυτά τα στοιχεία. Παρακαλώ ελέγξτε τον αριθμό παραγγελίας ή τον αριθμό τηλεφώνου σας.'
              : "I couldn't find any orders with those details. Please check your order number or phone number.",
            searchCriteria: { order_number, customer_phone }
          };
        }

        if (matchingOrders.length === 1) {
          const order = matchingOrders[0];
          const statusText = formatOrderStatus(order.status, language);
          
          let message;
          if (language === 'el') {
            message = `Βρήκα την παραγγελία σας ${order.id}. Κατάσταση: ${statusText}.`;
            
            if (order.status === 'shipped' && order.tracking_number) {
              message += ` Κωδικός παρακολούθησης: ${order.tracking_number}. Εκτιμώμενη παράδοση: ${order.estimated_delivery}.`;
            } else if (order.status === 'processing') {
              message += ' Η παραγγελία σας προετοιμάζεται και θα σταλεί σύντομα.';
            } else if (order.status === 'delivered') {
              message += ' Η παραγγελία σας παραδόθηκε επιτυχώς!';
            }
          } else {
            message = `I found your order ${order.id}. Status: ${statusText}.`;
            
            if (order.status === 'shipped' && order.tracking_number) {
              message += ` Tracking number: ${order.tracking_number}. Estimated delivery: ${order.estimated_delivery}.`;
            } else if (order.status === 'processing') {
              message += ' Your order is being prepared and will ship soon.';
            } else if (order.status === 'delivered') {
              message += ' Your order has been delivered successfully!';
            }
          }

          return {
            found: true,
            order: {
              id: order.id,
              status: order.status,
              statusText: statusText,
              total: order.total,
              orderDate: order.order_date,
              estimatedDelivery: order.estimated_delivery,
              trackingNumber: order.tracking_number,
              items: order.items
            },
            message: message
          };
        }

        // Multiple orders found
        const ordersList = matchingOrders.map((order, index) => 
          `${index + 1}. ${order.id} - ${formatOrderStatus(order.status, language)} (€${order.total})`
        ).join('\n');

        return {
          found: true,
          multipleOrders: true,
          orders: matchingOrders,
          message: language === 'el'
            ? `Βρήκα ${matchingOrders.length} παραγγελίες:\n${ordersList}\nΓια ποια θέλετε περισσότερες πληροφορίες;`
            : `I found ${matchingOrders.length} orders:\n${ordersList}\nWhich one would you like more information about?`
        };

      } catch (error) {
        console.error('Order status check error:', error);
        throw error;
      }
    }
  },

  trackOrder: {
    ttl: 300, // Cache for 5 minutes
    fallbackResponse: "I'm having trouble accessing tracking information. Please call us at 77-111-104 or check with the courier directly.",
    
    async execute(params, context) {
      const { tracking_number, order_number } = params;
      
      if (!tracking_number && !order_number) {
        return {
          found: false,
          message: 'I need a tracking number or order number to provide tracking information.',
          requiresInput: true
        };
      }

      const language = detectLanguage(tracking_number || order_number || '');

      try {
        // Find order with tracking number
        let order = null;
        
        if (tracking_number) {
          order = mockOrders.find(o => o.tracking_number === tracking_number);
        } else if (order_number) {
          order = mockOrders.find(o => 
            o.id.toLowerCase().includes(order_number.toLowerCase())
          );
        }

        if (!order || !order.tracking_number) {
          return {
            found: false,
            message: language === 'el'
              ? 'Δεν βρήκα πληροφορίες παρακολούθησης για αυτόν τον αριθμό. Ίσως η παραγγελία δεν έχει σταλεί ακόμα.'
              : "I couldn't find tracking information for that number. The order may not have shipped yet.",
            searchTerm: tracking_number || order_number
          };
        }

        // Mock tracking information
        const trackingInfo = {
          trackingNumber: order.tracking_number,
          status: order.status,
          estimatedDelivery: order.estimated_delivery,
          events: [
            {
              date: '2024-01-16 10:30',
              location: 'Armenius Store, Nicosia',
              description: language === 'el' ? 'Παραγγελία παραλήφθηκε' : 'Order picked up'
            },
            {
              date: '2024-01-16 14:15',
              location: 'Sorting Facility, Nicosia',
              description: language === 'el' ? 'Στο κέντρο διαλογής' : 'At sorting facility'
            },
            {
              date: '2024-01-17 09:45',
              location: 'Out for delivery',
              description: language === 'el' ? 'Σε διανομή' : 'Out for delivery'
            }
          ]
        };

        return {
          found: true,
          tracking: trackingInfo,
          message: language === 'el'
            ? `Η παραγγελία με κωδικό παρακολούθησης ${order.tracking_number} είναι ${formatOrderStatus(order.status, language)}. Εκτιμώμενη παράδοση: ${order.estimated_delivery}.`
            : `Your package with tracking number ${order.tracking_number} is ${formatOrderStatus(order.status, language)}. Estimated delivery: ${order.estimated_delivery}.`
        };

      } catch (error) {
        console.error('Order tracking error:', error);
        throw error;
      }
    }
  }
};

export default orderFunctions;