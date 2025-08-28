// Secure configuration endpoint - only returns public/safe config
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
    
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
    
  // Only return safe, public configuration
  const publicConfig = {
    // NO sensitive environment variables exposed
    environment: 'development',
    debug: false, // Never expose debug in production
        
    // Voice settings (safe to expose)
    voice: {
      provider: '11labs',
      language: 'en-US'
      // voiceId NOT exposed - handled on backend
    },
        
    // Model settings (safe to expose)
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini'
      // No API keys exposed
    },
        
    // Available functions (safe to expose)
    functions: [
      'checkInventory',
      'getProductPrice', 
      'bookAppointment',
      'checkOrderStatus',
      'getStoreInfo'
    ],
        
    // Test scenarios for UI (safe to expose)
    testScenarios: {
      inventory: {
        en: 'Do you have the RTX 4090 graphics card in stock?',
        el: 'Έχετε διαθέσιμη την κάρτα γραφικών RTX 4090;'
      },
      price: {
        en: "What's the price of the Intel Core i9-13900K?",
        el: 'Ποια είναι η τιμή του Intel Core i9-13900K;'
      },
      appointment: {
        en: 'I need to book an appointment for computer repair',
        el: 'Θέλω να κλείσω ραντεβού για επισκευή υπολογιστή'
      },
      hours: {
        en: 'What are your store hours today?',
        el: 'Ποιες είναι οι ώρες λειτουργίας σας σήμερα;'
      },
      location: {
        en: 'Where is your store located?',
        el: 'Πού βρίσκεται το κατάστημά σας;'
      }
    },
        
    // Vapi configuration (public key safe to expose)
    vapi: {
      publicKey: process.env.VAPI_PUBLIC_KEY || '32b555af-1fbc-4b6c-81c0-c940b07c6da2',
      assistantId: '89b5d633-974a-4b58-a6b5-cdbba8c2726a',
      available: !!process.env.VAPI_API_KEY
    },
        
    // System status (safe to expose)
    systemStatus: {
      hasVapiConfig: !!process.env.VAPI_API_KEY,
      hasSupabaseConfig: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      hasOpenAIConfig: !!process.env.OPENAI_API_KEY,
      hasDeepgramConfig: !!process.env.DEEPGRAM_API_KEY
    },
        
    // Store information (safe to expose)
    storeInfo: {
      name: 'Armenius Store Cyprus',
      address: '171 Makarios Avenue, Nicosia, Cyprus',
      phone: '77-111-104',
      hours: 'Monday-Friday 9am-7pm, Saturday 9am-2pm, Sunday closed'
    }
  };
    
  return res.status(200).json(publicConfig);
}