import { mcp__vapi__update_assistant } from '../mcp-clients/vapi.js';
import { detectLanguage } from '../utils/language-detection.js';

export default {
  dynamicVoiceOptimization: {
    ttl: 60, // 1 minute cache for voice settings
    fallbackResponse: "I'm optimizing my voice for you, please hold on",
    cacheable: false, // Always fresh for personalization
    
    async execute(parameters, callContext) {
      try {
        const { language, customerProfile } = callContext;
        const detectedLanguage = language || detectLanguage(parameters.userInput);
        
        // Select optimal voice based on language and customer profile
        const voiceConfig = await this.selectOptimalVoice(detectedLanguage, customerProfile);
        
        // Update assistant configuration via MCP
        if (callContext.assistantId) {
          await mcp__vapi__update_assistant(callContext.assistantId, {
            voice: voiceConfig,
            model: {
              temperature: detectedLanguage === 'el' ? 0.6 : 0.7, // Greeks prefer more structured responses
            }
          });
        }
        
        return {
          message: detectedLanguage === 'el' 
            ? "Προσαρμόζω τη φωνή μου για εσάς"
            : "I'm optimizing my voice for you",
          voiceOptimized: true,
          selectedVoice: voiceConfig.voiceId,
          language: detectedLanguage
        };
      } catch (error) {
        console.error('Voice optimization failed:', error);
        return {
          message: parameters.language === 'el' 
            ? "Συγγνώμη, θα χρησιμοποιήσω την κανονική μου φωνή"
            : "Sorry, I'll use my normal voice",
          voiceOptimized: false,
          error: error.message
        };
      }
    },

    async selectOptimalVoice(language, customerProfile) {
      const voiceConfigs = {
        'el': {
          provider: "azure",
          voiceId: customerProfile?.preferredVoiceGender === 'female' 
            ? "el-GR-AthinaNeural" 
            : "el-GR-NestorNeural",
          fallbackPlan: {
            voices: [
              { provider: "azure", voiceId: "el-GR-AthinaNeural" },
              { provider: "azure", voiceId: "en-US-BrianNeural" },
              { provider: "11labs", voiceId: "DMrXvkhaNPEmPbI3ABs8" }
            ]
          }
        },
        'en': {
          provider: "azure", 
          voiceId: customerProfile?.preferredVoiceGender === 'female'
            ? "en-US-AriaNeural"
            : "en-US-BrianNeural",
          fallbackPlan: {
            voices: [
              { provider: "azure", voiceId: "en-US-AriaNeural" },
              { provider: "azure", voiceId: "el-GR-NestorNeural" },
              { provider: "11labs", voiceId: "DMrXvkhaNPEmPbI3ABs8" }
            ]
          }
        }
      };

      return voiceConfigs[language] || voiceConfigs['en'];
    }
  }
};