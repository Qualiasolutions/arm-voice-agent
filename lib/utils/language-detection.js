// Language detection utilities for Greek and English
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';
  
  const cleanText = text.toLowerCase().trim();
  
  // Greek detection patterns
  const greekPatterns = [
    /[\u0370-\u03FF\u1F00-\u1FFF]/, // Greek Unicode ranges
    /καλησπέρα|γειά|πώς|μπορώ|θέλω|έχετε|τιμή|προϊόν|υπολογιστής|κάρτα/i,
    /επεξεργαστής|μνήμη|δίσκος|gaming|laptop|εγγύηση|επισκευή/i
  ];
  
  // English detection patterns  
  const englishPatterns = [
    /\b(hello|hi|good|how|can|help|want|need|price|computer|graphics)\b/i,
    /\b(processor|memory|storage|gaming|laptop|warranty|repair|track|order)\b/i
  ];
  
  let greekScore = 0;
  let englishScore = 0;
  
  // Check Greek patterns
  greekPatterns.forEach(pattern => {
    if (pattern.test(cleanText)) {
      greekScore += pattern.source.includes('[') ? 10 : 5; // Unicode patterns get higher score
    }
  });
  
  // Check English patterns
  englishPatterns.forEach(pattern => {
    if (pattern.test(cleanText)) {
      englishScore += 3;
    }
  });
  
  // Greek words tend to be longer, account for this
  const avgWordLength = cleanText.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / cleanText.split(/\s+/).length;
  if (avgWordLength > 6) greekScore += 2;
  
  // Decision logic
  if (greekScore > englishScore && greekScore > 3) {
    return 'el';
  } else if (englishScore > 0) {
    return 'en';
  }
  
  // Default fallback
  return 'en';
}

export function detectLanguageWithConfidence(text) {
  if (!text || typeof text !== 'string') {
    return { language: 'en', confidence: 0 };
  }
  
  const cleanText = text.toLowerCase().trim();
  
  // More sophisticated scoring
  let scores = { el: 0, en: 0 };
  
  // Greek indicators
  if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) {
    scores.el += 20; // Strong indicator
  }
  
  // Greek common words
  const greekWords = [
    'καλησπέρα', 'γειά', 'πώς', 'μπορώ', 'θέλω', 'έχετε', 'τιμή', 
    'επεξεργαστής', 'κάρτα', 'υπολογιστής', 'εγγύηση', 'επισκευή'
  ];
  
  greekWords.forEach(word => {
    if (cleanText.includes(word)) {
      scores.el += 8;
    }
  });
  
  // English common words
  const englishWords = [
    'hello', 'hi', 'good', 'how', 'can', 'help', 'want', 'need',
    'graphics', 'card', 'processor', 'computer', 'gaming', 'laptop'
  ];
  
  englishWords.forEach(word => {
    if (cleanText.includes(word)) {
      scores.en += 5;
    }
  });
  
  // Length-based hints (Greek words are typically longer)
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  if (avgLength > 7) {
    scores.el += 3;
  } else if (avgLength < 5) {
    scores.en += 2;
  }
  
  // Character frequency analysis
  const greekChars = (text.match(/[αβγδεζηθικλμνξοπρστυφχψω]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  if (greekChars > 0) {
    scores.el += Math.min(greekChars / totalChars * 30, 15);
  }
  
  // Determine result
  const totalScore = scores.el + scores.en;
  const language = scores.el > scores.en ? 'el' : 'en';
  const confidence = totalScore > 0 ? Math.max(scores.el, scores.en) / totalScore : 0;
  
  return {
    language,
    confidence: Math.min(confidence, 1.0),
    scores: { ...scores }
  };
}

export function isGreekText(text) {
  return detectLanguage(text) === 'el';
}

export function isEnglishText(text) {
  return detectLanguage(text) === 'en';
}

export function formatResponseForLanguage(message, language, formality = 'formal') {
  if (!message) return '';
  
  if (language === 'el') {
    // Greek formatting
    if (formality === 'formal') {
      // Use formal Greek structures
      return message
        .replace(/\byou\b/gi, 'εσάς')
        .replace(/\bhi\b/gi, 'Καλησπέρα')
        .replace(/\bhello\b/gi, 'Καλησπέρα');
    } else {
      // Casual Greek
      return message
        .replace(/\byou\b/gi, 'εσένα')
        .replace(/\bhi\b/gi, 'Γειά')
        .replace(/\bhello\b/gi, 'Γειά');
    }
  }
  
  // English formatting (default)
  return message;
}

export default {
  detectLanguage,
  detectLanguageWithConfidence,
  isGreekText,
  isEnglishText,
  formatResponseForLanguage
};