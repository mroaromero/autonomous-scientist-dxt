#!/usr/bin/env node

/**
 * Hierarchical Document Organizer v6.3
 * Advanced academic document structure with intelligent organization
 */

export interface DocumentSection {
  id: string;
  title: string;
  level: number; // 1-6 for heading levels
  order: number;
  parentId?: string;
  children: string[];
  content: {
    text: string;
    wordCount: number;
    requirements: string[];
    cognitiveSkills: string[];
    citations: string[];
    subsections: DocumentSubsection[];
  };
  metadata: {
    completed: boolean;
    reviewed: boolean;
    wordTarget: number;
    lastModified: Date;
    contributor?: string;
    version: number;
  };
}

export interface DocumentSubsection {
  id: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  requirements: string[];
  cognitiveSkills: string[];
  completed: boolean;
}

export interface DocumentStructure {
  id: string;
  title: string;
  type: 'research-paper' | 'thesis' | 'dissertation' | 'report' | 'article';
  discipline: string;
  paradigm: string;
  sections: DocumentSection[];
  metadata: {
    totalWordCount: number;
    targetWordCount: number;
    completionPercentage: number;
    created: Date;
    lastModified: Date;
    authors: string[];
    version: string;
  };
  requirements: {
    citationStyle: string;
    minimumSections: number;
    wordLimits: Record<string, { min: number; max: number }>;
    requiredSections: string[];
    optionalSections: string[];
  };
}

export interface StructureTemplate {
  name: string;
  type: DocumentStructure['type'];
  discipline: string;
  sections: Omit<DocumentSection, 'id' | 'content' | 'metadata'>[];
  requirements: DocumentStructure['requirements'];
  description: string;
}

export class HierarchicalDocumentOrganizer {
  private structures: Map<string, DocumentStructure> = new Map();
  private templates: Map<string, StructureTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Create a new document structure from template
   */
  createDocumentStructure(
    title: string,
    type: DocumentStructure['type'],
    discipline: string,
    paradigm: string,
    templateName?: string
  ): DocumentStructure {
    const id = this.generateId();
    
    const template = templateName 
      ? this.templates.get(templateName)
      : this.getBestTemplate(type, discipline);

    if (!template) {
      throw new Error(`No suitable template found for type: ${type}, discipline: ${discipline}`);
    }

    const sections = template.sections.map((sectionTemplate, index) => ({
      ...sectionTemplate,
      id: `section_${id}_${index}`,
      content: {
        text: '',
        wordCount: 0,
        requirements: [],
        cognitiveSkills: [],
        citations: [],
        subsections: []
      },
      metadata: {
        completed: false,
        reviewed: false,
        wordTarget: this.calculateWordTarget(sectionTemplate.title, type),
        lastModified: new Date(),
        version: 1
      }
    }));

    const structure: DocumentStructure = {
      id,
      title,
      type,
      discipline,
      paradigm,
      sections,
      metadata: {
        totalWordCount: 0,
        targetWordCount: this.calculateTotalWordTarget(type),
        completionPercentage: 0,
        created: new Date(),
        lastModified: new Date(),
        authors: [],
        version: '1.0.0'
      },
      requirements: template.requirements
    };

    this.structures.set(id, structure);
    return structure;
  }

  /**
   * Add a section to existing document structure
   */
  addSection(
    structureId: string,
    title: string,
    level: number,
    parentId?: string,
    insertAfter?: string
  ): DocumentSection {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const sectionId = `section_${structureId}_${Date.now()}`;
    let order = structure.sections.length;

    if (insertAfter) {
      const insertIndex = structure.sections.findIndex(s => s.id === insertAfter);
      if (insertIndex >= 0) {
        order = structure.sections[insertIndex].order + 0.5;
        // Reorder subsequent sections
        structure.sections
          .filter(s => s.order > structure.sections[insertIndex].order)
          .forEach(s => s.order += 1);
      }
    }

    const section: DocumentSection = {
      id: sectionId,
      title,
      level,
      order,
      parentId,
      children: [],
      content: {
        text: '',
        wordCount: 0,
        requirements: [],
        cognitiveSkills: [],
        citations: [],
        subsections: []
      },
      metadata: {
        completed: false,
        reviewed: false,
        wordTarget: this.calculateWordTarget(title, structure.type),
        lastModified: new Date(),
        version: 1
      }
    };

    // Update parent's children if applicable
    if (parentId) {
      const parent = structure.sections.find(s => s.id === parentId);
      if (parent) {
        parent.children.push(sectionId);
      }
    }

    structure.sections.push(section);
    structure.sections.sort((a, b) => a.order - b.order);
    
    this.updateStructureMetadata(structure);
    return section;
  }

  /**
   * Add subsection to a section
   */
  addSubsection(
    structureId: string,
    sectionId: string,
    title: string,
    requirements: string[] = [],
    cognitiveSkills: string[] = []
  ): DocumentSubsection {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const section = structure.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    const subsection: DocumentSubsection = {
      id: `subsection_${sectionId}_${Date.now()}`,
      title,
      order: section.content.subsections.length,
      content: '',
      wordCount: 0,
      requirements,
      cognitiveSkills,
      completed: false
    };

    section.content.subsections.push(subsection);
    this.updateStructureMetadata(structure);

    return subsection;
  }

  /**
   * Update section content
   */
  updateSectionContent(
    structureId: string,
    sectionId: string,
    content: string,
    citations: string[] = []
  ): void {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const section = structure.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    section.content.text = content;
    section.content.wordCount = this.countWords(content);
    section.content.citations = citations;
    section.metadata.lastModified = new Date();
    section.metadata.version += 1;

    this.updateStructureMetadata(structure);
  }

  /**
   * Update subsection content
   */
  updateSubsectionContent(
    structureId: string,
    sectionId: string,
    subsectionId: string,
    content: string
  ): void {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const section = structure.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    const subsection = section.content.subsections.find(ss => ss.id === subsectionId);
    if (!subsection) {
      throw new Error(`Subsection not found: ${subsectionId}`);
    }

    subsection.content = content;
    subsection.wordCount = this.countWords(content);
    section.metadata.lastModified = new Date();

    this.updateStructureMetadata(structure);
  }

  /**
   * Mark section as completed
   */
  markSectionCompleted(structureId: string, sectionId: string, reviewed: boolean = false): void {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const section = structure.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    section.metadata.completed = true;
    section.metadata.reviewed = reviewed;
    section.metadata.lastModified = new Date();

    this.updateStructureMetadata(structure);
  }

  /**
   * Get document structure hierarchy
   */
  getHierarchy(structureId: string): any {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const buildHierarchy = (parentId?: string): any[] => {
      return structure.sections
        .filter(section => section.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(section => ({
          ...section,
          children: buildHierarchy(section.id)
        }));
    };

    return {
      structure: {
        id: structure.id,
        title: structure.title,
        type: structure.type,
        discipline: structure.discipline,
        paradigm: structure.paradigm,
        metadata: structure.metadata
      },
      hierarchy: buildHierarchy()
    };
  }

  /**
   * Generate table of contents
   */
  generateTableOfContents(structureId: string, includeSubsections: boolean = true): string {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const buildTOC = (sections: DocumentSection[], level: number = 0): string[] => {
      const tocLines: string[] = [];

      sections.forEach(section => {
        const indent = '  '.repeat(level);
        const status = section.metadata.completed ? '✓' : '○';
        const wordCount = section.content.wordCount;
        const target = section.metadata.wordTarget;
        
        tocLines.push(`${indent}${status} ${section.title} (${wordCount}/${target} words)`);

        if (includeSubsections && section.content.subsections.length > 0) {
          section.content.subsections.forEach(subsection => {
            const subIndent = '  '.repeat(level + 1);
            const subStatus = subsection.completed ? '✓' : '○';
            tocLines.push(`${subIndent}${subStatus} ${subsection.title} (${subsection.wordCount} words)`);
          });
        }

        const children = structure.sections.filter(s => s.parentId === section.id);
        if (children.length > 0) {
          tocLines.push(...buildTOC(children, level + 1));
        }
      });

      return tocLines;
    };

    const rootSections = structure.sections.filter(s => !s.parentId);
    const tocLines = buildTOC(rootSections);

    return [
      `# Table of Contents - ${structure.title}`,
      '',
      `**Progress:** ${structure.metadata.completionPercentage.toFixed(1)}% Complete`,
      `**Word Count:** ${structure.metadata.totalWordCount}/${structure.metadata.targetWordCount}`,
      '',
      ...tocLines
    ].join('\n');
  }

  /**
   * Validate document structure
   */
  validateStructure(structureId: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    compliance: Record<string, boolean>;
  } {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    const compliance: Record<string, boolean> = {};

    // Check required sections
    structure.requirements.requiredSections.forEach(requiredSection => {
      const hasSection = structure.sections.some(s => 
        s.title.toLowerCase().includes(requiredSection.toLowerCase())
      );
      compliance[`required_${requiredSection}`] = hasSection;
      
      if (!hasSection) {
        issues.push(`Missing required section: ${requiredSection}`);
      }
    });

    // Check minimum sections
    compliance.minimum_sections = structure.sections.length >= structure.requirements.minimumSections;
    if (!compliance.minimum_sections) {
      issues.push(`Insufficient sections: ${structure.sections.length}/${structure.requirements.minimumSections}`);
    }

    // Check word limits
    Object.entries(structure.requirements.wordLimits).forEach(([sectionType, limits]) => {
      const matchingSections = structure.sections.filter(s => 
        s.title.toLowerCase().includes(sectionType.toLowerCase())
      );

      matchingSections.forEach(section => {
        const wordCount = section.content.wordCount;
        const sectionCompliance = wordCount >= limits.min && wordCount <= limits.max;
        compliance[`wordlimit_${section.id}`] = sectionCompliance;

        if (wordCount < limits.min) {
          issues.push(`${section.title}: Too few words (${wordCount}/${limits.min} minimum)`);
        } else if (wordCount > limits.max) {
          issues.push(`${section.title}: Too many words (${wordCount}/${limits.max} maximum)`);
        }
      });
    });

    // Check section hierarchy
    const orphanedSections = structure.sections.filter(s => 
      s.parentId && !structure.sections.some(parent => parent.id === s.parentId)
    );
    
    if (orphanedSections.length > 0) {
      issues.push(`Orphaned sections detected: ${orphanedSections.length}`);
    }

    // Generate suggestions
    if (structure.metadata.completionPercentage < 50) {
      suggestions.push('Focus on completing major sections first');
    }

    if (structure.metadata.totalWordCount < structure.metadata.targetWordCount * 0.8) {
      suggestions.push('Consider expanding content to meet word count targets');
    }

    const incompleteSections = structure.sections.filter(s => !s.metadata.completed);
    if (incompleteSections.length > 0) {
      suggestions.push(`Complete remaining sections: ${incompleteSections.map(s => s.title).join(', ')}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      compliance
    };
  }

  /**
   * Export document structure
   */
  exportStructure(structureId: string, format: 'json' | 'markdown' | 'latex' | 'docx'): string {
    const structure = this.structures.get(structureId);
    if (!structure) {
      throw new Error(`Document structure not found: ${structureId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(structure, null, 2);
      case 'markdown':
        return this.exportToMarkdown(structure);
      case 'latex':
        return this.exportToLaTeX(structure);
      case 'docx':
        throw new Error('DOCX export requires additional dependencies');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Psychology Research Paper Template
    this.templates.set('psychology-research', {
      name: 'Psychology Research Paper',
      type: 'research-paper',
      discipline: 'psychology',
      description: 'Standard APA format research paper for psychology',
      sections: [
        { title: 'Abstract', level: 1, order: 0, parentId: undefined, children: [] },
        { title: 'Introduction', level: 1, order: 1, parentId: undefined, children: [] },
        { title: 'Literature Review', level: 1, order: 2, parentId: undefined, children: [] },
        { title: 'Method', level: 1, order: 3, parentId: undefined, children: [] },
        { title: 'Results', level: 1, order: 4, parentId: undefined, children: [] },
        { title: 'Discussion', level: 1, order: 5, parentId: undefined, children: [] },
        { title: 'Conclusion', level: 1, order: 6, parentId: undefined, children: [] },
        { title: 'References', level: 1, order: 7, parentId: undefined, children: [] }
      ],
      requirements: {
        citationStyle: 'apa',
        minimumSections: 6,
        wordLimits: {
          abstract: { min: 150, max: 250 },
          introduction: { min: 500, max: 1000 },
          literature: { min: 1500, max: 3000 },
          method: { min: 800, max: 1500 },
          results: { min: 1000, max: 2000 },
          discussion: { min: 1200, max: 2500 }
        },
        requiredSections: ['Abstract', 'Introduction', 'Method', 'Results', 'Discussion', 'References'],
        optionalSections: ['Literature Review', 'Conclusion', 'Appendix']
      }
    });

    // Add more templates...
    this.addEducationTemplate();
    this.addSociologyTemplate();
    this.addPhilosophyTemplate();
  }

  private addEducationTemplate(): void {
    this.templates.set('education-research', {
      name: 'Education Research Study',
      type: 'research-paper',
      discipline: 'education',
      description: 'Educational research paper following standard academic format',
      sections: [
        { title: 'Abstract', level: 1, order: 0, parentId: undefined, children: [] },
        { title: 'Introduction', level: 1, order: 1, parentId: undefined, children: [] },
        { title: 'Theoretical Framework', level: 1, order: 2, parentId: undefined, children: [] },
        { title: 'Literature Review', level: 1, order: 3, parentId: undefined, children: [] },
        { title: 'Methodology', level: 1, order: 4, parentId: undefined, children: [] },
        { title: 'Findings', level: 1, order: 5, parentId: undefined, children: [] },
        { title: 'Discussion and Implications', level: 1, order: 6, parentId: undefined, children: [] },
        { title: 'Conclusion', level: 1, order: 7, parentId: undefined, children: [] },
        { title: 'References', level: 1, order: 8, parentId: undefined, children: [] }
      ],
      requirements: {
        citationStyle: 'apa',
        minimumSections: 7,
        wordLimits: {
          abstract: { min: 200, max: 300 },
          introduction: { min: 800, max: 1200 },
          theoretical: { min: 1000, max: 2000 },
          literature: { min: 2000, max: 4000 },
          methodology: { min: 1500, max: 2500 },
          findings: { min: 2000, max: 3500 },
          discussion: { min: 1500, max: 3000 }
        },
        requiredSections: ['Abstract', 'Introduction', 'Methodology', 'Findings', 'Discussion', 'References'],
        optionalSections: ['Theoretical Framework', 'Literature Review', 'Implications']
      }
    });
  }

  private addSociologyTemplate(): void {
    this.templates.set('sociology-research', {
      name: 'Sociology Research Paper',
      type: 'research-paper', 
      discipline: 'sociology',
      description: 'Sociological research paper with critical analysis focus',
      sections: [
        { title: 'Abstract', level: 1, order: 0, parentId: undefined, children: [] },
        { title: 'Introduction', level: 1, order: 1, parentId: undefined, children: [] },
        { title: 'Social Context', level: 1, order: 2, parentId: undefined, children: [] },
        { title: 'Theoretical Framework', level: 1, order: 3, parentId: undefined, children: [] },
        { title: 'Literature Review', level: 1, order: 4, parentId: undefined, children: [] },
        { title: 'Research Design', level: 1, order: 5, parentId: undefined, children: [] },
        { title: 'Analysis and Findings', level: 1, order: 6, parentId: undefined, children: [] },
        { title: 'Social Implications', level: 1, order: 7, parentId: undefined, children: [] },
        { title: 'Conclusion', level: 1, order: 8, parentId: undefined, children: [] },
        { title: 'References', level: 1, order: 9, parentId: undefined, children: [] }
      ],
      requirements: {
        citationStyle: 'asa',
        minimumSections: 8,
        wordLimits: {
          abstract: { min: 200, max: 350 },
          introduction: { min: 800, max: 1500 },
          context: { min: 1000, max: 2000 },
          theoretical: { min: 1500, max: 2500 },
          literature: { min: 2500, max: 4000 },
          methodology: { min: 1200, max: 2000 },
          analysis: { min: 2500, max: 4000 },
          implications: { min: 1000, max: 2000 }
        },
        requiredSections: ['Abstract', 'Introduction', 'Theoretical Framework', 'Research Design', 'Analysis', 'References'],
        optionalSections: ['Social Context', 'Literature Review', 'Social Implications']
      }
    });
  }

  private addPhilosophyTemplate(): void {
    this.templates.set('philosophy-paper', {
      name: 'Philosophy Paper',
      type: 'article',
      discipline: 'philosophy',
      description: 'Philosophical argument paper with logical structure',
      sections: [
        { title: 'Abstract', level: 1, order: 0, parentId: undefined, children: [] },
        { title: 'Introduction', level: 1, order: 1, parentId: undefined, children: [] },
        { title: 'Problem Statement', level: 1, order: 2, parentId: undefined, children: [] },
        { title: 'Philosophical Background', level: 1, order: 3, parentId: undefined, children: [] },
        { title: 'Argument Development', level: 1, order: 4, parentId: undefined, children: [] },
        { title: 'Objections and Responses', level: 1, order: 5, parentId: undefined, children: [] },
        { title: 'Implications', level: 1, order: 6, parentId: undefined, children: [] },
        { title: 'Conclusion', level: 1, order: 7, parentId: undefined, children: [] },
        { title: 'Bibliography', level: 1, order: 8, parentId: undefined, children: [] }
      ],
      requirements: {
        citationStyle: 'chicago',
        minimumSections: 6,
        wordLimits: {
          abstract: { min: 150, max: 250 },
          introduction: { min: 600, max: 1000 },
          problem: { min: 800, max: 1500 },
          background: { min: 1500, max: 2500 },
          argument: { min: 2000, max: 3500 },
          objections: { min: 1000, max: 2000 },
          implications: { min: 800, max: 1500 }
        },
        requiredSections: ['Introduction', 'Problem Statement', 'Argument Development', 'Conclusion', 'Bibliography'],
        optionalSections: ['Abstract', 'Philosophical Background', 'Objections and Responses', 'Implications']
      }
    });
  }

  /**
   * Helper methods
   */
  private getBestTemplate(type: DocumentStructure['type'], discipline: string): StructureTemplate | undefined {
    // Find template by discipline first, then by type
    const disciplineTemplate = Array.from(this.templates.values())
      .find(t => t.discipline === discipline && t.type === type);
    
    if (disciplineTemplate) {
      return disciplineTemplate;
    }

    // Fallback to type-based template
    return Array.from(this.templates.values())
      .find(t => t.type === type);
  }

  private calculateWordTarget(sectionTitle: string, type: DocumentStructure['type']): number {
    const baseTargets: Record<string, number> = {
      'abstract': 200,
      'introduction': 800,
      'literature': 2000,
      'method': 1200,
      'methodology': 1200,
      'results': 1500,
      'findings': 1500,
      'discussion': 2000,
      'conclusion': 600,
      'references': 0,
      'bibliography': 0
    };

    const sectionKey = sectionTitle.toLowerCase();
    for (const [key, target] of Object.entries(baseTargets)) {
      if (sectionKey.includes(key)) {
        return target;
      }
    }

    // Default target based on document type
    const typeMultipliers = {
      'research-paper': 1.0,
      'thesis': 1.5,
      'dissertation': 2.0,
      'report': 0.8,
      'article': 0.9
    };

    return Math.round(1000 * (typeMultipliers[type] || 1.0));
  }

  private calculateTotalWordTarget(type: DocumentStructure['type']): number {
    const baseTargets = {
      'research-paper': 8000,
      'thesis': 15000,
      'dissertation': 50000,
      'report': 5000,
      'article': 6000
    };

    return baseTargets[type] || 8000;
  }

  private updateStructureMetadata(structure: DocumentStructure): void {
    structure.metadata.totalWordCount = structure.sections
      .reduce((total, section) => total + section.content.wordCount, 0);
    
    structure.metadata.completionPercentage = structure.sections.length > 0
      ? (structure.sections.filter(s => s.metadata.completed).length / structure.sections.length) * 100
      : 0;
    
    structure.metadata.lastModified = new Date();
  }

  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private exportToMarkdown(structure: DocumentStructure): string {
    const lines: string[] = [
      `# ${structure.title}`,
      '',
      `**Type:** ${structure.type}`,
      `**Discipline:** ${structure.discipline}`,
      `**Paradigm:** ${structure.paradigm}`,
      `**Word Count:** ${structure.metadata.totalWordCount}/${structure.metadata.targetWordCount}`,
      `**Completion:** ${structure.metadata.completionPercentage.toFixed(1)}%`,
      '',
      '---',
      ''
    ];

    structure.sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        const headingLevel = '#'.repeat(section.level);
        lines.push(`${headingLevel} ${section.title}`);
        lines.push('');
        
        if (section.content.text) {
          lines.push(section.content.text);
          lines.push('');
        }

        section.content.subsections.forEach(subsection => {
          const subHeadingLevel = '#'.repeat(section.level + 1);
          lines.push(`${subHeadingLevel} ${subsection.title}`);
          lines.push('');
          
          if (subsection.content) {
            lines.push(subsection.content);
            lines.push('');
          }
        });
      });

    return lines.join('\n');
  }

  private exportToLaTeX(structure: DocumentStructure): string {
    const lines: string[] = [
      '\\documentclass[12pt,a4paper]{article}',
      '\\usepackage[utf8]{inputenc}',
      '\\usepackage{amsmath,amsfonts,amssymb}',
      '\\usepackage{graphicx}',
      '\\usepackage[margin=1in]{geometry}',
      '\\usepackage{setspace}',
      '\\doublespacing',
      '',
      `\\title{${structure.title}}`,
      `\\author{${structure.metadata.authors.join(' \\and ')}}`,
      '\\date{\\today}',
      '',
      '\\begin{document}',
      '\\maketitle',
      ''
    ];

    structure.sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        const sectionCommand = section.level === 1 ? 'section' : 
                              section.level === 2 ? 'subsection' :
                              'subsubsection';
        
        lines.push(`\\${sectionCommand}{${section.title}}`);
        lines.push('');
        
        if (section.content.text) {
          lines.push(section.content.text);
          lines.push('');
        }

        section.content.subsections.forEach(subsection => {
          const subSectionCommand = section.level === 1 ? 'subsection' : 'subsubsection';
          lines.push(`\\${subSectionCommand}{${subsection.title}}`);
          lines.push('');
          
          if (subsection.content) {
            lines.push(subsection.content);
            lines.push('');
          }
        });
      });

    lines.push('\\end{document}');
    return lines.join('\n');
  }

  /**
   * Get all structures
   */
  getAllStructures(): DocumentStructure[] {
    return Array.from(this.structures.values());
  }

  /**
   * Get structure by ID
   */
  getStructure(id: string): DocumentStructure | undefined {
    return this.structures.get(id);
  }

  /**
   * Delete structure
   */
  deleteStructure(id: string): boolean {
    return this.structures.delete(id);
  }

  /**
   * Get available templates
   */
  getTemplates(): StructureTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Add custom template
   */
  addTemplate(template: StructureTemplate): void {
    this.templates.set(template.name, template);
  }
}

export default HierarchicalDocumentOrganizer;