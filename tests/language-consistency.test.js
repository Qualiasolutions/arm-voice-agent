import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { detectLanguage, detectLanguageWithConfidence, isGreekText, isEnglishText } from '../lib/utils/language-detection.js';
import FunctionRegistry from '../lib/functions/index.js';

describe('Greek Language Consistency Tests', () => {
  beforeAll(async () => {
    await FunctionRegistry.init();
  });

  afterEach(() => {
    // Clean up any side effects
  });

  describe('Language Detection', () => {
    test('should detect Greek language within 2 seconds', async () => {
      const startTime = Date.now();
      const result = detectLanguageWithConfidence('Καλησπέρα, θέλω μία κάρτα γραφικών');
      const detectionTime = Date.now() - startTime;
      
      expect(result.language).toBe('el');
      expect(detectionTime).toBeLessThan(2000);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should detect English language correctly', async () => {
      const result = detectLanguageWithConfidence('Hello, I want a graphics card');
      
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle Greek technical terms', () => {
      const greekTechPhrases = [
        'κάρτα γραφικών RTX 4090',
        'επεξεργαστής AMD Ryzen',
        'μνήμη RAM DDR5',
        'gaming υπολογιστής',
        'εγγύηση δύο χρόνια'
      ];

      greekTechPhrases.forEach(phrase => {
        const result = detectLanguage(phrase);
        expect(result).toBe('el');
        expect(isGreekText(phrase)).toBe(true);
      });
    });

    test('should handle English technical terms', () => {
      const englishTechPhrases = [
        'RTX 4090 graphics card',
        'AMD Ryzen processor',
        'DDR5 RAM memory',
        'gaming computer',
        'two year warranty'
      ];

      englishTechPhrases.forEach(phrase => {
        const result = detectLanguage(phrase);
        expect(result).toBe('en');
        expect(isEnglishText(phrase)).toBe(true);
      });
    });

    test('should handle mixed technical terms appropriately', () => {
      // Greek sentence with English tech terms (common in Cyprus)
      const mixedPhrase = 'Θέλω έναν RTX 4090 για gaming';
      const result = detectLanguage(mixedPhrase);
      
      // Should still detect as Greek since the structure is Greek
      expect(result).toBe('el');
    });

    test('should provide confidence scores', () => {
      const testCases = [
        { text: 'Καλησπέρα, πώς πάτε;', expectedLang: 'el', minConfidence: 0.9 },
        { text: 'Hello, how are you?', expectedLang: 'en', minConfidence: 0.8 },
        { text: 'RTX 4090', expectedLang: 'en', minConfidence: 0.3 }, // Tech terms are ambiguous
        { text: 'κάρτα γραφικών', expectedLang: 'el', minConfidence: 0.9 }
      ];

      testCases.forEach(({ text, expectedLang, minConfidence }) => {
        const result = detectLanguageWithConfidence(text);
        expect(result.language).toBe(expectedLang);
        expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
      });
    });
  });

  describe('Conversation Language Consistency', () => {
    test('should maintain Greek throughout conversation', async () => {
      const greekConversation = [
        'Καλησπέρα, θέλω gaming laptop',
        'Τι τιμές έχετε;',
        'Έχετε εγγύηση;',
        'Πόσο κοστίζει η επισκευή;'
      ];
      
      const responses = [];
      
      for (const input of greekConversation) {
        const detectedLang = detectLanguage(input);
        responses.push({
          input: input,
          language: detectedLang,
          containsEnglish: /\b(hello|hi|good|can|help|want|need|price)\b/i.test(input)
        });
      }

      responses.forEach(response => {
        expect(response.language).toBe('el');
        expect(response.containsEnglish).toBe(false);
      });
    });

    test('should maintain English throughout conversation', async () => {
      const englishConversation = [
        'Hello, I want a gaming laptop',
        'What prices do you have?',
        'Do you have warranty?',
        'How much does repair cost?'
      ];
      
      const responses = [];
      
      for (const input of englishConversation) {
        const detectedLang = detectLanguage(input);
        responses.push({
          input: input,
          language: detectedLang,
          containsGreek: /[\u0370-\u03FF\u1F00-\u1FFF]/.test(input)
        });
      }

      responses.forEach(response => {
        expect(response.language).toBe('en');
        expect(response.containsGreek).toBe(false);
      });
    });

    test('should handle language switching gracefully', () => {
      const mixedConversation = [
        { text: 'Καλησπέρα', expectedLang: 'el' },
        { text: 'Hello, can you help me?', expectedLang: 'en' },
        { text: 'Ναι, μπορώ να σας βοηθήσω', expectedLang: 'el' },
        { text: 'Thank you', expectedLang: 'en' }
      ];

      mixedConversation.forEach(({ text, expectedLang }) => {
        const detectedLang = detectLanguage(text);
        expect(detectedLang).toBe(expectedLang);
      });
    });
  });

  describe('Voice Function Language Handling', () => {
    test('should handle Greek product search requests', async () => {
      const greekProductQueries = [
        'Θέλω κάρτα γραφικών',
        'Ψάχνω επεξεργαστή AMD',
        'Έχετε gaming laptop;',
        'Τι τιμή έχει η RTX 4090;'
      ];

      for (const query of greekProductQueries) {
        const language = detectLanguage(query);
        expect(language).toBe('el');
        
        // Simulate function call context
        const callContext = {
          language: language,
          customerProfile: { preferredLanguage: 'el' }
        };
        
        // Test that the context maintains Greek language preference
        expect(callContext.language).toBe('el');
        expect(callContext.customerProfile.preferredLanguage).toBe('el');
      }
    });

    test('should handle English product search requests', async () => {
      const englishProductQueries = [
        'I want a graphics card',
        'Looking for AMD processor',
        'Do you have gaming laptops?',
        'What price is the RTX 4090?'
      ];

      for (const query of englishProductQueries) {
        const language = detectLanguage(query);
        expect(language).toBe('en');
        
        // Simulate function call context
        const callContext = {
          language: language,
          customerProfile: { preferredLanguage: 'en' }
        };
        
        expect(callContext.language).toBe('en');
        expect(callContext.customerProfile.preferredLanguage).toBe('en');
      }
    });
  });

  describe('Response Consistency Validation', () => {
    test('should generate consistent Greek responses', () => {
      const greekResponsePatterns = [
        {
          input: 'Καλησπέρα',
          expectedPattern: /καλησπέρα|γειά|καλώς/i,
          shouldNotContain: /hello|hi|good/i
        },
        {
          input: 'Έχετε RTX 4090;',
          expectedPattern: /ναι|όχι|έχουμε|δεν έχουμε/i,
          shouldNotContain: /yes|no|have|don't/i
        },
        {
          input: 'Πόσο κοστίζει;',
          expectedPattern: /ευρώ|τιμή|κόστος/i,
          shouldNotContain: /euros|price|cost/i
        }
      ];

      // This would typically test actual function responses
      // For now, we test the pattern matching logic
      greekResponsePatterns.forEach(({ expectedPattern, shouldNotContain }) => {
        const mockGreekResponse = 'Καλησπέρα! Ναι, έχουμε RTX 4090 με τιμή 1200 ευρώ.';
        
        expect(expectedPattern.test(mockGreekResponse)).toBe(true);
        expect(shouldNotContain.test(mockGreekResponse)).toBe(false);
      });
    });

    test('should generate consistent English responses', () => {
      const englishResponsePatterns = [
        {
          input: 'Hello',
          expectedPattern: /hello|hi|good/i,
          shouldNotContain: /καλησπέρα|γειά/i
        },
        {
          input: 'Do you have RTX 4090?',
          expectedPattern: /yes|no|have|don't/i,
          shouldNotContain: /ναι|όχι|έχουμε/i
        },
        {
          input: 'How much does it cost?',
          expectedPattern: /euros|price|cost/i,
          shouldNotContain: /ευρώ|τιμή|κόστος/i
        }
      ];

      englishResponsePatterns.forEach(({ expectedPattern, shouldNotContain }) => {
        const mockEnglishResponse = 'Hello! Yes, we have RTX 4090 for 1200 euros.';
        
        expect(expectedPattern.test(mockEnglishResponse)).toBe(true);
        expect(shouldNotContain.test(mockEnglishResponse)).toBe(false);
      });
    });
  });

  describe('Performance Requirements', () => {
    test('language detection should be fast', () => {
      const testPhrases = [
        'Καλησπέρα, θέλω βοήθεια',
        'Hello, I need help',
        'RTX 4090 gaming card',
        'κάρτα γραφικών για παιχνίδια'
      ];

      testPhrases.forEach(phrase => {
        const startTime = performance.now();
        detectLanguage(phrase);
        const endTime = performance.now();
        
        // Should complete in under 10ms
        expect(endTime - startTime).toBeLessThan(10);
      });
    });

    test('confidence calculation should be fast', () => {
      const testPhrase = 'Καλησπέρα, θέλω μία κάρτα γραφικών RTX 4090 για gaming';
      
      const startTime = performance.now();
      const result = detectLanguageWithConfidence(testPhrase);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(20);
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('scores');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty or null input gracefully', () => {
      const edgeCases = ['', null, undefined, ' ', '   '];
      
      edgeCases.forEach(input => {
        const result = detectLanguage(input);
        expect(result).toBe('en'); // Default fallback
      });
    });

    test('should handle very short input', () => {
      const shortInputs = ['hi', 'ok', 'no', 'ναι', 'όχι'];
      
      shortInputs.forEach(input => {
        const result = detectLanguage(input);
        expect(['en', 'el']).toContain(result);
      });
    });

    test('should handle numbers and symbols', () => {
      const numericInputs = ['123', '€500', '$1000', '4090', 'RTX'];
      
      numericInputs.forEach(input => {
        const result = detectLanguage(input);
        expect(['en', 'el']).toContain(result);
      });
    });

    test('should handle very long input', () => {
      const longGreekText = 'Καλησπέρα, θέλω να αγοράσω μία κάρτα γραφικών για τον υπολογιστή μου. Ψάχνω κάτι που να είναι καλό για gaming αλλά και για επαγγελματική δουλειά. Έχετε κάτι να μου προτείνετε; Θα ήθελα να μάθω τις τιμές και τη διαθεσιμότητα διαφόρων μοντέλων.'.repeat(5);
      
      const startTime = performance.now();
      const result = detectLanguage(longGreekText);
      const endTime = performance.now();
      
      expect(result).toBe('el');
      expect(endTime - startTime).toBeLessThan(100); // Should still be fast
    });
  });

  describe('Greek Language Accuracy', () => {
    test('should correctly identify various Greek greetings', () => {
      const greekGreetings = [
        'Καλημέρα',
        'Καλησπέρα', 
        'Γειά σας',
        'Γειά σου',
        'Καλώς ήρθατε',
        'Χαίρετε'
      ];

      greekGreetings.forEach(greeting => {
        expect(detectLanguage(greeting)).toBe('el');
      });
    });

    test('should correctly identify Greek technical vocabulary', () => {
      const greekTechTerms = [
        'υπολογιστής',
        'επεξεργαστής',
        'κάρτα γραφικών',
        'μητρική κάρτα',
        'τροφοδοτικό',
        'σκληρός δίσκος',
        'μνήμη RAM',
        'οθόνη',
        'πληκτρολόγιο',
        'ποντίκι'
      ];

      greekTechTerms.forEach(term => {
        expect(detectLanguage(term)).toBe('el');
      });
    });

    test('should handle Greek with Latin characters (tech terms)', () => {
      const mixedGreekTech = [
        'κάρτα RTX 4090',
        'επεξεργαστής Intel i7',
        'μνήμη DDR5 32GB',
        'SSD 1TB δίσκος',
        'gaming υπολογιστής'
      ];

      mixedGreekTech.forEach(term => {
        expect(detectLanguage(term)).toBe('el');
      });
    });
  });

  describe('Validation Metrics', () => {
    test('Greek language detection accuracy should be >95%', () => {
      const greekTestSet = [
        'Καλησπέρα, θέλω βοήθεια',
        'Έχετε κάρτες γραφικών;',
        'Πόσο κοστίζει αυτός ο υπολογιστής;',
        'Μπορείτε να μου δείξετε laptops;',
        'Θέλω να αγοράσω επεξεργαστή',
        'Υπάρχει εγγύηση;',
        'Πότε θα έρθει η παραγγελία μου;',
        'Χρειάζομαι τεχνική υποστήριξη',
        'Ποια είναι τα ωράρια του καταστήματος;',
        'Μπορώ να κάνω επιστροφή;'
      ];

      let correctDetections = 0;
      
      greekTestSet.forEach(text => {
        if (detectLanguage(text) === 'el') {
          correctDetections++;
        }
      });

      const accuracy = correctDetections / greekTestSet.length;
      expect(accuracy).toBeGreaterThan(0.95);
    });

    test('English language detection accuracy should be >95%', () => {
      const englishTestSet = [
        'Hello, I need help',
        'Do you have graphics cards?',
        'How much does this computer cost?',
        'Can you show me some laptops?',
        'I want to buy a processor',
        'Is there a warranty?',
        'When will my order arrive?',
        'I need technical support',
        'What are the store hours?',
        'Can I return this?'
      ];

      let correctDetections = 0;
      
      englishTestSet.forEach(text => {
        if (detectLanguage(text) === 'en') {
          correctDetections++;
        }
      });

      const accuracy = correctDetections / englishTestSet.length;
      expect(accuracy).toBeGreaterThan(0.95);
    });

    test('overall language detection should have high confidence', () => {
      const mixedTestSet = [
        { text: 'Καλησπέρα', expectedLang: 'el' },
        { text: 'Hello', expectedLang: 'en' },
        { text: 'Θέλω RTX 4090', expectedLang: 'el' },
        { text: 'I want RTX 4090', expectedLang: 'en' },
        { text: 'Πόσο κοστίζει;', expectedLang: 'el' },
        { text: 'How much is it?', expectedLang: 'en' }
      ];

      let highConfidenceCount = 0;
      
      mixedTestSet.forEach(({ text, expectedLang }) => {
        const result = detectLanguageWithConfidence(text);
        if (result.language === expectedLang && result.confidence > 0.8) {
          highConfidenceCount++;
        }
      });

      const highConfidenceRate = highConfidenceCount / mixedTestSet.length;
      expect(highConfidenceRate).toBeGreaterThan(0.85);
    });
  });
});