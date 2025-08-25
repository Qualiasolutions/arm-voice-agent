// MCP (Model Context Protocol) Configuration for Armenius Store Voice Assistant
// This file handles MCP server setup and integration testing

export const mcpConfig = {
  // Default MCP server configuration
  defaultServer: {
    url: process.env.MCP_SERVER_URL || "https://mcp.zapier.com/api/mcp/s/YOUR_ZAPIER_MCP_TOKEN/mcp",
    protocol: "shttp", // Streamable HTTP for better performance
    headers: {
      "User-Agent": "Armenius-Store-Voice-Assistant/1.0",
      "X-Client": "vapi",
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    timeout: 30000, // 30 second timeout
    retryAttempts: 3
  },

  // Available MCP server types and their configurations
  serverTypes: {
    zapier: {
      name: "Zapier MCP",
      description: "Access to 7000+ apps and 30000+ actions through Zapier",
      baseUrl: "https://mcp.zapier.com/api/mcp/s/",
      capabilities: [
        "email_notifications",
        "sms_messaging", 
        "calendar_integration",
        "crm_integration",
        "task_automation",
        "data_sync"
      ]
    },
    firecrawl: {
      name: "Firecrawl MCP",
      description: "Web scraping and content extraction for product data updates",
      baseUrl: "https://api.firecrawl.dev/",
      capabilities: [
        "web_scraping",
        "content_extraction",
        "batch_processing",
        "structured_data_extraction",
        "search_capabilities",
        "deep_research"
      ],
      tools: [
        "firecrawl_scrape",
        "firecrawl_batch_scrape",
        "firecrawl_search",
        "firecrawl_extract",
        "firecrawl_crawl",
        "firecrawl_deep_research"
      ]
    },
    composio: {
      name: "Composio MCP",
      description: "Specific tool integrations (Gmail, GitHub, etc.)",
      baseUrl: "https://mcp.composio.dev/api/mcp/",
      capabilities: [
        "gmail_integration",
        "github_operations",
        "slack_messaging",
        "calendar_management"
      ]
    }
  },

  // Common MCP tools that might be available for Armenius Store
  expectedTools: {
    // Customer Communication
    "send_email": {
      description: "Send confirmation emails to customers",
      useCases: ["appointment confirmations", "order confirmations", "follow-ups"]
    },
    "send_sms": {
      description: "Send SMS notifications to customers", 
      useCases: ["appointment reminders", "order updates", "urgent notifications"]
    },
    
    // Calendar Integration
    "create_calendar_event": {
      description: "Create calendar events for appointments",
      useCases: ["service appointments", "delivery schedules", "staff meetings"]
    },
    
    // CRM Integration
    "update_customer_record": {
      description: "Update customer information in CRM",
      useCases: ["contact updates", "purchase history", "service records"]
    },
    
    // Task Management
    "create_task": {
      description: "Create follow-up tasks for staff",
      useCases: ["order processing", "service follow-ups", "inventory checks"]
    },
    
    // Firecrawl Tools for Product Data Management
    "firecrawl_scrape": {
      description: "Scrape armenius.com.cy for product updates",
      useCases: ["product inventory sync", "price updates", "new product discovery"]
    },
    "firecrawl_extract": {
      description: "Extract structured product data from web pages",
      useCases: ["product specifications", "pricing data", "stock information"]
    },
    "firecrawl_batch_scrape": {
      description: "Batch scrape multiple product pages",
      useCases: ["catalog synchronization", "bulk product updates", "competitive analysis"]
    }
  }
};

// MCP Server Connection Test
export async function testMcpConnection(serverUrl) {
  const testConfig = {
    ...mcpConfig.defaultServer,
    url: serverUrl
  };

  try {
    console.log(`Testing MCP connection to: ${serverUrl}`);
    
    // Test basic connectivity (this would be implemented with actual HTTP client)
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: testConfig.headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("✅ MCP Connection successful");
    console.log(`Available tools: ${data.result?.tools?.length || 0}`);
    
    return {
      success: true,
      tools: data.result?.tools || [],
      capabilities: data.result?.capabilities || []
    };

  } catch (error) {
    console.error("❌ MCP Connection failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Validate MCP tool configuration
export function validateMcpTool(toolConfig) {
  const requiredFields = ['type', 'name', 'server'];
  const missingFields = requiredFields.filter(field => !toolConfig[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missingFields.join(', ')}`]
    };
  }

  if (toolConfig.type !== 'mcp') {
    return {
      valid: false,
      errors: ['Tool type must be "mcp"']
    };
  }

  if (!toolConfig.server.url) {
    return {
      valid: false,
      errors: ['Server URL is required']
    };
  }

  // Validate URL format
  try {
    new URL(toolConfig.server.url);
  } catch (error) {
    return {
      valid: false,
      errors: ['Server URL is not a valid URL']
    };
  }

  return {
    valid: true,
    errors: []
  };
}

// Generate MCP tool configuration for Vapi
export function generateMcpToolConfig(serverUrl, options = {}) {
  const config = {
    type: "mcp",
    name: options.name || "mcpTools",
    description: options.description || "Access to extended capabilities through MCP server integration",
    server: {
      url: serverUrl,
      headers: {
        ...mcpConfig.defaultServer.headers,
        ...options.headers
      }
    },
    metadata: {
      protocol: options.protocol || "shttp",
      ...options.metadata
    }
  };

  return config;
}

// Load global MCP configuration from ~/.config/vapi/.env.mcp
export async function loadGlobalMcpConfig() {
  try {
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs');
    
    const globalConfigPath = path.join(os.homedir(), '.config', 'vapi', '.env.mcp');
    
    if (fs.existsSync(globalConfigPath)) {
      const configContent = fs.readFileSync(globalConfigPath, 'utf8');
      const config = {};
      
      configContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      });
      
      return config;
    }
    
    return {};
  } catch (error) {
    console.warn('Could not load global MCP config:', error.message);
    return {};
  }
}

// Validate global MCP configuration
export async function validateGlobalMcpConfig() {
  const globalConfig = await loadGlobalMcpConfig();
  
  console.log('🔍 Checking global MCP configuration...');
  console.log(`📁 Config path: ~/.config/vapi/.env.mcp`);
  
  if (Object.keys(globalConfig).length === 0) {
    console.log('⚠️  No global MCP configuration found');
    console.log('💡 Create ~/.config/vapi/.env.mcp with:');
    console.log('   ZAPIER_MCP_TOKEN=your_zapier_token');
    console.log('   FIRECRAWL_API_KEY=fc-your_firecrawl_key');
    return false;
  }
  
  console.log('✅ Global MCP configuration loaded');
  console.log('🔧 Available integrations:');
  
  if (globalConfig.ZAPIER_MCP_TOKEN) {
    console.log('   ✅ Zapier MCP (7000+ apps)');
  } else {
    console.log('   ❌ Zapier MCP (missing token)');
  }
  
  if (globalConfig.FIRECRAWL_API_KEY) {
    console.log('   ✅ Firecrawl MCP (web scraping)');
  } else {
    console.log('   ❌ Firecrawl MCP (missing API key)');
  }
  
  return true;
}

// Generate Firecrawl scraping configuration for armenius.com.cy
export function generateFirecrawlScrapingConfig() {
  return {
    armenius: {
      baseUrl: 'https://armenius.com.cy',
      productPages: [
        '/products',
        '/categories',
        '/electronics',
        '/computers',
        '/accessories'
      ],
      extractionSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
          sku: { type: 'string' },
          category: { type: 'string' },
          stock_quantity: { type: 'number' },
          specifications: { type: 'object' },
          images: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'price', 'description']
      },
      scrapingOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        includeTags: ['article', 'main', '.product'],
        excludeTags: ['nav', 'footer', '.ads', '.sidebar'],
        waitFor: 2000,
        timeout: 30000
      }
    }
  };
}

export default mcpConfig;