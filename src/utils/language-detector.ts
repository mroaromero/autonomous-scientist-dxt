interface LanguageProfile {
  code: string;
  name: string;
  patterns: RegExp[];
  commonWords: string[];
  characterFrequency: Record<string, number>;
  academicTerms: string[];
}

export class LanguageDetector {
  private profiles: LanguageProfile[];

  constructor() {
    this.profiles = this.initializeLanguageProfiles();
  }

  private initializeLanguageProfiles(): LanguageProfile[] {
    return [
      {
        code: 'en',
        name: 'English',
        patterns: [
          /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|run|too|any|few|let|put|say|she|try|use)\b/gi
        ],
        commonWords: ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had'],
        characterFrequency: { 'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0, 'n': 6.7, 's': 6.3 },
        academicTerms: ['research', 'study', 'analysis', 'method', 'result', 'conclusion', 'hypothesis', 'data', 'evidence', 'theory']
      },
      {
        code: 'es',
        name: 'Spanish',
        patterns: [
          /\b(que|con|una|por|del|las|los|sus|más|fue|son|han|muy|sin|año|ser|dos|más|día|vez|así|bien|como|todo|cada|vida|otro|forma|puede|años|tiempo|hasta|bajo|debe|donde|mientras|menos|caso|parte|desde|hacer|mismo|tres|estado|gran|poco|lugar|ejemplo|estos|hacia|casa|tanto|través|entre|agua|punto|grupo|país|mundo|hecho)\b/gi
        ],
        commonWords: ['que', 'con', 'una', 'por', 'del', 'las', 'los', 'sus', 'más', 'fue'],
        characterFrequency: { 'e': 13.7, 'a': 11.5, 'o': 8.7, 's': 7.2, 'n': 6.7, 'r': 6.9, 'i': 6.2 },
        academicTerms: ['investigación', 'estudio', 'análisis', 'método', 'resultado', 'conclusión', 'hipótesis', 'datos', 'evidencia', 'teoría']
      },
      {
        code: 'de',
        name: 'German',
        patterns: [
          /\b(der|die|und|von|den|des|mit|ein|auf|für|ist|das|dem|nicht|eine|als|auch|sie|aus|zum|wie|noch|nur|über|hat|man|nach|aber|bei|vor|wenn|mehr|kann|durch|wird)\b/gi
        ],
        commonWords: ['der', 'die', 'und', 'von', 'den', 'des', 'mit', 'ein', 'auf', 'für'],
        characterFrequency: { 'e': 17.4, 'n': 9.8, 'i': 7.6, 's': 7.3, 'r': 7.0, 'a': 6.5, 't': 6.2 },
        academicTerms: ['forschung', 'studie', 'analyse', 'methode', 'ergebnis', 'schlussfolgerung', 'hypothese', 'daten', 'beweis', 'theorie']
      },
      {
        code: 'fr',
        name: 'French',
        patterns: [
          /\b(que|les|des|est|pour|une|dans|qui|sur|avec|son|pas|tout|par|mais|comme|ont|aux|être|vous|cette|lui|ses|ou|cette|fait|peut|sans)\b/gi
        ],
        commonWords: ['que', 'les', 'des', 'est', 'pour', 'une', 'dans', 'qui', 'sur', 'avec'],
        characterFrequency: { 'e': 14.7, 's': 7.9, 'a': 7.6, 'i': 7.5, 't': 7.2, 'n': 7.1, 'r': 6.6 },
        academicTerms: ['recherche', 'étude', 'analyse', 'méthode', 'résultat', 'conclusion', 'hypothèse', 'données', 'preuve', 'théorie']
      },
      {
        code: 'it',
        name: 'Italian',
        patterns: [
          /\b(che|per|con|del|una|alla|nel|dai|delle|dalla|negli|nella|dell|dalle|dello|negli|sulla|sugli|dalle|negli)\b/gi
        ],
        commonWords: ['che', 'per', 'con', 'del', 'una', 'alla', 'nel', 'dai', 'delle', 'dalla'],
        characterFrequency: { 'e': 11.8, 'a': 11.7, 'i': 10.1, 'o': 9.8, 'n': 6.9, 't': 5.6, 'r': 6.4 },
        academicTerms: ['ricerca', 'studio', 'analisi', 'metodo', 'risultato', 'conclusione', 'ipotesi', 'dati', 'evidenza', 'teoria']
      },
      {
        code: 'pt',
        name: 'Portuguese',
        patterns: [
          /\b(que|com|uma|para|são|dos|das|seu|sua|foi|tem|mais|seus|suas|pela|pelo|numa|esta|esse|essa|como|muito|bem|já|só|também|até|onde|quando)\b/gi
        ],
        commonWords: ['que', 'com', 'uma', 'para', 'são', 'dos', 'das', 'seu', 'sua', 'foi'],
        characterFrequency: { 'a': 14.6, 'e': 12.6, 'o': 10.7, 's': 7.8, 'r': 6.5, 'i': 6.2, 'n': 5.2 },
        academicTerms: ['pesquisa', 'estudo', 'análise', 'método', 'resultado', 'conclusão', 'hipótese', 'dados', 'evidência', 'teoria']
      },
      {
        code: 'la',
        name: 'Latin',
        patterns: [
          /\b(et|in|ad|ex|de|cum|per|pro|ab|ob|sub|super|inter|post|ante|contra|sine|causa|res|homo|vita|dies|tempus|locus|modus|genus|species)\b/gi
        ],
        commonWords: ['et', 'in', 'ad', 'ex', 'de', 'cum', 'per', 'pro', 'ab', 'ob'],
        characterFrequency: { 'i': 11.2, 'a': 8.9, 'e': 8.4, 'u': 8.0, 's': 7.1, 't': 6.8, 'n': 6.4 },
        academicTerms: ['quaestio', 'studium', 'analysis', 'methodus', 'conclusio', 'hypothesis', 'data', 'argumentum', 'theoria']
      },
      {
        code: 'grc',
        name: 'Ancient Greek',
        patterns: [
          /\b(καὶ|τὸ|τὴν|τοῦ|τῆς|ἐν|τῷ|τῇ|οὐ|μὴ|γὰρ|δὲ|ἀλλὰ|εἰ|ὡς|πρὸς|διὰ|κατὰ|μετὰ|ἐπὶ|ἀπὸ|παρὰ|ὑπὸ|περὶ|σὺν|ἐκ|εἰς)\b/gi
        ],
        commonWords: ['καὶ', 'τὸ', 'τὴν', 'τοῦ', 'τῆς', 'ἐν', 'τῷ', 'τῇ', 'οὐ', 'μὴ'],
        characterFrequency: { 'α': 8.2, 'ε': 7.8, 'ι': 7.3, 'ο': 6.9, 'υ': 6.1, 'η': 5.4, 'ω': 4.8 },
        academicTerms: ['φιλοσοφία', 'ἐπιστήμη', 'θεωρία', 'μέθοδος', 'λόγος', 'ἀρχή', 'αἰτία', 'οὐσία']
      }
    ];
  }

  async detectLanguage(text: string): Promise<string> {
    if (!text || text.trim().length < 50) {
      return 'en'; // Default to English for short texts
    }

    const scores = new Map<string, number>();
    
    // Initialize scores
    for (const profile of this.profiles) {
      scores.set(profile.code, 0);
    }

    // Analyze each language profile
    for (const profile of this.profiles) {
      let score = 0;
      
      // Pattern matching score
      for (const pattern of profile.patterns) {
        const matches = (text.match(pattern) || []).length;
        score += matches * 2; // Weight pattern matches heavily
      }
      
      // Common words score
      const words = text.toLowerCase().split(/\s+/);
      for (const word of profile.commonWords) {
        const wordCount = words.filter(w => w === word).length;
        score += wordCount * 3; // Weight common words very heavily
      }
      
      // Character frequency analysis
      score += this.analyzeCharacterFrequency(text, profile.characterFrequency);
      
      // Academic terms bonus
      for (const term of profile.academicTerms) {
        if (text.toLowerCase().includes(term)) {
          score += 5; // Bonus for academic terminology
        }
      }
      
      scores.set(profile.code, score);
    }

    // Find the language with the highest score
    let maxScore = 0;
    let detectedLanguage = 'en';
    
    for (const [lang, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }

    // Confidence check - if score is too low, default to English
    if (maxScore < 10) {
      detectedLanguage = 'en';
    }

    console.error(`🌐 Language detected: ${detectedLanguage} (score: ${maxScore})`);
    return detectedLanguage;
  }

  private analyzeCharacterFrequency(text: string, expectedFreq: Record<string, number>): number {
    const textChars = text.toLowerCase().replace(/[^a-záéíóúñüàâäéèêëïîôùûüÿçßαβγδεζηθικλμνξοπρστυφχψω]/gi, '');
    const totalChars = textChars.length;
    
    if (totalChars === 0) return 0;
    
    const actualFreq: Record<string, number> = {};
    
    // Calculate actual character frequencies
    for (const char of textChars) {
      actualFreq[char] = (actualFreq[char] || 0) + 1;
    }
    
    // Convert to percentages
    for (const char in actualFreq) {
      actualFreq[char] = (actualFreq[char] / totalChars) * 100;
    }
    
    // Calculate similarity score
    let score = 0;
    let comparisons = 0;
    
    for (const [char, expectedPct] of Object.entries(expectedFreq)) {
      const actualPct = actualFreq[char] || 0;
      const difference = Math.abs(expectedPct - actualPct);
      score += Math.max(0, 5 - difference); // Max 5 points per character, decreasing with difference
      comparisons++;
    }
    
    return comparisons > 0 ? score / comparisons : 0;
  }

  // Get supported languages list
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return this.profiles.map(profile => ({
      code: profile.code,
      name: profile.name
    }));
  }

  // Validate if a language code is supported
  isLanguageSupported(langCode: string): boolean {
    return this.profiles.some(profile => profile.code === langCode);
  }

  // Get academic terms for a specific language (useful for OCR post-processing)
  getAcademicTerms(langCode: string): string[] {
    const profile = this.profiles.find(p => p.code === langCode);
    return profile ? profile.academicTerms : [];
  }

  // Detect if text is multilingual
  async detectMultilingualText(text: string): Promise<Array<{ language: string; confidence: number; segments: string[] }>> {
    // Split text into segments (paragraphs)
    const segments = text.split(/\n\s*\n/).filter(s => s.trim().length > 50);
    
    const languageResults: Array<{ language: string; confidence: number; segments: string[] }> = [];
    const segmentLanguages = new Map<string, string[]>();
    
    // Detect language for each segment
    for (const segment of segments) {
      const detectedLang = await this.detectLanguage(segment);
      
      if (!segmentLanguages.has(detectedLang)) {
        segmentLanguages.set(detectedLang, []);
      }
      segmentLanguages.get(detectedLang)!.push(segment);
    }
    
    // Calculate confidence based on segment distribution
    for (const [language, langSegments] of segmentLanguages.entries()) {
      const confidence = (langSegments.length / segments.length) * 100;
      
      languageResults.push({
        language,
        confidence: Math.round(confidence),
        segments: langSegments
      });
    }
    
    // Sort by confidence
    languageResults.sort((a, b) => b.confidence - a.confidence);
    
    return languageResults;
  }
}