import vapiMCPClient from '../mcp-clients/vapi.js';
import { db } from '../supabase/client.js';
import { detectLanguageWithConfidence } from '../utils/language-detection.js';

export default {
  monitorVoiceQuality: {
    ttl: 0, // No cache - real-time monitoring
    cacheable: false,
    
    async execute(parameters, callContext) {
      try {
        const { callId, language } = callContext;
        
        if (!callId) {
          return {
            message: "Voice quality monitoring requires active call",
            metrics: null,
            qualityScore: 0
          };
        }

        // Get call details via Vapi MCP
        const callDetails = await vapiMCPClient.analyzeCallQuality(callId);
        
        if (!callDetails) {
          return {
            message: "Unable to retrieve call quality data",
            metrics: null,
            qualityScore: 0
          };
        }

        // Analyze voice metrics
        const voiceMetrics = {
          clarity: callDetails.quality?.clarity || 0,
          languageConsistency: await this.analyzeLanguageConsistency(callDetails.transcript, language),
          responseTime: callDetails.quality?.responseTime || 0,
          customerSatisfaction: callDetails.quality?.satisfaction || 0,
          duration: callDetails.duration || 0
        };
        
        // Calculate overall quality score
        const qualityScore = this.calculateOverallQuality(voiceMetrics);
        
        // Store quality metrics in database
        await this.storeQualityMetrics(callId, language, voiceMetrics, qualityScore);
        
        // Auto-adjust if quality is poor
        if (voiceMetrics.languageConsistency < 0.8 && callContext.assistantId) {
          const switched = await this.switchToBackupVoice(language, callContext);
          if (switched) {
            voiceMetrics.voiceSwitched = true;
          }
        }
        
        return {
          message: language === 'el' 
            ? "Παρακολουθώ την ποιότητα της φωνής μου"
            : "Voice quality monitoring active",
          metrics: voiceMetrics,
          qualityScore: qualityScore,
          recommendation: this.getQualityRecommendation(qualityScore, language)
        };
      } catch (error) {
        console.error('Voice quality monitoring failed:', error);
        return {
          message: parameters.language === 'el'
            ? "Δεν μπόρεσα να ελέγξω την ποιότητα της φωνής"
            : "Unable to monitor voice quality",
          metrics: null,
          qualityScore: 0,
          error: error.message
        };
      }
    },

    async analyzeLanguageConsistency(transcript, expectedLanguage) {
      if (!transcript || !expectedLanguage) return 0;
      
      try {
        // Split transcript into segments
        const segments = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let consistentSegments = 0;
        let totalSegments = segments.length;
        
        for (const segment of segments) {
          const detection = detectLanguageWithConfidence(segment.trim());
          
          // Consider segment consistent if:
          // 1. Detected language matches expected
          // 2. Confidence is reasonable (>0.6)
          if (detection.language === expectedLanguage && detection.confidence > 0.6) {
            consistentSegments++;
          }
        }
        
        return totalSegments > 0 ? consistentSegments / totalSegments : 0;
      } catch (error) {
        console.error('Language consistency analysis failed:', error);
        return 0;
      }
    },

    calculateOverallQuality(metrics) {
      // Weighted scoring system
      const weights = {
        clarity: 0.25,           // Voice clarity
        languageConsistency: 0.35, // Most important for multilingual
        responseTime: 0.20,      // Response speed
        customerSatisfaction: 0.20 // Customer feedback
      };
      
      // Normalize response time (lower is better, max 2000ms)
      const normalizedResponseTime = Math.max(0, 1 - (metrics.responseTime / 2000));
      
      const score = 
        (metrics.clarity * weights.clarity) +
        (metrics.languageConsistency * weights.languageConsistency) +
        (normalizedResponseTime * weights.responseTime) +
        (metrics.customerSatisfaction * weights.customerSatisfaction);
      
      return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
    },

    async storeQualityMetrics(callId, language, metrics, qualityScore) {
      try {
        await db.from('voice_quality_metrics').insert({
          call_id: callId,
          language: language,
          clarity_score: metrics.clarity,
          consistency_score: metrics.languageConsistency,
          customer_rating: metrics.customerSatisfaction,
          technical_metrics: {
            response_time: metrics.responseTime,
            overall_score: qualityScore,
            duration: metrics.duration,
            voice_switched: metrics.voiceSwitched || false
          }
        });
      } catch (error) {
        console.error('Failed to store quality metrics:', error);
      }
    },

    async switchToBackupVoice(language, callContext) {
      try {
        const backupVoiceConfig = this.getBackupVoiceConfig(language);
        
        const success = await vapiMCPClient.updateAssistantVoice(
          callContext.assistantId, 
          backupVoiceConfig
        );
        
        if (success) {
          console.log(`Switched to backup voice for language: ${language}`);
          
          // Track the switch
          await db.trackEvent('voice_switch', {
            callId: callContext.callId,
            language: language,
            reason: 'poor_quality',
            newVoice: backupVoiceConfig.voiceId
          }, callContext.conversationId);
        }
        
        return success;
      } catch (error) {
        console.error('Voice switch failed:', error);
        return false;
      }
    },

    getBackupVoiceConfig(language) {
      const backupConfigs = {
        'el': {
          provider: "azure",
          voiceId: "el-GR-AthinaNeural", // Switch to female Greek voice
          settings: {
            speed: 0.95,
            pitch: "medium"
          }
        },
        'en': {
          provider: "azure", 
          voiceId: "en-US-AriaNeural", // Switch to female English voice
          settings: {
            speed: 0.95,
            pitch: "medium"
          }
        }
      };
      
      return backupConfigs[language] || backupConfigs['en'];
    },

    getQualityRecommendation(score, language) {
      const isGreek = language === 'el';
      
      if (score >= 0.9) {
        return isGreek 
          ? "Εξαιρετική ποιότητα φωνής"
          : "Excellent voice quality";
      } else if (score >= 0.75) {
        return isGreek
          ? "Πολύ καλή ποιότητα φωνής" 
          : "Very good voice quality";
      } else if (score >= 0.6) {
        return isGreek
          ? "Καλή ποιότητα φωνής"
          : "Good voice quality";
      } else if (score >= 0.4) {
        return isGreek
          ? "Η ποιότητα της φωνής χρειάζεται βελτίωση"
          : "Voice quality needs improvement";
      } else {
        return isGreek
          ? "Κακή ποιότητα φωνής - αλλάζω προσαρμογές"
          : "Poor voice quality - adjusting settings";
      }
    }
  },

  generateVoiceReport: {
    ttl: 3600, // 1-hour cache
    cacheable: true,

    async execute(parameters, callContext) {
      try {
        const { timeframe = '24h', language } = parameters;
        
        // Get voice quality metrics from database
        const metrics = await this.getQualityMetricsReport(timeframe, language);
        
        const report = this.generateReport(metrics, language);
        
        return {
          message: language === 'el'
            ? "Έχω δημιουργήσει την αναφορά ποιότητας φωνής"
            : "Voice quality report generated",
          report: report,
          timeframe: timeframe,
          language: language
        };
      } catch (error) {
        console.error('Voice report generation failed:', error);
        return {
          message: parameters.language === 'el'
            ? "Δεν μπόρεσα να δημιουργήσω την αναφορά"
            : "Failed to generate voice report",
          report: null,
          error: error.message
        };
      }
    },

    async getQualityMetricsReport(timeframe, language) {
      const timeFilter = this.getTimeFilter(timeframe);
      
      const query = db
        .from('voice_quality_metrics')
        .select('*')
        .gte('created_at', timeFilter);
        
      if (language && language !== 'all') {
        query.eq('language', language);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },

    generateReport(metrics, language) {
      if (!metrics.length) {
        return {
          summary: language === 'el' ? "Δεν υπάρχουν δεδομένα" : "No data available",
          totalCalls: 0,
          averageQuality: 0,
          trends: null
        };
      }

      const totalCalls = metrics.length;
      const averageClarity = metrics.reduce((sum, m) => sum + (m.clarity_score || 0), 0) / totalCalls;
      const averageConsistency = metrics.reduce((sum, m) => sum + (m.consistency_score || 0), 0) / totalCalls;
      const voiceSwitches = metrics.filter(m => m.technical_metrics?.voice_switched).length;
      
      const languageBreakdown = metrics.reduce((acc, m) => {
        acc[m.language] = (acc[m.language] || 0) + 1;
        return acc;
      }, {});

      return {
        summary: language === 'el' 
          ? `${totalCalls} κλήσεις αναλύθηκαν με μέσο όρο ποιότητας ${(averageClarity * 100).toFixed(1)}%`
          : `${totalCalls} calls analyzed with average quality of ${(averageClarity * 100).toFixed(1)}%`,
        totalCalls,
        averageClarity: averageClarity,
        averageConsistency: averageConsistency,
        voiceSwitches: voiceSwitches,
        languageBreakdown: languageBreakdown,
        recommendations: this.getReportRecommendations(averageClarity, averageConsistency, voiceSwitches, language)
      };
    },

    getTimeFilter(timeframe) {
      const now = new Date();
      switch (timeframe) {
        case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      }
    },

    getReportRecommendations(clarity, consistency, switches, language) {
      const recommendations = [];
      const isGreek = language === 'el';
      
      if (clarity < 0.7) {
        recommendations.push(isGreek 
          ? "Βελτιώστε την ποιότητα του ήχου"
          : "Improve audio quality settings");
      }
      
      if (consistency < 0.8) {
        recommendations.push(isGreek
          ? "Βελτιώστε τη συνέπεια της γλώσσας"
          : "Improve language consistency");
      }
      
      if (switches > 0) {
        recommendations.push(isGreek
          ? `${switches} αλλαγές φωνής - ελέγξτε τη σταθερότητα`
          : `${switches} voice switches - check stability`);
      }
      
      return recommendations;
    }
  }
};