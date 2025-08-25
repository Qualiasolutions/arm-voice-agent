// Secure Frontend Configuration - NO sensitive data exposed
// All sensitive configuration is handled on the backend

const FRONTEND_CONFIG = {
  // API endpoints for secure backend communication
  apiEndpoints: {
    config: '/api/config',
    vapiInit: '/api/vapi/init', 
    vapiWebhook: '/api/vapi',
    health: '/api/vapi/health',
    functionTest: '/api/vapi'
  },
    
  // UI settings (safe to expose)
  ui: {
    environment: 'development',
    debug: false,
    language: 'en',
    theme: 'light'
  },
    
  // Call settings (safe to expose)
  call: {
    maxDurationMinutes: 15,
    costPerCall: 0.32, // Estimated average
    targetResponseTimeMs: 500
  },
    
  // Metrics for display (safe to expose)
  metrics: {
    automationRate: 82.5,
    customerSatisfaction: 4.7,
    avgCallDuration: '3m 24s',
    resolutionRate: 89.2
  }
};

// Secure configuration loader
class SecureConfig {
  constructor() {
    this.config = null;
    this.vapiSession = null;
    this.loaded = false;
  }
    
  // Load public configuration from secure backend
  async loadConfig() {
    try {
      const response = await fetch(FRONTEND_CONFIG.apiEndpoints.config);
      if (!response.ok) {
        throw new Error(`Config load failed: ${response.status}`);
      }
            
      this.config = await response.json();
      this.loaded = true;
      console.log('✅ Secure configuration loaded');
      return this.config;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }
    
  // Initialize Vapi session securely through backend
  async initVapiSession(language = 'en') {
    try {
      const response = await fetch(FRONTEND_CONFIG.apiEndpoints.vapiInit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language })
      });
            
      if (!response.ok) {
        throw new Error(`Vapi init failed: ${response.status}`);
      }
            
      this.vapiSession = await response.json();
      console.log('✅ Vapi session initialized securely');
      return this.vapiSession;
    } catch (error) {
      console.error('❌ Failed to initialize Vapi session:', error);
      throw error;
    }
  }
    
  // Get system status
  async getSystemStatus() {
    try {
      const response = await fetch(FRONTEND_CONFIG.apiEndpoints.health);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
            
      return await response.json();
    } catch (error) {
      console.error('❌ System status check failed:', error);
      return { status: 'error', services: {} };
    }
  }
    
  // Test function calls securely
  async testFunction(functionName, parameters = {}) {
    try {
      const response = await fetch(FRONTEND_CONFIG.apiEndpoints.functionTest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'function-call',
          functionCall: {
            name: functionName,
            parameters: parameters
          }
        })
      });
            
      if (!response.ok) {
        throw new Error(`Function test failed: ${response.status}`);
      }
            
      return await response.json();
    } catch (error) {
      console.error(`❌ Function test failed for ${functionName}:`, error);
      throw error;
    }
  }
    
  // Get configuration value safely
  get(path) {
    if (!this.loaded || !this.config) {
      console.warn('⚠️ Configuration not loaded yet');
      return null;
    }
        
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }
    
  // Get frontend config value
  getFrontend(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], FRONTEND_CONFIG);
  }
}

// Create global secure config instance
const secureConfig = new SecureConfig();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FRONTEND_CONFIG, SecureConfig, secureConfig };
}

// Make available globally
window.secureConfig = secureConfig;
window.FRONTEND_CONFIG = FRONTEND_CONFIG;