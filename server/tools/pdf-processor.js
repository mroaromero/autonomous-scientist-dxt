const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const { MemoryManager } = require('../utils/memory-manager.js');
const { LanguageDetector } = require('../utils/language-detector.js');
const { ErrorHandler } = require('../utils/error-handler.js');

class PDFProcessor {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.languageDetector = new LanguageDetector();
    this.errorHandler = new ErrorHandler();
  }

  async processPDF(options) {
    const startTime = Date.now();
    const taskId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = {
      success: false,
      content: {
        text: '',
        metadata: {},
        pages: [],
        statistics: {
          totalPages: 0,
          totalWords: 0,
          ocrPages: 0,
          processingTime: 0,
          language: 'unknown'
        },
        extracted_elements: {
          citations: [],
          figures: [],
          tables: [],
          equations: []
        }
      },
      errors: []
    };

    try {
      // Validate file exists and get size
      if (!await fs.pathExists(options.file_path)) {
        throw new Error(`PDF file not found: ${options.file_path}`);
      }

      const fileStats = await fs.stat(options.file_path);
      const fileSizeMB = fileStats.size / (1024 * 1024);
      
      console.error(`📄 Processing PDF: ${path.basename(options.file_path)} (${fileSizeMB.toFixed(1)}MB)`);

      // Check if system can handle this file size
      if (!this.memoryManager.canHandleOperation(fileSizeMB * 3)) { // Estimate 3x memory usage
        throw new Error(`PDF too large for available memory. File: ${fileSizeMB.toFixed(1)}MB, Available: ${this.memoryManager.getMemoryStats().currentUsage}`);
      }

      // Allocate memory for processing
      await this.memoryManager.allocateMemory({
        id: taskId,
        type: 'pdf',
        size: fileSizeMB * 1024 * 1024 * 3, // Estimate 3x file size for processing
        priority: 'high',
        timeout: 30 * 60 * 1000 // 30 minutes timeout
      });

      // Read PDF file
      const pdfBuffer = await fs.readFile(options.file_path);
      
      // Parse PDF with pdf-parse
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0, // Parse all pages
        version: 'v1.10.100'
      });

      result.content.metadata = pdfData.info;
      result.content.statistics.totalPages = pdfData.numpages;

      console.error(`📑 PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);

      // Detect language
      const detectedLanguage = options.language === 'auto' || !options.language 
        ? await this.languageDetector.detectLanguage(pdfData.text.substring(0, 1000))
        : options.language;
      
      result.content.statistics.language = detectedLanguage;

      // Determine if OCR is needed
      const needsOCR = this.determineOCRNeed(pdfData, options.ocr_mode);
      
      if (needsOCR) {
        console.error(`🔍 OCR required - processing with Tesseract (language: ${detectedLanguage})`);
        await this.performOCRProcessing(pdfBuffer, result, detectedLanguage, taskId);
      } else {
        // Use direct text extraction
        result.content.text = pdfData.text;
        result.content.pages = this.createPageStructure(pdfData.text, pdfData.numpages);
        console.error(`📝 Direct text extraction successful`);
      }

      // Extract academic elements
      if (options.extract_metadata) {
        await this.extractAcademicElements(result.content.text, result.content.extracted_elements, options.discipline);
      }

      // Calculate statistics
      result.content.statistics.totalWords = result.content.text.split(/\s+/).length;
      result.content.statistics.processingTime = Date.now() - startTime;
      
      result.success = true;
      console.error(`✅ PDF processing complete: ${result.content.statistics.totalWords} words in ${(result.content.statistics.processingTime / 1000).toFixed(1)}s`);

    } catch (error) {
      result.errors.push(this.errorHandler.formatError(error));
      console.error(`❌ PDF processing failed:`, error.message);
    } finally {
      // Always release memory
      this.memoryManager.releaseMemory(taskId);
    }

    return result;
  }

  determineOCRNeed(pdfData, ocrMode) {
    if (ocrMode === 'force') return true;
    if (ocrMode === 'skip') return false;
    
    // Auto-detect need for OCR
    const textLength = pdfData.text?.length || 0;
    const pageCount = pdfData.numpages || 1;
    const avgCharsPerPage = textLength / pageCount;
    
    // Heuristic: if less than 100 chars per page on average, likely scanned
    return avgCharsPerPage < 100;
  }

  async performOCRProcessing(
    pdfBuffer, 
    result, 
    language, 
    taskId
  ) {
    try {
      // Convert PDF pages to images using pdf-poppler (would need to be installed)
      // For now, we'll simulate OCR processing with Tesseract
      
      // Configure Tesseract for academic documents
      const tesseractOptions = {
        lang: this.mapLanguageToTesseract(language),
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.error(`🔍 OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        tessedit_char_whitelist: this.getCharacterWhitelist(language),
      };

      // In a real implementation, we would:
      // 1. Convert PDF pages to images using pdf2pic or similar
      // 2. Enhance image quality with Sharp
      // 3. Process each image with Tesseract
      // 4. Combine results
      
      // Simulated OCR result for now
      const ocrText = `[OCR PROCESSING SIMULATED]\nThis would contain the OCR-extracted text from the PDF.\nLanguage: ${language}\nPages processed with OCR.\n`;
      
      result.content.text = ocrText;
      result.content.statistics.ocrPages = result.content.statistics.totalPages;
      
      // Create page structure for OCR results
      result.content.pages = Array.from({ length: result.content.statistics.totalPages }, (_, i) => ({
        pageNumber: i + 1,
        text: `Page ${i + 1} OCR text would go here...`,
        hasImages: true,
        ocrApplied: true,
        confidence: 85 // Simulated confidence score
      }));

    } catch (error) {
      console.error(`❌ OCR processing failed:`, error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  mapLanguageToTesseract(language) {
    const langMap = {
      'en': 'eng',
      'es': 'spa', 
      'de': 'deu',
      'fr': 'fra',
      'it': 'ita',
      'pt': 'por',
      'la': 'lat',
      'grc': 'grc', // Ancient Greek
      'ru': 'rus',
      'zh': 'chi_sim',
      'ja': 'jpn',
      'ar': 'ara'
    };

    return langMap[language] || 'eng';
  }

  getCharacterWhitelist(language) {
    // Base Latin characters
    let whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"\'-/\\@#$%&*+=<>|~`^_';
    
    // Add language-specific characters
    const languageChars = {
      'es': 'ñáéíóúüÑÁÉÍÓÚÜ¿¡',
      'de': 'äöüßÄÖÜ',
      'fr': 'àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ',
      'it': 'àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ',
      'pt': 'ãâáàêéíõôóúçÃÂÁÀÊÉÍÕÔÓÚÇ'
    };

    if (languageChars[language]) {
      whitelist += languageChars[language];
    }

    return whitelist;
  }

  createPageStructure(text, pageCount) {
    // Simple page splitting - in practice would need more sophisticated logic
    const avgCharsPerPage = Math.ceil(text.length / pageCount);
    const pages = [];
    
    for (let i = 0; i < pageCount; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, text.length);
      
      pages.push({
        pageNumber: i + 1,
        text: text.substring(start, end),
        hasImages: false,
        ocrApplied: false
      });
    }
    
    return pages;
  }

  async extractAcademicElements(
    text, 
    elements,
    discipline
  ) {
    try {
      // Extract citations using regex patterns
      elements.citations = this.extractCitations(text);
      
      // Extract figures and tables
      elements.figures = this.extractFigures(text);
      elements.tables = this.extractTables(text);
      
      // Extract equations (LaTeX or mathematical notation)
      elements.equations = this.extractEquations(text);
      
      console.error(`📊 Extracted elements: ${elements.citations.length} citations, ${elements.figures.length} figures, ${elements.tables.length} tables, ${elements.equations.length} equations`);
      
    } catch (error) {
      console.error(`⚠️ Error extracting academic elements:`, error);
    }
  }

  extractCitations(text) {
    const citations = [];
    
    // Various citation patterns
    const patterns = [
      // APA style: (Author, Year)
      /\([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+\d{4}\)/g,
      // Numbered citations: [1], [2-5], etc.
      /\[\d+(?:-\d+)?\]/g,
      // DOI patterns
      /10\.\d{4,}\/[^\s]+/g,
      // Simple author-year: Smith (2020)
      /[A-Z][a-z]+\s+\(\d{4}\)/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        citations.push(...matches);
      }
    }

    // Remove duplicates and return
    return [...new Set(citations)];
  }

  extractFigures(text) {
    const figures = [];
    
    // Patterns for figure captions
    const figurePatterns = [
      /Figure\s+\d+[.:]\s+([^\n]+)/gi,
      /Fig\.\s+\d+[.:]\s+([^\n]+)/gi,
      /Figura\s+\d+[.:]\s+([^\n]+)/gi, // Spanish
      /Abbildung\s+\d+[.:]\s+([^\n]+)/gi // German
    ];

    for (const pattern of figurePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        figures.push({
          page: 1, // Would need actual page detection
          caption: match[1].trim(),
          type: 'figure'
        });
      }
    }

    return figures;
  }

  extractTables(text) {
    const tables = [];
    
    // Patterns for table captions
    const tablePatterns = [
      /Table\s+\d+[.:]\s+([^\n]+)/gi,
      /Tabla\s+\d+[.:]\s+([^\n]+)/gi, // Spanish
      /Tabelle\s+\d+[.:]\s+([^\n]+)/gi // German
    ];

    for (const pattern of tablePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        tables.push({
          page: 1, // Would need actual page detection
          caption: match[1].trim()
        });
      }
    }

    return tables;
  }

  extractEquations(text) {
    const equations = [];
    
    // LaTeX equation patterns
    const equationPatterns = [
      /\\begin\{equation\}(.*?)\\end\{equation\}/gs,
      /\$\$(.*?)\$\$/gs,
      /\\\[(.*?)\\\]/gs
    ];

    for (const pattern of equationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        equations.push(...matches);
      }
    }

    return equations;
  }
}

// Export function for MCP server
async function processPDF(args, memoryManager) {
  const processor = new PDFProcessor(memoryManager);
  const result = await processor.processPDF(args);
  
  if (result.success) {
    return {
      content: [{
        type: 'text',
        text: `🔬 **PDF Processing Complete**\n\n` +
              `📄 **File:** ${path.basename(args.file_path)}\n` +
              `📊 **Statistics:**\n` +
              `• Pages: ${result.content.statistics.totalPages}\n` +
              `• Words: ${result.content.statistics.totalWords.toLocaleString()}\n` +
              `• Language: ${result.content.statistics.language}\n` +
              `• OCR Pages: ${result.content.statistics.ocrPages}\n` +
              `• Processing Time: ${(result.content.statistics.processingTime / 1000).toFixed(1)}s\n\n` +
              `📚 **Extracted Elements:**\n` +
              `• Citations: ${result.content.extracted_elements.citations.length}\n` +
              `• Figures: ${result.content.extracted_elements.figures.length}\n` +
              `• Tables: ${result.content.extracted_elements.tables.length}\n` +
              `• Equations: ${result.content.extracted_elements.equations.length}\n\n` +
              `📝 **Content Preview:**\n${result.content.text.substring(0, 500)}${result.content.text.length > 500 ? '...' : ''}\n\n` +
              `✅ **Ready for analysis!** Use "analyze_by_discipline" to perform academic analysis.`
      }]
    };
  } else {
    return {
      content: [{
        type: 'text', 
        text: `❌ **PDF Processing Failed**\n\n` +
              `**Errors:**\n${result.errors.join('\n')}\n\n` +
              `**Troubleshooting:**\n` +
              `• Ensure PDF file exists and is readable\n` +
              `• Check available system memory\n` +
              `• Try with OCR mode 'skip' for large files\n` +
              `• Verify file is not corrupted`
      }]
    };
  }
}

module.exports = {
  PDFProcessor,
  processPDF
};