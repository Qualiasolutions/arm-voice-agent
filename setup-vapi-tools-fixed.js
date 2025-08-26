#!/usr/bin/env node

import fetch from 'node-fetch';

// Vapi API configuration
const VAPI_PRIVATE_KEY = '7b7a0576-788f-4425-9a20-d5d918ccf841';
const VAPI_BASE_URL = 'https://api.vapi.ai';

const headers = {
  'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
  'Content-Type': 'application/json'
};

// Function definitions for Armenius Store
const functions = [
  {
    type: "function",
    function: {
      name: "checkInventory",
      description: "Check product availability and stock levels from Armenius Store database with semantic search",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Name or description of the product to check"
          },
          product_sku: {
            type: "string", 
            description: "Product SKU code if available"
          },
          category: {
            type: "string",
            description: "Product category (graphics cards, processors, memory, etc.)"
          }
        },
        required: ["product_name"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProductPrice",
      description: "Get current product pricing with quantity discounts",
      parameters: {
        type: "object",
        properties: {
          product_identifier: {
            type: "string",
            description: "Product name or SKU"
          },
          quantity: {
            type: "number",
            description: "Quantity requested for bulk pricing",
            default: 1
          }
        },
        required: ["product_identifier"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bookAppointment", 
      description: "Schedule a service appointment for repairs, consultations, or custom builds",
      parameters: {
        type: "object",
        properties: {
          service_type: {
            type: "string",
            description: "Type of service (repair, consultation, custom_build, warranty_service)",
            enum: ["repair", "consultation", "custom_build", "warranty_service"]
          },
          preferred_date: {
            type: "string",
            description: "Preferred date and time (natural language or ISO format)"
          },
          customer_phone: {
            type: "string",
            description: "Customer phone number for confirmation"
          },
          customer_name: {
            type: "string",
            description: "Customer name"
          }
        },
        required: ["service_type", "preferred_date", "customer_phone"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkOrderStatus",
      description: "Check the status of an existing order with customer verification",
      parameters: {
        type: "object",
        properties: {
          order_number: {
            type: "string",
            description: "Order number or reference"
          },
          customer_phone: {
            type: "string",
            description: "Customer phone number associated with the order"
          }
        },
        required: ["order_number"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getStoreInfo",
      description: "Get store information including hours, location, contact details, and services",
      parameters: {
        type: "object",
        properties: {
          info_type: {
            type: "string",
            description: "Type of information requested",
            enum: ["hours", "location", "contact", "services", "general"]
          },
          language: {
            type: "string",
            description: "Preferred language (en/el)",
            enum: ["en", "el"]
          }
        }
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchLiveProducts",
      description: "Search for products using live data from armenius.com.cy website for the most current pricing and availability",
      parameters: {
        type: "object",
        properties: {
          product_query: {
            type: "string",
            description: "Product search query (e.g., 'RTX 4090', 'gaming laptop', 'AMD processor')"
          },
          category: {
            type: "string",
            description: "Product category to filter by (optional)",
            enum: ["graphics-cards", "processors", "memory", "storage", "motherboards", "laptops", "desktops", "gaming"]
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return",
            default: 5,
            minimum: 1,
            maximum: 10
          }
        },
        required: ["product_query"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getLiveProductDetails",
      description: "Get detailed information about a specific product from the live website",
      parameters: {
        type: "object",
        properties: {
          product_url: {
            type: "string",
            description: "Direct URL to the product page on armenius.com.cy"
          },
          product_sku: {
            type: "string",
            description: "Product SKU or identifier"
          }
        }
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buildCustomPC",
      description: "Interactive custom PC building service - guides customers through component selection and creates custom build orders",
      parameters: {
        type: "object",
        properties: {
          step: {
            type: "string",
            description: "Current step in the PC building process",
            enum: ["start", "select_components", "review_build", "confirm_order"],
            default: "start"
          },
          components: {
            type: "object",
            description: "Currently selected components",
            properties: {
              cpu: {type: "object"},
              gpu: {type: "object"},
              motherboard: {type: "object"},
              memory: {type: "object"},
              storage: {type: "object"},
              psu: {type: "object"},
              case: {type: "object"}
            }
          },
          budget_range: {
            type: "string",
            description: "Customer's budget range",
            enum: ["800-1200", "1200-2000", "2000-3500", "3500+"]
          },
          use_case: {
            type: "string",
            description: "Primary use case for the PC",
            enum: ["gaming", "professional", "office", "programming"]
          },
          component_selection: {
            type: "string",
            description: "Type of component currently being selected",
            enum: ["cpu", "gpu", "motherboard", "memory", "storage", "psu", "case", "cooling"]
          },
          confirm_build: {
            type: "boolean",
            description: "Whether customer confirms the final build order",
            default: false
          }
        }
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trackOrderByNumber",
      description: "Track order status and delivery information by tracking number or order ID - say 'Yes, I can track that for you!'",
      parameters: {
        type: "object",
        properties: {
          tracking_number: {
            type: "string",
            description: "Tracking number or order ID to look up (e.g., '1005', 'ARM-1008')"
          },
          order_id: {
            type: "string",
            description: "Alternative order ID if tracking number not provided"
          },
          customer_phone: {
            type: "string",
            description: "Customer phone number to verify order ownership"
          }
        },
        required: ["tracking_number"]
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkOrderArrivals",
      description: "Check if customer has any recent order arrivals ready for pickup",
      parameters: {
        type: "object",
        properties: {
          customer_phone: {
            type: "string",
            description: "Customer's phone number"
          },
          customer_email: {
            type: "string",
            description: "Customer's email address"
          }
        }
      }
    },
    server: {
      url: "https://armenius.vercel.app/api/vapi",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vapi-Function-Call/1.0"
      }
    }
  }
];

async function createTool(functionDef) {
  try {
    const response = await fetch(`${VAPI_BASE_URL}/tool`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(functionDef)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create tool ${functionDef.function?.name || 'unknown'}:`, response.status, errorText);
      return null;
    }

    const tool = await response.json();
    console.log(`✅ Created tool: ${functionDef.function.name} (ID: ${tool.id})`);
    return tool;
  } catch (error) {
    console.error(`Error creating tool ${functionDef.function?.name || 'unknown'}:`, error.message);
    return null;
  }
}

async function listExistingTools() {
  try {
    const response = await fetch(`${VAPI_BASE_URL}/tool`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      console.error('Failed to list tools:', response.status);
      return [];
    }

    const tools = await response.json();
    console.log(`\nExisting tools: ${tools.length}`);
    tools.forEach(tool => {
      console.log(`- ${tool.function?.name || tool.name || 'unnamed'} (ID: ${tool.id})`);
    });
    return tools;
  } catch (error) {
    console.error('Error listing tools:', error.message);
    return [];
  }
}

async function setupAllTools() {
  console.log('🚀 Setting up Armenius Store Voice Functions...\n');

  // List existing tools first
  const existingTools = await listExistingTools();
  const existingNames = existingTools.map(t => t.function?.name || t.name);

  console.log('\n📝 Creating function tools...\n');

  const createdTools = [];
  for (const functionDef of functions) {
    const functionName = functionDef.function.name;
    
    if (existingNames.includes(functionName)) {
      console.log(`⏭️ Tool ${functionName} already exists, skipping...`);
      continue;
    }

    const tool = await createTool(functionDef);
    if (tool) {
      createdTools.push(tool);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Setup complete! Created ${createdTools.length} new tools.`);
  console.log('\nTool IDs for your assistant configuration:');
  createdTools.forEach(tool => {
    console.log(`- ${tool.function?.name || tool.name}: ${tool.id}`);
  });

  return createdTools;
}

// Run the setup
setupAllTools().catch(console.error);