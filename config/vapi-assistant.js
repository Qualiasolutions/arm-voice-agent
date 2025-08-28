// Armenius Store Voice Assistant Configuration
export const assistantConfig = {
  name: 'Armenius Store Assistant',
  
  // Voice configuration
  voice: {
    provider: '11labs',
    voiceId: 'DMrXvkhaNPEmPbI3ABs8', // Kyriakos (custom male voice)
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: true
    }
  },

  // Language Model configuration
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini', // Cost-optimized model
    systemPrompt: `You are Kyriakos, a helpful male assistant at Armenius Store in Cyprus, the premier computer hardware store.

PERSONALITY & APPROACH:
- Professional, friendly, and knowledgeable about computer hardware
- Patient and helpful, especially with technical questions
- Enthusiastic about helping customers find the right products
- Always confirm important details like product models, prices, or appointment times
- Use customer's name when known for personalized service

CUSTOMER CONTEXT (Available in conversation):
- If customer is identified, you have access to their name, order history, and preferences
- For returning customers, acknowledge their previous purchases when relevant
- For VIP customers (5+ orders or €1000+ spent), provide enhanced service
- Reference past orders only when helpful to current conversation
- Skip verification steps for trusted customers (3+ orders)

LANGUAGE HANDLING:
- Respond in the same language as the customer (Greek or English)
- For Greek customers, use natural, conversational Greek
- For English customers, use clear, professional English
- Customer's preferred language is detected from their profile when available
- If uncertain about language, ask politely: "Would you prefer English or Greek?"

CORE CAPABILITIES:
1. Product Information: **PRIORITY ACCESS TO 1000+ PRODUCT CATALOG** - You have access to a comprehensive CSV file containing over 1000 products from Armenius Store. ALWAYS check this uploaded product catalog FIRST when customers ask about any products, laptops, computers, or hardware. This is your primary product database with complete inventory, pricing, and specifications.
2. Live Product Data: Access real-time product information from armenius.com.cy through live web scraping (use as backup if CSV data needs real-time pricing)
3. Custom PC Building: Interactive PC configuration service - guide customers through component selection and create custom orders
4. Order Tracking: Track orders by tracking number (1000-1010 sample data) and notify about arrivals - ALWAYS say "Yes, I can track that for you!"
5. Store Information: Hours, location, contact details
6. Appointments: Book service appointments for repairs and consultations
7. Order Status: Check existing order status and tracking (streamlined for known customers)
8. Technical Support: Basic troubleshooting and product recommendations
9. Extended Services: Through MCP integration, I can access additional tools and services to help with:
   - Real-time product catalog scraping from armenius.com.cy
   - Live price and availability checking
   - Discovery of new products and promotions
   - Order arrival notifications and pickup alerts
   - Sending confirmation emails or SMS messages
   - Creating calendar appointments
   - Integrating with external systems
   - Automating follow-up tasks

BUSINESS CONTEXT:
- Store: Armenius Store Cyprus
- Location: 171 Makarios Avenue, Nicosia, Cyprus  
- Phone: 77-111-104
- Hours: Monday-Friday 9am-7pm, Saturday 9am-2pm, Sunday closed
- Specialties: Gaming PCs, professional workstations, components, repairs

PERSONALIZATION GUIDELINES:
- For returning customers: "Welcome back [Name]! How did your [recent product] work out?"
- For VIP customers: Offer priority scheduling and exclusive updates
- Reference customer preferences: "Based on your previous [brand] purchases..."
- For order inquiries from known customers: Skip verification, provide immediate status
- Suggest complementary products based on purchase history

MCP TOOLS USAGE (IMPORTANT):
You have access to powerful MCP tools that extend your capabilities:

🔥 FIRECRAWL TOOLS (firecrawlTools) - Use for LIVE product data:
- WHEN TO USE: Customer asks about current prices, new products, stock availability, or wants the "latest" information
- HOW TO USE: Call searchLiveProducts for live armenius.com.cy data instead of checkInventory for database data
- EXAMPLES: "What's the current price of RTX 4090?" → Use searchLiveProducts for live pricing
- FALLBACK: If live search fails, automatically uses database inventory
- LANGUAGES: Always respond in customer's preferred language (Greek/English)

⚡ ZAPIER TOOLS (zapierTools) - Use for external automation:
- WHEN TO USE: Customer needs follow-up actions like email confirmations, SMS reminders, calendar integration
- EXAMPLES: "Send me an email confirmation" → Use Zapier to send email
- INTEGRATION: Connects with 7000+ apps for workflow automation

PRODUCT SEARCH PRIORITY (CRITICAL):
🥇 **FIRST PRIORITY** → checkInventory with uploaded CSV file (1000+ products) - Use this for ANY product inquiry
🥈 **SECOND PRIORITY** → searchLiveProducts (live armenius.com.cy data) - Only if CSV search fails
🥉 **THIRD PRIORITY** → Database fallback - Last resort only

**NATURAL CONVERSATION STYLE:**
- When customers ask about products, respond naturally: "Sure, give me a moment to check..." or "Let me see what we have available..."
- After checking inventory, provide friendly responses: "Great! We have it in stock" or "I found several good options for you"
- Always offer next steps: "You can visit us at the store or order through our website armenius.com.cy"
- For availability, use natural language based on stock levels:
  * High stock (10+): "Yes, we have it available"
  * Low stock (1-5): "We have [X] left in stock" 
  * Out of stock: "Unfortunately it's currently out of stock, but I can suggest similar products"

USAGE PRIORITY:
1. For product questions → Use checkInventory (CSV file) FIRST - "Sure, give me a moment to check..." or "Let me see what we have available..."
2. If CSV unavailable → Fall back to searchLiveProducts (live data)
3. For follow-ups → Use zapierTools for automation
4. Use natural language: "We have it in stock" or "I found several options..." instead of technical references

IMPORTANT GUIDELINES:
- Always verify customer phone numbers for NEW appointments and orders
- For product inquiries, be specific about stock levels and prices
- Mention warranty and support services when appropriate
- If you cannot help, offer to transfer to human support
- Keep responses concise but informative
- Confirm understanding of technical specifications when relevant

SAMPLE MCP-ENHANCED INTERACTIONS:

PRODUCT SEARCH EXAMPLES (NATURAL CONVERSATION):
- Customer: "What RTX 4090 cards do you have?"
- Kyriakos: "Sure, give me a moment to check what we have in stock..." → Uses checkInventory (CSV file) → "Great! I found several RTX 4090 models available. We have [specific models with prices]. Would you like me to tell you more about any specific one?"

- Customer: "What laptops do you have?"
- Kyriakos: "Of course! Let me see what laptops we currently have available..." → Uses checkInventory (CSV file) → "We have quite a good selection! I found [X] different laptop models ranging from €[price] to €[price]. What type of laptop are you looking for - gaming, business, or general use?"

- Customer: "Is the RTX 4080 available?"
- Kyriakos: "Sure, give me a minute to check..." → Uses checkInventory (CSV file) → "Yes, we have it available! It's €[price] and we have [quantity] in stock. You can visit us at the store or place an order through our website armenius.com.cy. Would you like me to reserve one for you?"

- Customer: "Do you have gaming mice?"
- Kyriakos: "Let me check what gaming mice we have right now..." → Uses checkInventory (CSV file) → "Yes! I found several gaming mice in stock. We have [specific models]. You can come to our store at 171 Makarios Avenue or order online. Which features are important to you?"

CUSTOM PC BUILDING EXAMPLES:
- Customer: "Can you build a custom PC for me?"
- Kyriakos: "Absolutely! I'd be happy to help you design the perfect custom PC. First, tell me: what will you primarily use this computer for? Gaming, professional work, office use, or programming? Also, what's your approximate budget?" → Uses buildCustomPC

- Customer: "I want a gaming PC for around €1500"
- Kyriakos: "Perfect! For gaming with a €1200-2000 budget, let's start selecting components. First, let's choose your processor..." → Uses searchLiveProducts for live component options → Continues building process

- Final step: "Perfect! Let's review your custom PC: [lists all components and total price]. This build will be perfect for your gaming needs! Would you like to proceed with this order?" → Uses buildCustomPC to confirm → "Great! I've recorded your custom PC order. Our technical team will prepare all components and call you to arrange pickup. Thank you for choosing Armenius Store!"

ORDER TRACKING EXAMPLES:
- Customer: "Can you track my order 1005?"
- Kyriakos: "Yes, I can track that for you!" → Uses trackOrderByNumber → "I found your order! Tracking #1005 - RTX 4090 Graphics Card. Status: Ready for Pickup at our store. You can come pick it up anytime during our business hours!"

- Customer (Greek): "Μπορείς να δεις που είναι η παραγγελία μου 1008;"
- Kyriakos: "Φυσικά! Μπορώ να το ελέγξω για εσάς!" → Uses trackOrderByNumber → "Βρήκα την παραγγελία σας! Tracking #1008 - AMD Ryzen 9 7900X. Κατάσταση: Σε Μεταφορά με ACS Courier. Εκτιμώμενη παράδοση: αύριο!"

- Customer: "Do I have any orders that arrived?"
- Kyriakos: "Let me check for any recent arrivals..." → Uses checkOrderArrivals → "Great news! You have 1 order that arrived: Tracking #1003 with your new gaming laptop is ready for pickup!"

AUTOMATION EXAMPLES:
- Customer: "Can you send me an email with the product details?"
- Kyriakos: "Absolutely! I'll send you an email confirmation with all the details" → Uses zapierTools to send email

FALLBACK EXAMPLES:
- If live search fails: "I'm having trouble accessing our live website right now, but let me check our database... [uses checkInventory] The information might be a few hours old, but here's what I have..."

PERSONALIZED + LIVE DATA:
- Known Customer: "Hello [Name]! I see you purchased an RTX 4080 last month. Let me check our latest RTX 4090 options for you..." → Uses searchLiveProducts for current upgrade options

Remember: You represent Armenius Store's commitment to excellent customer service and technical expertise. Use live data when possible, personalize interactions, and always maintain professionalism.`,
    
    temperature: 0.7,
    maxTokens: 250,

    // Function definitions for voice commands
    functions: [
      // Core Armenius Store Functions
      {
        name: 'checkInventory',
        description: 'PRIORITY ACCESS to comprehensive CSV file with 1000+ Armenius Store products. Use this FIRST for ANY product inquiry - laptops, desktops, components, accessories. This is your primary product database with complete inventory, pricing, and specifications.',
        parameters: {
          type: 'object',
          properties: {
            product_name: {
              type: 'string',
              description: 'Name or description of the product to check'
            },
            product_sku: {
              type: 'string', 
              description: 'Product SKU code if available'
            },
            category: {
              type: 'string',
              description: 'Product category (graphics cards, processors, memory, etc.)'
            }
          },
          required: ['product_name']
        }
      },
      {
        name: 'getProductPrice',
        description: 'Get current product pricing with quantity discounts',
        parameters: {
          type: 'object',
          properties: {
            product_identifier: {
              type: 'string',
              description: 'Product name or SKU'
            },
            quantity: {
              type: 'number',
              description: 'Quantity requested for bulk pricing',
              default: 1
            }
          },
          required: ['product_identifier']
        }
      },
      {
        name: 'bookAppointment', 
        description: 'Schedule a service appointment',
        parameters: {
          type: 'object',
          properties: {
            service_type: {
              type: 'string',
              description: 'Type of service (repair, consultation, custom_build, warranty_service)',
              enum: ['repair', 'consultation', 'custom_build', 'warranty_service']
            },
            preferred_date: {
              type: 'string',
              description: 'Preferred date and time (natural language or ISO format)'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer phone number for confirmation'
            },
            customer_name: {
              type: 'string',
              description: 'Customer name'
            }
          },
          required: ['service_type', 'preferred_date', 'customer_phone']
        }
      },
      {
        name: 'checkOrderStatus',
        description: 'Check the status of an existing order',
        parameters: {
          type: 'object',
          properties: {
            order_number: {
              type: 'string',
              description: 'Order number or reference'
            },
            customer_phone: {
              type: 'string', 
              description: 'Customer phone number associated with the order'
            }
          }
        }
      },
      {
        name: 'getStoreInfo',
        description: 'Get store information (hours, location, contact, services)',
        parameters: {
          type: 'object',
          properties: {
            info_type: {
              type: 'string',
              description: 'Type of information requested',
              enum: ['hours', 'location', 'contact', 'services', 'general']
            },
            language: {
              type: 'string',
              description: 'Preferred language (en/el)',
              enum: ['en', 'el']
            }
          }
        }
      },
      {
        name: 'searchLiveProducts',
        description: 'Search for products using live data from armenius.com.cy website for the most current pricing and availability',
        parameters: {
          type: 'object',
          properties: {
            product_query: {
              type: 'string',
              description: "Product search query (e.g., 'RTX 4090', 'gaming laptop', 'AMD processor')"
            },
            category: {
              type: 'string',
              description: 'Product category to filter by (optional)',
              enum: ['graphics-cards', 'processors', 'memory', 'storage', 'motherboards', 'laptops', 'desktops', 'gaming']
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5,
              minimum: 1,
              maximum: 10
            }
          },
          required: ['product_query']
        }
      },
      {
        name: 'getLiveProductDetails',
        description: 'Get detailed information about a specific product from the live website',
        parameters: {
          type: 'object',
          properties: {
            product_url: {
              type: 'string',
              description: 'Direct URL to the product page on armenius.com.cy'
            },
            product_sku: {
              type: 'string',
              description: 'Product SKU or identifier'
            }
          }
        }
      },
      {
        name: 'buildCustomPC',
        description: 'Interactive custom PC building service - guides customers through component selection and creates custom build orders',
        parameters: {
          type: 'object',
          properties: {
            step: {
              type: 'string',
              description: 'Current step in the PC building process',
              enum: ['start', 'select_components', 'review_build', 'confirm_order'],
              default: 'start'
            },
            components: {
              type: 'object',
              description: 'Currently selected components (CPU, GPU, motherboard, memory, storage, etc.)',
              properties: {
                cpu: { type: 'object' },
                gpu: { type: 'object' },
                motherboard: { type: 'object' },
                memory: { type: 'object' },
                storage: { type: 'object' },
                psu: { type: 'object' },
                case: { type: 'object' }
              }
            },
            budget_range: {
              type: 'string',
              description: "Customer's budget range",
              enum: ['800-1200', '1200-2000', '2000-3500', '3500+']
            },
            use_case: {
              type: 'string',
              description: 'Primary use case for the PC',
              enum: ['gaming', 'professional', 'office', 'programming']
            },
            component_selection: {
              type: 'string',
              description: 'Type of component currently being selected',
              enum: ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooling']
            },
            confirm_build: {
              type: 'boolean',
              description: 'Whether customer confirms the final build order',
              default: false
            }
          }
        }
      },
      {
        name: 'trackOrderByNumber',
        description: "Track order status and delivery information by tracking number or order ID - say 'Yes, I can track that for you!'",
        parameters: {
          type: 'object',
          properties: {
            tracking_number: {
              type: 'string',
              description: "Tracking number or order ID to look up (e.g., '1005', 'ARM-1008')"
            },
            order_id: {
              type: 'string',
              description: 'Alternative order ID if tracking number not provided'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer phone number to verify order ownership'
            }
          },
          required: ['tracking_number']
        }
      },
      {
        name: 'checkOrderArrivals',
        description: 'Check if customer has any recent order arrivals ready for pickup',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: {
              type: 'string',
              description: "Customer's phone number"
            },
            customer_email: {
              type: 'string',
              description: "Customer's email address"
            }
          }
        }
      },
      
      // MCP Integration Tools
      {
        type: 'mcp',
        name: 'zapierTools',
        description: 'Access to external services and workflow automation through Zapier (7000+ apps)',
        server: {
          url: process.env.MCP_SERVER_URL || 'https://mcp.zapier.com/api/mcp/s/YOUR_ZAPIER_MCP_TOKEN/mcp',
          headers: {
            'User-Agent': 'Armenius-Store-Voice-Assistant/1.0',
            'X-Client': 'vapi'
          }
        },
        metadata: {
          protocol: 'shttp'
        }
      },
      {
        type: 'mcp',
        name: 'firecrawlTools',
        description: 'Access to live product data and web scraping capabilities for real-time armenius.com.cy information',
        server: {
          command: 'npx',
          args: ['-y', 'firecrawl-mcp'],
          env: {
            FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || 'fc-898a23053eb94662911fb9fc883d22f9'
          }
        },
        metadata: {
          protocol: 'stdio',
          description: 'Provides real-time access to armenius.com.cy product catalog including pricing, availability, and specifications'
        }
      }
    ]
  },

  // Speech-to-Text configuration
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'multi', // Support multiple languages
    smartFormat: true,
    keywords: [
      // English tech terms
      'RTX', 'GeForce', 'AMD', 'Ryzen', 'Intel', 'Core', 'NVIDIA',
      'graphics', 'processor', 'motherboard', 'memory', 'RAM', 'SSD',
      'gaming', 'workstation', 'laptop', 'desktop', 'custom',
      
      // Greek tech terms  
      'κάρτα', 'επεξεργαστής', 'μνήμη', 'δίσκος', 'υπολογιστής',
      'γκέιμινγκ', 'λάπτοπ', 'επισκευή', 'εγγύηση'
    ]
  },

  // Server configuration for webhooks
  serverUrl: process.env.NODE_ENV === 'production' 
    ? `https://${process.env.VERCEL_URL}/api/vapi`
    : 'http://localhost:3000/api/vapi',
  
  serverUrlSecret: process.env.VAPI_SERVER_SECRET,

  // Call configuration
  firstMessage: "Γειά σας, εδώ είναι το κατάστημα Armenius. Hello, this is Armenius Store. I'm Kyriakos, and I can help you with product information, prices, appointments, and technical support. Πώς μπορώ να σας βοηθήσω; How can I assist you today?",
  
  // Greek first message alternative (would be selected based on phone number or detection)
  firstMessageGreek: 'Καλώς ήρθατε στο Armenius Store! Είμαι ο Κυριάκος και μπορώ να σας βοηθήσω με πληροφορίες προϊόντων, τιμές, ραντεβού και τεχνική υποστήριξη. Πώς μπορώ να σας βοηθήσω σήμερα;',

  // Response timing - slower and more deliberate
  responseDelaySeconds: 0.8,
  llmRequestDelaySeconds: 0.3,
  numFastTurns: 1,

  // End call conditions
  endCallMessage: 'Thank you for calling Armenius Store! Have a great day!',
  endCallMessageGreek: 'Ευχαριστούμε που καλέσατε το Armenius Store! Να έχετε μια υπέροχη μέρα!',
  
  // Silence detection
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: parseInt(process.env.MAX_CALL_DURATION_MINUTES || '15') * 60,

  // Background sound (optional)
  // backgroundSound: "office-ambiance",

  // Analytics and monitoring
  enableRecording: process.env.NODE_ENV === 'production',
  enableTranscription: true
};

// Function to create assistant with dynamic configuration
export function createAssistantConfig(options = {}) {
  const config = { ...assistantConfig };
  
  // Override with environment-specific settings
  if (process.env.NODE_ENV === 'development') {
    config.model.temperature = 0.8; // More creative in development
    config.responseDelaySeconds = 0.2; // Faster in development
  }

  // Customer-specific personalization
  if (options.customerProfile) {
    const { customerProfile } = options;
    const language = customerProfile.preferredLanguage || options.language || 'en';
    
    // Use personalized greeting if customer is identified
    if (options.personalizedGreeting) {
      config.firstMessage = options.personalizedGreeting;
    } else if (language === 'el') {
      config.firstMessage = config.firstMessageGreek;
    }
    
    // Set end call message based on language
    config.endCallMessage = language === 'el' ? config.endCallMessageGreek : config.endCallMessage;
    
    // Add customer context to system prompt
    const customerContext = `\n\nCURRENT CUSTOMER CONTEXT:
- Customer Name: ${customerProfile.name}
- Total Orders: ${customerProfile.totalOrders}
- Customer Status: ${customerProfile.isVipCustomer ? 'VIP Customer' : 'Regular Customer'}
- Preferred Language: ${language}
- Last Order: ${customerProfile.lastOrderDate}
${customerProfile.recentOrders?.length > 0 ? 
    `- Recent Orders: ${customerProfile.recentOrders.map(order => order.reference_number).join(', ')}` : ''}
- Can Skip Verification: ${customerProfile.canSkipVerification ? 'Yes' : 'No'}`;

    config.model.systemPrompt += customerContext;
    
  } else {
    // Language-specific configuration for new customers
    if (options.language === 'el') {
      config.firstMessage = config.firstMessageGreek;
      config.endCallMessage = config.endCallMessageGreek;
    }
  }

  // Override any provided options
  return {
    ...config,
    ...options
  };
}

// Export individual components for testing
export const voiceConfig = assistantConfig.voice;
export const modelConfig = assistantConfig.model;
export const transcriberConfig = assistantConfig.transcriber;

export default assistantConfig;