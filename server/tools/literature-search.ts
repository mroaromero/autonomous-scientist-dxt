import axios from 'axios';
import { SecurityManager } from '../utils/security.js';
import { CacheManager } from '../utils/cache-manager.js';

interface LiteratureSearchOptions {
  query: string;
  discipline?: string;
  date_range?: {
    start_year?: number;
    end_year?: number;
  };
  max_results?: number;
  sources?: string[];
}

interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  journal?: string;
  doi?: string;
  url?: string;
  citation_count?: number;
  pdf_url?: string;
  source: string;
  relevance_score?: number;
}

interface ComprehensiveSearchResult {
  query: string;
  total_results: number;
  results_by_source: {
    semantic_scholar: SearchResult[];
    arxiv: SearchResult[];
    crossref: SearchResult[];
  };
  combined_results: SearchResult[];
  search_time: number;
  recommendations: string[];
}

export class LiteratureSearchManager {
  private securityManager: SecurityManager;
  private cacheManager: CacheManager;
  
  constructor(cacheManager: CacheManager) {
    this.securityManager = new SecurityManager();
    this.cacheManager = cacheManager;
  }

  async searchLiterature(options: LiteratureSearchOptions): Promise<ComprehensiveSearchResult> {
    const startTime = Date.now();
    const { query, discipline, date_range, max_results = 50, sources = ['semantic_scholar', 'arxiv', 'crossref'] } = options;

    console.error(`🔍 Starting comprehensive literature search: "${query}"`);

    // Check cache first
    const cacheKey = `search:${JSON.stringify(options)}`;
    let cachedResult = await this.cacheManager.getCachedSearchResults(query, 'comprehensive');
    if (cachedResult) {
      console.error(`🎯 Using cached search results`);
      return cachedResult;
    }

    const result: ComprehensiveSearchResult = {
      query,
      total_results: 0,
      results_by_source: {
        semantic_scholar: [],
        arxiv: [],
        crossref: []
      },
      combined_results: [],
      search_time: 0,
      recommendations: []
    };

    // Search each source in parallel
    const searchPromises = [];

    if (sources.includes('semantic_scholar')) {
      searchPromises.push(this.searchSemanticScholar(query, max_results, date_range));
    }

    if (sources.includes('arxiv')) {
      searchPromises.push(this.searchArXiv(query, max_results, date_range));
    }

    if (sources.includes('crossref')) {
      searchPromises.push(this.searchCrossRef(query, max_results, date_range));
    }

    try {
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Process results from each source
      let sourceIndex = 0;
      if (sources.includes('semantic_scholar')) {
        const semanticResult = searchResults[sourceIndex];
        if (semanticResult.status === 'fulfilled') {
          result.results_by_source.semantic_scholar = semanticResult.value;
          console.error(`📚 Semantic Scholar: ${semanticResult.value.length} results`);
        } else {
          console.error(`❌ Semantic Scholar search failed:`, semanticResult.reason?.message);
        }
        sourceIndex++;
      }

      if (sources.includes('arxiv')) {
        const arxivResult = searchResults[sourceIndex];
        if (arxivResult.status === 'fulfilled') {
          result.results_by_source.arxiv = arxivResult.value;
          console.error(`📄 ArXiv: ${arxivResult.value.length} results`);
        } else {
          console.error(`❌ ArXiv search failed:`, arxivResult.reason?.message);
        }
        sourceIndex++;
      }

      if (sources.includes('crossref')) {
        const crossrefResult = searchResults[sourceIndex];
        if (crossrefResult.status === 'fulfilled') {
          result.results_by_source.crossref = crossrefResult.value;
          console.error(`🏛️ CrossRef: ${crossrefResult.value.length} results`);
        } else {
          console.error(`❌ CrossRef search failed:`, crossrefResult.reason?.message);
        }
      }

      // Combine and deduplicate results
      result.combined_results = this.combineAndDeduplicateResults(result.results_by_source);
      result.total_results = result.combined_results.length;
      result.search_time = Date.now() - startTime;

      // Generate recommendations
      result.recommendations = this.generateSearchRecommendations(result, options);

      // Cache the results
      await this.cacheManager.cacheSearchResults(query, 'comprehensive', result);

      console.error(`✅ Literature search complete: ${result.total_results} unique papers found in ${(result.search_time / 1000).toFixed(1)}s`);
      
      return result;

    } catch (error) {
      console.error(`❌ Literature search failed:`, error);
      throw error;
    }
  }

  private async searchSemanticScholar(query: string, maxResults: number, dateRange?: any): Promise<SearchResult[]> {
    try {
      const apiKey = await this.securityManager.retrieveAPIKey('semantic_scholar');
      const headers: any = {
        'User-Agent': 'Autonomous-Scientist/6.0 (Research Tool)'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Build query parameters
      const params: any = {
        query: query,
        limit: Math.min(maxResults, 100), // API limit
        fields: 'paperId,title,authors,year,abstract,journal,citationCount,openAccessPdf,url,venue'
      };

      if (dateRange?.start_year) {
        params.year = `${dateRange.start_year}-${dateRange.end_year || new Date().getFullYear()}`;
      }

      const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        headers,
        params,
        timeout: 30000
      });

      return response.data.data.map((paper: any) => ({
        id: paper.paperId,
        title: paper.title || 'Untitled',
        authors: paper.authors?.map((a: any) => a.name) || ['Unknown'],
        year: paper.year || 0,
        abstract: paper.abstract,
        journal: paper.journal?.name || paper.venue,
        doi: paper.externalIds?.DOI,
        url: paper.url,
        citation_count: paper.citationCount,
        pdf_url: paper.openAccessPdf?.url,
        source: 'semantic_scholar',
        relevance_score: paper.citationCount || 0
      }));

    } catch (error: any) {
      console.error('Semantic Scholar search error:', error.message);
      if (error.response?.status === 429) {
        throw new Error('Semantic Scholar rate limit exceeded. Please try again later.');
      }
      return [];
    }
  }

  private async searchArXiv(query: string, maxResults: number, dateRange?: any): Promise<SearchResult[]> {
    try {
      // ArXiv API query construction
      let searchQuery = `all:${encodeURIComponent(query)}`;
      
      // Add date range if specified
      if (dateRange?.start_year) {
        searchQuery += `+AND+submittedDate:[${dateRange.start_year}0101+TO+${dateRange.end_year || new Date().getFullYear()}1231]`;
      }

      const params = {
        search_query: searchQuery,
        start: 0,
        max_results: Math.min(maxResults, 100),
        sortBy: 'relevance',
        sortOrder: 'descending'
      };

      const response = await axios.get('http://export.arxiv.org/api/query', {
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'Autonomous-Scientist/6.0 (Research Tool)'
        }
      });

      // Parse XML response (simplified)
      const results = this.parseArXivXML(response.data);
      
      return results.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        abstract: paper.abstract,
        journal: 'arXiv preprint',
        doi: paper.doi,
        url: paper.url,
        pdf_url: paper.pdf_url,
        source: 'arxiv',
        relevance_score: paper.year // Use recency as relevance for preprints
      }));

    } catch (error: any) {
      console.error('ArXiv search error:', error.message);
      return [];
    }
  }

  private async searchCrossRef(query: string, maxResults: number, dateRange?: any): Promise<SearchResult[]> {
    try {
      const apiKey = await this.securityManager.retrieveAPIKey('crossref');
      const headers: any = {
        'User-Agent': 'Autonomous-Scientist/6.0 (mailto:research@example.com)' // Polite pool
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const params: any = {
        query: query,
        rows: Math.min(maxResults, 100),
        sort: 'relevance',
        order: 'desc'
      };

      if (dateRange?.start_year) {
        params['filter'] = `from-pub-date:${dateRange.start_year},until-pub-date:${dateRange.end_year || new Date().getFullYear()}`;
      }

      const response = await axios.get('https://api.crossref.org/works', {
        headers,
        params,
        timeout: 30000
      });

      return response.data.message.items.map((item: any) => ({
        id: item.DOI,
        title: item.title?.[0] || 'Untitled',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown'],
        year: item.published?.['date-parts']?.[0]?.[0] || 0,
        abstract: item.abstract,
        journal: item['container-title']?.[0],
        doi: item.DOI,
        url: item.URL,
        citation_count: item['is-referenced-by-count'],
        source: 'crossref',
        relevance_score: item['is-referenced-by-count'] || 0
      }));

    } catch (error: any) {
      console.error('CrossRef search error:', error.message);
      return [];
    }
  }

  private parseArXivXML(xmlData: string): any[] {
    // Simplified XML parsing for ArXiv results
    // In a real implementation, use a proper XML parser
    const results: any[] = [];
    
    // Basic regex-based extraction (this is a simplification)
    const entryRegex = /<entry>(.*?)<\/entry>/gs;
    const matches = xmlData.match(entryRegex);
    
    if (matches) {
      for (const match of matches.slice(0, 50)) { // Limit results
        const titleMatch = match.match(/<title>(.*?)<\/title>/s);
        const authorMatches = match.match(/<name>(.*?)<\/name>/gs);
        const abstractMatch = match.match(/<summary>(.*?)<\/summary>/s);
        const publishedMatch = match.match(/<published>(.*?)<\/published>/);
        const idMatch = match.match(/<id>(.*?)<\/id>/);
        const linkMatches = match.match(/<link[^>]*href="([^"]*)"[^>]*type="application\/pdf"/);

        results.push({
          id: idMatch?.[1]?.split('/').pop() || '',
          title: titleMatch?.[1]?.trim() || 'Untitled',
          authors: authorMatches?.map(a => a.replace(/<\/?name>/g, '').trim()) || ['Unknown'],
          year: publishedMatch?.[1] ? new Date(publishedMatch[1]).getFullYear() : 0,
          abstract: abstractMatch?.[1]?.trim(),
          doi: null,
          url: idMatch?.[1],
          pdf_url: linkMatches?.[1]
        });
      }
    }
    
    return results;
  }

  private combineAndDeduplicateResults(resultsBySource: any): SearchResult[] {
    const combined: SearchResult[] = [];
    const seenTitles = new Set<string>();
    const seenDOIs = new Set<string>();

    // Combine all results
    const allResults = [
      ...resultsBySource.semantic_scholar,
      ...resultsBySource.arxiv,
      ...resultsBySource.crossref
    ];

    // Deduplicate by title and DOI
    for (const result of allResults) {
      const normalizedTitle = this.normalizeTitle(result.title);
      const isDuplicateTitle = seenTitles.has(normalizedTitle);
      const isDuplicateDOI = result.doi && seenDOIs.has(result.doi);

      if (!isDuplicateTitle && !isDuplicateDOI) {
        combined.push(result);
        seenTitles.add(normalizedTitle);
        if (result.doi) {
          seenDOIs.add(result.doi);
        }
      }
    }

    // Sort by relevance score (descending)
    return combined.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateSearchRecommendations(result: ComprehensiveSearchResult, options: LiteratureSearchOptions): string[] {
    const recommendations: string[] = [];

    // Check result quality
    if (result.total_results < 10) {
      recommendations.push('Consider broadening your search terms or removing date restrictions');
      recommendations.push('Try searching for related concepts or synonyms');
    }

    if (result.total_results > 100) {
      recommendations.push('Consider narrowing your search with more specific terms');
      recommendations.push('Add date range filters to focus on recent research');
    }

    // Source-specific recommendations
    if (result.results_by_source.semantic_scholar.length === 0) {
      recommendations.push('Semantic Scholar found no results - check spelling and try alternative terms');
    }

    if (result.results_by_source.arxiv.length === 0 && options.discipline === 'neuroscience') {
      recommendations.push('No ArXiv preprints found - this may indicate limited recent research in this area');
    }

    // Quality recommendations
    const highCitationPapers = result.combined_results.filter(r => (r.citation_count || 0) > 50);
    if (highCitationPapers.length > 0) {
      recommendations.push(`Found ${highCitationPapers.length} highly cited papers - consider these for your literature review`);
    }

    const recentPapers = result.combined_results.filter(r => r.year >= new Date().getFullYear() - 2);
    if (recentPapers.length > 0) {
      recommendations.push(`${recentPapers.length} recent papers (last 2 years) found - check for latest developments`);
    }

    // Add discipline-specific recommendations
    if (options.discipline) {
      recommendations.push(`Consider searching discipline-specific databases for ${options.discipline} research`);
    }

    return recommendations;
  }
}

// Export function for MCP server
export async function searchLiterature(args: LiteratureSearchOptions): Promise<any> {
  const cacheManager = new CacheManager();
  const searchManager = new LiteratureSearchManager(cacheManager);
  
  try {
    const result = await searchManager.searchLiterature(args);
    
    // Format results for display
    const topResults = result.combined_results.slice(0, 10);
    const resultText = topResults.map((paper, index) => {
      const authors = paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '');
      const journal = paper.journal ? ` - ${paper.journal}` : '';
      const year = paper.year ? ` (${paper.year})` : '';
      const citations = paper.citation_count ? ` [${paper.citation_count} citations]` : '';
      const doi = paper.doi ? `\n  DOI: ${paper.doi}` : '';
      const abstract = paper.abstract ? `\n  Abstract: ${paper.abstract.substring(0, 200)}...` : '';
      
      return `${index + 1}. **${paper.title}**\n` +
             `   ${authors}${journal}${year}${citations}${doi}${abstract}\n`;
    }).join('\n');

    return {
      content: [{
        type: 'text',
        text: `🔍 **Literature Search Results**\n\n` +
              `**Query:** "${result.query}"\n` +
              `**Total Results:** ${result.total_results} papers found\n` +
              `**Search Time:** ${(result.search_time / 1000).toFixed(1)} seconds\n\n` +
              `**Results by Source:**\n` +
              `• Semantic Scholar: ${result.results_by_source.semantic_scholar.length}\n` +
              `• ArXiv: ${result.results_by_source.arxiv.length}\n` +
              `• CrossRef: ${result.results_by_source.crossref.length}\n\n` +
              `**Top 10 Results:**\n\n${resultText}\n` +
              `**Recommendations:**\n${result.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
              `💡 **Next Steps:**\n` +
              `• Use "process_academic_pdf" to analyze paper PDFs\n` +
              `• Use "analyze_by_discipline" for specific analysis\n` +
              `• Use "generate_latex_paper" to create literature review\n` +
              `• Refine search with more specific terms if needed`
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Literature Search Failed**\n\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
              `**Troubleshooting:**\n` +
              `• Check your internet connection\n` +
              `• Verify API configurations with "setup_research_apis"\n` +
              `• Try simpler search terms\n` +
              `• Check if APIs are experiencing downtime\n\n` +
              `**Supported Sources:**\n` +
              `• Semantic Scholar (200M+ papers)\n` +
              `• ArXiv (STEM preprints)\n` +
              `• CrossRef (Publisher metadata)`
      }]
    };
  }
}