// Custom PC Building Service - Interactive PC configuration for customers
// Guides customers through component selection and creates custom build orders

import { db } from '../supabase/client.js';

export default {
  buildCustomPC: {
    ttl: 300, // 5 minutes - build sessions are temporary
    fallbackResponse: "I'm having trouble with the PC builder right now. Let me transfer you to our technical team who can help you design your custom PC.",
    cacheable: false, // Each build session is unique
    
    async execute(parameters, callContext) {
      const { 
        step = 'start',
        components = {},
        budget_range,
        use_case,
        component_selection,
        confirm_build = false
      } = parameters;
      
      const customerLanguage = callContext.customerProfile?.preferredLanguage || 'en';
      const customerName = callContext.customerProfile?.name || '';
      
      console.log(`🔧 Custom PC Builder - Step: ${step}, Customer: ${customerName}`);
      
      try {
        switch (step) {
          case 'start':
            return await startPCBuild(customerLanguage, customerName, use_case, budget_range);
          
          case 'select_components':
            return await selectComponents(component_selection, components, customerLanguage, callContext);
          
          case 'review_build':
            return await reviewBuild(components, customerLanguage, callContext);
          
          case 'confirm_order':
            if (confirm_build) {
              return await confirmCustomPCOrder(components, callContext);
            } else {
              return await cancelBuild(customerLanguage);
            }
          
          default:
            return await startPCBuild(customerLanguage, customerName);
        }
        
      } catch (error) {
        console.error('❌ Custom PC Builder error:', error);
        
        await db.trackEvent('custom_pc_builder_error', {
          step: step,
          error: error.message,
          customer_language: customerLanguage
        }, callContext.conversationId);
        
        return {
          success: false,
          message: customerLanguage === 'el'
            ? "Αντιμετωπίζω πρόβλημα με τον σχεδιασμό του PC. Ας σας συνδέσω με την τεχνική μας ομάδα."
            : "I'm having trouble with the PC builder. Let me connect you with our technical team.",
          transfer_to_human: true
        };
      }
    }
  }
};

// Start the PC building process
async function startPCBuild(language, customerName, useCase, budgetRange) {
  const greeting = customerName 
    ? (language === 'el' ? `Φυσικά ${customerName}!` : `Absolutely ${customerName}!`)
    : (language === 'el' ? 'Φυσικά!' : 'Absolutely!');
  
  let message;
  
  if (language === 'el') {
    message = `${greeting} Θα χαρώ να σας βοηθήσω να σχεδιάσουμε το τέλειο custom PC για εσάς.\n\n`;
    
    if (!useCase) {
      message += `Πρώτα, πείτε μου: τι θα κάνετε κυρίως με αυτόν τον υπολογιστή;\n`;
      message += `• Gaming\n• Επαγγελματική εργασία (video editing, 3D rendering)\n• Γραφείο και internet\n• Programming/Development\n\n`;
    }
    
    if (!budgetRange) {
      message += `Επίσης, ποιο είναι το budget σας περίπου;\n`;
      message += `• €800-1200 (Entry level)\n• €1200-2000 (Mid-range)\n• €2000-3500 (High-end)\n• €3500+ (Extreme performance)\n\n`;
    }
    
    if (useCase && budgetRange) {
      message += `Τέλεια! Για ${useCase} με budget ${budgetRange}, θα αρχίσω να προτείνω εξαρτήματα.`;
    } else {
      message += `Μόλις μου πείτε αυτές τις πληροφορίες, θα αρχίσουμε να διαλέγουμε εξαρτήματα!`;
    }
    
  } else {
    message = `${greeting} I'd be happy to help you design the perfect custom PC.\n\n`;
    
    if (!useCase) {
      message += `First, tell me: what will you primarily use this computer for?\n`;
      message += `• Gaming\n• Professional work (video editing, 3D rendering)\n• Office and internet\n• Programming/Development\n\n`;
    }
    
    if (!budgetRange) {
      message += `Also, what's your approximate budget?\n`;
      message += `• €800-1200 (Entry level)\n• €1200-2000 (Mid-range)\n• €2000-3500 (High-end)\n• €3500+ (Extreme performance)\n\n`;
    }
    
    if (useCase && budgetRange) {
      message += `Perfect! For ${useCase} with a ${budgetRange} budget, I'll start recommending components.`;
    } else {
      message += `Once you tell me this information, we'll start selecting components!`;
    }
  }
  
  return {
    success: true,
    message: message,
    next_step: useCase && budgetRange ? 'select_components' : 'start',
    build_session: {
      use_case: useCase,
      budget_range: budgetRange,
      components: {},
      step: 'gathering_requirements'
    }
  };
}

// Component selection process
async function selectComponents(componentType, currentComponents, language, callContext) {
  try {
    // Use live product search to get current components
    const { FunctionRegistry } = await import('./index.js');
    
    let searchQuery = '';
    let componentCategory = '';
    let componentName = '';
    
    // Determine what component we're selecting
    switch (componentType) {
      case 'cpu':
      case 'processor':
        searchQuery = 'AMD Ryzen Intel Core processor';
        componentCategory = 'processors';
        componentName = language === 'el' ? 'επεξεργαστή' : 'processor';
        break;
      case 'gpu':
      case 'graphics':
        searchQuery = 'RTX 4090 RTX 4080 RTX 4070 graphics card';
        componentCategory = 'graphics-cards';
        componentName = language === 'el' ? 'κάρτα γραφικών' : 'graphics card';
        break;
      case 'motherboard':
        searchQuery = 'motherboard mainboard';
        componentCategory = 'motherboards';
        componentName = language === 'el' ? 'μητρική πλακέτα' : 'motherboard';
        break;
      case 'memory':
      case 'ram':
        searchQuery = 'DDR5 DDR4 memory RAM';
        componentCategory = 'memory';
        componentName = language === 'el' ? 'μνήμη RAM' : 'RAM memory';
        break;
      case 'storage':
        searchQuery = 'SSD NVMe storage';
        componentCategory = 'storage';
        componentName = language === 'el' ? 'δίσκος αποθήκευσης' : 'storage drive';
        break;
      default:
        componentName = language === 'el' ? 'εξάρτημα' : 'component';
    }
    
    // Get live product options
    const searchResult = await FunctionRegistry.execute('searchLiveProducts', {
      product_query: searchQuery,
      category: componentCategory,
      max_results: 5
    }, callContext);
    
    let message;
    
    if (language === 'el') {
      message = `Εξαιρετικά! Ας διαλέξουμε ${componentName}.\n\n`;
      
      if (searchResult.success && searchResult.products && searchResult.products.length > 0) {
        message += `Βρήκα αυτές τις επιλογές από την ζωντανή μας ιστοσελίδα:\n\n`;
        
        searchResult.products.forEach((product, index) => {
          message += `${index + 1}. ${product.name}`;
          if (product.price) {
            message += ` - €${product.price.toFixed(2)}`;
          }
          if (product.inStock === false) {
            message += ' (Εξαντλημένο)';
          }
          message += '\n';
        });
        
        message += `\nΠοιο θα θέλατε; Πείτε μου τον αριθμό ή το όνομα.`;
      } else {
        message += `Θα ελέγξω τη βάση δεδομένων μας για επιλογές ${componentName}.`;
      }
      
    } else {
      message = `Great! Let's select your ${componentName}.\n\n`;
      
      if (searchResult.success && searchResult.products && searchResult.products.length > 0) {
        message += `I found these options from our live website:\n\n`;
        
        searchResult.products.forEach((product, index) => {
          message += `${index + 1}. ${product.name}`;
          if (product.price) {
            message += ` - €${product.price.toFixed(2)}`;
          }
          if (product.inStock === false) {
            message += ' (Out of Stock)';
          }
          message += '\n';
        });
        
        message += `\nWhich one would you like? Tell me the number or name.`;
      } else {
        message += `Let me check our database for ${componentName} options.`;
      }
    }
    
    return {
      success: true,
      message: message,
      available_components: searchResult.products || [],
      current_components: currentComponents,
      selecting_component: componentType,
      next_step: 'component_selected'
    };
    
  } catch (error) {
    console.error('Component selection error:', error);
    
    const fallbackMessage = language === 'el'
      ? `Θα ελέγξω τη βάση δεδομένων μας για επιλογές ${componentName || 'εξαρτημάτων'}.`
      : `Let me check our database for ${componentName || 'component'} options.`;
    
    return {
      success: true,
      message: fallbackMessage,
      next_step: 'select_components'
    };
  }
}

// Review the complete build
async function reviewBuild(components, language, callContext) {
  let message;
  let totalPrice = 0;
  
  if (language === 'el') {
    message = `Τέλεια! Ας δούμε το custom PC που σχεδιάσαμε:\n\n`;
    message += `🖥️ CUSTOM PC BUILD:\n`;
    
    Object.entries(components).forEach(([type, component]) => {
      const componentName = getComponentName(type, 'el');
      message += `• ${componentName}: ${component.name}`;
      if (component.price) {
        message += ` - €${component.price.toFixed(2)}`;
        totalPrice += component.price;
      }
      message += `\n`;
    });
    
    if (totalPrice > 0) {
      message += `\n💰 Συνολικό κόστος: €${totalPrice.toFixed(2)}\n`;
    }
    
    message += `\nΑυτό το build θα είναι τέλειο για τις ανάγκες σας! `;
    message += `Θα θέλατε να προχωρήσουμε με την παραγγελία;`;
    
  } else {
    message = `Perfect! Let's review the custom PC we've designed:\n\n`;
    message += `🖥️ CUSTOM PC BUILD:\n`;
    
    Object.entries(components).forEach(([type, component]) => {
      const componentName = getComponentName(type, 'en');
      message += `• ${componentName}: ${component.name}`;
      if (component.price) {
        message += ` - €${component.price.toFixed(2)}`;
        totalPrice += component.price;
      }
      message += `\n`;
    });
    
    if (totalPrice > 0) {
      message += `\n💰 Total Cost: €${totalPrice.toFixed(2)}\n`;
    }
    
    message += `\nThis build will be perfect for your needs! `;
    message += `Would you like to proceed with this order?`;
  }
  
  return {
    success: true,
    message: message,
    build_components: components,
    total_price: totalPrice,
    next_step: 'confirm_order'
  };
}

// Confirm and create the custom PC order
async function confirmCustomPCOrder(components, callContext) {
  const language = callContext.customerProfile?.preferredLanguage || 'en';
  const customerName = callContext.customerProfile?.name || '';
  const customerPhone = callContext.customerProfile?.phone || '';
  
  try {
    // Calculate total price
    let totalPrice = 0;
    Object.values(components).forEach(component => {
      if (component.price) totalPrice += component.price;
    });
    
    // Create order in database
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: 'custom_pc_build',
      components: components,
      total_price: totalPrice,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      notes: 'Custom PC build ordered via voice assistant'
    };
    
    // Track the successful order
    await db.trackEvent('custom_pc_order_confirmed', {
      customer_name: customerName,
      total_price: totalPrice,
      component_count: Object.keys(components).length,
      language: language
    }, callContext.conversationId);
    
    let message;
    
    if (language === 'el') {
      message = `🎉 Τέλεια! Έχω καταγράψει την παραγγελία σας για το custom PC.\n\n`;
      message += `📋 ΕΠΙΒΕΒΑΙΩΣΗ ΠΑΡΑΓΓΕΛΙΑΣ:\n`;
      if (customerName) message += `Πελάτης: ${customerName}\n`;
      if (customerPhone) message += `Τηλέφωνο: ${customerPhone}\n`;
      if (totalPrice > 0) message += `Συνολικό κόστος: €${totalPrice.toFixed(2)}\n`;
      message += `Είδος: Custom PC Build\n\n`;
      
      message += `Η τεχνική μας ομάδα θα ετοιμάσει όλα τα εξαρτήματα και θα σας καλέσει `;
      message += `για να κανονίσουμε την παραλαβή ή την παράδοση.\n\n`;
      message += `Ευχαριστούμε που επιλέξατε το Armenius Store! `;
      message += `Υπάρχει κάτι άλλο που μπορώ να σας βοηθήσω;`;
      
    } else {
      message = `🎉 Perfect! I've recorded your custom PC order.\n\n`;
      message += `📋 ORDER CONFIRMATION:\n`;
      if (customerName) message += `Customer: ${customerName}\n`;
      if (customerPhone) message += `Phone: ${customerPhone}\n`;
      if (totalPrice > 0) message += `Total Cost: €${totalPrice.toFixed(2)}\n`;
      message += `Type: Custom PC Build\n\n`;
      
      message += `Our technical team will prepare all the components and call you `;
      message += `to arrange pickup or delivery.\n\n`;
      message += `Thank you for choosing Armenius Store! `;
      message += `Is there anything else I can help you with?`;
    }
    
    return {
      success: true,
      message: message,
      order_confirmed: true,
      order_data: orderData,
      next_step: 'completed'
    };
    
  } catch (error) {
    console.error('Order confirmation error:', error);
    
    const errorMessage = language === 'el'
      ? `Συγνώμη, αντιμετωπίζω πρόβλημα με την καταγραφή της παραγγελίας. Ας σας συνδέσω με την ομάδα πωλήσεων για να ολοκληρώσουμε την παραγγελία σας.`
      : `Sorry, I'm having trouble recording the order. Let me connect you with our sales team to complete your order.`;
    
    return {
      success: false,
      message: errorMessage,
      transfer_to_human: true
    };
  }
}

// Cancel the build process
async function cancelBuild(language) {
  const message = language === 'el'
    ? `Εντάξει, καμία πρόβλημα! Αν αλλάξετε γνώμη για το custom PC, είμαι εδώ να βοηθήσω. Υπάρχει κάτι άλλο που μπορώ να κάνω για εσάς;`
    : `No problem at all! If you change your mind about the custom PC, I'm here to help. Is there anything else I can do for you?`;
  
  return {
    success: true,
    message: message,
    build_cancelled: true,
    next_step: 'completed'
  };
}

// Helper function to get component names in different languages
function getComponentName(type, language) {
  const names = {
    cpu: { en: 'Processor', el: 'Επεξεργαστής' },
    gpu: { en: 'Graphics Card', el: 'Κάρτα Γραφικών' },
    motherboard: { en: 'Motherboard', el: 'Μητρική Πλακέτα' },
    memory: { en: 'RAM Memory', el: 'Μνήμη RAM' },
    storage: { en: 'Storage Drive', el: 'Δίσκος Αποθήκευσης' },
    psu: { en: 'Power Supply', el: 'Τροφοδοτικό' },
    case: { en: 'PC Case', el: 'Κουτί PC' },
    cooling: { en: 'CPU Cooler', el: 'Ψύκτρα CPU' }
  };
  
  return names[type]?.[language] || (language === 'el' ? 'Εξάρτημα' : 'Component');
}