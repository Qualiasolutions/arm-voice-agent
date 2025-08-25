// Secure Vapi initialization endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
    
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
    
  try {
    // Validate required environment variables
    if (!process.env.VAPI_API_KEY) {
      return res.status(500).json({ 
        error: 'Vapi not configured',
        details: 'VAPI_API_KEY missing'
      });
    }
        
    const { language = 'en' } = req.body;
        
    // Create assistant configuration with secure backend values
    const assistantConfig = {
      name: 'Armenius Store Assistant',
            
      // Voice configuration using backend env vars
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Safe to keep static
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.4,
          useSpeakerBoost: true
        }
      },
            
      // Model configuration
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 150,
        systemPrompt: getSystemPrompt(language)
      },
            
      // First message based on language
      firstMessage: language === 'el' 
        ? 'Καλημέρα! Είμαι η Μαρία από το Armenius Store. Πώς μπορώ να σας βοηθήσω σήμερα;'
        : "Hello! I'm Maria from Armenius Store. How can I help you today?",
            
      // Webhook URL (secure backend endpoint)
      serverUrl: getWebhookUrl(req),
            
      // Function definitions
      functions: getFunctionDefinitions(),
            
      // Call settings
      endCallMessage: language === 'el'
        ? 'Ευχαριστώ που επικοινωνήσατε με το Armenius Store. Καλή ημέρα!'
        : 'Thank you for contacting Armenius Store. Have a great day!',
                
      endCallPhrases: ['goodbye', 'bye', 'thank you', 'αντίο', 'ευχαριστώ'],
            
      // Cost optimization
      maxDurationSeconds: 900, // 15 minutes max
            
      // Voice settings
      interruptionThreshold: 100,
      responseDelaySeconds: 0.4,
      llmRequestDelaySeconds: 0.1
    };
        
    // Return only the public key and assistant config (no sensitive data)
    return res.status(200).json({
      success: true,
      // Only return what's needed for frontend Vapi SDK
      config: {
        // Generate a temporary session ID instead of exposing real keys
        sessionId: generateSessionId(),
        assistantConfig: assistantConfig,
        // Frontend will use this to identify the session
        webhookUrl: getWebhookUrl(req)
      }
    });
        
  } catch (error) {
    console.error('Vapi init error:', error);
    return res.status(500).json({ 
      error: 'Failed to initialize Vapi',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
}

function getSystemPrompt(language) {
  const basePrompt = `You are Maria, a helpful assistant at Armenius Store in Cyprus, the premier computer hardware store.

PERSONALITY & APPROACH:
- Professional, friendly, and knowledgeable about computer hardware
- Patient and helpful, especially with technical questions
- Enthusiastic about helping customers find the right products
- Always confirm important details like product models, prices, or appointment times

CORE CAPABILITIES:
1. Product Information: Check inventory, prices, and specifications
2. Store Information: Hours, location, contact details  
3. Appointments: Book service appointments for repairs and consultations
4. Order Status: Check existing order status and tracking
5. Technical Support: Basic troubleshooting and product recommendations

BUSINESS CONTEXT:
- Store: Armenius Store Cyprus
- Location: 171 Makarios Avenue, Nicosia, Cyprus
- Phone: 77-111-104
- Hours: Monday-Friday 9am-7pm, Saturday 9am-2pm, Sunday closed
- Specialties: Gaming PCs, professional workstations, components, repairs

IMPORTANT GUIDELINES:
- Always verify customer phone numbers for appointments and orders
- Be specific about product availability and pricing
- If you cannot help with something, politely offer to transfer to a human
- Keep responses concise but informative
- Use natural, conversational language`;

  if (language === 'el') {
    return basePrompt + '\n\nLANGUAGE: Respond in Greek (Ελληνικά) using natural, conversational Greek.';
  }
    
  return basePrompt + '\n\nLANGUAGE: Respond in English using clear, professional language.';
}

function getFunctionDefinitions() {
  return [
    {
      name: 'checkInventory',
      description: 'Check product availability and stock levels',
      parameters: {
        type: 'object',
        properties: {
          product: {
            type: 'string',
            description: 'Product name, model, or SKU to check'
          }
        },
        required: ['product']
      }
    },
    {
      name: 'getProductPrice',
      description: 'Get current product pricing with quantity discounts',
      parameters: {
        type: 'object',
        properties: {
          product: {
            type: 'string',
            description: 'Product name, model, or SKU'
          },
          quantity: {
            type: 'number',
            description: 'Quantity for bulk pricing (optional)',
            default: 1
          }
        },
        required: ['product']
      }
    },
    {
      name: 'bookAppointment',
      description: 'Book service appointments for repairs and consultations',
      parameters: {
        type: 'object',
        properties: {
          service: {
            type: 'string',
            enum: ['repair', 'consultation', 'custom_build', 'warranty_service'],
            description: 'Type of service needed'
          },
          date: {
            type: 'string',
            description: 'Preferred appointment date (YYYY-MM-DD format)'
          },
          phoneNumber: {
            type: 'string',
            description: 'Customer phone number for confirmation'
          },
          description: {
            type: 'string',
            description: 'Brief description of the issue or service needed'
          }
        },
        required: ['service', 'phoneNumber']
      }
    },
    {
      name: 'checkOrderStatus', 
      description: 'Check the status of existing orders',
      parameters: {
        type: 'object',
        properties: {
          orderNumber: {
            type: 'string',
            description: 'Order number or reference ID'
          },
          phoneNumber: {
            type: 'string', 
            description: 'Phone number associated with the order'
          }
        },
        required: ['orderNumber', 'phoneNumber']
      }
    },
    {
      name: 'getStoreInfo',
      description: 'Get store information like hours, location, contact details',
      parameters: {
        type: 'object',
        properties: {
          infoType: {
            type: 'string',
            enum: ['hours', 'location', 'contact', 'services', 'directions'],
            description: 'Type of store information requested'
          }
        },
        required: ['infoType']
      }
    }
  ];
}

function getWebhookUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/vapi`;
}

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}