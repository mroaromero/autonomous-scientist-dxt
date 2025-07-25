const axios = require('axios');
const { SecurityManager } = require('../utils/security.js');
const { CacheManager } = require('../utils/cache-manager.js');
const xml2js = require('xml2js');


class ArXivEnhancedManager {
  constructor(cacheManager) {
    this.securityManager = new SecurityManager();
    this.cacheManager = cacheManager;
    this.baseUrl = 'http://export.arxiv.org/api/query';
    
    // ArXiv subject classifications
    this.subjectClasses = {
    'cs': 'Computer Science',
    'math': 'Mathematics', 
    'physics': 'Physics',
    'astro-ph': 'Astrophysics',
    'cond-mat': 'Condensed Matter',
    'gr-qc': 'General Relativity and Quantum Cosmology',
    'hep-ex': 'High Energy Physics - Experiment',
    'hep-lat': 'High Energy Physics - Lattice',
    'hep-ph': 'High Energy Physics - Phenomenology',
    'hep-th': 'High Energy Physics - Theory',
    'math-ph': 'Mathematical Physics',
    'nlin': 'Nonlinear Sciences',
    'nucl-ex': 'Nuclear Experiment',
    'nucl-th': 'Nuclear Theory',
    'quant-ph': 'Quantum Physics',
    'q-bio': 'Quantitative Biology',
    'q-fin': 'Quantitative Finance',
    'stat': 'Statistics',
    'eess': 'Electrical Engineering and Systems Science',
    'econ': 'Economics'
  };


  async searchArXivAdvanced(options) {
    const startTime = Date.now();
    const {
      query,
      category,
      author,
      title,
      abstract,
      date_range,
      max_results = 50,
      start = 0,
      sort_by = 'relevance',
      sort_order = 'descending'
    } = options;

    console.error(`🔬 ArXiv Advanced Search: "${query}"`);

    // Check cache first
    const cacheKey = `arxiv:${JSON.stringify(options)}`;
    const cachedResult = await this.cacheManager.getCachedSearchResults(cacheKey, 'arxiv');
    if (cachedResult) {
      console.error('🎯 Using cached ArXiv results');
      return cachedResult;
    }

    try {
      // Build advanced search query
      const searchQuery = this.buildAdvancedQuery(query, category, author, title, abstract, date_range);
      
      const params = {
        search_query: searchQuery,
        start: start,
        max_results: Math.min(max_results, 200), // ArXiv API limit
        sortBy: sort_by,
        sortOrder: sort_order
      };

      console.error(`📡 ArXiv Query: ${searchQuery}`);

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 45000,
        headers: {
          'User-Agent': 'Autonomous-Scientist/6.0 (Enhanced ArXiv Research Tool)'
        }
      });

      // Parse XML response with full metadata
      const parsedData = await this.parseArXivXMLAdvanced(response.data);
      
      const result: ArXivSearchResult = {
        query: searchQuery,
        total_results: parsedData.totalResults,
        start_index: parsedData.startIndex,
        items_per_page: parsedData.itemsPerPage,
        papers: parsedData.papers,
        search_time: Date.now() - startTime,
        categories_found: [...new Set(parsedData.papers.flatMap(p => p.categories))],
        date_range_covered: this.calculateDateRange(parsedData.papers)
      };

      // Cache the results
      await this.cacheManager.cacheSearchResults(cacheKey, 'arxiv', result);

      console.error(`✅ ArXiv search complete: ${result.papers.length} papers found in ${(result.search_time / 1000).toFixed(1)}s`);
      
      return result;

    } catch (error) {
      console.error('ArXiv Enhanced search error:', error.message);
      throw new Error(`ArXiv search failed: ${error.message}`);
    }
  }

  buildAdvancedQuery(
    query,
    category, 
    author,
    title,
    abstract,
    dateRange
  ) {
    const queryParts: string[] = [];

    // Main query - search in all fields if no specific field specified
    if (query) {
      queryParts.push(`all:${encodeURIComponent(query)}`);
    }

    // Specific field searches
    if (title) {
      queryParts.push(`ti:${encodeURIComponent(title)}`);
    }

    if (author) {
      queryParts.push(`au:${encodeURIComponent(author)}`);
    }

    if (abstract) {
      queryParts.push(`abs:${encodeURIComponent(abstract)}`);
    }

    if (category) {
      queryParts.push(`cat:${encodeURIComponent(category)}`);
    }

    // Date range filtering
    if (dateRange?.start_date && dateRange?.end_date) {
      queryParts.push(`submittedDate:[${dateRange.start_date}+TO+${dateRange.end_date}]`);
    } else if (dateRange?.start_year) {
      const startDate = `${dateRange.start_year}0101`;
      const endDate = `${dateRange.end_year || new Date().getFullYear()}1231`;
      queryParts.push(`submittedDate:[${startDate}+TO+${endDate}]`);
    }

    return queryParts.join('+AND+');
  }

  async parseArXivXMLAdvanced(xmlData) {
    try {
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });

      const parsed = await parser.parseStringPromise(xmlData);
      const feed = parsed.feed;

      // Extract feed metadata
      const totalResults = parseInt(feed.opensearch_totalresults || '0');
      const startIndex = parseInt(feed.opensearch_startindex || '0');
      const itemsPerPage = parseInt(feed.opensearch_itemsperpage || '0');

      // Handle single entry vs array of entries
      let entries = feed.entry;
      if (!entries) {
        entries = [];
      } else if (!Array.isArray(entries)) {
        entries = [entries];
      }

      const papers = entries.map((entry) => {
        // Extract ArXiv ID from entry ID
        const entryId = entry.id || '';
        const arxivId = entryId.split('/abs/')[1] || '';

        // Parse authors
        let authors = [];
        if (entry.author) {
          const authorData = Array.isArray(entry.author) ? entry.author : [entry.author];
          authors = authorData.map((auth: any) => ({
            name: auth.name || 'Unknown',
            affiliation: auth.arxiv_affiliation || undefined
          }));
        }

        // Parse categories
        let categories = [];
        let primaryCategory = '';
        if (entry.arxiv_primary_category) {
          primaryCategory = entry.arxiv_primary_category.term || '';
        }
        if (entry.category) {
          const catData = Array.isArray(entry.category) ? entry.category : [entry.category];
          categories = catData.map((cat: any) => cat.term).filter(Boolean);
        }

        // Parse links
        const links = [];
        if (entry.link) {
          const linkData = Array.isArray(entry.link) ? entry.link : [entry.link];
          links.push(...linkData.map((link: any) => ({
            href: link.href || '',
            rel: link.rel || '',
            type: link.type || '',
            title: link.title || undefined
          })));
        }

        // Find PDF URL
        const pdfLink = links.find(l => l.type === 'application/pdf');
        const pdfUrl = pdfLink?.href || entryId.replace('/abs/', '/pdf/') + '.pdf';

        return {
          id: entryId,
          arxiv_id: arxivId,
          title: entry.title || 'Untitled',
          authors: authors,
          abstract: entry.summary || '',
          categories: categories,
          primary_category: primaryCategory,
          published_date: entry.published || '',
          updated_date: entry.updated || '',
          doi: entry.arxiv_doi || undefined,
          journal_ref: entry.arxiv_journal_ref || undefined,
          pdf_url: pdfUrl,
          abs_url: entryId,
          comment: entry.arxiv_comment || undefined,
          msc_class: entry.arxiv_msc_class || undefined,
          acm_class: entry.arxiv_acm_class || undefined,
          report_no: entry.arxiv_report_no || undefined,
          links: links
        };
      });

      return {
        totalResults,
        startIndex,
        itemsPerPage,
        papers
      };

    } catch (error) {
      console.error('XML parsing error:', error);
      throw new Error('Failed to parse ArXiv XML response');
    }
  }

  calculateDateRange(papers) {
    if (papers.length === 0) {
      return { earliest: '', latest: '' };
    }

    const dates = papers
      .map(p => p.published_date)
      .filter(Boolean)
      .sort();

    return {
      earliest: dates[0] || '',
      latest: dates[dates.length - 1] || ''
    };
  }

  async getCategoryStatistics(category) {
    try {
      // Get recent papers in category for statistics
      const searchOptions = {
        query: '*',
        category: category,
        max_results: 200,
        sort_by: 'submittedDate',
        sort_order: 'descending',
        date_range: {
          start_year: new Date().getFullYear() - 1
        }
      };

      const results = await this.searchArXivAdvanced(searchOptions);
      
      // Calculate statistics
      const categoryCounts: { [key: string]: number } = {};
      const authorCounts: { [key: string]: number } = {};
      const monthlySubmissions: { [key: string]: number } = {};

      results.papers.forEach(paper => {
        // Category statistics
        paper.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Author statistics (top authors)
        paper.authors.slice(0, 3).forEach(author => {
          authorCounts[author.name] = (authorCounts[author.name] || 0) + 1;
        });

        // Monthly submission statistics
        if (paper.published_date) {
          const month = paper.published_date.substring(0, 7); // YYYY-MM
          monthlySubmissions[month] = (monthlySubmissions[month] || 0) + 1;
        }
      });

      // Sort and limit results
      const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      const topAuthors = Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20);

      return {
        category_filter: category || 'all',
        total_papers_analyzed: results.papers.length,
        date_range: results.date_range_covered,
        top_categories: topCategories.map(([cat, count]) => ({
          category: cat,
          name: this.subjectClasses[cat.split('.')[0]] || cat,
          count
        })),
        top_authors: topAuthors.map(([author, count]) => ({
          author,
          papers: count
        })),
        monthly_submissions: Object.entries(monthlySubmissions)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 12),
        subject_areas_available: Object.entries(this.subjectClasses)
      };

    } catch (error) {
      console.error('Failed to get ArXiv statistics:', error);
      throw error;
    }
  }
}

// Export functions for MCP server
async function searchArXivAdvanced(args) {
  const cacheManager = new CacheManager();
  const arxivManager = new ArXivEnhancedManager(cacheManager);

  try {
    const result = await arxivManager.searchArXivAdvanced(args);

    // Format top results for display
    const topPapers = result.papers.slice(0, 10);
    const papersList = topPapers.map((paper, index) => {
      const authors = paper.authors.slice(0, 3).map(a => a.name).join(', ') + 
                     (paper.authors.length > 3 ? ' et al.' : '');
      const categories = paper.categories.slice(0, 3).join(', ');
      const publishedDate = new Date(paper.published_date).toLocaleDateString();
      
      return `${index + 1}. **${paper.title}**\n` +
             `   Authors: ${authors}\n` +
             `   Categories: ${categories}\n` +
             `   Published: ${publishedDate}\n` +
             `   ArXiv ID: ${paper.arxiv_id}\n` +
             `   PDF: ${paper.pdf_url}\n` +
             `   Abstract: ${paper.abstract.substring(0, 150)}...\n`;
    }).join('\n');

    return {
      content: [{
        type: 'text',
        text: `🔬 **ArXiv Enhanced Search Results**\n\n` +
              `**Query:** "${result.query}"\n` +
              `**Total Results:** ${result.total_results} papers found\n` +
              `**Search Time:** ${(result.search_time / 1000).toFixed(1)} seconds\n` +
              `**Date Range:** ${result.date_range_covered.earliest} to ${result.date_range_covered.latest}\n\n` +
              `**Categories Found:** ${result.categories_found.slice(0, 5).join(', ')}\n\n` +
              `**Top 10 Results:**\n\n${papersList}\n` +
              `**Advanced Features Used:**\n` +
              `• Enhanced XML parsing with full metadata\n` +
              `• Category and author filtering\n` +
              `• Date range analysis\n` +
              `• Direct PDF access links\n` +
              `• Journal references when available\n\n` +
              `**Next Steps:**\n` +
              `• Use "get_arxiv_statistics" for category analysis\n` +
              `• Use "process_academic_pdf" to analyze paper PDFs\n` +
              `• Use "analyze_by_discipline" for field-specific analysis\n` +
              `• Refine search with specific categories or authors`
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ **ArXiv Enhanced Search Failed**\n\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
              `**Troubleshooting:**\n` +
              `• Check internet connection\n` +
              `• Verify search query syntax\n` +
              `• Try simpler search terms\n` +
              `• Reduce max_results if timeout occurs\n\n` +
              `**Available Search Fields:**\n` +
              `• all: Search all fields\n` +
              `• ti: Search titles only\n` +
              `• au: Search authors\n` +
              `• abs: Search abstracts\n` +
              `• cat: Search categories\n\n` +
              `**Example Advanced Query:**\n` +
              `• Query: "machine learning", Category: "cs.LG", Author: "Smith"`
      }]
    };
  }
}

async function getArXivStatistics(args) {
  const cacheManager = new CacheManager();
  const arxivManager = new ArXivEnhancedManager(cacheManager);

  try {
    const stats = await arxivManager.getCategoryStatistics(args.category);

    const categoriesList = stats.top_categories.map((cat: any, index: number) => 
      `${index + 1}. ${cat.name} (${cat.category}): ${cat.count} papers`
    ).join('\n');

    const authorsList = stats.top_authors.slice(0, 10).map((author, index) =>
      `${index + 1}. ${author.author}: ${author.papers} papers`
    ).join('\n');

    const monthlyData = stats.monthly_submissions.map(([month, count]) =>
      `${month}: ${count} papers`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `📊 **ArXiv Statistics Analysis**\n\n` +
              `**Category Filter:** ${stats.category_filter}\n` +
              `**Papers Analyzed:** ${stats.total_papers_analyzed}\n` +
              `**Date Range:** ${stats.date_range.earliest} to ${stats.date_range.latest}\n\n` +
              `**Top Categories:**\n${categoriesList}\n\n` +
              `**Most Active Authors:**\n${authorsList}\n\n` +
              `**Monthly Submission Trends:**\n${monthlyData}\n\n` +
              `**Available Subject Areas:**\n` +
              `${Object.entries(stats.subject_areas_available).slice(0, 10).map(([code, name]) => 
                `• ${code}: ${name}`).join('\n')}\n\n` +
              `**Research Insights:**\n` +
              `• Peak submission months indicate research cycles\n` +
              `• Category distribution shows field activity\n` +
              `• Author frequency indicates research leaders\n` +
              `• Use specific categories for focused searches`
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ **ArXiv Statistics Failed**\n\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
              `**Available Categories:**\n` +
              `• cs: Computer Science\n` +
              `• math: Mathematics\n` +
              `• physics: Physics\n` +
              `• q-bio: Quantitative Biology\n` +
              `• stat: Statistics\n` +
              `• econ: Economics\n\n` +
              `Try: get_arxiv_statistics with category parameter`
      }]
    };
  }
}

module.exports = {
  ArXivEnhancedManager,
  searchArXivAdvanced,
  getArXivStatistics
};