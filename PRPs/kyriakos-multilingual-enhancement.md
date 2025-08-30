# Kyriakos Voice Agent Multilingual Enhancement PRP

```yaml
name: "Kyriakos Voice Agent - Greek Language & MCP Enhancement"
description: |
  Comprehensive enhancement of the Kyriakos voice assistant to resolve Greek language 
  inconsistencies and integrate advanced MCP capabilities for superior customer experience.
  
  Focus Areas:
  1. Fix inconsistent Greek language performance
  2. Implement Azure multilingual voice system with fallbacks
  3. Integrate Vapi MCP for advanced voice features  
  4. Add semantic search MCP for better product discovery
  5. Implement customer memory MCP for personalization
  6. Add real-time translation and cultural adaptation

status: "ready-to-implement"
priority: "high"
estimated_hours: 16-24
complexity: "medium-high"
```

## Purpose

Transform Kyriakos from a basic bilingual assistant into a production-grade multilingual AI agent with:
- **Consistent Greek Language Performance**: Eliminate the current "sometimes yes, sometimes no" Greek language issues
- **Advanced MCP Integration**: Leverage multiple MCP servers for enhanced capabilities
- **Cultural Intelligence**: Context-aware responses for Greek/English speaking customers
- **Enhanced Personalization**: Persistent customer memory across sessions

## Core Principles

1. **Context is King**: Include ALL necessary Vapi.ai documentation and MCP integration patterns
2. **Validation Loops**: Provide executable tests for voice quality and language consistency
3. **Information Dense**: Use keywords from existing Armenius codebase patterns
4. **Progressive Success**: Start with language fixes, validate, then enhance with MCPs
5. **Production Ready**: Build foundations that scale with customer growth

## Problem Analysis

### Current Greek Language Issues Identified:

1. **Inconsistent Voice Quality**: Using single 11Labs voice `DMrXvkhaNPEmPbI3ABs8` for both languages
2. **No Language Detection**: Current transcriber settings don't auto-detect Greek vs English
3. **Mixed Language Prompts**: System prompt mixes languages confusingly
4. **No Fallback System**: Single point of failure for Greek language support
5. **Cultural Context Missing**: No Greek cultural adaptation in responses

### Current Configuration Gaps:

```javascript
// PROBLEMATIC: Current single-language transcriber
transcriber: {
  provider: 'deepgram',
  model: 'nova-2', 
  language: 'multi', // This is correct but needs better voice matching
  keywords: [...] // Good multilingual keywords exist
}

// PROBLEMATIC: Single voice for both languages  
voice: {
  provider: '11labs',
  voiceId: 'DMrXvkhaNPEmPbI3ABs8', // No language-specific fallbacks
  settings: {...} // Fixed settings, no adaptation
}
```

## Success Criteria

- [ ] Greek language responses are consistent 95%+ of the time
- [ ] Automatic language detection works in <2 seconds
- [ ] Voice quality is natural for both Greek and English speakers
- [ ] Customer personalization works across language switches
- [ ] MCP integrations provide measurable value (search accuracy, memory retention)
- [ ] Response time remains under 500ms average
- [ ] Cost per call stays under €0.40 target

## Implementation Blueprint

### Phase 1: Fix Core Language Issues (4-6 hours)

#### 1.1 Implement Azure Multilingual Voice System

```javascript
// NEW: Azure multilingual voice with proper fallbacks
const enhancedVoiceConfig = {
  provider: "azure",
  voiceId: "el-GR-NestorNeural", // Primary Greek male voice
  fallbackPlan: {
    voices: [
      {
        provider: "azure",
        voiceId: "el-GR-AthinaNeural" // Backup Greek female voice
      },
      {
        provider: "azure", 
        voiceId: "en-US-BrianNeural" // English male fallback
      },
      {
        provider: "11labs",
        voiceId: "DMrXvkhaNPEmPbI3ABs8" // Current voice as final fallback
      }
    ]
  }
};
```

**Implementation Steps:**
1. Update `config/vapi-assistant.js` voice configuration
2. Add Azure voice IDs for Greek neural voices
3. Configure voice fallback chain
4. Test voice quality for both languages

#### 1.2 Enhanced Language Detection System

```javascript
// NEW: Improved transcriber with better Greek detection
const enhancedTranscriber = {
  provider: "deepgram",
  model: "nova-3", // Latest model for better accuracy  
  language: "multi",
  smartFormat: true,
  keywords: [
    // Enhanced Greek technical terms
    'κάρτα γραφικών', 'επεξεργαστής', 'μητρική κάρτα', 'μνήμη RAM',
    'σκληρός δίσκος', 'SSD', 'gaming', 'laptop', 'desktop',
    'εγγύηση', 'επισκευή', 'τεχνική υποστήριξη', 'παραγγελία',
    // English terms
    'graphics card', 'processor', 'motherboard', 'memory', 'storage',
    'warranty', 'repair', 'technical support', 'order tracking'
  ],
  // NEW: Language-specific optimizations
  languageDetectionSettings: {
    confidence_threshold: 0.8,
    detection_timeout: 2000 // 2 seconds max for detection
  }
};
```

#### 1.3 Cultural Context System Prompt

```javascript
// NEW: Greek-aware system prompt with cultural intelligence
const culturallyAwarePrompt = `You are Kyriakos, a professional Greek-Cypriot AI assistant at Armenius Store.

LANGUAGE & CULTURAL INTELLIGENCE:
- GREEK CUSTOMERS: Use respectful "σας" form initially, warm Greek hospitality style
- ENGLISH CUSTOMERS: Professional but friendly international business style
- AUTO-DETECT language from first 2-3 words and adapt immediately
- CULTURAL CONTEXT: Understand Greek tech terminology, European retail customs
- BUSINESS HOURS: Reference Cyprus timezone and local customs

RESPONSE PATTERNS:
Greek: "Καλησπέρα! Είμαι ο Κυριάκος από το Armenius Store..." 
English: "Hello! I'm Kyriakos from Armenius Store..."

TECHNICAL EXPERTISE (Both Languages):
- Graphics Cards: κάρτες γραφικών / graphics cards
- Processors: επεξεργαστές / processors  
- Gaming Systems: gaming συστήματα / gaming systems
- Repairs: επισκευές / repairs

CONSISTENCY RULES:
1. Never mix languages within a single response
2. Maintain detected language throughout conversation
3. Ask for clarification if language detection is uncertain
4. Use appropriate formality level for each language`;
```

### Phase 2: MCP Integration Architecture (6-8 hours)

#### 2.1 Vapi MCP Integration

**Available Vapi MCP Tools:**
- `mcp__vapi__list_assistants` - Assistant management
- `mcp__vapi__create_assistant` - Dynamic assistant creation
- `mcp__vapi__update_assistant` - Real-time configuration updates
- `mcp__vapi__list_calls` - Call analytics and monitoring
- `mcp__vapi__get_call` - Individual call analysis

**Implementation Pattern:**
```javascript
// NEW: Dynamic voice assistant adaptation
const voiceOptimizationFunction = {
  dynamicVoiceOptimization: {
    ttl: 60, // 1 minute cache for voice settings
    fallbackResponse: "I'm optimizing my voice for you, please hold on",
    cacheable: false, // Always fresh for personalization
    
    async execute(parameters, callContext) {
      const { language, customerProfile } = callContext;
      
      // Use Vapi MCP to update voice in real-time
      const voiceConfig = await this.selectOptimalVoice(language, customerProfile);
      
      // Update assistant configuration via MCP
      await mcpVapi.updateAssistant(callContext.assistantId, {
        voice: voiceConfig,
        model: {
          temperature: language === 'el' ? 0.6 : 0.7, // Greeks prefer more structured responses
        }
      });
      
      return {
        message: language === 'el' 
          ? "Προσαρμόζω τη φωνή μου για εσάς"
          : "I'm optimizing my voice for you",
        voiceOptimized: true
      };
    }
  }
};
```

#### 2.2 Memory MCP for Customer Context

```javascript
// NEW: Enhanced customer memory system
const customerMemorySystem = {
  rememberCustomerPreferences: {
    ttl: 86400, // 24-hour memory cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      const { customerProfile, conversationId } = callContext;
      
      // Store in Memory MCP
      await mcpMemory.createEntities([{
        name: `Customer-${customerProfile?.phone}`,
        entityType: 'customer_profile',
        observations: [
          `Preferred language: ${parameters.detectedLanguage}`,
          `Voice quality preference: ${parameters.voiceRating || 'unknown'}`,
          `Technical level: ${parameters.technicalLevel || 'unknown'}`,
          `Recent inquiries: ${JSON.stringify(parameters.recentTopics)}`,
          `Cultural context: ${parameters.detectedLanguage === 'el' ? 'Greek-Cypriot' : 'International'}`
        ]
      }]);
      
      // Create memory relationships
      await mcpMemory.createRelations([{
        from: `Customer-${customerProfile?.phone}`,
        to: `Conversation-${conversationId}`,
        relationType: 'had_conversation_in_language'
      }]);
      
      return {
        message: parameters.detectedLanguage === 'el'
          ? "Θα θυμάμαι τις προτιμήσεις σας για την επόμενη φορά"
          : "I'll remember your preferences for next time",
        memoryStored: true
      };
    }
  }
};
```

#### 2.3 Context7 MCP for Enhanced Product Discovery

```javascript
// NEW: Intelligent product discovery with Context7
const intelligentProductSearch = {
  contextualProductSearch: {
    ttl: 300, // 5-minute cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      const { productQuery, language } = parameters;
      const { customerProfile } = callContext;
      
      // Get enhanced documentation for product categories
      const productContext = await mcpContext7.getLibraryDocs('/computer-hardware/graphics-cards', {
        topic: productQuery,
        tokens: 2000
      });
      
      // Combine with existing inventory search
      const inventoryResults = await this.checkInventoryWithContext(productQuery, productContext);
      
      // Personalize based on customer history
      const personalizedResults = await this.personalizeResults(inventoryResults, customerProfile);
      
      return {
        message: language === 'el' 
          ? `Βρήκα ${personalizedResults.length} προϊόντα που ταιριάζουν με αυτό που ψάχνετε`
          : `I found ${personalizedResults.length} products that match what you're looking for`,
        products: personalizedResults,
        contextEnhanced: true
      };
    }
  }
};
```

### Phase 3: Advanced Features (6-10 hours)

#### 3.1 Real-time Voice Quality Monitoring

```javascript
// NEW: Voice quality feedback system
const voiceQualityMonitor = {
  monitorVoiceQuality: {
    ttl: 0, // No cache - real-time monitoring
    cacheable: false,
    
    async execute(parameters, callContext) {
      const { callId, language } = callContext;
      
      // Get call details via Vapi MCP
      const callDetails = await mcpVapi.getCall(callId);
      
      // Analyze voice metrics
      const voiceMetrics = {
        clarity: callDetails.audioQuality?.clarity || 0,
        languageConsistency: this.analyzeLanguageConsistency(callDetails.transcript, language),
        responseTime: callDetails.averageResponseTime || 0,
        customerSatisfaction: callDetails.satisfactionScore || 0
      };
      
      // Auto-adjust if quality is poor
      if (voiceMetrics.languageConsistency < 0.8) {
        await this.switchToBackupVoice(language, callContext);
      }
      
      return {
        message: "Voice quality monitoring active",
        metrics: voiceMetrics,
        qualityScore: this.calculateOverallQuality(voiceMetrics)
      };
    }
  }
};
```

#### 3.2 Semantic Product Matching

```javascript
// NEW: Advanced product matching with embeddings
const semanticProductMatcher = {
  semanticProductSearch: {
    ttl: 600, // 10-minute cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      const { query, language } = parameters;
      
      // Generate embeddings for user query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search product database with vector similarity
      const semanticResults = await db.searchProductsBySimilarity(queryEmbedding, {
        threshold: 0.75,
        limit: 10,
        language: language
      });
      
      // Combine with traditional search
      const traditionalResults = await this.traditionalProductSearch(query);
      
      // Merge and rank results
      const combinedResults = this.mergeAndRankResults(semanticResults, traditionalResults);
      
      return {
        message: language === 'el'
          ? `Χρησιμοποιώ προηγμένη αναζήτηση για να βρω τα καλύτερα προϊόντα για εσάς`
          : `Using advanced search to find the best products for you`,
        results: combinedResults,
        searchType: 'semantic_enhanced'
      };
    }
  }
};
```

## Data Models & Schema Updates

### Enhanced Customer Profile
```sql
-- NEW: Enhanced customer profile table
ALTER TABLE customer_profiles ADD COLUMN language_preference VARCHAR(5);
ALTER TABLE customer_profiles ADD COLUMN voice_quality_rating INTEGER;
ALTER TABLE customer_profiles ADD COLUMN cultural_context VARCHAR(50);
ALTER TABLE customer_profiles ADD COLUMN technical_expertise_level VARCHAR(20);
ALTER TABLE customer_profiles ADD COLUMN preferred_voice_speed DECIMAL(3,1);

-- NEW: Language interaction tracking
CREATE TABLE language_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customer_profiles(id),
  conversation_id VARCHAR(255),
  detected_language VARCHAR(5),
  language_confidence DECIMAL(3,2),
  voice_provider VARCHAR(50),
  voice_id VARCHAR(100),
  response_time_ms INTEGER,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT now()
);

-- NEW: Voice quality metrics
CREATE TABLE voice_quality_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id VARCHAR(255),
  language VARCHAR(5),
  clarity_score DECIMAL(3,2),
  consistency_score DECIMAL(3,2),
  customer_rating INTEGER,
  technical_metrics JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

### Enhanced Product Search Schema
```sql
-- NEW: Multilingual product descriptions
ALTER TABLE products ADD COLUMN description_el TEXT;
ALTER TABLE products ADD COLUMN keywords_el TEXT[];
ALTER TABLE products ADD COLUMN technical_specs_el JSONB;

-- NEW: Product search embeddings
CREATE TABLE product_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  language VARCHAR(5),
  embedding_vector vector(1536), -- OpenAI embedding dimensions
  text_content TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create vector similarity index
CREATE INDEX product_embeddings_vector_idx ON product_embeddings 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
```

## Integration Points

### Environment Configuration Updates
```bash
# NEW: Additional environment variables needed
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region

# MCP Server Configurations
MCP_MEMORY_SERVER_URL=your_memory_mcp_endpoint
MCP_CONTEXT7_API_KEY=your_context7_key  
MCP_VAPI_PRIVATE_KEY=your_vapi_private_key # For assistant management

# Voice Quality Monitoring
VOICE_QUALITY_WEBHOOK_URL=your_quality_monitoring_endpoint
VOICE_FALLBACK_THRESHOLD=0.8 # Switch to backup voice below this score

# Semantic Search Configuration  
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VECTOR_SIMILARITY_THRESHOLD=0.75
```

### Dependencies Updates
```json
{
  "dependencies": {
    "@azure/cognitiveservices-speech-sdk": "^1.31.0",
    "@pinecone-database/pinecone": "^1.1.0", 
    "pg-vector": "^0.5.0",
    "openai": "^4.63.0"
  }
}
```

## Validation Loop

### 1. Language Consistency Tests
```javascript
// tests/language-consistency.test.js
describe('Greek Language Consistency', () => {
  test('should detect Greek language within 2 seconds', async () => {
    const result = await testGreekDetection('Καλησπέρα, θέλω μία κάρτα γραφικών');
    expect(result.detectedLanguage).toBe('el');
    expect(result.detectionTime).toBeLessThan(2000);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('should maintain Greek throughout conversation', async () => {
    const conversation = await simulateConversation([
      'Καλησπέρα, θέλω gaming laptop',
      'Τι τιμές έχετε;',
      'Έχετε εγγύηση;'
    ]);
    
    conversation.responses.forEach(response => {
      expect(response.language).toBe('el');
      expect(response.containsEnglish).toBe(false);
    });
  });
});
```

### 2. Voice Quality Validation
```javascript
// tests/voice-quality.test.js  
describe('Voice Quality Assurance', () => {
  test('should use appropriate Greek voice for Greek customer', async () => {
    const result = await testVoiceSelection('el', 'male');
    expect(result.provider).toBe('azure');
    expect(result.voiceId).toMatch(/el-GR-.*Neural/);
  });

  test('should fallback gracefully if primary voice fails', async () => {
    const result = await testVoiceFallback('el', 'primary_failed');
    expect(result.fallbackUsed).toBe(true);
    expect(result.voiceProvider).toBe('azure');
    expect(result.responseTime).toBeLessThan(1000);
  });
});
```

### 3. MCP Integration Tests
```javascript
// tests/mcp-integration.test.js
describe('MCP Integration', () => {
  test('should store customer language preference in Memory MCP', async () => {
    await storeCustomerPreference('customer_123', 'el', 'formal');
    const stored = await mcpMemory.searchNodes('customer_123');
    expect(stored.entities[0].observations).toContain('Preferred language: el');
  });

  test('should enhance product search with Context7', async () => {
    const result = await contextualProductSearch('RTX 4090', 'el');
    expect(result.contextEnhanced).toBe(true);
    expect(result.products.length).toBeGreaterThan(0);
  });
});
```

### 4. Performance Benchmarks
```bash
# Performance validation commands
npm run test:voice-quality     # Test all voice configurations
npm run test:language-detect   # Test Greek/English detection accuracy  
npm run test:mcp-integration   # Test all MCP connections
npm run test:load              # Load test with 50 concurrent Greek/English calls
npm run validate:costs         # Ensure costs stay under €0.40/call
```

## Deployment Strategy

### Phase 1: Gradual Rollout (Week 1)
1. Deploy language detection improvements to 20% of calls
2. Monitor Greek language consistency metrics
3. Collect voice quality feedback
4. Fine-tune Azure voice settings

### Phase 2: MCP Integration (Week 2)  
1. Enable Memory MCP for customer personalization
2. Integrate Context7 for enhanced product discovery
3. Deploy Vapi MCP for dynamic voice optimization
4. Monitor performance impact

### Phase 3: Full Production (Week 3)
1. Enable all features for 100% of calls
2. Activate real-time monitoring dashboards
3. Launch advanced analytics and reporting
4. Document operational procedures

## Monitoring & Analytics

### Key Performance Indicators
- **Language Detection Accuracy**: >95% within 2 seconds
- **Greek Response Consistency**: >95% pure Greek (no English mixing)
- **Voice Quality Score**: >4.0/5.0 average customer rating
- **Response Time**: <500ms average (including MCP calls)
- **Cost Efficiency**: <€0.40 per call maintained
- **Customer Satisfaction**: >90% positive feedback

### Real-time Dashboards
```javascript
// NEW: Enhanced monitoring dashboard metrics
const monitoringMetrics = {
  languageMetrics: {
    detectionAccuracy: 0.97,
    greekConsistency: 0.94,
    voiceQualityScore: 4.2
  },
  mcpPerformance: {
    memoryMcpLatency: 45, // ms
    context7McpLatency: 120, // ms
    vapiMcpLatency: 80 // ms
  },
  businessMetrics: {
    customerSatisfaction: 0.92,
    automationRate: 0.85,
    costPerCall: 0.36 // euros
  }
};
```

## Risk Assessment & Mitigation

### High Risk: Voice Provider Failures
- **Risk**: Azure voices may fail, affecting Greek language quality
- **Mitigation**: Multi-tier fallback system with 11Labs backup
- **Testing**: Weekly automated voice quality checks

### Medium Risk: MCP Latency Impact
- **Risk**: Multiple MCP calls may increase response time
- **Mitigation**: Parallel MCP calls where possible, aggressive caching
- **Testing**: Load testing with 50 concurrent multilingual calls

### Low Risk: Cost Increase
- **Risk**: Enhanced features may increase per-call costs  
- **Mitigation**: Intelligent caching, Azure cost optimization
- **Testing**: Daily cost monitoring with automated alerts

## Success Validation

### Technical Validation
```bash
# Run comprehensive test suite
npm run test:comprehensive

# Expected results:
# ✅ Greek language detection: 97% accuracy
# ✅ Voice consistency: 95% pure language responses  
# ✅ MCP integration: All connections stable <100ms
# ✅ Response time: 380ms average (within target)
# ✅ Cost efficiency: €0.36/call (within budget)
```

### Business Validation  
- Greek customers report significantly improved experience
- Reduced need for human escalation in Greek conversations
- Enhanced product discovery leads to increased sales conversion
- Customer retention improves for Greek-speaking customers

## Next Steps After Implementation

### Immediate (Week 4)
- Monitor all KPIs and adjust thresholds
- Collect customer feedback via post-call surveys
- Fine-tune cultural adaptation settings
- Document best practices for multilingual voice AI

### Short-term (Month 2-3)
- Expand to additional languages (French, Russian)
- Integrate more MCP servers for specialized functions
- Implement advanced sentiment analysis
- Add proactive customer service features

### Long-term (Month 4-6)
- Develop Kyriakos personality further with more cultural nuance
- Create specialized technical support modes
- Implement predictive customer needs analysis
- Scale to multiple concurrent conversation handling

---

**Implementation Owner**: Senior AI Developer  
**Reviewers**: Product Manager, Greek Language Consultant, Voice Quality Engineer  
**Timeline**: 3 weeks development + 1 week testing  
**Success Criteria**: 95% Greek language consistency, maintained response times, customer satisfaction >90%