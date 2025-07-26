#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { setupResearchAPIs } from './tools/api-setup.js';
import { processPDF } from './tools/pdf-processor.js';
import { searchLiterature } from './tools/literature-search.js';
import { analyzeByDiscipline } from './tools/discipline-analyzer.js';
import { generateLaTeX } from './tools/latex-generator.js';
import { MemoryManager } from './utils/memory-manager.js';
import { ErrorHandler } from './utils/error-handler.js';
import { CacheManager } from './utils/cache-manager.js';

class AutonomousScientistServer {
  private server: Server;
  private memoryManager: MemoryManager;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;
  
  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-scientist',
        version: '6.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    // Initialize hardware optimization for i3-12100F + 16GB
    this.memoryManager = new MemoryManager({
      maxUsage: 8 * 1024 * 1024 * 1024, // 8GB
      chunkSize: 2 * 1024 * 1024 * 1024, // 2GB chunks
      cacheSize: 2 * 1024 * 1024 * 1024  // 2GB cache
    });
    
    this.errorHandler = new ErrorHandler();
    this.cacheManager = new CacheManager();
    
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          // Configuration and Setup Tools
          case 'setup_research_apis':
            return await setupResearchAPIs(args);
          case 'validate_api_key':
            return await this.validateAPIKey(args);
          case 'configure_discipline':
            return await this.configureDiscipline(args);
          
          // PDF Processing and OCR Tools  
          case 'process_academic_pdf':
            return await processPDF(args, this.memoryManager);
          case 'batch_process_pdfs':
            return await this.batchProcessPDFs(args);
          case 'ocr_multilingual':
            return await this.performOCR(args);
          
          // Literature Search and Analysis
          case 'comprehensive_literature_search':
            return await searchLiterature(args);
          case 'analyze_by_discipline':
            return await analyzeByDiscipline(args);
          case 'identify_research_gaps':
            return await this.identifyResearchGaps(args);
          
          // LaTeX Generation
          case 'generate_latex_paper':
            return await generateLaTeX(args);
          case 'format_citations':
            return await this.formatCitations(args);
          case 'compile_to_pdf':
            return await this.compileToPDF(args);
          
          // Discipline-specific Analysis
          case 'analyze_psychology_research':
            return await this.analyzePsychologyResearch(args);
          case 'analyze_neuroscience_paper':
            return await this.analyzeNeurosciencePaper(args);
          case 'analyze_education_study':
            return await this.analyzeEducationStudy(args);
          case 'analyze_sociology_research':
            return await this.analyzeSociologyResearch(args);
          case 'analyze_anthropology_work':
            return await this.analyzeAnthropologyWork(args);
          case 'analyze_philosophy_argument':
            return await this.analyzePhilosophyArgument(args);
          case 'analyze_political_science':
            return await this.analyzePoliticalScience(args);
          case 'analyze_international_relations':
            return await this.analyzeInternationalRelations(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.errorHandler.handleToolError(error, name, args);
      }
    });
  }

  private getToolDefinitions(): Tool[] {
    return [
      // Configuration Tools
      {
        name: 'setup_research_apis',
        description: 'Interactive setup of research APIs (Semantic Scholar, ArXiv, CrossRef)',
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
            service: { type: 'string', enum: ['semantic_scholar', 'crossref', 'openai', 'anthropic'] },
            key: { type: 'string' }
          },
          required: ['service', 'key']
        }
      },
      {
        name: 'configure_discipline',
        description: 'Configure extension for specific academic discipline',
        inputSchema: {
          type: 'object',
          properties: {
            discipline: { 
              type: 'string', 
              enum: ['psychology', 'neuroscience', 'education', 'sociology', 'anthropology', 'philosophy', 'political-science', 'international-relations'] 
            },
            citation_style: { type: 'string', enum: ['apa', 'chicago', 'mla', 'asa', 'aaa', 'apsa'] }
          },
          required: ['discipline']
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
      {
        name: 'identify_research_gaps',
        description: 'Automatic identification of research gaps from literature',
        inputSchema: {
          type: 'object',
          properties: {
            literature_set: { type: 'array', items: { type: 'string' } },
            discipline: { type: 'string' },
            gap_types: { type: 'array', items: { type: 'string' }, default: ['methodological', 'theoretical', 'empirical', 'practical'] }
          },
          required: ['literature_set', 'discipline']
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
      {
        name: 'format_citations',
        description: 'Automatic citation formatting for multiple academic styles',
        inputSchema: {
          type: 'object',
          properties: {
            citations: { type: 'array', items: { type: 'object' } },
            style: { type: 'string', enum: ['apa', 'chicago', 'mla', 'asa', 'aaa', 'apsa'] },
            output_format: { type: 'string', enum: ['bibtex', 'latex', 'text'], default: 'latex' }
          },
          required: ['citations', 'style']
        }
      },
      {
        name: 'compile_to_pdf',
        description: 'Compile LaTeX document to PDF with error handling',
        inputSchema: {
          type: 'object',
          properties: {
            latex_file: { type: 'string' },
            output_path: { type: 'string' },
            bibliography: { type: 'boolean', default: true },
            quality_check: { type: 'boolean', default: true }
          },
          required: ['latex_file']
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
      {
        name: 'analyze_education_study',
        description: 'Education research analysis (curriculum design, competency evaluation, action research)',
        inputSchema: {
          type: 'object',
          properties: {
            study_content: { type: 'string' },
            education_level: { type: 'string', enum: ['primary', 'secondary', 'higher', 'adult', 'special'] },
            research_type: { type: 'string', enum: ['quantitative', 'qualitative', 'mixed-methods', 'action-research'] }
          },
          required: ['study_content']
        }
      },
      {
        name: 'analyze_sociology_research',
        description: 'Sociology-specific analysis (social networks, demographics, sociological theory)',
        inputSchema: {
          type: 'object',
          properties: {
            research_content: { type: 'string' },
            sociological_perspective: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'string', enum: ['survey', 'ethnography', 'case-study', 'comparative', 'historical'] }
          },
          required: ['research_content']
        }
      },
      {
        name: 'analyze_anthropology_work',
        description: 'Anthropology-specific analysis (ethnography, cultural analysis, fieldwork)',
        inputSchema: {
          type: 'object',
          properties: {
            ethnographic_content: { type: 'string' },
            anthropology_subfield: { type: 'string', enum: ['cultural', 'linguistic', 'archaeological', 'biological', 'applied'] },
            fieldwork_method: { type: 'array', items: { type: 'string' } }
          },
          required: ['ethnographic_content']
        }
      },
      {
        name: 'analyze_philosophy_argument',
        description: 'Philosophy-specific analysis (conceptual analysis, argument structure, philosophical traditions)',
        inputSchema: {
          type: 'object',
          properties: {
            philosophical_text: { type: 'string' },
            philosophical_tradition: { type: 'string', enum: ['analytic', 'continental', 'pragmatic', 'eastern', 'medieval', 'ancient'] },
            argument_type: { type: 'string', enum: ['deductive', 'inductive', 'abductive', 'transcendental'] }
          },
          required: ['philosophical_text']
        }
      },
      {
        name: 'analyze_political_science',
        description: 'Political Science analysis (electoral analysis, public policy, institutions)',
        inputSchema: {
          type: 'object',
          properties: {
            political_content: { type: 'string' },
            subfield: { type: 'string', enum: ['comparative', 'american', 'theory', 'public-policy', 'methodology'] },
            analysis_level: { type: 'string', enum: ['individual', 'institutional', 'systemic', 'global'] }
          },
          required: ['political_content']
        }
      },
      {
        name: 'analyze_international_relations',
        description: 'International Relations analysis (conflict analysis, diplomacy, IR theory)',
        inputSchema: {
          type: 'object',
          properties: {
            ir_content: { type: 'string' },
            theoretical_approach: { type: 'string', enum: ['realism', 'liberalism', 'constructivism', 'critical-theory', 'postmodern'] },
            analysis_focus: { type: 'array', items: { type: 'string' }, default: ['security', 'economics', 'institutions', 'norms'] }
          },
          required: ['ir_content']
        }
      }
    ];
  }

  // Placeholder methods for tool implementations
  private async validateAPIKey(args: any) { return { content: [{ type: 'text', text: 'API validation not yet implemented' }] }; }
  private async configureDiscipline(args: any) { return { content: [{ type: 'text', text: 'Discipline configuration not yet implemented' }] }; }
  private async batchProcessPDFs(args: any) { return { content: [{ type: 'text', text: 'Batch PDF processing not yet implemented' }] }; }
  private async performOCR(args: any) { return { content: [{ type: 'text', text: 'OCR processing not yet implemented' }] }; }
  private async identifyResearchGaps(args: any) { return { content: [{ type: 'text', text: 'Research gap identification not yet implemented' }] }; }
  private async formatCitations(args: any) { return { content: [{ type: 'text', text: 'Citation formatting not yet implemented' }] }; }
  private async compileToPDF(args: any) { return { content: [{ type: 'text', text: 'PDF compilation not yet implemented' }] }; }
  private async analyzePsychologyResearch(args: any) { return { content: [{ type: 'text', text: 'Psychology analysis not yet implemented' }] }; }
  private async analyzeNeurosciencePaper(args: any) { return { content: [{ type: 'text', text: 'Neuroscience analysis not yet implemented' }] }; }
  private async analyzeEducationStudy(args: any) { return { content: [{ type: 'text', text: 'Education analysis not yet implemented' }] }; }
  private async analyzeSociologyResearch(args: any) { return { content: [{ type: 'text', text: 'Sociology analysis not yet implemented' }] }; }
  private async analyzeAnthropologyWork(args: any) { return { content: [{ type: 'text', text: 'Anthropology analysis not yet implemented' }] }; }
  private async analyzePhilosophyArgument(args: any) { return { content: [{ type: 'text', text: 'Philosophy analysis not yet implemented' }] }; }
  private async analyzePoliticalScience(args: any) { return { content: [{ type: 'text', text: 'Political Science analysis not yet implemented' }] }; }
  private async analyzeInternationalRelations(args: any) { return { content: [{ type: 'text', text: 'International Relations analysis not yet implemented' }] }; }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Autonomous Scientist MCP Server v6.0 running on stdio');
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AutonomousScientistServer();
  server.run().catch(console.error);
}