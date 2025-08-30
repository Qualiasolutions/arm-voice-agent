import { mcp__memory__create_entities, mcp__memory__create_relations, mcp__memory__search_nodes } from '../mcp-clients/memory.js';

export default {
  rememberCustomerPreferences: {
    ttl: 86400, // 24-hour memory cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      try {
        const { customerProfile, conversationId } = callContext;
        const { detectedLanguage, voiceRating, technicalLevel, recentTopics } = parameters;
        
        if (!customerProfile?.phone) {
          return {
            message: detectedLanguage === 'el'
              ? "Δεν μπόρεσα να αποθηκεύσω τις προτιμήσεις χωρίς στοιχεία επικοινωνίας"
              : "Cannot store preferences without contact information",
            memoryStored: false
          };
        }

        // Store customer preferences in Memory MCP
        await mcp__memory__create_entities([{
          name: `Customer-${customerProfile.phone}`,
          entityType: 'customer_profile',
          observations: [
            `Preferred language: ${detectedLanguage || 'unknown'}`,
            `Voice quality preference: ${voiceRating || 'unknown'}`,
            `Technical level: ${technicalLevel || 'unknown'}`,
            `Recent inquiries: ${JSON.stringify(recentTopics || [])}`,
            `Cultural context: ${detectedLanguage === 'el' ? 'Greek-Cypriot' : 'International'}`,
            `Last interaction: ${new Date().toISOString()}`,
            `Conversation style: ${detectedLanguage === 'el' ? 'Formal Greek hospitality' : 'Professional English'}`
          ]
        }]);
        
        // Create conversation relationship
        if (conversationId) {
          await mcp__memory__create_relations([{
            from: `Customer-${customerProfile.phone}`,
            to: `Conversation-${conversationId}`,
            relationType: 'had_conversation_in_language'
          }]);
        }
        
        return {
          message: detectedLanguage === 'el'
            ? "Θα θυμάμαι τις προτιμήσεις σας για την επόμενη φορά"
            : "I'll remember your preferences for next time",
          memoryStored: true,
          storedPreferences: {
            language: detectedLanguage,
            technicalLevel: technicalLevel,
            culturalContext: detectedLanguage === 'el' ? 'Greek-Cypriot' : 'International'
          }
        };
      } catch (error) {
        console.error('Memory storage failed:', error);
        return {
          message: parameters.detectedLanguage === 'el'
            ? "Συγγνώμη, δεν μπόρεσα να αποθηκεύσω τις προτιμήσεις σας"
            : "Sorry, I couldn't store your preferences",
          memoryStored: false,
          error: error.message
        };
      }
    }
  },

  retrieveCustomerContext: {
    ttl: 300, // 5-minute cache
    cacheable: true,

    async execute(parameters, callContext) {
      try {
        const { customerPhone } = parameters;
        
        if (!customerPhone) {
          return { contextFound: false };
        }

        // Search for customer in memory
        const customerNodes = await mcp__memory__search_nodes(`Customer-${customerPhone}`);
        
        if (customerNodes.entities.length === 0) {
          return { contextFound: false };
        }

        const customerEntity = customerNodes.entities[0];
        const preferences = this.parseCustomerObservations(customerEntity.observations);

        return {
          contextFound: true,
          customerContext: preferences,
          message: preferences.language === 'el'
            ? `Καλώς ήρθατε πίσω! Θυμάμαι ότι προτιμάτε ${preferences.language === 'el' ? 'Ελληνικά' : 'Αγγλικά'}`
            : `Welcome back! I remember you prefer ${preferences.language === 'el' ? 'Greek' : 'English'}`
        };
      } catch (error) {
        console.error('Context retrieval failed:', error);
        return { 
          contextFound: false,
          error: error.message
        };
      }
    },

    parseCustomerObservations(observations) {
      const preferences = {
        language: 'en',
        technicalLevel: 'unknown',
        culturalContext: 'International',
        voiceRating: 'unknown'
      };

      observations.forEach(obs => {
        if (obs.includes('Preferred language:')) {
          preferences.language = obs.split(':')[1].trim();
        } else if (obs.includes('Technical level:')) {
          preferences.technicalLevel = obs.split(':')[1].trim();
        } else if (obs.includes('Cultural context:')) {
          preferences.culturalContext = obs.split(':')[1].trim();
        } else if (obs.includes('Voice quality preference:')) {
          preferences.voiceRating = obs.split(':')[1].trim();
        }
      });

      return preferences;
    }
  }
};