// Vapi MCP Client - For dynamic voice assistant management
// Temporary: Disable MCP imports for deployment
// import { mcp__vapi__update_assistant, mcp__vapi__get_call, mcp__vapi__list_assistants } from '../../mcp-functions.js';

export class VapiMCPClient {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Test connection by listing assistants
      await mcp__vapi__list_assistants();
      this.initialized = true;
      console.log('Vapi MCP client initialized successfully');
    } catch (error) {
      console.warn('Vapi MCP client initialization failed:', error.message);
      console.warn('Voice optimization features will be limited');
    }
  }

  async updateAssistantVoice(assistantId, voiceConfig) {
    try {
      await this.init();
      
      if (!this.initialized) {
        console.warn('Vapi MCP not available, skipping voice update');
        return false;
      }

      const result = await mcp__vapi__update_assistant(assistantId, {
        voice: voiceConfig
      });
      
      return result;
    } catch (error) {
      console.error('Failed to update assistant voice:', error);
      return false;
    }
  }

  async getCallDetails(callId) {
    try {
      await this.init();
      
      if (!this.initialized) {
        return null;
      }

      return await mcp__vapi__get_call(callId);
    } catch (error) {
      console.error('Failed to get call details:', error);
      return null;
    }
  }

  async analyzeCallQuality(callId) {
    try {
      const callDetails = await this.getCallDetails(callId);
      
      if (!callDetails) return null;

      return {
        duration: callDetails.duration || 0,
        endReason: callDetails.endedReason || 'unknown',
        transcript: callDetails.transcript || '',
        costs: callDetails.costs || {},
        quality: {
          responseTime: callDetails.averageResponseTime || 0,
          clarity: callDetails.audioQuality?.clarity || 0,
          satisfaction: callDetails.satisfactionScore || 0
        }
      };
    } catch (error) {
      console.error('Call quality analysis failed:', error);
      return null;
    }
  }
}

export default new VapiMCPClient();