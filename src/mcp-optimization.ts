/**
 * MCP Integration Optimization Layer
 * Enhances the Autonomous Scientist MCP server with advanced features
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import NodeCache from 'node-cache';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: any;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  rateLimitRemaining?: number;
  cached?: boolean;
}

interface RateLimit {
  requests: number;
  window: number; // in seconds
  used: number;
  resetTime: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class MCPOptimizationLayer {
  private cache: NodeCache;
  private rateLimiters: Map<string, RateLimit>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private config: MCPConfiguration;

  constructor(config: MCPConfiguration) {
    this.config = config;
    this.cache = new NodeCache({ 
      stdTTL: config.cache.ttl,
      maxKeys: config.cache.maxSize 
    });
    this.rateLimiters = new Map();
    this.circuitBreakers = new Map();
  }

  /**
   * Enhanced tool registration with validation and optimization
   */
  getOptimizedToolDefinitions(): Tool[] {
    return [
      // Core Academic Search Tools
      {
        name: 'search_academic_news',
        description: 'Search academic news with paradigm filtering using NewsAPI',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 3, maxLength: 500 },
            paradigm: { 
              type: 'string', 
              enum: ['positivist', 'post-positivist', 'constructivist', 'transformative', 'pragmatic', 'critical-theory', 'feminist'] 
            },
            discipline: { type: 'string' },
            max_results: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            date_range: { type: 'string', enum: ['day', 'week', 'month', 'year'] }
          },
          required: ['query']
        }
      },
      {
        name: 'search_scientific_consensus',
        description: 'Analyze scientific consensus using Consensus API',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 5 },
            evidence_level: { type: 'string', enum: ['high', 'medium', 'low', 'all'] },
            domain: { type: 'string' },
            synthesis_type: { type: 'string', enum: ['meta-analysis', 'systematic-review', 'consensus'] }
          },
          required: ['query']
        }
      },

      // Cognitive Abilities Tools
      {
        name: 'cognitive_synthesizer',
        description: 'Synthesize information using the 12 cognitive skills framework',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'array', items: { type: 'string' } },
            skill_type: { 
              type: 'string', 
              enum: ['synthesize', 'argue', 'analyze', 'inform', 'organize', 'inquire', 'interpret', 'relate', 'classify', 'conclude', 'evaluate', 'apply'] 
            },
            paradigm: { type: 'string' },
            target_section: { 
              type: 'string', 
              enum: ['summary', 'keywords', 'theoretical_framework', 'conclusions', 'problematization', 'methodological_framework', 'analysis_results', 'comparisons', 'introduction', 'research_questions'] 
            },
            word_count: { type: 'number', minimum: 100, maximum: 5000 }
          },
          required: ['content', 'skill_type']
        }
      },
      {
        name: 'cognitive_argumentator',
        description: 'Generate arguments using cognitive argumentation framework',
        inputSchema: {
          type: 'object',
          properties: {
            premise: { type: 'string' },
            paradigm: { type: 'string' },
            argument_type: { type: 'string', enum: ['deductive', 'inductive', 'abductive'] },
            evidence: { type: 'array', items: { type: 'string' } },
            target_audience: { type: 'string', enum: ['academic', 'general', 'policy'] }
          },
          required: ['premise']
        }
      },

      // Document Structure Tools
      {
        name: 'generate_document_section',
        description: 'Generate specific academic document sections',
        inputSchema: {
          type: 'object',
          properties: {
            section_type: { 
              type: 'string', 
              enum: ['introduction', 'literature_review', 'methodology', 'results', 'discussion', 'conclusion', 'abstract', 'bibliography', 'appendix'] 
            },
            content_input: { type: 'object' },
            paradigm: { type: 'string' },
            citation_style: { type: 'string', enum: ['apa', 'mla', 'chicago', 'harvard'] },
            word_count: { type: 'number', minimum: 200, maximum: 10000 }
          },
          required: ['section_type', 'content_input']
        }
      },
      {
        name: 'intelligent_citation_processor',
        description: 'Process and validate citations with integrity checking',
        inputSchema: {
          type: 'object',
          properties: {
            citations: { type: 'array', items: { type: 'object' } },
            citation_style: { type: 'string', enum: ['apa', 'mla', 'chicago', 'harvard'] },
            validate_sources: { type: 'boolean', default: true },
            check_fabrication: { type: 'boolean', default: true },
            auto_format: { type: 'boolean', default: true }
          },
          required: ['citations']
        }
      },

      // Academic Integrity Tools
      {
        name: 'detect_citation_fabrication',
        description: 'Detect potentially fabricated citations',
        inputSchema: {
          type: 'object',
          properties: {
            citations: { type: 'array', items: { type: 'object' } },
            validation_level: { type: 'string', enum: ['basic', 'comprehensive', 'forensic'] },
            cross_reference_databases: { type: 'array', items: { type: 'string' } }
          },
          required: ['citations']
        }
      },
      {
        name: 'validate_academic_integrity',
        description: 'Comprehensive academic integrity validation',
        inputSchema: {
          type: 'object',
          properties: {
            document_content: { type: 'string' },
            check_plagiarism: { type: 'boolean', default: true },
            validate_citations: { type: 'boolean', default: true },
            verify_sources: { type: 'boolean', default: true },
            paradigm_alignment: { type: 'boolean', default: true }
          },
          required: ['document_content']
        }
      },

      // Operational Flow Tools
      {
        name: 'initial_project_assessment',
        description: 'Assess existing project materials and determine project type',
        inputSchema: {
          type: 'object',
          properties: {
            project_description: { type: 'string' },
            existing_documents: { type: 'array', items: { type: 'string' } },
            objectives: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            resources: { type: 'object' }
          },
          required: ['project_description']
        }
      },
      {
        name: 'epistemological_inquiry',
        description: 'Conduct epistemological inquiry to identify research paradigm',
        inputSchema: {
          type: 'object',
          properties: {
            research_interest: { type: 'string' },
            worldview_indicators: { type: 'array', items: { type: 'string' } },
            methodology_preferences: { type: 'array', items: { type: 'string' } },
            philosophical_position: { type: 'string' }
          },
          required: ['research_interest']
        }
      }
    ];
  }

  /**
   * Validate input with comprehensive error checking
   */
  validateInput(schema: any, args: any): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in args)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate field types and constraints
    for (const [field, value] of Object.entries(args)) {
      const fieldSchema = schema.properties?.[field];
      if (!fieldSchema) continue;

      if (fieldSchema.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`Field ${field} must be a string`);
        } else {
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(`Field ${field} must be at least ${fieldSchema.minLength} characters`);
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(`Field ${field} must be at most ${fieldSchema.maxLength} characters`);
          }
          if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            errors.push(`Field ${field} must be one of: ${fieldSchema.enum.join(', ')}`);
          }
        }
      }
      
      if (fieldSchema.type === 'number') {
        if (typeof value !== 'number') {
          errors.push(`Field ${field} must be a number`);
        } else {
          if (fieldSchema.minimum && value < fieldSchema.minimum) {
            errors.push(`Field ${field} must be at least ${fieldSchema.minimum}`);
          }
          if (fieldSchema.maximum && value > fieldSchema.maximum) {
            errors.push(`Field ${field} must be at most ${fieldSchema.maximum}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: errors.length === 0 ? this.sanitizeInput(args) : undefined
    };
  }

  /**
   * Check rate limiting for API calls
   */
  checkRateLimit(apiName: string): boolean {
    const limit = this.rateLimiters.get(apiName);
    const now = Date.now();
    
    if (!limit) {
      // Initialize rate limiter
      const config = this.config.rateLimit[apiName] || { requests: 100, window: 3600 };
      this.rateLimiters.set(apiName, {
        requests: config.requests,
        window: config.window * 1000, // convert to ms
        used: 0,
        resetTime: now + config.window * 1000
      });
      return true;
    }

    // Reset if window has passed
    if (now > limit.resetTime) {
      limit.used = 0;
      limit.resetTime = now + limit.window;
    }

    // Check if limit exceeded
    if (limit.used >= limit.requests) {
      return false;
    }

    limit.used++;
    return true;
  }

  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker(apiName: string): boolean {
    const breaker = this.circuitBreakers.get(apiName);
    const now = Date.now();
    
    if (!breaker) {
      this.circuitBreakers.set(apiName, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED'
      });
      return true;
    }

    switch (breaker.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        // Check if enough time has passed to try again
        if (now - breaker.lastFailure > 60000) { // 1 minute
          breaker.state = 'HALF_OPEN';
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return false;
    }
  }

  /**
   * Record API success/failure for circuit breaker
   */
  recordApiResult(apiName: string, success: boolean): void {
    const breaker = this.circuitBreakers.get(apiName);
    if (!breaker) return;

    if (success) {
      breaker.failures = 0;
      breaker.state = 'CLOSED';
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= 5) { // Threshold
        breaker.state = 'OPEN';
      }
    }
  }

  /**
   * Get cached response or execute function
   */
  async withCache<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    const result = await fn();
    this.cache.set(key, result, ttl || this.config.cache.ttl);
    return result;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

interface MCPConfiguration {
  apis: {
    newsapi: { key: string; baseUrl: string };
    consensus: { baseUrl: string };
    openalex: { baseUrl: string };
    scielo: { baseUrl: string };
    osf: { baseUrl: string };
    arxiv: { baseUrl: string };
  };
  rateLimit: {
    [apiName: string]: { requests: number; window: number };
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
}

export { MCPOptimizationLayer, MCPConfiguration, ValidationResult, ApiResponse };