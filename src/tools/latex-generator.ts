import * as fs from 'fs-extra';
import * as path from 'path';
import { CacheManager } from '../utils/cache-manager.js';
import { ErrorHandler } from '../utils/error-handler.js';

interface LaTeXGenerationOptions {
  title: string;
  discipline: string;
  citation_style?: string;
  paper_type?: 'journal' | 'conference' | 'thesis' | 'chapter';
  content_sections?: Array<{
    title: string;
    content: string;
    type: 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'custom';
  }>;
  bibliography?: Array<{
    type: 'article' | 'book' | 'inproceedings' | 'misc';
    key: string;
    title: string;
    author: string;
    year: string;
    journal?: string;
    pages?: string;
    doi?: string;
    url?: string;
  }>;
  authors?: Array<{
    name: string;
    affiliation: string;
    email?: string;
  }>;
  abstract?: string;
  keywords?: string[];
}

interface LaTeXTemplate {
  discipline: string;
  style: string;
  paperType: string;
  template: string;
  packages: string[];
  bibliography_style: string;
}

export class LaTeXGenerator {
  private cacheManager: CacheManager;
  private errorHandler: ErrorHandler;
  private templatesPath: string;
  private templates: Map<string, LaTeXTemplate>;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    this.errorHandler = new ErrorHandler();
    this.templatesPath = path.join(__dirname, '../../templates');
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Psychology templates (APA 7th Edition)
    this.templates.set('psychology:apa:journal', {
      discipline: 'psychology',
      style: 'apa',
      paperType: 'journal',
      template: this.getPsychologyAPATemplate(),
      packages: ['apa7', 'csquotes', 'babel', 'fontspec', 'geometry', 'fancyhdr', 'setspace'],
      bibliography_style: 'apa'
    });

    // Neuroscience templates (Nature format)
    this.templates.set('neuroscience:nature:journal', {
      discipline: 'neuroscience',
      style: 'nature',
      paperType: 'journal',
      template: this.getNeuroscienceNatureTemplate(),
      packages: ['article', 'natbib', 'graphicx', 'amsmath', 'amssymb', 'geometry'],
      bibliography_style: 'naturemag'
    });

    // Education templates (APA Educational format)
    this.templates.set('education:apa:journal', {
      discipline: 'education',
      style: 'apa',
      paperType: 'journal',
      template: this.getEducationAPATemplate(),
      packages: ['apa7', 'csquotes', 'babel', 'fontspec', 'geometry', 'booktabs'],
      bibliography_style: 'apa'
    });

    // Sociology templates (ASA format)
    this.templates.set('sociology:asa:journal', {
      discipline: 'sociology',
      style: 'asa',
      paperType: 'journal',
      template: this.getSociologyASATemplate(),
      packages: ['article', 'natbib', 'geometry', 'setspace', 'fancyhdr'],
      bibliography_style: 'asa'
    });

    // Anthropology templates (AAA format)  
    this.templates.set('anthropology:aaa:journal', {
      discipline: 'anthropology',
      style: 'aaa',
      paperType: 'journal',
      template: this.getAnthropologyAAATemplate(),
      packages: ['article', 'natbib', 'geometry', 'setspace', 'csquotes'],
      bibliography_style: 'aaa'
    });

    // Philosophy templates (Chicago 17th Edition)
    this.templates.set('philosophy:chicago:journal', {
      discipline: 'philosophy',
      style: 'chicago',
      paperType: 'journal',
      template: this.getPhilosophyChicagoTemplate(),
      packages: ['article', 'biblatex-chicago', 'csquotes', 'geometry', 'setspace'],
      bibliography_style: 'chicago-authordate'
    });

    // Political Science templates (APSA format)
    this.templates.set('political-science:apsa:journal', {
      discipline: 'political-science',
      style: 'apsa',
      paperType: 'journal',
      template: this.getPoliticalScienceAPSATemplate(),
      packages: ['article', 'natbib', 'geometry', 'setspace', 'fancyhdr'],
      bibliography_style: 'apsa'
    });

    // International Relations templates (Chicago/APSA)
    this.templates.set('international-relations:apsa:journal', {
      discipline: 'international-relations',
      style: 'apsa',
      paperType: 'journal',
      template: this.getInternationalRelationsTemplate(),
      packages: ['article', 'natbib', 'geometry', 'setspace', 'fancyhdr'],
      bibliography_style: 'apsa'
    });
  }

  async generateLaTeX(options: LaTeXGenerationOptions): Promise<any> {
    try {
      console.error(`📝 Generating LaTeX document: ${options.title} (${options.discipline})`);

      // Determine template key
      const citationStyle = options.citation_style || this.getDefaultCitationStyle(options.discipline);
      const paperType = options.paper_type || 'journal';
      const templateKey = `${options.discipline}:${citationStyle}:${paperType}`;
      
      // Get template
      const template = this.templates.get(templateKey);
      if (!template) {
        throw new Error(`No template found for ${options.discipline} - ${citationStyle} - ${paperType}`);
      }

      // Check cache for compiled template
      const cacheKey = `latex:${templateKey}:${options.title}`;
      let cachedResult = await this.cacheManager.getCachedLaTeXCompilation(JSON.stringify(options));
      if (cachedResult) {
        console.error(`🎯 Using cached LaTeX generation`);
        return cachedResult;
      }

      // Generate document content
      const documentContent = await this.buildDocument(options, template);
      
      // Generate bibliography if provided
      const bibliographyContent = options.bibliography ? 
        this.generateBibliography(options.bibliography, template.bibliography_style) : '';

      // Create complete LaTeX document
      const completeDocument = this.combineDocumentParts(
        template.template,
        documentContent,
        bibliographyContent,
        options
      );

      // Validate LaTeX syntax
      const validationResult = this.validateLaTeXSyntax(completeDocument);
      if (!validationResult.valid) {
        throw new Error(`LaTeX syntax error: ${validationResult.errors.join(', ')}`);
      }

      const result = {
        success: true,
        document: completeDocument,
        template_used: templateKey,
        bibliography: bibliographyContent,
        word_count: this.estimateWordCount(documentContent),
        pages_estimated: Math.ceil(this.estimateWordCount(documentContent) / 250),
        compile_ready: true,
        packages_required: template.packages,
        bibliography_style: template.bibliography_style
      };

      // Cache the result
      await this.cacheManager.cacheLaTeXCompilation(JSON.stringify(options), result);

      console.error(`✅ LaTeX generation complete: ${result.pages_estimated} pages estimated`);
      return result;

    } catch (error) {
      console.error(`❌ LaTeX generation failed:`, error);
      throw error;
    }
  }

  private getDefaultCitationStyle(discipline: string): string {
    const defaults: Record<string, string> = {
      'psychology': 'apa',
      'neuroscience': 'nature',
      'education': 'apa',
      'sociology': 'asa',
      'anthropology': 'aaa',
      'philosophy': 'chicago',
      'political-science': 'apsa',
      'international-relations': 'apsa'
    };
    return defaults[discipline] || 'apa';
  }

  private async buildDocument(options: LaTeXGenerationOptions, template: LaTeXTemplate): Promise<string> {
    let content = '';

    // Add abstract if provided
    if (options.abstract) {
      content += `\\begin{abstract}\n${this.escapeLatex(options.abstract)}\n\\end{abstract}\n\n`;
    }

    // Add keywords if provided
    if (options.keywords && options.keywords.length > 0) {
      content += `\\keywords{${options.keywords.map(k => this.escapeLatex(k)).join(', ')}}\n\n`;
    }

    // Add sections
    if (options.content_sections && options.content_sections.length > 0) {
      for (const section of options.content_sections) {
        content += this.generateSection(section, template.discipline);
      }
    } else {
      // Generate default structure
      content += this.generateDefaultSections(options.discipline);
    }

    return content;
  }

  private generateSection(section: any, discipline: string): string {
    const title = this.escapeLatex(section.title);
    const content = this.escapeLatex(section.content);
    
    let sectionContent = '';
    
    // Determine section level based on type
    switch (section.type) {
      case 'introduction':
      case 'methods':
      case 'results':  
      case 'discussion':
      case 'conclusion':
        sectionContent = `\\section{${title}}\n${content}\n\n`;
        break;
      case 'custom':
        sectionContent = `\\section{${title}}\n${content}\n\n`;
        break;
      default:
        sectionContent = `\\subsection{${title}}\n${content}\n\n`;
    }

    return sectionContent;
  }

  private generateDefaultSections(discipline: string): string {
    const sections: Record<string, string> = {
      'psychology': `
\\section{Introduction}
% Literature review and theoretical background
\\section{Method}
\\subsection{Participants}
\\subsection{Materials}
\\subsection{Procedure}
\\section{Results}
% Statistical analyses and findings
\\section{Discussion}
% Interpretation of results and implications
\\section{Conclusion}
% Summary and future directions
`,
      'neuroscience': `
\\section{Introduction}
% Background and hypotheses
\\section{Materials and Methods}
\\subsection{Participants}
\\subsection{Experimental Setup}
\\subsection{Data Acquisition}
\\subsection{Data Analysis}
\\section{Results}
% Experimental findings
\\section{Discussion}
% Interpretation and implications
`,
      'education': `
\\section{Introduction}
% Educational context and research questions
\\section{Literature Review}
% Theoretical framework
\\section{Methodology}
\\subsection{Research Design}
\\subsection{Participants}
\\subsection{Data Collection}
\\section{Results}
% Findings and analysis
\\section{Discussion and Implications}
% Educational implications
\\section{Conclusion}
`,
      'philosophy': `
\\section{Introduction}
% Philosophical problem and thesis
\\section{Background}
% Historical and theoretical context
\\section{Argument}
% Main philosophical argument
\\section{Objections and Replies}
% Counterarguments and responses
\\section{Conclusion}
% Summary and implications
`
    };

    return sections[discipline] || sections['psychology'];
  }

  private generateBibliography(bibliography: any[], style: string): string {
    let bibContent = '';
    
    for (const entry of bibliography) {
      switch (entry.type) {
        case 'article':
          bibContent += this.generateArticleEntry(entry);
          break;
        case 'book':
          bibContent += this.generateBookEntry(entry);
          break;
        case 'inproceedings':
          bibContent += this.generateConferenceEntry(entry);
          break;
        default:
          bibContent += this.generateMiscEntry(entry);
      }
    }

    return bibContent;
  }

  private generateArticleEntry(entry: any): string {
    return `@article{${entry.key},
  title={${this.escapeLatex(entry.title)}},
  author={${this.escapeLatex(entry.author)}},
  journal={${this.escapeLatex(entry.journal || '')}},
  year={${entry.year}},
  pages={${entry.pages || ''}},
  doi={${entry.doi || ''}},
  url={${entry.url || ''}}
}

`;
  }

  private generateBookEntry(entry: any): string {
    return `@book{${entry.key},
  title={${this.escapeLatex(entry.title)}},
  author={${this.escapeLatex(entry.author)}},
  publisher={${this.escapeLatex(entry.publisher || '')}},
  year={${entry.year}},
  address={${this.escapeLatex(entry.address || '')}},
  isbn={${entry.isbn || ''}}
}

`;
  }

  private generateConferenceEntry(entry: any): string {
    return `@inproceedings{${entry.key},
  title={${this.escapeLatex(entry.title)}},
  author={${this.escapeLatex(entry.author)}},
  booktitle={${this.escapeLatex(entry.booktitle || '')}},
  year={${entry.year}},
  pages={${entry.pages || ''}},
  organization={${this.escapeLatex(entry.organization || '')}}
}

`;
  }

  private generateMiscEntry(entry: any): string {
    return `@misc{${entry.key},
  title={${this.escapeLatex(entry.title)}},
  author={${this.escapeLatex(entry.author)}},
  year={${entry.year}},
  url={${entry.url || ''}},
  note={${this.escapeLatex(entry.note || '')}}
}

`;
  }

  private combineDocumentParts(
    template: string, 
    content: string, 
    bibliography: string, 
    options: LaTeXGenerationOptions
  ): string {
    let document = template;

    // Replace placeholders
    document = document.replace('{{TITLE}}', this.escapeLatex(options.title));
    document = document.replace('{{AUTHORS}}', this.formatAuthors(options.authors || []));
    document = document.replace('{{DATE}}', new Date().toLocaleDateString());
    document = document.replace('{{CONTENT}}', content);
    
    // Add bibliography if provided
    if (bibliography) {
      document = document.replace('{{BIBLIOGRAPHY}}', `
\\bibliography{references}
\\begin{filecontents}{references.bib}
${bibliography}
\\end{filecontents}
`);
    } else {
      document = document.replace('{{BIBLIOGRAPHY}}', '');
    }

    return document;
  }

  private formatAuthors(authors: any[]): string {
    if (authors.length === 0) return 'Author Name';
    
    return authors.map(author => {
      let formatted = this.escapeLatex(author.name);
      if (author.affiliation) {
        formatted += `\\thanks{${this.escapeLatex(author.affiliation)}}`;
      }
      return formatted;
    }).join(' \\and ');
  }

  private escapeLatex(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}');
  }

  private validateLaTeXSyntax(document: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for unmatched braces
    const openBraces = (document.match(/\{/g) || []).length;
    const closeBraces = (document.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check for unmatched environments
    const beginEnvs = (document.match(/\\begin\{[^}]+\}/g) || []);
    const endEnvs = (document.match(/\\end\{[^}]+\}/g) || []);
    if (beginEnvs.length !== endEnvs.length) {
      errors.push(`Unmatched environments: ${beginEnvs.length} begin, ${endEnvs.length} end`);
    }

    // Check for required sections
    if (!document.includes('\\documentclass')) {
      errors.push('Missing \\documentclass declaration');
    }
    if (!document.includes('\\begin{document}')) {
      errors.push('Missing \\begin{document}');
    }
    if (!document.includes('\\end{document}')) {
      errors.push('Missing \\end{document}');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private estimateWordCount(content: string): number {
    // Remove LaTeX commands and count words
    const cleanContent = content
      .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})*\*?/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanContent.split(' ').filter(word => word.length > 0).length;
  }

  // Template definitions
  private getPsychologyAPATemplate(): string {
    return `\\documentclass[man,12pt]{apa7}
\\usepackage[american]{babel}
\\usepackage{csquotes}
\\usepackage{fontspec}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}

\\end{document}`;
  }

  private getNeuroscienceNatureTemplate(): string {
    return `\\documentclass[10pt,twocolumn]{article}
\\usepackage{natbib}
\\usepackage{graphicx}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{margin=0.75in}

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\bibliographystyle{naturemag}

\\end{document}`;
  }

  private getEducationAPATemplate(): string {
    return `\\documentclass[man,12pt]{apa7}
\\usepackage[american]{babel}
\\usepackage{csquotes}
\\usepackage{booktabs}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}

\\end{document}`;
  }

  private getSociologyASATemplate(): string {
    return `\\documentclass[12pt]{article}
\\usepackage{natbib}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\geometry{margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\bibliographystyle{asa}

\\end{document}`;
  }

  private getAnthropologyAAATemplate(): string {
    return `\\documentclass[12pt]{article}
\\usepackage{natbib}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{csquotes}
\\geometry{margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\bibliographystyle{aaa}

\\end{document}`;
  }

  private getPhilosophyChicagoTemplate(): string {
    return `\\documentclass[12pt]{article}
\\usepackage[authordate,backend=biber]{biblatex-chicago}
\\usepackage{csquotes}
\\usepackage{geometry}
\\usepackage{setspace}
\\geometry{margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\printbibliography

\\end{document}`;
  }

  private getPoliticalScienceAPSATemplate(): string {
    return `\\documentclass[12pt]{article}
\\usepackage{natbib}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\geometry{margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\bibliographystyle{apsa}

\\end{document}`;
  }

  private getInternationalRelationsTemplate(): string {
    return `\\documentclass[12pt]{article}
\\usepackage{natbib}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\geometry{margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHORS}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

{{CONTENT}}

{{BIBLIOGRAPHY}}
\\bibliographystyle{apsa}

\\end{document}`;
  }
}

// Export function for MCP server
export async function generateLaTeX(args: LaTeXGenerationOptions): Promise<any> {
  const cacheManager = new CacheManager();
  const generator = new LaTeXGenerator(cacheManager);
  
  try {
    const result = await generator.generateLaTeX(args);
    
    return {
      content: [{
        type: 'text',
        text: `📝 **LaTeX Document Generated Successfully**\n\n` +
              `📄 **Document Details:**\n` +
              `• Title: ${args.title}\n` +
              `• Discipline: ${args.discipline}\n` +
              `• Template: ${result.template_used}\n` +
              `• Citation Style: ${result.bibliography_style}\n` +
              `• Estimated Pages: ${result.pages_estimated}\n` +
              `• Word Count: ${result.word_count.toLocaleString()}\n\n` +
              `📦 **Required Packages:**\n${result.packages_required.map((p: string) => `• ${p}`).join('\n')}\n\n` +
              `🔧 **Compilation Ready:** ${result.compile_ready ? 'Yes' : 'No'}\n\n` +
              `📋 **LaTeX Document:**\n\`\`\`latex\n${result.document.substring(0, 1500)}${result.document.length > 1500 ? '\n... (truncated for display)' : ''}\n\`\`\`\n\n` +
              `💡 **Next Steps:**\n` +
              `• Save document as .tex file\n` +
              `• Compile with pdflatex or xelatex\n` +
              `• Use "compile_to_pdf" tool for automatic compilation\n` +
              `• Review and edit content as needed`
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ **LaTeX Generation Failed**\n\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
              `**Supported Templates:**\n` +
              `• Psychology: APA 7th Edition\n` +
              `• Neuroscience: Nature format\n` +
              `• Education: APA Educational\n` +
              `• Sociology: ASA format\n` +
              `• Anthropology: AAA format\n` +
              `• Philosophy: Chicago 17th\n` +
              `• Political Science: APSA\n` +
              `• International Relations: APSA\n\n` +
              `**Paper Types:** journal, conference, thesis, chapter`
      }]
    };
  }
}