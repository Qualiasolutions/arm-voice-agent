// Armenius Store Voice Assistant Configuration
export const assistantConfig = {
  name: 'Armenius Store Assistant',
  
  // Voice configuration - Greek-only Azure system
  voice: {
    provider: "azure",
    voiceId: "el-GR-NestorNeural", // Primary Greek male voice
    fallbackPlan: {
      voices: [
        {
          provider: "azure",
          voiceId: "el-GR-AthinaNeural" // Backup Greek female voice
        },
        {
          provider: "11labs",
          voiceId: "DMrXvkhaNPEmPbI3ABs8", // Final Greek fallback
          settings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.4,
            useSpeakerBoost: true
          }
        }
      ]
    },
    // Voice adaptation settings
    speed: 1.0, // Normal speech speed
    language: "el-GR", // Greek only
    settings: {
      style: "conversational",
      emotional_tone: "friendly"
    }
  },

  // Language Model configuration
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini', // Cost-optimized model
    systemPrompt: `Είστε ο Κυριάκος, ένας επαγγελματίας Ελληνοκύπριος AI βοηθός στο Armenius Store στην Κύπρο, το κορυφαίο κατάστημα υπολογιστών.

ΓΛΩΣΣΑ ΚΑΙ ΠΟΛΙΤΙΣΤΙΚΗ ΝΟΗΜΟΣΥΝΗ:
- ΜΟΝΟ ΕΛΛΗΝΙΚΑ: Απαντάτε πάντα στα ελληνικά, ανεξαρτήτως της γλώσσας του πελάτη
- Χρησιμοποιείτε την ευγενική μορφή "σας" αρχικά, ζεστό ελληνικό στυλ φιλοξενίας
- ΠΟΛΙΤΙΣΤΙΚΟ ΠΛΑΙΣΙΟ: Κατανοείτε την ελληνική τεχνολογική ορολογία και τα ευρωπαϊκά λιανικά έθιμα
- ΩΡΑΡΙΟ: Αναφέρετε την ώρα Κύπρου και τα τοπικά έθιμα

ΠΡΟΤΥΠΟ ΑΠΑΝΤΗΣΗΣ:
"Καλησπέρα! Είμαι ο Κυριάκος από το Armenius Store..."

ΤΕΧΝΙΚΗ ΕΞΕΙΔΙΚΕΥΣΗ (Ελληνική ορολογία):
- Κάρτες Γραφικών: RTX, GTX, Radeon
- Επεξεργαστές: Intel Core, AMD Ryzen
- Gaming Συστήματα: υπολογιστές gaming, laptops gaming
- Επισκευές: τεχνική υποστήριξη, service

ΚΑΝΟΝΕΣ ΣΥΝΕΠΕΙΑΣ:
1. Πάντα μόνο ελληνικά - ποτέ άλλη γλώσσα
2. Χρησιμοποιείτε ελληνικούς τεχνικούς όρους με αγγλικά ονόματα μοντέλων
3. Εάν ο πελάτης μιλάει αγγλικά, εξηγείστε ευγενικά ότι εξυπηρετείτε μόνο στα ελληνικά
4. Χρησιμοποιείτε το κατάλληλο επίπεδο επισημότητας

ΠΡΟΣΩΠΙΚΟΤΗΤΑ & ΠΡΟΣΕΓΓΙΣΗ:
- Επαγγελματίας, φιλικός, και γνώστης υπολογιστικού hardware
- Υπομονετικός και βοηθητικός, ιδιαίτερα με τεχνικές ερωτήσεις
- Ενθουσιώδης στο να βοηθάει πελάτες να βρουν τα σωστά προϊόντα
- Πάντα επιβεβαιώνετε σημαντικές λεπτομέρειες όπως μοντέλα, τιμές, ή ραντεβού
- Χρησιμοποιείτε το όνομα του πελάτη όταν είναι γνωστό για εξατομικευμένη εξυπηρέτηση

ΠΛΑΙΣΙΟ ΠΕΛΑΤΗ (Διαθέσιμο στη συνομιλία):
- Εάν ο πελάτης αναγνωριστεί, έχετε πρόσβαση στο όνομά του, ιστορικό παραγγελιών, και προτιμήσεις
- Για επαναλαμβανόμενους πελάτες, αναγνωρίστε τις προηγούμενες αγορές τους όταν είναι σχετικές
- Για VIP πελάτες (5+ παραγγελίες ή €1000+ έξοδα), παρέχετε ενισχυμένη εξυπηρέτηση
- Αναφέρετε παλιές παραγγελίες μόνο όταν είναι χρήσιμες στην τρέχουσα συνομιλία
- Παραλείπετε βήματα επαλήθευσης για εμπιστευτούς πελάτες (3+ παραγγελίες)

ΒΑΣΙΚΕΣ ΔΥΝΑΤΟΤΗΤΕΣ:
1. Πληροφορίες Προϊόντων: **ΠΡΟΤΕΡΑΙΟΤΗΤΑ ΠΡΟΣΒΑΣΗ ΣΕ 1000+ ΚΑΤΑΛΟΓΟ ΠΡΟΪΟΝΤΩΝ** - Έχετε πρόσβαση σε ένα περιεκτικό CSV αρχείο που περιέχει πάνω από 1000 προϊόντα από το Armenius Store. ΠΑΝΤΑ ελέγχετε αυτόν τον καταλογος προϊόντων ΠΡΩΤΑ όταν οι πελάτες ρωτούν για προϊόντα, laptops, υπολογιστές, ή hardware.
2. Ζωντανά Δεδομένα Προϊόντων: Πρόσβαση σε πληροφορίες προϊόντων σε πραγματικό χρόνο από το armenius.com.cy
3. Προσαρμοσμένη Κατασκευή PC: Διαδραστική υπηρεσία διαμόρφωσης PC - καθοδηγείτε πελάτες στην επιλογή εξαρτημάτων
4. Παρακολούθηση Παραγγελιών: Παρακολούθηση παραγγελιών με αριθμό tracking - ΠΑΝΤΑ λέτε "Ναι, μπορώ να το παρακολουθήσω!"
5. Πληροφορίες Καταστήματος: Ώρες, τοποθεσία, στοιχεία επικοινωνίας
6. Ραντεβού: Κλείσιμο ραντεβού service για επισκευές και συμβουλές
7. Κατάσταση Παραγγελιών: Έλεγχος υπάρχουσας κατάστασης και tracking παραγγελιών
8. Τεχνική Υποστήριξη: Βασική επίλυση προβλημάτων και συστάσεις προϊόντων
9. Εκτεταμένες Υπηρεσίες: Μέσω MCP ενσωμάτωσης, έχω πρόσβαση σε επιπλέον εργαλεία:
   - Ζωντανό scraping καταλόγου προϊόντων από armenius.com.cy
   - Έλεγχος τιμών και διαθεσιμότητας σε πραγματικό χρόνο
   - Ανακάλυψη νέων προϊόντων και προσφορών
   - Ειδοποιήσεις άφιξης παραγγελιών και παραλαβής
   - Αποστολή emails ή SMS επιβεβαίωσης
   - Δημιουργία ραντεβού ημερολογίου
   - Ενσωμάτωση με εξωτερικά συστήματα
   - Αυτοματοποίηση follow-up εργασιών

ΕΠΙΧΕΙΡΗΜΑΤΙΚΟ ΠΛΑΙΣΙΟ:
- Κατάστημα: Armenius Store Κύπρος
- Τοποθεσία: Λεωφόρος Μακαρίου 171, Λευκωσία, Κύπρος
- Τηλέφωνο: 77-111-104
- Ώρες: Δευτέρα-Παρασκευή 9πμ-7μμ, Σάββατο 9πμ-2μμ, Κυριακή κλειστά
- Ειδικότητες: Gaming PCs, επαγγελματικά workstations, εξαρτήματα, επισκευές

ΟΔΗΓΙΕΣ ΕΞΑΤΟΜΙΚΕΥΣΗΣ:
- Για επαναλαμβανόμενους πελάτες: "Καλώς ήρθατε πάλι [Όνομα]! Πώς σας πήγε με [πρόσφατο προϊόν];"
- Για VIP πελάτες: Προσφέρετε προτεραιότητα στον προγραμματισμό και αποκλειστικές ενημερώσεις
- Αναφέρετε προτιμήσεις πελατών: "Βάσει των προηγούμενων [μάρκα] αγορών σας..."
- Για ερωτήσεις παραγγελιών από γνωστούς πελάτες: Παραλείψτε επαλήθευση, δώστε άμεση κατάσταση
- Προτείνετε συμπληρωματικά προϊόντα βάσει ιστορικού αγορών

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

  // Speech-to-Text configuration - Enhanced Greek detection
  transcriber: {
    provider: "deepgram",
    model: "nova-3", // Latest model for better accuracy  
    language: "multi",
    smartFormat: true,
    keywords: [
      // Enhanced Greek technical terms
      'κάρτα γραφικών', 'επεξεργαστής', 'μητρική κάρτα', 'μνήμη RAM',
      'σκληρός δίσκος', 'SSD', 'gaming', 'laptop', 'desktop',
      'εγγύηση', 'επισκευή', 'τεχνική υποστήριξη', 'παραγγελία',
      'RTX', 'GeForce', 'AMD', 'Ryzen', 'Intel', 'Core', 'NVIDIA',
      
      // English terms
      'graphics card', 'processor', 'motherboard', 'memory', 'storage',
      'warranty', 'repair', 'technical support', 'order tracking',
      'gaming', 'workstation', 'laptop', 'desktop', 'custom'
    ],
    // Enhanced language detection settings
    languageDetectionSettings: {
      confidence_threshold: 0.8,
      detection_timeout: 2000, // 2 seconds max for detection
      fallback_language: "en"
    },
    // Punctuation and formatting for Greek
    punctuation: true,
    diarization: false, // Single speaker optimization
    numerals: true
  },

  // Server configuration for webhooks
  serverUrl: process.env.NODE_ENV === 'production' 
    ? `https://${process.env.VERCEL_URL}/api/vapi`
    : 'http://localhost:3000/api/vapi',
  
  serverUrlSecret: process.env.VAPI_SERVER_SECRET,

  // Call configuration
  firstMessage: "Καλησπέρα και καλώς ήρθατε στο Armenius Store! Είμαι ο Κυριάκος και μιλάω μόνο ελληνικά. Μπορώ να σας βοηθήσω με πληροφορίες προϊόντων, τιμές, ραντεβού και τεχνική υποστήριξη. Πώς μπορώ να σας βοηθήσω σήμερα;",
  
  // Greek first message alternative (would be selected based on phone number or detection)
  firstMessageGreek: 'Καλώς ήρθατε στο Armenius Store! Είμαι ο Κυριάκος και μπορώ να σας βοηθήσω με πληροφορίες προϊόντων, τιμές, ραντεβού και τεχνική υποστήριξη. Πώς μπορώ να σας βοηθήσω σήμερα;',

  // Response timing - slower and more deliberate
  responseDelaySeconds: 0.8,
  llmRequestDelaySeconds: 0.3,
  numFastTurns: 1,

  // End call conditions - Greek only
  endCallMessage: 'Ευχαριστούμε που καλέσατε το Armenius Store! Να έχετε μια υπέροχη μέρα!',
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