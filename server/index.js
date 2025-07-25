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
const { MemoryManager } = require('./utils/memory-manager.js');
const { ErrorHandler } = require('./utils/error-handler.js');
const { CacheManager } = require('./utils/cache-manager.js');

class AutonomousScientistServer {
  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-scientist',
        version: '6.0.0'
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
    
    this.setupToolHandlers();
    this.setupPromptHandlers();
    
    console.error('🔬 Autonomous Scientist v6.0 initialized');
    console.error(`📊 Configuration: ${this.config.primary_discipline}, ${this.config.default_citation_style} citations`);
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
      crossref_api_key: process.env.USER_CONFIG_CROSSREF_API_KEY
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
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  setupPromptHandlers() {
    // Handle predefined workflow prompts
    this.server.setRequestHandler('prompts/list', async () => {
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

    this.server.setRequestHandler('prompts/get', async (request) => {
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
      
      // Additional discipline-specific tools would be defined here...
      // (For brevity, showing just 2 of the 8 disciplines)
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
    console.error('🔬 Autonomous Scientist MCP Server v6.0 running on stdio');
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