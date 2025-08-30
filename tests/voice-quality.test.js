import { describe, test, expect, beforeAll, afterEach, vi } from 'vitest';
import FunctionRegistry from '../lib/functions/index.js';

// Mock MCP client to avoid actual API calls during testing
vi.mock('../lib/mcp-clients/vapi.js', () => ({
  default: {
    analyzeCallQuality: vi.fn(),
    updateAssistantVoice: vi.fn()
  }
}));

// Mock Supabase database operations
vi.mock('../lib/supabase/client.js', () => ({
  db: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null }))
        }))
      }))
    })),
    trackEvent: vi.fn()
  }
}));

describe('Voice Quality Monitoring Tests', () => {
  beforeAll(async () => {
    await FunctionRegistry.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Voice Quality Monitor Function', () => {
    test('should monitor voice quality with valid call context', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      // Mock call quality data
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 0.85,
          responseTime: 1200,
          satisfaction: 0.9
        },
        transcript: 'Καλησπέρα, θέλω μία κάρτα γραφικών RTX 4090',
        duration: 45000
      });

      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'test-call-123',
        language: 'el',
        conversationId: 'conv-456'
      });

      expect(result.message).toContain('Παρακολουθώ την ποιότητα');
      expect(result.metrics).toBeDefined();
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.metrics.clarity).toBe(0.85);
      expect(result.metrics.responseTime).toBe(1200);
    });

    test('should handle missing call ID gracefully', async () => {
      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        language: 'en'
      });

      expect(result.message).toBe('Voice quality monitoring requires active call');
      expect(result.metrics).toBeNull();
      expect(result.qualityScore).toBe(0);
    });

    test('should switch to backup voice when quality is poor', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      // Mock poor quality data that should trigger voice switch
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 0.6,
          responseTime: 2500,
          satisfaction: 0.4
        },
        transcript: 'Hello, I want RTX 4090', // Mixed language indicating poor consistency
        duration: 30000
      });

      vapiMCPClient.default.updateAssistantVoice.mockResolvedValue(true);

      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'test-call-poor',
        language: 'el',
        assistantId: 'test-assistant',
        conversationId: 'conv-poor'
      });

      expect(result.metrics.voiceSwitched).toBe(true);
      expect(vapiMCPClient.default.updateAssistantVoice).toHaveBeenCalled();
    });

    test('should calculate overall quality score correctly', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      // Mock perfect quality data
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 1.0,
          responseTime: 500,
          satisfaction: 1.0
        },
        transcript: 'Καλησπέρα, πώς μπορώ να σας βοηθήσω;',
        duration: 60000
      });

      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'test-call-perfect',
        language: 'el',
        conversationId: 'conv-perfect'
      });

      // Should have high quality score for perfect inputs
      expect(result.qualityScore).toBeGreaterThan(0.9);
      expect(result.recommendation).toContain('Εξαιρετική');
    });
  });

  describe('Language Consistency Analysis', () => {
    test('should correctly analyze Greek language consistency', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const greekTranscript = 'Καλησπέρα. Θέλω μία κάρτα γραφικών. Τι τιμές έχετε;';
      const consistency = await voiceQualityMonitor.analyzeLanguageConsistency(greekTranscript, 'el');
      
      expect(consistency).toBeGreaterThan(0.8);
    });

    test('should detect mixed language issues', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const mixedTranscript = 'Καλησπέρα. Hello, I want graphics card. Τι τιμές έχετε;';
      const consistency = await voiceQualityMonitor.analyzeLanguageConsistency(mixedTranscript, 'el');
      
      expect(consistency).toBeLessThan(0.7); // Should detect inconsistency
    });

    test('should handle empty transcript gracefully', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const consistency = await voiceQualityMonitor.analyzeLanguageConsistency('', 'el');
      expect(consistency).toBe(0);
      
      const consistencyNull = await voiceQualityMonitor.analyzeLanguageConsistency(null, 'el');
      expect(consistencyNull).toBe(0);
    });
  });

  describe('Voice Quality Scoring', () => {
    test('should weight language consistency heavily', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const perfectConsistencyMetrics = {
        clarity: 0.7,
        languageConsistency: 1.0,
        responseTime: 1000,
        customerSatisfaction: 0.8
      };
      
      const poorConsistencyMetrics = {
        clarity: 0.9,
        languageConsistency: 0.3,
        responseTime: 800,
        customerSatisfaction: 0.9
      };
      
      const perfectScore = voiceQualityMonitor.calculateOverallQuality(perfectConsistencyMetrics);
      const poorScore = voiceQualityMonitor.calculateOverallQuality(poorConsistencyMetrics);
      
      // Perfect consistency should score higher despite lower clarity
      expect(perfectScore).toBeGreaterThan(poorScore);
    });

    test('should normalize response time correctly', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const fastResponseMetrics = {
        clarity: 0.8,
        languageConsistency: 0.8,
        responseTime: 300, // Very fast
        customerSatisfaction: 0.8
      };
      
      const slowResponseMetrics = {
        clarity: 0.8,
        languageConsistency: 0.8,
        responseTime: 2500, // Very slow
        customerSatisfaction: 0.8
      };
      
      const fastScore = voiceQualityMonitor.calculateOverallQuality(fastResponseMetrics);
      const slowScore = voiceQualityMonitor.calculateOverallQuality(slowResponseMetrics);
      
      expect(fastScore).toBeGreaterThan(slowScore);
    });
  });

  describe('Voice Report Generation', () => {
    test('should generate comprehensive voice quality report', async () => {
      const result = await FunctionRegistry.execute('generateVoiceReport', {
        timeframe: '24h',
        language: 'el'
      }, {
        conversationId: 'test-conv'
      });

      expect(result.message).toContain('αναφορά ποιότητας');
      expect(result.report).toBeDefined();
      expect(result.timeframe).toBe('24h');
      expect(result.language).toBe('el');
    });

    test('should handle different timeframes', async () => {
      const timeframes = ['1h', '6h', '24h', '7d'];
      
      for (const timeframe of timeframes) {
        const result = await FunctionRegistry.execute('generateVoiceReport', {
          timeframe: timeframe,
          language: 'en'
        }, {
          conversationId: 'test-conv'
        });
        
        expect(result.timeframe).toBe(timeframe);
        expect(result.report).toBeDefined();
      }
    });

    test('should provide recommendations based on quality metrics', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('generateVoiceReport');
      
      // Mock poor quality metrics
      const poorMetrics = [{
        clarity_score: 0.5,
        consistency_score: 0.6,
        technical_metrics: { voice_switched: true },
        language: 'el'
      }];
      
      const report = voiceQualityMonitor.generateReport(poorMetrics, 'el');
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.voiceSwitches).toBe(1);
    });
  });

  describe('Backup Voice Configuration', () => {
    test('should provide correct backup voice for Greek', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const greekBackup = voiceQualityMonitor.getBackupVoiceConfig('el');
      
      expect(greekBackup.provider).toBe('azure');
      expect(greekBackup.voiceId).toBe('el-GR-AthinaNeural');
      expect(greekBackup.settings.speed).toBe(0.95);
    });

    test('should provide correct backup voice for English', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const englishBackup = voiceQualityMonitor.getBackupVoiceConfig('en');
      
      expect(englishBackup.provider).toBe('azure');
      expect(englishBackup.voiceId).toBe('en-US-AriaNeural');
      expect(englishBackup.settings.speed).toBe(0.95);
    });

    test('should fallback to English for unknown language', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const unknownBackup = voiceQualityMonitor.getBackupVoiceConfig('fr');
      
      expect(unknownBackup.provider).toBe('azure');
      expect(unknownBackup.voiceId).toBe('en-US-AriaNeural');
    });
  });

  describe('Quality Recommendation System', () => {
    test('should provide Greek recommendations for different quality levels', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const recommendations = {
        excellent: voiceQualityMonitor.getQualityRecommendation(0.95, 'el'),
        good: voiceQualityMonitor.getQualityRecommendation(0.8, 'el'),
        fair: voiceQualityMonitor.getQualityRecommendation(0.65, 'el'),
        poor: voiceQualityMonitor.getQualityRecommendation(0.3, 'el')
      };
      
      expect(recommendations.excellent).toContain('Εξαιρετική');
      expect(recommendations.good).toContain('καλή');
      expect(recommendations.fair).toContain('Καλή');
      expect(recommendations.poor).toContain('Κακή');
    });

    test('should provide English recommendations for different quality levels', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      const recommendations = {
        excellent: voiceQualityMonitor.getQualityRecommendation(0.95, 'en'),
        good: voiceQualityMonitor.getQualityRecommendation(0.8, 'en'),
        fair: voiceQualityMonitor.getQualityRecommendation(0.65, 'en'),
        poor: voiceQualityMonitor.getQualityRecommendation(0.3, 'en')
      };
      
      expect(recommendations.excellent).toContain('Excellent');
      expect(recommendations.good).toContain('good');
      expect(recommendations.fair).toContain('Good');
      expect(recommendations.poor).toContain('Poor');
    });
  });

  describe('Performance Requirements', () => {
    test('voice quality monitoring should complete within reasonable time', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 0.8,
          responseTime: 1000,
          satisfaction: 0.85
        },
        transcript: 'Test transcript',
        duration: 30000
      });

      const startTime = performance.now();
      
      await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'perf-test',
        language: 'el',
        conversationId: 'perf-conv'
      });
      
      const duration = performance.now() - startTime;
      
      // Should complete monitoring in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('voice report generation should handle large datasets efficiently', async () => {
      const startTime = performance.now();
      
      await FunctionRegistry.execute('generateVoiceReport', {
        timeframe: '7d',
        language: 'all'
      }, {
        conversationId: 'perf-report'
      });
      
      const duration = performance.now() - startTime;
      
      // Should generate report in under 10 seconds even for large datasets
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle MCP client failures gracefully', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.analyzeCallQuality.mockRejectedValue(new Error('MCP connection failed'));

      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'error-test',
        language: 'el',
        conversationId: 'error-conv'
      });

      expect(result.message).toContain('Δεν μπόρεσα να ελέγξω');
      expect(result.error).toBeDefined();
      expect(result.qualityScore).toBe(0);
    });

    test('should continue monitoring even if voice switch fails', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 0.3, // Poor quality should trigger switch attempt
          responseTime: 3000,
          satisfaction: 0.2
        },
        transcript: 'Mixed language transcript',
        duration: 20000
      });

      vapiMCPClient.default.updateAssistantVoice.mockRejectedValue(new Error('Voice switch failed'));

      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'switch-fail-test',
        language: 'el',
        assistantId: 'test-assistant',
        conversationId: 'switch-fail-conv'
      });

      // Should still return monitoring results even if switch fails
      expect(result.metrics).toBeDefined();
      expect(result.qualityScore).toBeDefined();
      expect(result.metrics.voiceSwitched).toBeUndefined(); // Switch failed, so not marked as switched
    });

    test('should handle database storage failures without crashing', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      const { db } = await import('../lib/supabase/client.js');
      
      vapiMCPClient.default.analyzeCallQuality.mockResolvedValue({
        quality: {
          clarity: 0.8,
          responseTime: 1000,
          satisfaction: 0.8
        },
        transcript: 'Test transcript',
        duration: 30000
      });

      // Mock database failure
      db.from.mockImplementation(() => ({
        insert: () => Promise.reject(new Error('Database connection failed'))
      }));

      // Should not crash even if database storage fails
      const result = await FunctionRegistry.execute('monitorVoiceQuality', {}, {
        callId: 'db-fail-test',
        language: 'el',
        conversationId: 'db-fail-conv'
      });

      expect(result.metrics).toBeDefined();
      expect(result.qualityScore).toBeGreaterThan(0);
    });
  });

  describe('Integration with Language Detection', () => {
    test('should use language detection results in consistency analysis', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      // Test with clearly Greek text
      const greekText = 'Καλημέρα, θέλω να αγοράσω έναν υπολογιστή για gaming';
      const greekConsistency = await voiceQualityMonitor.analyzeLanguageConsistency(greekText, 'el');
      
      // Test with clearly English text analyzed for Greek consistency
      const englishText = 'Good morning, I want to buy a gaming computer';
      const mixedConsistency = await voiceQualityMonitor.analyzeLanguageConsistency(englishText, 'el');
      
      expect(greekConsistency).toBeGreaterThan(mixedConsistency);
      expect(greekConsistency).toBeGreaterThan(0.8);
      expect(mixedConsistency).toBeLessThan(0.5);
    });

    test('should handle technical terms appropriately in consistency check', async () => {
      const voiceQualityMonitor = FunctionRegistry.get('monitorVoiceQuality');
      
      // Greek with English tech terms (common in Cyprus)
      const cyprusGreekText = 'Θέλω RTX 4090 για gaming και Intel i7 processor';
      const consistency = await voiceQualityMonitor.analyzeLanguageConsistency(cyprusGreekText, 'el');
      
      // Should still detect as reasonably consistent Greek despite tech terms
      expect(consistency).toBeGreaterThan(0.7);
    });
  });
});