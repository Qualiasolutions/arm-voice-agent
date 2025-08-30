// Memory MCP Client - For persistent customer context
// Temporary: Disable MCP imports for deployment
/*
import { 
  mcp__memory__create_entities, 
  mcp__memory__create_relations, 
  mcp__memory__search_nodes,
  mcp__memory__add_observations,
  mcp__memory__open_nodes 
} from '../../mcp-functions.js';

export { 
  mcp__memory__create_entities, 
  mcp__memory__create_relations, 
  mcp__memory__search_nodes,
  mcp__memory__add_observations,
  mcp__memory__open_nodes
};
*/

export class MemoryMCPClient {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Test connection by searching for a test entity
      await mcp__memory__search_nodes('test');
      this.initialized = true;
      console.log('Memory MCP client initialized successfully');
    } catch (error) {
      console.warn('Memory MCP client initialization failed:', error.message);
      console.warn('Customer memory features will be limited');
    }
  }

  async storeCustomerProfile(customerPhone, profile) {
    try {
      await this.init();
      
      if (!this.initialized) {
        console.warn('Memory MCP not available, skipping profile storage');
        return false;
      }

      const entityName = `Customer-${customerPhone}`;
      const observations = [
        `Preferred language: ${profile.language || 'unknown'}`,
        `Voice quality preference: ${profile.voiceRating || 'unknown'}`,
        `Technical level: ${profile.technicalLevel || 'unknown'}`,
        `Cultural context: ${profile.culturalContext || 'unknown'}`,
        `Last interaction: ${new Date().toISOString()}`,
        `Customer type: ${profile.isVip ? 'VIP' : 'Regular'}`
      ];

      if (profile.recentTopics && profile.recentTopics.length > 0) {
        observations.push(`Recent topics: ${JSON.stringify(profile.recentTopics)}`);
      }

      await mcp__memory__create_entities([{
        name: entityName,
        entityType: 'customer_profile',
        observations: observations
      }]);

      return true;
    } catch (error) {
      console.error('Failed to store customer profile:', error);
      return false;
    }
  }

  async retrieveCustomerProfile(customerPhone) {
    try {
      await this.init();
      
      if (!this.initialized) {
        return null;
      }

      const entityName = `Customer-${customerPhone}`;
      const results = await mcp__memory__search_nodes(entityName);
      
      if (results.entities.length === 0) {
        return null;
      }

      const entity = results.entities[0];
      return this.parseCustomerProfile(entity.observations);
    } catch (error) {
      console.error('Failed to retrieve customer profile:', error);
      return null;
    }
  }

  parseCustomerProfile(observations) {
    const profile = {
      language: 'en',
      voiceRating: 'unknown',
      technicalLevel: 'unknown',
      culturalContext: 'International',
      lastInteraction: null,
      customerType: 'Regular',
      recentTopics: []
    };

    observations.forEach(obs => {
      if (obs.includes('Preferred language:')) {
        profile.language = obs.split(':')[1].trim();
      } else if (obs.includes('Voice quality preference:')) {
        profile.voiceRating = obs.split(':')[1].trim();
      } else if (obs.includes('Technical level:')) {
        profile.technicalLevel = obs.split(':')[1].trim();
      } else if (obs.includes('Cultural context:')) {
        profile.culturalContext = obs.split(':')[1].trim();
      } else if (obs.includes('Last interaction:')) {
        profile.lastInteraction = obs.split(':')[1].trim();
      } else if (obs.includes('Customer type:')) {
        profile.customerType = obs.split(':')[1].trim();
      } else if (obs.includes('Recent topics:')) {
        try {
          profile.recentTopics = JSON.parse(obs.split(':').slice(1).join(':').trim());
        } catch (e) {
          profile.recentTopics = [];
        }
      }
    });

    return profile;
  }

  async createConversationMemory(conversationId, customerPhone, details) {
    try {
      await this.init();
      
      if (!this.initialized) return false;

      const conversationEntity = `Conversation-${conversationId}`;
      const customerEntity = `Customer-${customerPhone}`;

      // Create conversation entity
      await mcp__memory__create_entities([{
        name: conversationEntity,
        entityType: 'conversation',
        observations: [
          `Started: ${details.startTime || new Date().toISOString()}`,
          `Language: ${details.language || 'unknown'}`,
          `Duration: ${details.duration || 'ongoing'}`,
          `Functions called: ${JSON.stringify(details.functionsCalled || [])}`,
          `Resolution: ${details.resolution || 'incomplete'}`
        ]
      }]);

      // Link to customer
      await mcp__memory__create_relations([{
        from: customerEntity,
        to: conversationEntity,
        relationType: 'had_conversation'
      }]);

      return true;
    } catch (error) {
      console.error('Failed to create conversation memory:', error);
      return false;
    }
  }
}

export default new MemoryMCPClient();