const { LanguageDetector } = require('../utils/language-detector.js');
const { CacheManager } = require('../utils/cache-manager.js');


class DisciplineAnalyzer {
  constructor(cacheManager) {
    this.languageDetector = new LanguageDetector();
    this.cacheManager = cacheManager;
    this.disciplinePatterns = this.initializeDisciplinePatterns();
  }

  initializeDisciplinePatterns() {
    const patterns = new Map();

    // Psychology patterns
    patterns.set('psychology', {
      methodologies: [
        'experimental design', 'quasi-experimental', 'correlational', 'longitudinal',
        'cross-sectional', 'case study', 'meta-analysis', 'systematic review',
        'randomized controlled trial', 'single-case design', 'mixed methods'
      ],
      theories: [
        'cognitive behavioral', 'psychodynamic', 'humanistic', 'social learning',
        'attachment theory', 'cognitive dissonance', 'social identity theory',
        'self-determination theory', 'theory of planned behavior'
      ],
      measures: [
        'likert scale', 'beck depression inventory', 'mini mental state',
        'wechsler', 'mmpi', 'big five', 'dass-21', 'panas', 'rosenberg self-esteem'
      ],
      analyses: [
        'anova', 'regression', 't-test', 'chi-square', 'factor analysis',
        'sem', 'multilevel modeling', 'survival analysis', 'time series'
      ],
      keywords: [
        'participants', 'intervention', 'control group', 'baseline', 'treatment',
        'behavior', 'cognition', 'emotion', 'personality', 'development'
      ]
    });

    // Neuroscience patterns
    patterns.set('neuroscience', {
      methodologies: [
        'fmri', 'eeg', 'pet', 'meg', 'tms', 'optogenetics', 'patch clamp',
        'calcium imaging', 'electrophysiology', 'lesion studies'
      ],
      theories: [
        'neural plasticity', 'synaptic transmission', 'neural networks',
        'computational neuroscience', 'connectome', 'default mode network'
      ],
      measures: [
        'bold signal', 'spike rate', 'local field potential', 'connectivity',
        'brain volume', 'cortical thickness', 'white matter integrity'
      ],
      analyses: [
        'spm', 'fsl', 'freesurfer', 'conn', 'brainstorm', 'fieldtrip',
        'nilearn', 'mrtrix', 'dti analysis', 'ica', 'glm'
      ],
      keywords: [
        'neurons', 'synapses', 'cortex', 'hippocampus', 'amygdala', 'cerebellum',
        'brain regions', 'neural activity', 'neurotransmitters', 'plasticity'
      ]
    });

    // Education patterns
    patterns.set('education', {
      methodologies: [
        'action research', 'design-based research', 'ethnography', 'case study',
        'mixed methods', 'longitudinal cohort', 'intervention study'
      ],
      theories: [
        'constructivism', 'social learning theory', 'bloom taxonomy',
        'multiple intelligences', 'zone of proximal development', 'scaffolding'
      ],
      measures: [
        'achievement tests', 'standardized scores', 'rubrics', 'portfolios',
        'self-efficacy scales', 'motivation inventories', 'learning analytics'
      ],
      analyses: [
        'pre-post analysis', 'growth modeling', 'multilevel analysis',
        'qualitative coding', 'thematic analysis', 'discourse analysis'
      ],
      keywords: [
        'students', 'learning', 'curriculum', 'pedagogy', 'assessment',
        'achievement', 'motivation', 'engagement', 'instruction', 'classroom'
      ]
    });

    // Sociology patterns
    patterns.set('sociology', {
      methodologies: [
        'survey research', 'ethnography', 'comparative analysis', 'historical analysis',
        'network analysis', 'content analysis', 'grounded theory'
      ],
      theories: [
        'social capital', 'social networks', 'rational choice', 'conflict theory',
        'symbolic interactionism', 'social constructionism', 'institutional theory'
      ],
      measures: [
        'social class', 'socioeconomic status', 'social mobility', 'network density',
        'centrality measures', 'homophily', 'social cohesion'
      ],
      analyses: [
        'regression analysis', 'logistic regression', 'network analysis',
        'survival analysis', 'multilevel modeling', 'structural equation modeling'
      ],
      keywords: [
        'society', 'social groups', 'institutions', 'inequality', 'mobility',
        'culture', 'norms', 'values', 'social change', 'stratification'
      ]
    });

    // Anthropology patterns
    patterns.set('anthropology', {
      methodologies: [
        'ethnography', 'participant observation', 'field work', 'life history',
        'oral history', 'visual anthropology', 'digital ethnography'
      ],
      theories: [
        'cultural relativism', 'structural functionalism', 'symbolic anthropology',
        'practice theory', 'actor-network theory', 'postcolonial theory'
      ],
      measures: [
        'thick description', 'cultural domains', 'kinship systems',
        'ritual analysis', 'material culture', 'linguistic anthropology'
      ],
      analyses: [
        'thematic analysis', 'narrative analysis', 'discourse analysis',
        'comparative analysis', 'genealogical method', 'cultural mapping'
      ],
      keywords: [
        'culture', 'society', 'ritual', 'kinship', 'ethnicity', 'identity',
        'tradition', 'customs', 'beliefs', 'practices', 'community'
      ]
    });

    // Philosophy patterns
    patterns.set('philosophy', {
      methodologies: [
        'conceptual analysis', 'thought experiments', 'logical analysis',
        'hermeneutics', 'phenomenology', 'dialectical method'
      ],
      theories: [
        'virtue ethics', 'deontology', 'consequentialism', 'existentialism',
        'phenomenology', 'pragmatism', 'analytic philosophy'
      ],
      measures: [
        'logical validity', 'soundness', 'coherence', 'consistency',
        'conceptual clarity', 'argumentative strength'
      ],
      analyses: [
        'argument analysis', 'conceptual mapping', 'logical reconstruction',
        'textual analysis', 'comparative analysis', 'critical analysis'
      ],
      keywords: [
        'argument', 'premise', 'conclusion', 'logic', 'ethics', 'metaphysics',
        'epistemology', 'consciousness', 'reality', 'truth', 'knowledge'
      ]
    });

    // Political Science patterns
    patterns.set('political-science', {
      methodologies: [
        'comparative method', 'case study', 'statistical analysis', 'survey research',
        'content analysis', 'game theory', 'institutional analysis'
      ],
      theories: [
        'rational choice', 'institutional theory', 'democratic theory',
        'realism', 'liberalism', 'constructivism', 'public choice theory'
      ],
      measures: [
        'democracy indices', 'electoral systems', 'public opinion', 'policy outcomes',
        'institutional quality', 'governance indicators', 'conflict measures'
      ],
      analyses: [
        'regression analysis', 'time series analysis', 'panel data analysis',
        'qualitative comparative analysis', 'content analysis', 'network analysis'
      ],
      keywords: [
        'government', 'democracy', 'elections', 'policy', 'institutions',
        'power', 'authority', 'legitimacy', 'governance', 'political behavior'
      ]
    });

    // International Relations patterns
    patterns.set('international-relations', {
      methodologies: [
        'comparative case studies', 'process tracing', 'content analysis',
        'game theory', 'statistical analysis', 'historical analysis'
      ],
      theories: [
        'realism', 'liberalism', 'constructivism', 'critical theory',
        'feminist IR theory', 'postcolonial theory', 'security studies'
      ],
      measures: [
        'power indices', 'conflict intensity', 'trade flows', 'alliance patterns',
        'international law compliance', 'diplomatic relations'
      ],
      analyses: [
        'event analysis', 'network analysis', 'spatial analysis',
        'time series analysis', 'qualitative analysis', 'discourse analysis'
      ],
      keywords: [
        'states', 'sovereignty', 'security', 'diplomacy', 'conflict', 'cooperation',
        'international law', 'globalization', 'international organizations'
      ]
    });

    return patterns;
  }

  async analyzeByDiscipline(options) {
    const { content, discipline, analysis_type = 'comprehensive', language } = options;

    // Check cache first
    const cacheKey = `analysis:${discipline}:${analysis_type}`;
    let cachedResult = await this.cacheManager.get('discipline-analysis', cacheKey);
    if (cachedResult) {
      console.error(`🎯 Using cached analysis for ${discipline}`);
      return cachedResult;
    }

    console.error(`🔬 Analyzing content for ${discipline} (${analysis_type} analysis)`);

    // Detect language if not provided
    const detectedLanguage = language || await this.languageDetector.detectLanguage(content);
    
    // Get discipline-specific patterns
    const patterns = this.disciplinePatterns.get(discipline);
    if (!patterns) {
      throw new Error(`Unsupported discipline: ${discipline}`);
    }

    // Perform analysis
    const result = {
      discipline,
      analysis_type,
      findings: {
        methodology: await this.analyzeMethodology(content, patterns),
        theoretical_framework: await this.analyzeTheoretical(content, patterns),
        empirical_findings: await this.analyzeEmpirical(content, patterns),
        quality_assessment: await this.assessQuality(content, patterns),
        discipline_specific: await this.performDisciplineSpecificAnalysis(content, discipline, patterns)
      },
      recommendations: await this.generateRecommendations(content, discipline, patterns),
      citations_found: this.extractCitations(content),
      keywords: this.extractKeywords(content, patterns),
      summary: await this.generateSummary(content, discipline)
    };

    // Cache the result
    await this.cacheManager.set('discipline-analysis', cacheKey, result, 3600);

    console.error(`✅ ${discipline} analysis complete`);
    return result;
  }

  async analyzeMethodology(content, patterns) {
    const methodology = {
      research_design: 'Not specified',
      data_collection: [],
      analysis_methods: [],
      validity_threats: [],
      ethical_considerations: []
    };

    const lowerContent = content.toLowerCase();

    // Identify research design
    for (const design of patterns.methodologies) {
      if (lowerContent.includes(design.toLowerCase())) {
        methodology.research_design = design;
        break;
      }
    }

    // Identify data collection methods
    const dataCollectionTerms = [
      'survey', 'interview', 'observation', 'questionnaire', 'focus group',
      'experiment', 'measurement', 'recording', 'sampling', 'data collection'
    ];
    
    for (const term of dataCollectionTerms) {
      if (lowerContent.includes(term)) {
        methodology.data_collection.push(term);
      }
    }

    // Identify analysis methods
    for (const method of patterns.analyses) {
      if (lowerContent.includes(method.toLowerCase())) {
        methodology.analysis_methods.push(method);
      }
    }

    // Extract sample size if mentioned
    const sampleMatch = content.match(/n\s*=\s*(\d+)|sample.*?(\d+)|participants.*?(\d+)/i);
    if (sampleMatch) {
      methodology.sample_size = parseInt(sampleMatch[1] || sampleMatch[2] || sampleMatch[3]);
    }

    // Identify validity threats
    const validityThreats = [
      'selection bias', 'confounding', 'measurement error', 'attrition',
      'history effects', 'maturation', 'testing effects', 'regression to mean'
    ];
    
    for (const threat of validityThreats) {
      if (lowerContent.includes(threat)) {
        methodology.validity_threats.push(threat);
      }
    }

    // Check for ethical considerations
    const ethicalTerms = [
      'informed consent', 'ethics approval', 'irb', 'ethics committee',
      'confidentiality', 'anonymity', 'deception', 'debriefing'
    ];
    
    for (const term of ethicalTerms) {
      if (lowerContent.includes(term)) {
        methodology.ethical_considerations.push(term);
      }
    }

    return methodology;
  }

  async analyzeTheoretical(content, patterns) {
    const theoretical = {
      main_theories: [],
      conceptual_framework: 'Not explicitly stated',
      hypotheses: [],
      variables: {
        independent: [],
        dependent: [],
        mediating: [],
        moderating: []
      }
    };

    const lowerContent = content.toLowerCase();

    // Identify theories
    for (const theory of patterns.theories) {
      if (lowerContent.includes(theory.toLowerCase())) {
        theoretical.main_theories.push(theory);
      }
    }

    // Extract hypotheses
    const hypothesesMatches = content.match(/h\d+[:\s].*?[\.;]/gi) || 
                             content.match(/hypothesis[:\s].*?[\.;]/gi) ||
                             content.match(/predicted.*?[\.;]/gi);
    
    if (hypothesesMatches) {
      theoretical.hypotheses = hypothesesMatches.map(h => h.trim());
    }

    // Identify conceptual framework
    if (lowerContent.includes('conceptual framework') || 
        lowerContent.includes('theoretical framework') ||
        lowerContent.includes('theoretical model')) {
      theoretical.conceptual_framework = 'Present (see full text for details)';
    }

    // Extract variables (simplified pattern matching)
    const variablePatterns = {
      independent: /independent variable[s]?[:\s]([^\.;]+)/gi,
      dependent: /dependent variable[s]?[:\s]([^\.;]+)/gi,
      mediating: /mediat[ing|or][^\.;]*variable[s]?[:\s]([^\.;]+)/gi,
      moderating: /moderat[ing|or][^\.;]*variable[s]?[:\s]([^\.;]+)/gi
    };

    for (const [type, pattern] of Object.entries(variablePatterns)) {
      const matches = content.match(pattern);
      if (matches) {
        theoretical.variables[type] = 
          matches.map(match => match.replace(pattern, '$1').trim());
      }
    }

    return theoretical;
  }

  async analyzeEmpirical(content, patterns) {
    const empirical = {
      findings: [],
      statistical_significance: false,
      effect_sizes: [],
      limitations: [],
      generalizability: 'Not discussed'
    };

    const lowerContent = content.toLowerCase();

    // Check for statistical significance
    empirical.statistical_significance = /p\s*[<>=]\s*\.?0*[0-5]/.test(content) ||
                                       lowerContent.includes('significant') ||
                                       lowerContent.includes('p-value');

    // Extract effect sizes
    const effectSizePatterns = [
      /cohen'?s\s+d\s*=\s*([\d\.]+)/gi,
      /eta\s*squared?\s*=\s*([\d\.]+)/gi,
      /r\s*=\s*([\d\.]+)/gi,
      /r²\s*=\s*([\d\.]+)/gi
    ];

    for (const pattern of effectSizePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        empirical.effect_sizes.push(...matches);
      }
    }

    // Extract main findings
    const findingsPatterns = [
      /results? show[s]?[^\.]*[\.]/gi,
      /findings? indicate[s]?[^\.]*[\.]/gi,
      /analysis revealed[^\.]*[\.]/gi,
      /we found[^\.]*[\.]/gi
    ];

    for (const pattern of findingsPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        empirical.findings.push(...matches.map(f => f.trim()));
      }
    }

    // Extract limitations
    const limitationSection = content.match(/limitations?[^\.]*[\.\n]([^]*?)(?:conclusion|future|reference)/i);
    if (limitationSection) {
      const limitations = limitationSection[1].split(/[\.;]/).filter(l => l.trim().length > 20);
      empirical.limitations = limitations.map(l => l.trim());
    }

    // Check generalizability discussion
    if (lowerContent.includes('generalizab') || 
        lowerContent.includes('external validity') ||
        lowerContent.includes('broader population')) {
      empirical.generalizability = 'Discussed (see full text)';
    }

    return empirical;
  }

  async assessQuality(content, patterns) {
    let methodologicalRigor = 5; // Base score
    let theoreticalContribution = 5;
    let empiricalValidity = 5;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const lowerContent = content.toLowerCase();

    // Assess methodological rigor
    if (lowerContent.includes('randomized')) methodologicalRigor += 2;
    if (lowerContent.includes('control group')) methodologicalRigor += 1;
    if (lowerContent.includes('blind')) methodologicalRigor += 1;
    if (lowerContent.includes('power analysis')) methodologicalRigor += 1;
    if (lowerContent.includes('effect size')) methodologicalRigor += 1;

    // Assess theoretical contribution
    if (patterns.theories.some((t) => lowerContent.includes(t.toLowerCase()))) {
      theoreticalContribution += 1;
    }
    if (lowerContent.includes('novel') || lowerContent.includes('innovative')) {
      theoreticalContribution += 1;
    }

    // Assess empirical validity
    if (/p\s*[<>=]\s*\.?0*[0-5]/.test(content)) empiricalValidity += 1;
    if (lowerContent.includes('replication')) empiricalValidity += 1;
    if (lowerContent.includes('cross-validation')) empiricalValidity += 1;

    // Identify strengths and weaknesses
    if (methodologicalRigor >= 7) strengths.push('Strong methodological design');
    if (theoreticalContribution >= 7) strengths.push('Clear theoretical framework');
    if (empiricalValidity >= 7) strengths.push('Robust empirical findings');

    if (methodologicalRigor <= 4) weaknesses.push('Methodological limitations');
    if (theoreticalContribution <= 4) weaknesses.push('Limited theoretical contribution');
    if (empiricalValidity <= 4) weaknesses.push('Weak empirical support');

    const overallScore = Math.round((methodologicalRigor + theoreticalContribution + empiricalValidity) / 3);

    return {
      methodological_rigor: Math.min(methodologicalRigor, 10),
      theoretical_contribution: Math.min(theoreticalContribution, 10),
      empirical_validity: Math.min(empiricalValidity, 10),
      overall_score: overallScore,
      strengths,
      weaknesses
    };
  }

  async performDisciplineSpecificAnalysis(content, discipline, patterns) {
    const lowerContent = content.toLowerCase();

    switch (discipline) {
      case 'psychology':
        return {
          psychological_measures: patterns.measures.filter((m) => 
            lowerContent.includes(m.toLowerCase())
          ),
          participant_characteristics: this.extractParticipantInfo(content),
          intervention_details: this.extractInterventionInfo(content),
          behavioral_outcomes: this.extractBehavioralOutcomes(content)
        };

      case 'neuroscience':
        return {
          brain_regions: this.extractBrainRegions(content),
          neuroimaging_methods: patterns.methodologies.filter((m) => 
            lowerContent.includes(m.toLowerCase())
          ),
          neural_measures: this.extractNeuralMeasures(content),
          connectivity_analysis: lowerContent.includes('connectivity') || 
                                lowerContent.includes('network')
        };

      case 'education':
        return {
          educational_level: this.extractEducationalLevel(content),
          learning_outcomes: this.extractLearningOutcomes(content),
          pedagogical_approach: this.extractPedagogicalApproach(content),
          assessment_methods: this.extractAssessmentMethods(content)
        };

      case 'sociology':
        return {
          social_groups_studied: this.extractSocialGroups(content),
          social_phenomena: this.extractSocialPhenomena(content),
          demographic_factors: this.extractDemographicFactors(content),
          social_theory_application: patterns.theories.filter((t) => 
            lowerContent.includes(t.toLowerCase())
          )
        };

      case 'anthropology':
        return {
          cultural_context: this.extractCulturalContext(content),
          fieldwork_location: this.extractFieldworkLocation(content),
          ethnographic_methods: this.extractEthnographicMethods(content),
          cultural_practices: this.extractCulturalPractices(content)
        };

      case 'philosophy':
        return {
          philosophical_arguments: this.extractArguments(content),
          logical_structure: this.analyzeLogicalStructure(content),
          philosophical_tradition: this.identifyPhilosophicalTradition(content),
          conceptual_analysis: this.extractConceptualAnalysis(content)
        };

      case 'political-science':
        return {
          political_institutions: this.extractPoliticalInstitutions(content),
          policy_areas: this.extractPolicyAreas(content),
          political_actors: this.extractPoliticalActors(content),
          governance_mechanisms: this.extractGovernanceMechanisms(content)
        };

      case 'international-relations':
        return {
          countries_studied: this.extractCountries(content),
          international_issues: this.extractInternationalIssues(content),
          diplomatic_relations: this.extractDiplomaticRelations(content),
          security_concerns: this.extractSecurityConcerns(content)
        };

      default:
        return {};
    }
  }

  // Helper methods for discipline-specific analysis
  extractParticipantInfo(content) {
    const ageMatch = content.match(/age[s]?[:\s]*(\d+(?:\.\d+)?)/i);
    const genderMatch = content.match(/(male|female)[s]?[:\s]*(\d+)/gi);
    const nMatch = content.match(/n\s*=\s*(\d+)/i);

    return {
      sample_size: nMatch ? parseInt(nMatch[1]) : null,
      age_info: ageMatch ? ageMatch[1] : null,
      gender_distribution: genderMatch || []
    };
  }

  extractBrainRegions(content) {
    const brainRegions = [
      'prefrontal cortex', 'hippocampus', 'amygdala', 'cerebellum', 'thalamus',
      'striatum', 'insula', 'anterior cingulate', 'posterior cingulate',
      'temporal lobe', 'parietal lobe', 'frontal lobe', 'occipital lobe'
    ];

    return brainRegions.filter(region => 
      content.toLowerCase().includes(region.toLowerCase())
    );
  }

  extractCitations(content) {
    const citationPatterns = [
      /\([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+\d{4}\)/g,
      /\[\d+(?:-\d+)?\]/g,
      /[A-Z][a-z]+\s+\(\d{4}\)/g
    ];

    const citations: string[] = [];
    for (const pattern of citationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        citations.push(...matches);
      }
    }

    return [...new Set(citations)];
  }

  extractKeywords(content, patterns) {
    const keywords: string[] = [];
    const lowerContent = content.toLowerCase();

    // Add discipline-specific keywords found in content
    for (const keyword of patterns.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }

  // Additional helper methods (simplified implementations)
  extractInterventionInfo(content) { return {}; }
  extractBehavioralOutcomes(content) { return []; }
  extractNeuralMeasures(content) { return []; }
  extractEducationalLevel(content) { return 'Not specified'; }
  extractLearningOutcomes(content) { return []; }
  extractPedagogicalApproach(content) { return 'Not specified'; }
  extractAssessmentMethods(content) { return []; }
  extractSocialGroups(content) { return []; }
  extractSocialPhenomena(content) { return []; }
  extractDemographicFactors(content) { return []; }
  extractCulturalContext(content) { return 'Not specified'; }
  extractFieldworkLocation(content) { return 'Not specified'; }
  extractEthnographicMethods(content) { return []; }
  extractCulturalPractices(content) { return []; }
  extractArguments(content) { return []; }
  analyzeLogicalStructure(content) { return {}; }
  identifyPhilosophicalTradition(content) { return 'Not identified'; }
  extractConceptualAnalysis(content) { return []; }
  extractPoliticalInstitutions(content) { return []; }
  extractPolicyAreas(content) { return []; }
  extractPoliticalActors(content) { return []; }
  extractGovernanceMechanisms(content) { return []; }
  extractCountries(content) { return []; }
  extractInternationalIssues(content) { return []; }
  extractDiplomaticRelations(content) { return []; }
  extractSecurityConcerns(content) { return []; }

  async generateRecommendations(content, discipline, patterns) {
    const recommendations: string[] = [];
    const lowerContent = content.toLowerCase();

    // General recommendations based on missing elements
    if (!patterns.theories.some((t) => lowerContent.includes(t.toLowerCase()))) {
      recommendations.push(`Consider incorporating established ${discipline} theories to strengthen theoretical foundation`);
    }

    if (!lowerContent.includes('limitation')) {
      recommendations.push('Explicitly discuss study limitations and their implications');
    }

    if (!lowerContent.includes('future research')) {
      recommendations.push('Include suggestions for future research directions');
    }

    if (!patterns.analyses.some((a) => lowerContent.includes(a.toLowerCase()))) {
      recommendations.push(`Consider using more sophisticated ${discipline}-specific analytical methods`);
    }

    return recommendations;
  }

  async generateSummary(content, discipline) {
    // Simplified summary generation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
    const keySentences = sentences.slice(0, 3).map(s => s.trim()).join('. ');
    
    return `${discipline} study summary: ${keySentences}${keySentences.endsWith('.') ? '' : '.'}`;
  }
}

// Export function for MCP server
async function analyzeByDiscipline(args) {
  const cacheManager = new CacheManager();
  const analyzer = new DisciplineAnalyzer(cacheManager);
  
  try {
    const result = await analyzer.analyzeByDiscipline(args);
    
    return {
      content: [{
        type: 'text',
        text: `🔬 **${result.discipline.toUpperCase()} ANALYSIS COMPLETE**\n\n` +
              `📊 **Quality Assessment:**\n` +
              `• Overall Score: ${result.findings.quality_assessment.overall_score}/10\n` +
              `• Methodological Rigor: ${result.findings.quality_assessment.methodological_rigor}/10\n` +
              `• Theoretical Contribution: ${result.findings.quality_assessment.theoretical_contribution}/10\n` +
              `• Empirical Validity: ${result.findings.quality_assessment.empirical_validity}/10\n\n` +
              `🔍 **Methodology:**\n` +
              `• Research Design: ${result.findings.methodology.research_design}\n` +
              `• Analysis Methods: ${result.findings.methodology.analysis_methods.join(', ') || 'Not specified'}\n` +
              `• Sample Size: ${result.findings.methodology.sample_size || 'Not specified'}\n\n` +
              `📚 **Theoretical Framework:**\n` +
              `• Main Theories: ${result.findings.theoretical_framework.main_theories.join(', ') || 'Not specified'}\n` +
              `• Hypotheses Found: ${result.findings.theoretical_framework.hypotheses.length}\n\n` +
              `📈 **Empirical Findings:**\n` +
              `• Statistical Significance: ${result.findings.empirical_findings.statistical_significance ? 'Yes' : 'No'}\n` +
              `• Effect Sizes: ${result.findings.empirical_findings.effect_sizes.length} reported\n` +
              `• Key Findings: ${result.findings.empirical_findings.findings.length} identified\n\n` +
              `💡 **Strengths:**\n${result.findings.quality_assessment.strengths.map(s => `• ${s}`).join('\n')}\n\n` +
              `⚠️ **Areas for Improvement:**\n${result.findings.quality_assessment.weaknesses.map(w => `• ${w}`).join('\n')}\n\n` +
              `🎯 **Recommendations:**\n${result.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
              `📝 **Keywords:** ${result.keywords.join(', ')}\n\n` +
              `📄 **Summary:** ${result.summary}`
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Analysis Failed**\n\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
              `**Supported disciplines:**\n` +
              `• Psychology\n• Neuroscience\n• Education\n• Sociology\n• Anthropology\n• Philosophy\n• Political Science\n• International Relations`
      }]
    };
  }
}

module.exports = {
  DisciplineAnalyzer,
  analyzeByDiscipline
};