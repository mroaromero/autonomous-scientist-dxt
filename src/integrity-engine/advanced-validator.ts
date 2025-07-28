#!/usr/bin/env node

/**
 * Advanced Academic Integrity Validator v6.3
 * Comprehensive data validation and consistency checking system
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface ValidationRule {
  id: string;
  name: string;
  category: 'plagiarism' | 'citation' | 'data' | 'methodology' | 'format' | 'consistency';
  severity: 'critical' | 'major' | 'minor' | 'warning';
  description: string;
  validator: (content: any, context: ValidationContext) => Promise<ValidationResult>;
  enabled: boolean;
  weight: number; // 0-1 for scoring
}

export interface ValidationContext {
  documentId: string;
  sectionId?: string;
  discipline: string;
  paradigm: string;
  citationStyle: string;
  academicLevel: 'undergraduate' | 'graduate' | 'doctoral' | 'professional';
  requirements: {
    originalityThreshold: number; // 0-100%
    citationAccuracy: number; // 0-100%
    dataIntegrity: number; // 0-100%
    methodologyRigor: number; // 0-100%
  };
  externalSources: {
    crossref?: boolean;
    openalex?: boolean;
    semanticScholar?: boolean;
    plagiarismDB?: boolean;
  };
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  score: number; // 0-100
  confidence: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
  metadata: {
    processingTime: number;
    sourceChecked: string[];
    lastChecked: Date;
  };
}

export interface ValidationIssue {
  id: string;
  type: 'plagiarism' | 'citation_error' | 'data_inconsistency' | 'format_violation' | 'logical_error';
  severity: 'critical' | 'major' | 'minor' | 'warning';
  description: string;
  location: {
    section?: string;
    paragraph?: number;
    line?: number;
    character?: number;
  };
  evidence: any;
  suggestedFix?: string;
  autoFixable: boolean;
}

export interface IntegrityReport {
  documentId: string;
  overallScore: number; // 0-100
  categoryScores: Record<string, number>;
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  passed: boolean;
  validationResults: ValidationResult[];
  recommendations: string[];
  generatedAt: Date;
  processingTime: number;
}

export interface DataConsistencyCheck {
  fieldName: string;
  expectedType: string;
  requiredFields: string[];
  validationPattern?: RegExp;
  crossReferences: string[];
  allowedValues?: any[];
}

export interface PlagiarismDetectionResult {
  segments: PlagiarismSegment[];
  overallSimilarity: number;
  sourceMatches: SourceMatch[];
  originalityScore: number;
}

export interface PlagiarismSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  similarity: number;
  matches: SourceMatch[];
}

export interface SourceMatch {
  source: string;
  title: string;
  authors: string[];
  url?: string;
  similarity: number;
  matchedText: string;
  confidence: number;
}

export class AdvancedIntegrityValidator extends EventEmitter {
  private rules: Map<string, ValidationRule> = new Map();
  private cache: Map<string, ValidationResult> = new Map();
  private plagiarismDB: Map<string, string[]> = new Map();
  private knownSources: Set<string> = new Set();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.loadKnownSources();
  }

  /**
   * Validate complete document integrity
   */
  async validateDocument(
    content: any,
    context: ValidationContext
  ): Promise<IntegrityReport> {
    const startTime = Date.now();
    const validationResults: ValidationResult[] = [];
    
    this.emit('validationStarted', { documentId: context.documentId });

    try {
      // Get applicable rules
      const applicableRules = Array.from(this.rules.values())
        .filter(rule => rule.enabled)
        .sort((a, b) => b.weight - a.weight);

      // Run validations in parallel
      const validationPromises = applicableRules.map(rule => 
        this.runValidationRule(rule, content, context)
      );

      const results = await Promise.allSettled(validationPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validationResults.push(result.value);
        } else {
          console.error(`Validation rule ${applicableRules[index].id} failed:`, result.reason);
          // Add error result
          validationResults.push({
            ruleId: applicableRules[index].id,
            passed: false,
            score: 0,
            confidence: 0,
            issues: [{
              id: `error_${Date.now()}`,
              type: 'logical_error',
              severity: 'major',
              description: `Validation rule failed: ${result.reason}`,
              location: {},
              evidence: { error: result.reason },
              autoFixable: false
            }],
            suggestions: ['Contact support if this error persists'],
            metadata: {
              processingTime: 0,
              sourceChecked: [],
              lastChecked: new Date()
            }
          });
        }
      });

      // Calculate overall scores
      const report = this.generateIntegrityReport(
        context.documentId,
        validationResults,
        Date.now() - startTime
      );

      this.emit('validationCompleted', report);
      return report;

    } catch (error) {
      this.emit('validationError', { documentId: context.documentId, error });
      throw error;
    }
  }

  /**
   * Detect plagiarism in text content
   */
  async detectPlagiarism(
    text: string,
    context: ValidationContext,
    sources: string[] = []
  ): Promise<PlagiarismDetectionResult> {
    const segments: PlagiarismSegment[] = [];
    const sourceMatches: SourceMatch[] = [];
    
    // Split text into segments for analysis
    const textSegments = this.segmentText(text, 50); // 50 word segments
    
    for (const segment of textSegments) {
      const segmentMatches = await this.checkSegmentSimilarity(segment, sources);
      
      if (segmentMatches.length > 0) {
        const maxSimilarity = Math.max(...segmentMatches.map(m => m.similarity));
        
        segments.push({
          text: segment.text,
          startIndex: segment.startIndex,
          endIndex: segment.endIndex,
          similarity: maxSimilarity,
          matches: segmentMatches
        });

        sourceMatches.push(...segmentMatches);
      }
    }

    // Calculate overall similarity
    const totalSegments = textSegments.length;
    const similarSegments = segments.length;
    const overallSimilarity = totalSegments > 0 ? (similarSegments / totalSegments) * 100 : 0;
    
    // Calculate originality score
    const weightedSimilarity = segments.reduce((sum, seg) => sum + seg.similarity, 0) / totalSegments;
    const originalityScore = Math.max(0, 100 - weightedSimilarity);

    return {
      segments,
      overallSimilarity,
      sourceMatches: this.deduplicateSourceMatches(sourceMatches),
      originalityScore
    };
  }

  /**
   * Validate citation accuracy and formatting
   */
  async validateCitations(
    citations: any[],
    citationStyle: string,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    const sourcesChecked: string[] = [];
    let totalScore = 100;
    let confidence = 100;

    for (const [index, citation] of citations.entries()) {
      // Check required fields
      const requiredFields = this.getRequiredCitationFields(citation.type, citationStyle);
      const missingFields = requiredFields.filter(field => !citation[field]);
      
      if (missingFields.length > 0) {
        issues.push({
          id: `citation_missing_${index}`,
          type: 'citation_error',
          severity: 'major',
          description: `Missing required fields: ${missingFields.join(', ')}`,
          location: { paragraph: index },
          evidence: { citation, missingFields },
          suggestedFix: `Add missing fields: ${missingFields.join(', ')}`,
          autoFixable: false
        });
        totalScore -= 10;
      }

      // Validate DOI if present
      if (citation.doi) {
        const doiValid = await this.validateDOI(citation.doi);
        sourcesChecked.push(`DOI: ${citation.doi}`);
        
        if (!doiValid) {
          issues.push({
            id: `citation_invalid_doi_${index}`,
            type: 'citation_error',
            severity: 'major',
            description: 'Invalid or unresolvable DOI',
            location: { paragraph: index },
            evidence: { citation, doi: citation.doi },
            suggestedFix: 'Verify DOI accuracy or remove invalid DOI',
            autoFixable: false
          });
          totalScore -= 15;
          confidence -= 10;
        }
      }

      // Check formatting consistency
      const formatIssues = this.validateCitationFormat(citation, citationStyle);
      issues.push(...formatIssues);
      totalScore -= formatIssues.length * 5;

      // Cross-reference with academic databases
      if (context.externalSources.openalex) {
        const verified = await this.verifyCitationWithOpenAlex(citation);
        sourcesChecked.push('OpenAlex');
        
        if (!verified) {
          issues.push({
            id: `citation_unverified_${index}`,
            type: 'citation_error',
            severity: 'minor',
            description: 'Citation could not be verified in academic databases',
            location: { paragraph: index },
            evidence: { citation },
            suggestedFix: 'Verify citation details and sources',
            autoFixable: false
          });
          confidence -= 5;
        }
      }
    }

    // Generate suggestions
    if (issues.length > 0) {
      suggestions.push('Review and correct citation formatting');
      suggestions.push('Verify all DOIs and external references');
      suggestions.push('Ensure all required citation fields are present');
    }

    return {
      ruleId: 'citation_validation',
      passed: totalScore >= context.requirements.citationAccuracy,
      score: Math.max(0, totalScore),
      confidence: Math.max(0, confidence),
      issues,
      suggestions,
      metadata: {
        processingTime: 0,
        sourceChecked: sourcesChecked,
        lastChecked: new Date()
      }
    };
  }

  /**
   * Validate data consistency across document
   */
  async validateDataConsistency(
    data: any,
    checks: DataConsistencyCheck[],
    context: ValidationContext
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    for (const check of checks) {
      const fieldValue = this.getNestedValue(data, check.fieldName);
      
      // Check if required field exists
      if (check.requiredFields.includes(check.fieldName) && (fieldValue === undefined || fieldValue === null)) {
        issues.push({
          id: `missing_field_${check.fieldName}`,
          type: 'data_inconsistency',
          severity: 'critical',
          description: `Required field '${check.fieldName}' is missing`,
          location: {},
          evidence: { fieldName: check.fieldName, expectedType: check.expectedType },
          suggestedFix: `Add required field '${check.fieldName}'`,
          autoFixable: false
        });
        score -= 20;
        continue;
      }

      // Type validation
      if (fieldValue !== undefined && !this.validateType(fieldValue, check.expectedType)) {
        issues.push({
          id: `invalid_type_${check.fieldName}`,
          type: 'data_inconsistency',
          severity: 'major',
          description: `Field '${check.fieldName}' has invalid type. Expected: ${check.expectedType}`,
          location: {},
          evidence: { fieldName: check.fieldName, actualType: typeof fieldValue, expectedType: check.expectedType },
          suggestedFix: `Convert '${check.fieldName}' to ${check.expectedType}`,
          autoFixable: true
        });
        score -= 15;
      }

      // Pattern validation
      if (check.validationPattern && fieldValue && !check.validationPattern.test(String(fieldValue))) {
        issues.push({
          id: `invalid_pattern_${check.fieldName}`,
          type: 'format_violation',
          severity: 'minor',
          description: `Field '${check.fieldName}' does not match required pattern`,
          location: {},
          evidence: { fieldName: check.fieldName, value: fieldValue, pattern: check.validationPattern.source },
          suggestedFix: `Format '${check.fieldName}' according to required pattern`,
          autoFixable: true
        });
        score -= 10;
      }

      // Allowed values validation
      if (check.allowedValues && fieldValue && !check.allowedValues.includes(fieldValue)) {
        issues.push({
          id: `invalid_value_${check.fieldName}`,
          type: 'data_inconsistency',
          severity: 'major',
          description: `Field '${check.fieldName}' contains invalid value`,
          location: {},
          evidence: { fieldName: check.fieldName, value: fieldValue, allowedValues: check.allowedValues },
          suggestedFix: `Use one of the allowed values: ${check.allowedValues.join(', ')}`,
          autoFixable: false
        });
        score -= 15;
      }

      // Cross-reference validation
      for (const refField of check.crossReferences) {
        const refValue = this.getNestedValue(data, refField);
        if (fieldValue && refValue && !this.validateCrossReference(fieldValue, refValue, check.fieldName, refField)) {
          issues.push({
            id: `invalid_cross_ref_${check.fieldName}_${refField}`,
            type: 'data_inconsistency',
            severity: 'major',
            description: `Inconsistency between '${check.fieldName}' and '${refField}'`,
            location: {},
            evidence: { field1: check.fieldName, value1: fieldValue, field2: refField, value2: refValue },
            suggestedFix: `Ensure consistency between '${check.fieldName}' and '${refField}'`,
            autoFixable: false
          });
          score -= 12;
        }
      }
    }

    // Generate suggestions
    if (issues.length > 0) {
      suggestions.push('Review data consistency across all fields');
      suggestions.push('Validate cross-references and dependencies');
      suggestions.push('Ensure all required fields are properly formatted');
    }

    return {
      ruleId: 'data_consistency',
      passed: score >= context.requirements.dataIntegrity,
      score: Math.max(0, score),
      confidence: 95,
      issues,
      suggestions,
      metadata: {
        processingTime: 0,
        sourceChecked: ['internal_data'],
        lastChecked: new Date()
      }
    };
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Plagiarism detection rule
    this.rules.set('plagiarism_detection', {
      id: 'plagiarism_detection',
      name: 'Plagiarism Detection',
      category: 'plagiarism',
      severity: 'critical',
      description: 'Detect potential plagiarism by comparing against known sources',
      validator: async (content, context) => {
        if (typeof content === 'string') {
          const result = await this.detectPlagiarism(content, context);
          return {
            ruleId: 'plagiarism_detection',
            passed: result.originalityScore >= context.requirements.originalityThreshold,
            score: result.originalityScore,
            confidence: 90,
            issues: result.segments.map((seg, idx) => ({
              id: `plagiarism_${idx}`,
              type: 'plagiarism' as const,
              severity: seg.similarity > 80 ? 'critical' as const : 'major' as const,
              description: `Potential plagiarism detected (${seg.similarity.toFixed(1)}% similarity)`,
              location: { character: seg.startIndex },
              evidence: { segment: seg.text, matches: seg.matches },
              autoFixable: false
            })),
            suggestions: result.originalityScore < context.requirements.originalityThreshold 
              ? ['Rewrite flagged content in your own words', 'Add proper citations for referenced material']
              : [],
            metadata: {
              processingTime: 0,
              sourceChecked: ['plagiarism_db'],
              lastChecked: new Date()
            }
          };
        }
        return this.createPassingResult('plagiarism_detection');
      },
      enabled: true,
      weight: 0.3
    });

    // Citation validation rule
    this.rules.set('citation_validation', {
      id: 'citation_validation',
      name: 'Citation Validation',
      category: 'citation',
      severity: 'major',
      description: 'Validate citation accuracy and formatting',
      validator: async (content, context) => {
        if (content.citations && Array.isArray(content.citations)) {
          return await this.validateCitations(content.citations, context.citationStyle, context);
        }
        return this.createPassingResult('citation_validation');
      },
      enabled: true,
      weight: 0.25
    });

    // Data consistency rule
    this.rules.set('data_consistency', {
      id: 'data_consistency',
      name: 'Data Consistency',
      category: 'data',
      severity: 'major',
      description: 'Validate data consistency and integrity',
      validator: async (content, context) => {
        const defaultChecks: DataConsistencyCheck[] = [
          {
            fieldName: 'title',
            expectedType: 'string',
            requiredFields: ['title'],
            crossReferences: []
          },
          {
            fieldName: 'authors',
            expectedType: 'array',
            requiredFields: ['authors'],
            crossReferences: []
          },
          {
            fieldName: 'year',
            expectedType: 'number',
            requiredFields: ['year'],
            validationPattern: /^\d{4}$/,
            crossReferences: []
          }
        ];
        return await this.validateDataConsistency(content, defaultChecks, context);
      },
      enabled: true,
      weight: 0.2
    });

    // Format validation rule
    this.rules.set('format_validation', {
      id: 'format_validation',
      name: 'Format Validation',
      category: 'format',
      severity: 'minor',
      description: 'Validate document formatting and structure',
      validator: async (content, context) => {
        const issues: ValidationIssue[] = [];
        let score = 100;

        // Basic format checks
        if (content.title && content.title.length > 200) {
          issues.push({
            id: 'title_too_long',
            type: 'format_violation',
            severity: 'minor',
            description: 'Title exceeds recommended length (200 characters)',
            location: {},
            evidence: { titleLength: content.title.length },
            suggestedFix: 'Shorten title to under 200 characters',
            autoFixable: false
          });
          score -= 5;
        }

        return {
          ruleId: 'format_validation',
          passed: score >= 90,
          score,
          confidence: 95,
          issues,
          suggestions: issues.length > 0 ? ['Review document formatting guidelines'] : [],
          metadata: {
            processingTime: 0,
            sourceChecked: ['internal_format'],
            lastChecked: new Date()
          }
        };
      },
      enabled: true,
      weight: 0.15
    });

    // Methodology validation rule
    this.rules.set('methodology_validation', {
      id: 'methodology_validation',
      name: 'Methodology Validation',
      category: 'methodology',
      severity: 'major',
      description: 'Validate research methodology rigor and completeness',
      validator: async (content, context) => {
        // Simplified methodology validation
        return this.createPassingResult('methodology_validation');
      },
      enabled: true,
      weight: 0.1
    });
  }

  /**
   * Helper methods
   */
  private async runValidationRule(
    rule: ValidationRule,
    content: any,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const result = await rule.validator(content, context);
      result.metadata.processingTime = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        ruleId: rule.id,
        passed: false,
        score: 0,
        confidence: 0,
        issues: [{
          id: `rule_error_${rule.id}`,
          type: 'logical_error',
          severity: 'major',
          description: `Validation rule error: ${error}`,
          location: {},
          evidence: { error: String(error) },
          autoFixable: false
        }],
        suggestions: ['Contact support for assistance'],
        metadata: {
          processingTime: Date.now() - startTime,
          sourceChecked: [],
          lastChecked: new Date()
        }
      };
    }
  }

  private generateIntegrityReport(
    documentId: string,
    results: ValidationResult[],
    processingTime: number
  ): IntegrityReport {
    const categoryScores: Record<string, number> = {};
    const issues = results.flatMap(r => r.issues);
    
    // Calculate category scores
    const categories = ['plagiarism', 'citation', 'data', 'methodology', 'format', 'consistency'];
    categories.forEach(category => {
      const categoryResults = results.filter(r => this.rules.get(r.ruleId)?.category === category);
      if (categoryResults.length > 0) {
        categoryScores[category] = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
      } else {
        categoryScores[category] = 100;
      }
    });

    // Calculate overall score (weighted average)
    let overallScore = 0;
    let totalWeight = 0;
    
    results.forEach(result => {
      const rule = this.rules.get(result.ruleId);
      if (rule) {
        overallScore += result.score * rule.weight;
        totalWeight += rule.weight;
      }
    });
    
    overallScore = totalWeight > 0 ? overallScore / totalWeight : 100;

    // Count issues by severity
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalIssues > 0) {
      recommendations.push('Address all critical issues before publication');
    }
    if (majorIssues > 0) {
      recommendations.push('Review and resolve major issues for academic standards');
    }
    if (overallScore < 80) {
      recommendations.push('Consider comprehensive revision to improve overall integrity');
    }

    return {
      documentId,
      overallScore,
      categoryScores,
      totalIssues: issues.length,
      criticalIssues,
      majorIssues,
      minorIssues,
      passed: overallScore >= 80 && criticalIssues === 0,
      validationResults: results,
      recommendations,
      generatedAt: new Date(),
      processingTime
    };
  }

  private createPassingResult(ruleId: string): ValidationResult {
    return {
      ruleId,
      passed: true,
      score: 100,
      confidence: 100,
      issues: [],
      suggestions: [],
      metadata: {
        processingTime: 0,
        sourceChecked: [],
        lastChecked: new Date()
      }
    };
  }

  private segmentText(text: string, segmentSize: number): Array<{text: string, startIndex: number, endIndex: number}> {
    const words = text.split(/\s+/);
    const segments = [];
    
    for (let i = 0; i < words.length; i += segmentSize) {
      const segmentWords = words.slice(i, i + segmentSize);
      const segmentText = segmentWords.join(' ');
      const startIndex = text.indexOf(segmentWords[0]);
      const endIndex = startIndex + segmentText.length;
      
      segments.push({
        text: segmentText,
        startIndex,
        endIndex
      });
    }
    
    return segments;
  }

  private async checkSegmentSimilarity(
    segment: {text: string, startIndex: number, endIndex: number},
    sources: string[]
  ): Promise<SourceMatch[]> {
    const matches: SourceMatch[] = [];
    
    // Simple similarity check (would be replaced with actual plagiarism detection)
    const segmentHash = createHash('md5').update(segment.text.toLowerCase()).digest('hex');
    
    if (this.plagiarismDB.has(segmentHash)) {
      const matchingSources = this.plagiarismDB.get(segmentHash)!;
      
      matchingSources.forEach(source => {
        matches.push({
          source: 'database',
          title: source,
          authors: [],
          similarity: 85 + Math.random() * 15, // Simulated similarity
          matchedText: segment.text,
          confidence: 90
        });
      });
    }
    
    return matches;
  }

  private deduplicateSourceMatches(matches: SourceMatch[]): SourceMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      const key = `${match.source}_${match.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async validateDOI(doi: string): Promise<boolean> {
    try {
      const response = await fetch(`https://doi.org/${doi}`, {
        method: 'HEAD',
        headers: { 'Accept': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private validateCitationFormat(citation: any, style: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Basic format validation (would be expanded for specific styles)
    if (style === 'apa' && citation.authors) {
      // APA author format validation
      const invalidAuthors = citation.authors.filter((author: string) => 
        !/^[A-Z][a-z]+,\s[A-Z]\./.test(author)
      );
      
      if (invalidAuthors.length > 0) {
        issues.push({
          id: 'apa_author_format',
          type: 'format_violation',
          severity: 'minor',
          description: 'Authors not formatted according to APA style',
          location: {},
          evidence: { invalidAuthors },
          suggestedFix: 'Format authors as "LastName, F. M."',
          autoFixable: true
        });
      }
    }
    
    return issues;
  }

  private async verifyCitationWithOpenAlex(citation: any): Promise<boolean> {
    try {
      const query = encodeURIComponent(`${citation.title} ${citation.authors?.[0] || ''}`);
      const response = await fetch(`https://api.openalex.org/works?search=${query}&limit=1`);
      const data = await response.json();
      return data.results && data.results.length > 0;
    } catch {
      return false;
    }
  }

  private getRequiredCitationFields(type: string, style: string): string[] {
    const baseFields = ['title', 'authors', 'year'];
    
    switch (type) {
      case 'journal':
        return [...baseFields, 'source', 'volume'];
      case 'book':
        return [...baseFields, 'publisher'];
      case 'chapter':
        return [...baseFields, 'source', 'pages'];
      default:
        return baseFields;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      default: return true;
    }
  }

  private validateCrossReference(value1: any, value2: any, field1: string, field2: string): boolean {
    // Implement cross-reference validation logic
    // This is a simplified implementation
    return true;
  }

  private loadKnownSources(): void {
    // Load known academic sources for verification
    const sources = [
      'Nature',
      'Science', 
      'Cell',
      'The Lancet',
      'New England Journal of Medicine',
      'Journal of the American Medical Association',
      'Proceedings of the National Academy of Sciences',
      'Physical Review Letters',
      'Journal of Biological Chemistry',
      'Psychological Science'
    ];
    
    sources.forEach(source => this.knownSources.add(source));
  }

  /**
   * Public API methods
   */
  
  public addValidationRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeValidationRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  public getAvailableRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getStatistics(): {
    totalRules: number;
    enabledRules: number;
    cacheSize: number;
    categories: Record<string, number>;
  } {
    const rules = Array.from(this.rules.values());
    const categories = rules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      cacheSize: this.cache.size,
      categories
    };
  }

  public destroy(): void {
    this.rules.clear();
    this.cache.clear();
    this.plagiarismDB.clear();
    this.knownSources.clear();
    this.removeAllListeners();
  }
}

export default AdvancedIntegrityValidator;