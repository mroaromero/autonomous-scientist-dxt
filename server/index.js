#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension v6.0
 * MCP Server for Research Automation in Social Sciences and Humanities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool
} = require('@modelcontextprotocol/sdk/types.js');

const path = require('path');
const fs = require('fs');

// Import tool implementations
const { setupResearchAPIs } = require('./tools/api-setup.js');
const { processPDF } = require('./tools/pdf-processor.js');
const { searchLiterature } = require('./tools/literature-search.js');
const { analyzeByDiscipline } = require('./tools/discipline-analyzer.js');
const { generateLaTeX } = require('./tools/latex-generator.js');
const { accessSemanticScholarDatasets, downloadDatasetSample } = require('./tools/semantic-scholar-datasets.js');
const { searchArXivAdvanced, getArXivStatistics } = require('./tools/arxiv-enhanced.js');
const { accessCrossRefDataFile, downloadCrossRefSample, getCrossRefDataInfo } = require('./tools/crossref-labs-data.js');

// New API integrations
const { searchOpenAlexWorks, getOpenAlexWork, searchOpenAlexAuthors, getOpenAlexStats } = require('./tools/openalex-api.js');
const { searchOSFProjects, getOSFProject, searchOSFPreprints, getOSFUserInfo, getOSFStats } = require('./tools/osf-api.js');
const { searchSciELOArticles, getSciELOJournals, getSciELOArticle, getSciELOStats, shortenSciELOURL } = require('./tools/scielo-api.js');

// News and Evidence APIs
const { NewsAPIResearchEngine } = require('./data-sources/newsapi-research.js');
const { ConsensusAPIEngine } = require('./data-sources/consensus-api.js');

const { MemoryManager } = require('./utils/memory-manager.js');
const { ErrorHandler } = require('./utils/error-handler.js');
const { CacheManager } = require('./utils/cache-manager.js');

// Import Cognitive Architecture Components
const { AutonomousScientistCognitiveCore } = require('./cognitive-core/operational-flow.js');
const { CognitiveSkillsEngine } = require('./cognitive-abilities/cognitive-skills-engine.js');
const { AcademicDocumentStructure } = require('./document-structure/academic-structure.js');
const { IntegratedCitationSystem } = require('./citation-engine/integrated-citation-system.js');
const { AcademicIntegrityValidator } = require('./integrity-engine/academic-integrity-validator.js');

class AutonomousScientistServer {
  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-scientist',
        version: '6.2.0'
      },
      {
        capabilities: {
          tools: {},
          prompts: {}
        }
      }
    );
    
    // Initialize configuration from user settings
    this.config = this.loadUserConfiguration();
    
    // Initialize components with user configuration
    this.memoryManager = new MemoryManager({
      maxUsage: (this.config.cache_size_gb || 5) * 1024 * 1024 * 1024,
      maxConcurrent: this.config.max_concurrent_pdfs || 2
    });
    
    this.errorHandler = new ErrorHandler();
    this.cacheManager = new CacheManager();
    
    // Initialize Cognitive Architecture
    this.cognitiveCore = new AutonomousScientistCognitiveCore(this.config, this.cacheManager);
    this.cognitiveEngine = new CognitiveSkillsEngine(this.config, this.cacheManager);
    this.documentStructure = new AcademicDocumentStructure(this.config, this.cacheManager);
    this.citationSystem = new IntegratedCitationSystem(this.config, this.cacheManager);
    this.integrityValidator = new AcademicIntegrityValidator(this.config, this.cacheManager);
    
    // Initialize New API Engines
    this.newsAPI = new NewsAPIResearchEngine(this.config.newsapi_key);
    this.consensusAPI = new ConsensusAPIEngine();
    
    this.setupToolHandlers();
    this.setupPromptHandlers();
    
    console.error('🔬 Autonomous Scientist v6.2 initialized with Cognitive Architecture');
    console.error(`🧠 Cognitive Core: 5-step flow, 12 abilities, 9 sections, 28 subsections`);
    console.error(`📊 Configuration: ${this.config.primary_discipline}, ${this.config.default_citation_style} citations`);
    console.error(`🔗 New APIs: NewsAPI (academic news), Consensus (evidence-based research)`);
    console.error(`🛠️  Total Tools: 65+ MCP tools organized in 5 modules`);
  }

  loadUserConfiguration() {
    // Load configuration from DXT environment
    const config = {
      primary_discipline: process.env.USER_CONFIG_PRIMARY_DISCIPLINE || 'psychology',
      default_citation_style: process.env.USER_CONFIG_DEFAULT_CITATION_STYLE || 'apa',
      cache_size_gb: parseInt(process.env.USER_CONFIG_CACHE_SIZE_GB || '5'),
      max_concurrent_pdfs: parseInt(process.env.USER_CONFIG_MAX_CONCURRENT_PDFS || '2'),
      ocr_languages: (process.env.USER_CONFIG_OCR_LANGUAGES || 'en,es,de,fr,it,pt,la').split(','),
      workspace_directory: process.env.USER_CONFIG_WORKSPACE_DIRECTORY || path.join(require('os').homedir(), 'Documents', 'Research'),
      enable_advanced_features: process.env.USER_CONFIG_ENABLE_ADVANCED_FEATURES === 'true',
      
      // API keys (handled securely by DXT)
      semantic_scholar_api_key: process.env.USER_CONFIG_SEMANTIC_SCHOLAR_API_KEY,
      crossref_api_key: process.env.USER_CONFIG_CROSSREF_API_KEY,
      osf_api_token: process.env.USER_CONFIG_OSF_API_TOKEN,
      newsapi_key: process.env.USER_CONFIG_NEWSAPI_KEY || 'efeb07d71d924059983a02797a18a62e'
    };
    
    // Ensure workspace directory exists
    try {
      fs.mkdirSync(config.workspace_directory, { recursive: true });
    } catch (error) {
      console.error('Warning: Could not create workspace directory:', error.message);
    }
    
    return config;
  }

  setupToolHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions()
      };
    });

    // Handle tool calls with proper error handling and timeouts
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Set timeout for all tool operations (10 minutes)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool execution timeout')), 10 * 60 * 1000)
      );
      
      try {
        const resultPromise = this.executeToolSafely(name, args);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        return result;
      } catch (error) {
        return this.errorHandler.handleToolError(error, name, args);
      }
    });
  }

  async executeToolSafely(name, args) {
    // Add user configuration to args
    const enrichedArgs = { 
      ...args, 
      _config: this.config,
      _workspace: this.config.workspace_directory
    };

    switch (name) {
      // Configuration and Setup Tools
      case 'setup_research_apis':
        return await setupResearchAPIs(enrichedArgs);
      case 'validate_api_key':
        return await this.validateAPIKey(enrichedArgs);
      case 'configure_discipline':
        return await this.configureDiscipline(enrichedArgs);
      
      // PDF Processing and OCR Tools  
      case 'process_academic_pdf':
        return await processPDF(enrichedArgs, this.memoryManager);
      case 'batch_process_pdfs':
        return await this.batchProcessPDFs(enrichedArgs);
      case 'ocr_multilingual':
        return await this.performOCR(enrichedArgs);
      
      // Literature Search and Analysis
      case 'comprehensive_literature_search':
        return await searchLiterature(enrichedArgs);
      case 'analyze_by_discipline':
        return await analyzeByDiscipline(enrichedArgs);
      case 'identify_research_gaps':
        return await this.identifyResearchGaps(enrichedArgs);
      
      // Semantic Scholar Datasets
      case 'access_semantic_scholar_datasets':
        return await accessSemanticScholarDatasets(enrichedArgs);
      case 'download_dataset_sample':
        return await downloadDatasetSample(enrichedArgs);
      case 'get_paper_recommendations':
        return await this.getPaperRecommendations(enrichedArgs);
      
      // ArXiv Enhanced
      case 'search_arxiv_advanced':
        return await searchArXivAdvanced(enrichedArgs);
      case 'get_arxiv_statistics':
        return await getArXivStatistics(enrichedArgs);
      
      // CrossRef Labs Data
      case 'access_crossref_data_file':
        return await accessCrossRefDataFile(enrichedArgs);
      case 'download_crossref_sample':
        return await downloadCrossRefSample(enrichedArgs);
      case 'get_crossref_data_info':
        return await getCrossRefDataInfo(enrichedArgs);
      
      // LaTeX Generation
      case 'generate_latex_paper':
        return await generateLaTeX(enrichedArgs);
      case 'format_citations':
        return await this.formatCitations(enrichedArgs);
      case 'compile_to_pdf':
        return await this.compileToPDF(enrichedArgs);
      
      // Discipline-specific Analysis (all 8 disciplines)
      case 'analyze_psychology_research':
        return await this.analyzePsychologyResearch(enrichedArgs);
      case 'analyze_neuroscience_paper':
        return await this.analyzeNeurosciencePaper(enrichedArgs);
      case 'analyze_education_study':
        return await this.analyzeEducationStudy(enrichedArgs);
      case 'analyze_sociology_research':
        return await this.analyzeSociologyResearch(enrichedArgs);
      case 'analyze_anthropology_work':
        return await this.analyzeAnthropologyWork(enrichedArgs);
      case 'analyze_philosophy_argument':
        return await this.analyzePhilosophyArgument(enrichedArgs);
      case 'analyze_political_science':
        return await this.analyzePoliticalScience(enrichedArgs);
      case 'analyze_international_relations':
        return await this.analyzeInternationalRelations(enrichedArgs);
      
      // OpenAlex API Tools
      case 'search_openalex_works':
        return await searchOpenAlexWorks(enrichedArgs);
      case 'get_openalex_work':
        return await getOpenAlexWork(enrichedArgs);
      case 'search_openalex_authors':
        return await searchOpenAlexAuthors(enrichedArgs);
      case 'get_openalex_stats':
        return await getOpenAlexStats(enrichedArgs);
      
      // OSF API Tools
      case 'search_osf_projects':
        return await searchOSFProjects(enrichedArgs);
      case 'get_osf_project':
        return await getOSFProject(enrichedArgs);
      case 'search_osf_preprints':
        return await searchOSFPreprints(enrichedArgs);
      case 'get_osf_user_info':
        return await getOSFUserInfo(enrichedArgs);
      case 'get_osf_stats':
        return await getOSFStats(enrichedArgs);
      
      // SciELO API Tools
      case 'search_scielo_articles':
        return await searchSciELOArticles(enrichedArgs);
      case 'get_scielo_journals':
        return await getSciELOJournals(enrichedArgs);
      case 'get_scielo_article':
        return await getSciELOArticle(enrichedArgs);
      case 'get_scielo_stats':
        return await getSciELOStats(enrichedArgs);
      case 'shorten_scielo_url':
        return await shortenSciELOURL(enrichedArgs);
      
      // NewsAPI Research Tools
      case 'search_academic_news':
        return await this.newsAPI.searchAcademicNews(enrichedArgs);
      case 'get_academic_headlines':
        return await this.newsAPI.getAcademicHeadlines(enrichedArgs);
      case 'search_news_by_paradigm':
        return await this.newsAPI.searchByResearchParadigm(enrichedArgs);
      case 'get_trending_academic_topics':
        return await this.newsAPI.getTrendingAcademicTopics(enrichedArgs);
      case 'validate_newsapi_connection':
        return await this.newsAPI.validateConnection();
      
      // Consensus API Evidence Tools
      case 'search_scientific_consensus':
        return await this.consensusAPI.searchScientificConsensus(enrichedArgs);
      case 'analyze_research_consensus':
        return await this.consensusAPI.analyzeResearchConsensus(enrichedArgs);
      case 'identify_research_gaps_consensus':
        return await this.consensusAPI.identifyResearchGaps(enrichedArgs);
      case 'get_methodology_recommendations':
        return await this.consensusAPI.getMethodologyRecommendations(enrichedArgs);
      case 'validate_consensus_connection':
        return await this.consensusAPI.validateConnection();
      
      // ===== COGNITIVE ARCHITECTURE TOOLS =====
      // Operational Flow Tools
      case 'initial_project_assessment':
        return await this.cognitiveCore.initialAssessment(enrichedArgs);
      case 'epistemological_inquiry':
        return await this.cognitiveCore.epistemologicalInquiry.execute(enrichedArgs);
      case 'problem_formulation_engine':
        return await this.cognitiveCore.problemFormulation(enrichedArgs);
      case 'methodological_evaluator':
        return await this.cognitiveCore.methodologicalEvaluation(enrichedArgs);
      case 'action_plan_generator':
        return await this.cognitiveCore.actionPlanPresentation(enrichedArgs);
      
      // Cognitive Skills Tools
      case 'cognitive_synthesizer':
        return await this.cognitiveEngine.executeSkill('Sintetizar', enrichedArgs.content, enrichedArgs.context);
      case 'cognitive_argumentator':
        return await this.cognitiveEngine.executeSkill('Argumentar', enrichedArgs.content, enrichedArgs.context);
      case 'cognitive_analyzer':
        return await this.cognitiveEngine.executeSkill('Analizar', enrichedArgs.content, enrichedArgs.context);
      case 'cognitive_informer':
        return await this.cognitiveEngine.executeSkill('Informar', enrichedArgs.content, enrichedArgs.context);
      case 'cognitive_organizer':
        return await this.cognitiveEngine.executeSkill('Ordenar', enrichedArgs.content, enrichedArgs.context);
      
      // Document Structure Tools
      case 'generate_document_section':
        return await this.documentStructure.generateSection(enrichedArgs.sectionNumber, enrichedArgs.content, enrichedArgs.context);
      case 'generate_complete_academic_document':
        return await this.documentStructure.generateCompleteDocument(enrichedArgs.content, enrichedArgs.context);
      case 'validate_document_structure':
        return await this.documentStructure.validateCompleteDocument(enrichedArgs.document);
      
      // Citation and Integrity Tools
      case 'intelligent_citation_processor':
        return await this.citationSystem.processDocumentSection(enrichedArgs.section, enrichedArgs.cognitiveSkills, enrichedArgs.requirements, enrichedArgs.sources);
      case 'validate_academic_integrity':
        return await this.integrityValidator.validateSection(enrichedArgs.section, enrichedArgs.content, enrichedArgs.citations, enrichedArgs.cognitiveSkills, enrichedArgs.requirements);
      case 'detect_citation_fabrication':
        return await this.integrityValidator.detectFabrication(enrichedArgs.citations, enrichedArgs.content);
      
      // Cognitive Assessment Tools
      case 'assess_cognitive_alignment':
        return await this.cognitiveEngine.validateCognitiveAlignment(enrichedArgs.section, enrichedArgs.content, enrichedArgs.requiredSkills);
      case 'generate_cognitive_report':
        return await this.cognitiveEngine.generateSkillsReport(enrichedArgs.executionResults);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  setupPromptHandlers() {
    // Handle predefined workflow prompts using proper MCP SDK schemas
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'literature_review_workflow',
            description: 'Complete workflow for conducting a literature review',
            arguments: [
              { name: 'topic', description: 'Research topic or question', required: true },
              { name: 'discipline', description: 'Academic discipline', required: false }
            ]
          },
          {
            name: 'document_analysis_workflow', 
            description: 'Comprehensive analysis of academic documents',
            arguments: [
              { name: 'file_path', description: 'Path to PDF document', required: true }
            ]
          }
        ]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.executeWorkflow(name, args);
    });
  }

  async executeWorkflow(workflowName, args) {
    switch (workflowName) {
      case 'literature_review_workflow':
        return await this.executeLiteratureReviewWorkflow(args);
      case 'document_analysis_workflow':
        return await this.executeDocumentAnalysisWorkflow(args);
      default:
        throw new Error(`Unknown workflow: ${workflowName}`);
    }
  }

  async executeLiteratureReviewWorkflow(args) {
    const { topic, discipline = this.config.primary_discipline } = args;
    
    return {
      description: `Complete literature review workflow for: ${topic}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need to conduct a comprehensive literature review on "${topic}" in the field of ${discipline}. Please:

1. Search for relevant academic papers using comprehensive_literature_search
2. Process any PDFs I provide with process_academic_pdf  
3. Analyze the literature using analyze_by_discipline
4. Identify research gaps with identify_research_gaps
5. Generate a complete literature review paper with generate_latex_paper

Let's start with the literature search. Use these parameters:
- Query: "${topic}"
- Discipline: "${discipline}"
- Max results: 50

Please execute comprehensive_literature_search now.`
          }
        }
      ]
    };
  }

  async executeDocumentAnalysisWorkflow(args) {
    const { file_path } = args;
    
    return {
      description: `Comprehensive analysis workflow for: ${path.basename(file_path)}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text', 
            text: `I need to analyze this academic document: ${file_path}

Please execute this workflow:
1. Process the PDF with OCR and content extraction using process_academic_pdf
2. Analyze the content using analyze_by_discipline for ${this.config.primary_discipline}
3. Extract and format citations using format_citations
4. Provide recommendations for further research

Let's start by processing the PDF. Please execute process_academic_pdf with:
- File path: "${file_path}"
- Language: auto-detect
- Extract metadata: true
- Quality enhancement: true`
          }
        }
      ]
    };
  }

  getToolDefinitions() {
    return [
      // Configuration Tools
      {
        name: 'setup_research_apis',
        description: 'Interactive setup wizard for research APIs (Semantic Scholar, ArXiv, CrossRef)',
        inputSchema: {
          type: 'object',
          properties: {
            interactive: { type: 'boolean', default: true }
          }
        }
      },
      {
        name: 'validate_api_key',
        description: 'Validate API key functionality in real-time',
        inputSchema: {
          type: 'object',
          properties: {
            service: { type: 'string', enum: ['semantic_scholar', 'crossref'] },
            key: { type: 'string' }
          },
          required: ['service', 'key']
        }
      },
      
      // PDF Processing Tools
      {
        name: 'process_academic_pdf',
        description: 'Complete PDF processing with OCR, metadata extraction, and content analysis',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string' },
            language: { type: 'string', default: 'auto' },
            quality_enhancement: { type: 'boolean', default: true },
            extract_metadata: { type: 'boolean', default: true }
          },
          required: ['file_path']
        }
      },
      {
        name: 'batch_process_pdfs',
        description: 'Process multiple PDFs in batch with memory optimization',
        inputSchema: {
          type: 'object',
          properties: {
            directory_path: { type: 'string' },
            max_concurrent: { type: 'number', default: 2 },
            output_format: { type: 'string', enum: ['json', 'csv', 'latex'], default: 'json' }
          },
          required: ['directory_path']
        }
      },
      {
        name: 'ocr_multilingual',
        description: 'Multi-language OCR with academic terminology enhancement',
        inputSchema: {
          type: 'object',
          properties: {
            image_path: { type: 'string' },
            languages: { type: 'array', items: { type: 'string' } },
            discipline: { type: 'string' },
            quality_mode: { type: 'string', enum: ['fast', 'balanced', 'accurate'], default: 'balanced' }
          },
          required: ['image_path']
        }
      },
      
      // Literature Search Tools
      {
        name: 'comprehensive_literature_search',
        description: 'Multi-source academic search (Semantic Scholar + ArXiv + CrossRef)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            discipline: { type: 'string' },
            date_range: { 
              type: 'object',
              properties: {
                start_year: { type: 'number' },
                end_year: { type: 'number' }
              }
            },
            max_results: { type: 'number', default: 50 }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_by_discipline',
        description: 'Discipline-specific analysis of academic content',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            discipline: { type: 'string' },
            analysis_type: { type: 'string', enum: ['methodology', 'theoretical', 'empirical', 'comprehensive'], default: 'comprehensive' }
          },
          required: ['content', 'discipline']
        }
      },
      
      // LaTeX Generation Tools
      {
        name: 'generate_latex_paper',
        description: 'Generate complete LaTeX paper with discipline-specific formatting',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            discipline: { type: 'string' },
            citation_style: { type: 'string' },
            paper_type: { type: 'string', enum: ['journal', 'conference', 'thesis', 'chapter'], default: 'journal' },
            content_sections: { type: 'array', items: { type: 'object' } },
            bibliography: { type: 'array', items: { type: 'object' } }
          },
          required: ['title', 'discipline']
        }
      },
      
      // Discipline-specific Analysis Tools (8 disciplines)
      {
        name: 'analyze_psychology_research',
        description: 'Psychology-specific research analysis (APA 7th, experimental design, psychometrics)',
        inputSchema: {
          type: 'object',
          properties: {
            paper_content: { type: 'string' },
            analysis_focus: { type: 'array', items: { type: 'string' }, default: ['methodology', 'statistics', 'ethics', 'replication'] }
          },
          required: ['paper_content']
        }
      },
      {
        name: 'analyze_neuroscience_paper',
        description: 'Neuroscience-specific analysis (neuroimaging, connectivity, paradigms)',
        inputSchema: {
          type: 'object',
          properties: {
            paper_content: { type: 'string' },
            methodology_type: { type: 'string', enum: ['fmri', 'eeg', 'pet', 'behavioral', 'computational', 'other'] },
            brain_regions: { type: 'array', items: { type: 'string' } }
          },
          required: ['paper_content']
        }
      },
      
      // Semantic Scholar Datasets Tools
      {
        name: 'access_semantic_scholar_datasets',
        description: 'Access Semantic Scholar academic datasets (papers, authors, citations, embeddings)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term to filter datasets' },
            dataset_type: { 
              type: 'string', 
              enum: ['papers', 'authors', 'citations', 'embeddings', 'all'], 
              default: 'all' 
            },
            limit: { type: 'number', default: 10, maximum: 50 },
            format: { type: 'string', enum: ['json', 'parquet', 'csv'], default: 'json' }
          }
        }
      },
      {
        name: 'download_dataset_sample',
        description: 'Download a sample from Semantic Scholar datasets for testing and analysis',
        inputSchema: {
          type: 'object',
          properties: {
            dataset_name: { 
              type: 'string',
              enum: ['semantic-scholar-papers', 'semantic-scholar-authors', 'semantic-scholar-citations', 'semantic-scholar-embeddings', 'semantic-scholar-tldr']
            },
            sample_size: { type: 'number', default: 1000, maximum: 10000 }
          },
          required: ['dataset_name']
        }
      },
      {
        name: 'get_paper_recommendations',
        description: 'Get paper recommendations based on a given paper or research interests',
        inputSchema: {
          type: 'object',
          properties: {
            paper_id: { type: 'string', description: 'Semantic Scholar paper ID for recommendations' },
            research_interests: { type: 'string', description: 'Research topics for general recommendations' },
            limit: { type: 'number', default: 10, maximum: 100 }
          }
        }
      },
      {
        name: 'advanced_crossref_search',
        description: 'Advanced CrossRef search with filters, facets, and detailed metadata',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            filters: {
              type: 'object',
              properties: {
                publication_type: { type: 'string', enum: ['journal-article', 'book-chapter', 'book', 'proceedings-article'] },
                publisher: { type: 'string' },
                subject: { type: 'string' },
                license: { type: 'string' },
                funder: { type: 'string' }
              }
            },
            facets: { type: 'array', items: { type: 'string' }, description: 'Facets to include in results' },
            sort: { type: 'string', enum: ['relevance', 'score', 'updated', 'deposited', 'indexed', 'published'], default: 'relevance' },
            max_results: { type: 'number', default: 50, maximum: 200 }
          },
          required: ['query']
        }
      },
      
      // ArXiv Enhanced Tools
      {
        name: 'search_arxiv_advanced',
        description: 'Advanced ArXiv search with full metadata, categories, and XML parsing',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Main search query' },
            category: { type: 'string', description: 'ArXiv category (e.g., cs.LG, math.CO, physics.gen-ph)' },
            author: { type: 'string', description: 'Author name' },
            title: { type: 'string', description: 'Title search' },
            abstract: { type: 'string', description: 'Abstract search' },
            date_range: {
              type: 'object',
              properties: {
                start_year: { type: 'number' },
                end_year: { type: 'number' },
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' }
              }
            },
            max_results: { type: 'number', default: 50, maximum: 200 },
            sort_by: { type: 'string', enum: ['relevance', 'lastUpdatedDate', 'submittedDate'], default: 'relevance' },
            sort_order: { type: 'string', enum: ['ascending', 'descending'], default: 'descending' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_arxiv_statistics',
        description: 'Get ArXiv submission statistics and trends by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Specific ArXiv category for focused statistics' }
          }
        }
      },
      
      // CrossRef Labs Data Tools
      {
        name: 'access_crossref_data_file',
        description: 'Access CrossRef annual data files with comprehensive publication metadata',
        inputSchema: {
          type: 'object',
          properties: {
            year: { type: 'number', minimum: 2015, maximum: 2024, default: 2023 },
            data_type: { type: 'string', enum: ['works', 'journals', 'publishers', 'funders', 'all'], default: 'works' },
            format: { type: 'string', enum: ['json', 'csv', 'parquet'], default: 'json' },
            sample_size: { type: 'number', default: 1000, maximum: 5000 },
            filters: {
              type: 'object',
              properties: {
                publisher: { type: 'string' },
                funder: { type: 'string' },
                type: { type: 'string' },
                has_doi: { type: 'boolean' },
                has_full_text: { type: 'boolean' },
                has_orcid: { type: 'boolean' }
              }
            }
          }
        }
      },
      {
        name: 'download_crossref_sample',
        description: 'Download CrossRef data file sample for local analysis',
        inputSchema: {
          type: 'object',
          properties: {
            year: { type: 'number', minimum: 2015, maximum: 2024 },
            data_type: { type: 'string', enum: ['works', 'journals', 'publishers', 'funders'] }
          },
          required: ['year', 'data_type']
        }
      },
      {
        name: 'get_crossref_data_info',
        description: 'Get information about available CrossRef data files and formats',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      
      // OpenAlex API Tools (250M+ scholarly works)
      {
        name: 'search_openalex_works',
        description: 'Search 250M+ scholarly works in OpenAlex with advanced filtering',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_results: { type: 'number', default: 20 },
            sort: { type: 'string', default: 'relevance_score:desc' },
            filters: { 
              type: 'object',
              properties: {
                publication_year: { type: 'string' },
                open_access: { type: 'boolean' },
                type: { type: 'string' }
              }
            },
            fields: { type: 'array', items: { type: 'string' } }
          },
          required: ['query']
        }
      },
      {
        name: 'get_openalex_work',
        description: 'Get detailed information about a specific OpenAlex work',
        inputSchema: {
          type: 'object',
          properties: {
            work_id: { type: 'string' }
          },
          required: ['work_id']
        }
      },
      {
        name: 'search_openalex_authors',
        description: 'Search OpenAlex author database with metrics and affiliations',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_results: { type: 'number', default: 20 },
            sort: { type: 'string', default: 'cited_by_count:desc' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_openalex_stats',
        description: 'Get OpenAlex database statistics and insights',
        inputSchema: {
          type: 'object',
          properties: {
            entity_type: { type: 'string', enum: ['works', 'authors', 'venues', 'institutions'], default: 'works' },
            filters: { 
              type: 'object',
              properties: {
                publication_year: { type: 'string' },
                open_access: { type: 'boolean' }
              }
            }
          }
        }
      },
      
      // Open Science Framework (OSF) API Tools
      {
        name: 'search_osf_projects',
        description: 'Search OSF for research projects and collaborations (public and private if authenticated)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_results: { type: 'number', default: 20 },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            sort: { type: 'string', default: '-date_modified' },
            include_private: { type: 'boolean', default: false, description: 'Include private projects (requires authentication)' }
          }
        }
      },
      {
        name: 'get_osf_project',
        description: 'Get detailed information about a specific OSF project',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string' }
          },
          required: ['project_id']
        }
      },
      {
        name: 'search_osf_preprints',
        description: 'Search OSF preprints database',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_results: { type: 'number', default: 20 },
            provider: { type: 'string' },
            subject: { type: 'string' },
            sort: { type: 'string', default: '-date_created' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_osf_user_info',
        description: 'Get authenticated user profile and statistics (requires OSF authentication)',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_osf_stats',
        description: 'Get OSF platform statistics and information',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      
      // SciELO API Tools (Latin American & Iberian Research)
      {
        name: 'search_scielo_articles',
        description: 'Search SciELO for Latin American and Iberian scientific literature',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_results: { type: 'number', default: 20 },
            collection: { type: 'string' },
            language: { type: 'string' },
            subject_area: { type: 'string' },
            publication_year: { type: 'string' },
            sort: { type: 'string', default: 'publication_year desc' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_scielo_journals',
        description: 'Get SciELO journal information by collection and subject',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            collection: { type: 'string', default: 'BR' },
            subject_area: { type: 'string' },
            max_results: { type: 'number', default: 20 }
          }
        }
      },
      {
        name: 'get_scielo_article',
        description: 'Get detailed information about a specific SciELO article',
        inputSchema: {
          type: 'object',
          properties: {
            article_id: { type: 'string' },
            collection: { type: 'string', default: 'BR' }
          },
          required: ['article_id']
        }
      },
      {
        name: 'get_scielo_stats',
        description: 'Get SciELO platform statistics and collection information',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'shorten_scielo_url',
        description: 'Shorten URLs using SciELO URL shortener service',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' }
          },
          required: ['url']
        }
      },
      
      // Additional discipline-specific tools would be defined here...
      // (For brevity, showing just 2 of the 8 disciplines)
      
      // ===== COGNITIVE ARCHITECTURE TOOLS =====
      // Operational Flow Tools (5-step process)
      {
        name: 'initial_project_assessment',
        description: 'Step 1: Initial assessment of project materials and stage',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            description: { type: 'string' },
            documents: { type: 'array', items: { type: 'string' } },
            objectives: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'string' }
          }
        }
      },
      {
        name: 'epistemological_inquiry',
        description: 'Step 2: Epistemological inquiry - "¿Por qué crees lo que crees?"',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            worldview: { type: 'string' },
            interests: { type: 'string' },
            assumptions: { type: 'string' }
          }
        }
      },
      {
        name: 'problem_formulation_engine',
        description: 'Step 3: Comprehensive problem formulation based on paradigm',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            paradigm: { type: 'object' },
            context: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'methodological_evaluator',
        description: 'Step 4: Methodological evaluation and selection',
        inputSchema: {
          type: 'object',
          properties: {
            formulation: { type: 'object' },
            resources: { type: 'object' },
            constraints: { type: 'object' }
          }
        }
      },
      {
        name: 'action_plan_generator',
        description: 'Step 5: Action plan generation and user approval',
        inputSchema: {
          type: 'object',
          properties: {
            completedAnalysis: { type: 'object' },
            wordCount: { type: 'number' },
            timeline: { type: 'string' }
          }
        }
      },
      
      // Cognitive Skills Tools (12 abilities)
      {
        name: 'cognitive_synthesizer',
        description: 'Synthesize complex information (for Resumen, Keywords, Theoretical Framework, Conclusions)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'object' },
            synthesisType: { type: 'string', enum: ['resumen', 'palabrasClave', 'marcoTeorico', 'conclusiones'] }
          },
          required: ['content', 'context']
        }
      },
      {
        name: 'cognitive_argumentator',
        description: 'Construct logical arguments (for Problematization, Methodological Framework)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'object' },
            argumentType: { type: 'string', enum: ['problematizacion', 'marcoMetodologico', 'justificacion'] }
          },
          required: ['content', 'context']
        }
      },
      {
        name: 'cognitive_analyzer',
        description: 'Systematic analysis (for Results Analysis, Comparative Analysis)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'object' },
            analysisType: { type: 'string', enum: ['analisisResultados', 'comparative', 'data'] }
          },
          required: ['content', 'context']
        }
      },
      {
        name: 'cognitive_informer',
        description: 'Provide clear information (for Introduction, Research Questions, Definitions)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'object' },
            informationType: { type: 'string', enum: ['introduccion', 'preguntasInvestigacion', 'marcoMetodologico'] }
          },
          required: ['content', 'context']
        }
      },
      {
        name: 'cognitive_organizer',
        description: 'Structure information logically (for Introduction structure, Theoretical order, Conclusions clarity)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'object' },
            organizationType: { type: 'string', enum: ['introduccion', 'marcoTeorico', 'conclusiones'] }
          },
          required: ['content', 'context']
        }
      },
      
      // Academic Document Structure Tools
      {
        name: 'generate_document_section',
        description: 'Generate complete academic document section with cognitive skills',
        inputSchema: {
          type: 'object',
          properties: {
            sectionNumber: { type: 'number', minimum: 1, maximum: 9 },
            content: { type: 'string' },
            context: { type: 'object' },
            sources: { type: 'array', items: { type: 'object' } }
          },
          required: ['sectionNumber', 'content', 'context']
        }
      },
      {
        name: 'generate_complete_academic_document',
        description: 'Generate complete 9-section academic document with full cognitive architecture',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'object' },
            context: { type: 'object' },
            wordCount: { type: 'number' }
          },
          required: ['title', 'content', 'context']
        }
      },
      {
        name: 'validate_document_structure',
        description: 'Validate academic document structure and requirements compliance',
        inputSchema: {
          type: 'object',
          properties: {
            document: { type: 'object' },
            requirements: { type: 'object' }
          },
          required: ['document']
        }
      },
      
      // Citation and Integrity Tools
      {
        name: 'intelligent_citation_processor',
        description: 'Process citations with cognitive-driven strategy selection',
        inputSchema: {
          type: 'object',
          properties: {
            section: { type: 'string' },
            cognitiveSkills: { type: 'array', items: { type: 'string' } },
            sources: { type: 'array', items: { type: 'object' } },
            requirements: { type: 'object' }
          },
          required: ['section', 'cognitiveSkills', 'sources']
        }
      },
      {
        name: 'validate_academic_integrity',
        description: 'Comprehensive academic integrity validation',
        inputSchema: {
          type: 'object',
          properties: {
            section: { type: 'string' },
            content: { type: 'string' },
            citations: { type: 'array', items: { type: 'object' } },
            cognitiveSkills: { type: 'array', items: { type: 'string' } },
            requirements: { type: 'object' }
          },
          required: ['section', 'content', 'citations']
        }
      },
      {
        name: 'detect_citation_fabrication',
        description: 'Detect potentially fabricated citations and sources',
        inputSchema: {
          type: 'object',
          properties: {
            citations: { type: 'array', items: { type: 'object' } },
            content: { type: 'string' }
          },
          required: ['citations', 'content']
        }
      },
      
      // Cognitive Assessment Tools
      {
        name: 'assess_cognitive_alignment',
        description: 'Assess alignment between content and required cognitive skills',
        inputSchema: {
          type: 'object',
          properties: {
            section: { type: 'string' },
            content: { type: 'string' },
            requiredSkills: { type: 'array', items: { type: 'string' } }
          },
          required: ['section', 'content', 'requiredSkills']
        }
      },
      {
        name: 'generate_cognitive_report',
        description: 'Generate comprehensive cognitive skills execution report',
        inputSchema: {
          type: 'object',
          properties: {
            executionResults: { type: 'object' },
            document: { type: 'object' }
          },
          required: ['executionResults']
        }
      },
      
      // ===== NEWS API RESEARCH TOOLS =====
      {
        name: 'search_academic_news',
        description: 'Search news articles with academic filtering and relevance scoring',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for news articles' },
            domains: { type: 'array', items: { type: 'string' }, description: 'Specific domains to search' },
            language: { type: 'string', default: 'en', description: 'Language filter' },
            sortBy: { type: 'string', enum: ['relevancy', 'popularity', 'publishedAt'], default: 'relevancy' },
            pageSize: { type: 'number', default: 20, maximum: 100, description: 'Number of results' },
            from: { type: 'string', description: 'From date (YYYY-MM-DD)' },
            to: { type: 'string', description: 'To date (YYYY-MM-DD)' },
            academicOnly: { type: 'boolean', default: false, description: 'Filter for academic content only' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_academic_headlines',
        description: 'Get top headlines from academic and scientific sources',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', default: 'science', description: 'Category filter' },
            sources: { type: 'array', items: { type: 'string' }, description: 'Specific sources' },
            country: { type: 'string', default: 'us', description: 'Country code' },
            pageSize: { type: 'number', default: 20, maximum: 100, description: 'Number of results' }
          }
        }
      },
      {
        name: 'search_news_by_paradigm',
        description: 'Search research news filtered by academic paradigm and discipline',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Research topic' },
            paradigm: { type: 'string', enum: ['marxism', 'liberalism', 'humanism', 'positivism', 'critical-theory', 'structuralism', 'post-structuralism'], description: 'Research paradigm' },
            discipline: { type: 'string', description: 'Academic discipline' },
            daysBack: { type: 'number', default: 30, description: 'Number of days to search back' }
          },
          required: ['topic']
        }
      },
      {
        name: 'get_trending_academic_topics',
        description: 'Analyze trending academic topics and research areas',
        inputSchema: {
          type: 'object',
          properties: {
            disciplines: { type: 'array', items: { type: 'string' }, default: ['psychology', 'neuroscience', 'education', 'sociology'], description: 'Academic disciplines to analyze' },
            daysBack: { type: 'number', default: 7, description: 'Analysis period in days' }
          }
        }
      },
      {
        name: 'validate_newsapi_connection',
        description: 'Validate NewsAPI connection and configuration',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      
      // ===== CONSENSUS API EVIDENCE TOOLS =====
      {
        name: 'search_scientific_consensus',
        description: 'Search for scientific evidence and consensus on research topics',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Research question or topic' },
            limit: { type: 'number', default: 20, maximum: 100, description: 'Number of results' },
            domain: { type: 'string', description: 'Research domain filter' },
            evidenceLevel: { type: 'string', enum: ['high', 'medium', 'low', 'all'], default: 'all', description: 'Evidence quality filter' },
            metaAnalysisOnly: { type: 'boolean', default: false, description: 'Only return meta-analyses and systematic reviews' },
            journals: { type: 'array', items: { type: 'string' }, description: 'Specific journals to search' },
            yearFrom: { type: 'number', description: 'Start year for publication date filter' },
            yearTo: { type: 'number', description: 'End year for publication date filter' }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_research_consensus',
        description: 'Analyze consensus patterns and evidence strength on research questions',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Specific research question' },
            keywords: { type: 'array', items: { type: 'string' }, description: 'Key terms to analyze' },
            paradigm: { type: 'string', description: 'Research paradigm context' },
            minStudies: { type: 'number', default: 5, description: 'Minimum number of studies for consensus' }
          },
          required: ['question']
        }
      },
      {
        name: 'identify_research_gaps_consensus',
        description: 'Identify research gaps and emerging topics using consensus data',
        inputSchema: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Research field' },
            topics: { type: 'array', items: { type: 'string' }, description: 'Topics to analyze for gaps' },
            yearsBack: { type: 'number', default: 5, description: 'Years to look back for trend analysis' }
          },
          required: ['field', 'topics']
        }
      },
      {
        name: 'get_methodology_recommendations',
        description: 'Get evidence-based recommendations for research methodology',
        inputSchema: {
          type: 'object',
          properties: {
            researchQuestion: { type: 'string', description: 'The research question' },
            discipline: { type: 'string', description: 'Academic discipline' },
            paradigm: { type: 'string', description: 'Research paradigm' },
            constraints: { type: 'array', items: { type: 'string' }, description: 'Research constraints (time, resources, etc.)' }
          },
          required: ['researchQuestion', 'discipline']
        }
      },
      {
        name: 'validate_consensus_connection',
        description: 'Validate Consensus API connection and functionality',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  // Placeholder methods for tool implementations
  async validateAPIKey(args) { 
    return { content: [{ type: 'text', text: 'API validation not yet implemented' }] }; 
  }
  async configureDiscipline(args) { 
    return { content: [{ type: 'text', text: 'Discipline configuration not yet implemented' }] }; 
  }
  async batchProcessPDFs(args) { 
    return { content: [{ type: 'text', text: 'Batch PDF processing not yet implemented' }] }; 
  }
  async performOCR(args) { 
    return { content: [{ type: 'text', text: 'OCR processing not yet implemented' }] }; 
  }
  async identifyResearchGaps(args) { 
    return { content: [{ type: 'text', text: 'Research gap identification not yet implemented' }] }; 
  }
  async formatCitations(args) { 
    return { content: [{ type: 'text', text: 'Citation formatting not yet implemented' }] }; 
  }
  async compileToPDF(args) { 
    return { content: [{ type: 'text', text: 'PDF compilation not yet implemented' }] }; 
  }
  async getPaperRecommendations(args) {
    return { content: [{ type: 'text', text: 'Paper recommendations feature integrated in literature search' }] };
  }
  async advancedCrossRefSearch(args) {
    return { content: [{ type: 'text', text: 'Advanced CrossRef search capabilities integrated in literature search' }] };
  }
  async analyzePsychologyResearch(args) { 
    return { content: [{ type: 'text', text: 'Psychology analysis not yet implemented' }] }; 
  }
  async analyzeNeurosciencePaper(args) { 
    return { content: [{ type: 'text', text: 'Neuroscience analysis not yet implemented' }] }; 
  }
  async analyzeEducationStudy(args) { 
    return { content: [{ type: 'text', text: 'Education analysis not yet implemented' }] }; 
  }
  async analyzeSociologyResearch(args) { 
    return { content: [{ type: 'text', text: 'Sociology analysis not yet implemented' }] }; 
  }
  async analyzeAnthropologyWork(args) { 
    return { content: [{ type: 'text', text: 'Anthropology analysis not yet implemented' }] }; 
  }
  async analyzePhilosophyArgument(args) { 
    return { content: [{ type: 'text', text: 'Philosophy analysis not yet implemented' }] }; 
  }
  async analyzePoliticalScience(args) { 
    return { content: [{ type: 'text', text: 'Political Science analysis not yet implemented' }] }; 
  }
  async analyzeInternationalRelations(args) { 
    return { content: [{ type: 'text', text: 'International Relations analysis not yet implemented' }] }; 
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🔬 Autonomous Scientist MCP Server v6.1 running on stdio with Cognitive Architecture');
  }

  async shutdown() {
    this.memoryManager?.shutdown();
    this.cacheManager?.shutdown();
    console.error('🔌 Autonomous Scientist Server shutting down');
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.error('📴 Received SIGINT, shutting down gracefully...');
  if (global.server) {
    await global.server.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('📴 Received SIGTERM, shutting down gracefully...');
  if (global.server) {
    await global.server.shutdown();
  }
  process.exit(0);
});

// Main execution
async function main() {
  try {
    const server = new AutonomousScientistServer();
    global.server = server;
    await server.run();
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutonomousScientistServer;