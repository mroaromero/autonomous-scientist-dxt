import { SecurityManager } from '../utils/security';
import axios from 'axios';

interface APIConfiguration {
  service: string;
  baseUrl: string;
  keyRequired: boolean;
  testEndpoint: string;
  description: string;
  features: string[];
}

interface APISetupResponse {
  success: boolean;
  configured: APIConfiguration[];
  errors: string[];
  nextSteps: string[];
}

const SUPPORTED_APIS: APIConfiguration[] = [
  {
    service: 'semantic_scholar',
    baseUrl: 'https://api.semanticscholar.org/graph/v1',
    keyRequired: false, // Basic tier is free
    testEndpoint: '/paper/search?query=machine%20learning&limit=1',
    description: 'Semantic Scholar - 200M+ academic papers with citation metrics',
    features: ['Paper search', 'Citation graphs', 'Author profiles', 'Venue information']
  },
  {
    service: 'arxiv',
    baseUrl: 'http://export.arxiv.org/api',
    keyRequired: false,
    testEndpoint: '/query?search_query=all:machine%20learning&max_results=1',
    description: 'ArXiv - Latest preprints in STEM fields',
    features: ['Preprint search', 'Full-text access', 'Category filtering', 'Daily updates']
  },
  {
    service: 'crossref',
    baseUrl: 'https://api.crossref.org',
    keyRequired: false, // Polite pool recommended but not required
    testEndpoint: '/works?query=machine%20learning&rows=1',
    description: 'CrossRef - Publisher metadata and DOI resolution',
    features: ['DOI resolution', 'Publisher metadata', 'Journal information', 'Funding data']
  },
  {
    service: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keyRequired: true,
    testEndpoint: '/models',
    description: 'OpenAI API - Enhanced analysis capabilities (Optional)',
    features: ['Advanced text analysis', 'Multiple model options', 'Embeddings', 'Function calling']
  },
  {
    service: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    keyRequired: true,
    testEndpoint: '/messages',
    description: 'Anthropic API - Extended Claude access (Optional)',
    features: ['Additional Claude models', 'Extended context', 'Advanced reasoning', 'Tool use']
  }
];

export class APISetupManager {
  private securityManager: SecurityManager;
  private configuredAPIs: Map<string, any> = new Map();

  constructor() {
    this.securityManager = new SecurityManager();
  }

  async setupResearchAPIs(args: { interactive?: boolean }): Promise<any> {
    const { interactive = true } = args;
    
    if (interactive) {
      return this.startInteractiveSetup();
    } else {
      return this.performAutomaticSetup();
    }
  }

  private async startInteractiveSetup(): Promise<any> {
    const response: APISetupResponse = {
      success: true,
      configured: [],
      errors: [],
      nextSteps: []
    };

    // Welcome message
    const welcomeMessage = `
🔬 **Autonomous Scientist API Setup Wizard**

I'll help you configure research APIs for optimal academic research capabilities.

**Available APIs:**
${SUPPORTED_APIS.map((api, index) => 
  `${index + 1}. **${api.service.toUpperCase()}** ${api.keyRequired ? '(API Key Required)' : '(Free)'}
     ${api.description}
     Features: ${api.features.join(', ')}`
).join('\n\n')}

**Recommendations:**
• Start with **Semantic Scholar**, **ArXiv**, and **CrossRef** (all free)
• Add **OpenAI** or **Anthropic** later for enhanced analysis
• You can configure APIs one at a time conversationally

Which API would you like to configure first? Just say:
"Configure Semantic Scholar" or "Set up ArXiv" etc.
`;

    // Test free APIs automatically
    for (const api of SUPPORTED_APIS.filter(a => !a.keyRequired)) {
      try {
        const testResult = await this.testAPIConnection(api);
        if (testResult.success) {
          response.configured.push(api);
          this.configuredAPIs.set(api.service, { 
            ...api, 
            configured: true, 
            testDate: new Date().toISOString() 
          });
        } else {
          response.errors.push(`${api.service}: ${testResult.error}`);
        }
      } catch (error) {
        response.errors.push(`${api.service}: Connection test failed`);
      }
    }

    response.nextSteps = [
      `✅ Free APIs tested: ${response.configured.length} working`,
      "💡 To configure paid APIs, say: 'Configure OpenAI API' or 'Set up Anthropic'",
      "🔧 To test all APIs, say: 'Test all API connections'",
      "📖 To see API usage examples, say: 'Show API examples'",
      "🎯 Ready to start researching! Try: 'Search literature on machine learning'"
    ];

    return {
      content: [{
        type: 'text',
        text: welcomeMessage + '\n\n**Current Status:**\n' + 
              `✅ Configured: ${response.configured.map(a => a.service).join(', ') || 'None'}\n` +
              `❌ Errors: ${response.errors.join(', ') || 'None'}\n\n` +
              `**Next Steps:**\n${response.nextSteps.join('\n')}`
      }]
    };
  }

  async configureSpecificAPI(service: string, apiKey?: string): Promise<any> {
    const api = SUPPORTED_APIS.find(a => a.service.toLowerCase() === service.toLowerCase());
    
    if (!api) {
      return {
        content: [{
          type: 'text',
          text: `❌ Unknown API service: ${service}\n\nSupported APIs: ${SUPPORTED_APIS.map(a => a.service).join(', ')}`
        }]
      };
    }

    if (api.keyRequired && !apiKey) {
      return this.requestAPIKey(api);
    }

    // Store API key securely if provided
    if (apiKey) {
      await this.securityManager.storeAPIKey(api.service, apiKey);
    }

    // Test the API
    const testResult = await this.testAPIConnection(api, apiKey);
    
    if (testResult.success) {
      this.configuredAPIs.set(api.service, {
        ...api,
        configured: true,
        testDate: new Date().toISOString(),
        hasKey: !!apiKey
      });

      return {
        content: [{
          type: 'text',
          text: `✅ **${api.service.toUpperCase()} Successfully Configured!**\n\n` +
                `🔗 **Endpoint:** ${api.baseUrl}\n` +
                `🎯 **Features:** ${api.features.join(', ')}\n` +
                `⚡ **Status:** Ready for research\n\n` +
                `**Try it now:**\n` +
                `• Search academic papers: "Search ${api.service} for [your topic]"\n` +
                `• Literature review: "Find recent papers on [your topic]"\n` +
                `• Citation analysis: "Analyze citations for [paper title]"`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `❌ **${api.service.toUpperCase()} Configuration Failed**\n\n` +
                `**Error:** ${testResult.error}\n\n` +
                `**Troubleshooting:**\n` +
                `• Check your API key format\n` +
                `• Verify account status and quotas\n` +
                `• Ensure network connectivity\n` +
                `• Try regenerating your API key\n\n` +
                `**Need help?** Say "Help with ${api.service} setup"`
        }]
      };
    }
  }

  private requestAPIKey(api: APIConfiguration): any {
    const instructions = this.getAPIKeyInstructions(api.service);
    
    return {
      content: [{
        type: 'text',
        text: `🔑 **${api.service.toUpperCase()} API Key Required**\n\n` +
              `${api.description}\n\n` +
              `**How to get your API key:**\n${instructions}\n\n` +
              `**Once you have your key, paste it here and I'll configure it securely.**\n\n` +
              `Just say: "Configure ${api.service} with key: YOUR_API_KEY_HERE"\n\n` +
              `🔒 **Security:** Your API key will be encrypted and stored locally.`
      }]
    };
  }

  private getAPIKeyInstructions(service: string): string {
    const instructions = {
      openai: `1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "Autonomous Scientist"
4. Copy the key (sk-...)`,
      
      anthropic: `1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it "Research Assistant"
4. Copy the key (sk-ant-...)`
    };

    return instructions[service as keyof typeof instructions] || 'Check the service documentation for API key instructions.';
  }

  private async testAPIConnection(api: APIConfiguration, apiKey?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: any = {
        'User-Agent': 'Autonomous-Scientist/6.0 (Research Tool)'
      };

      // Add authentication headers based on service
      if (apiKey) {
        switch (api.service) {
          case 'openai':
            headers['Authorization'] = `Bearer ${apiKey}`;
            break;
          case 'anthropic':
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            break;
          case 'crossref':
            headers['User-Agent'] = `Autonomous-Scientist/6.0 (mailto:research@example.com)`;
            break;
        }
      }

      // Special handling for Anthropic test (requires POST)  
      if (api.service === 'anthropic') {
        const response = await axios.post(
          `${api.baseUrl}/messages`,
          {
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          },
          { headers, timeout: 10000 }
        );
        return { success: response.status === 200 };
      }

      // Standard GET test for other APIs
      const response = await axios.get(`${api.baseUrl}${api.testEndpoint}`, {
        headers,
        timeout: 10000
      });

      return { success: response.status === 200 };
    } catch (error: any) {
      let errorMessage = 'Connection failed';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid API key';
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded';
        } else {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Network connection failed - check internet connectivity';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = 'Request timeout - service may be unavailable';
      }

      return { success: false, error: errorMessage };
    }
  }

  async validateAPIKey(args: { service: string; key: string }): Promise<any> {
    const { service, key } = args;
    const api = SUPPORTED_APIS.find(a => a.service === service);
    
    if (!api) {
      return {
        content: [{
          type: 'text',
          text: `❌ Unknown service: ${service}`
        }]
      };
    }

    const testResult = await this.testAPIConnection(api, key);
    
    if (testResult.success) {
      return {
        content: [{
          type: 'text',
          text: `✅ **${service.toUpperCase()} API Key Valid**\n\n` +
                `🔗 Connection successful\n` +
                `⚡ Ready for research tasks\n` +
                `🔒 Key will be stored securely if you proceed with configuration`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `❌ **${service.toUpperCase()} API Key Invalid**\n\n` +
                `**Error:** ${testResult.error}\n\n` +
                `**Please check:**\n` +
                `• Key format and completeness\n` +
                `• Account status and billing\n` +
                `• Service availability`
        }]
      };
    }
  }

  private async performAutomaticSetup(): Promise<any> {
    // Auto-configure free APIs
    const results = await Promise.all(
      SUPPORTED_APIS
        .filter(api => !api.keyRequired)
        .map(api => this.testAPIConnection(api))
    );

    const successCount = results.filter(r => r.success).length;
    
    return {
      content: [{
        type: 'text',
        text: `🔬 **Automatic API Setup Complete**\n\n` +
              `✅ Configured: ${successCount} free APIs\n` +
              `⚙️ Ready for research with Semantic Scholar, ArXiv, and CrossRef\n\n` +
              `**To add paid APIs:**\n` +
              `• Say "Configure OpenAI" for enhanced analysis\n` +
              `• Say "Setup Anthropic" for extended Claude access\n\n` +
              `**Start researching:**\n` +
              `• "Search literature on [your topic]"\n` +
              `• "Find recent papers about [subject]"\n` +
              `• "Analyze this research area: [description]"`
      }]
    };
  }

  getConfiguredAPIs(): APIConfiguration[] {
    return Array.from(this.configuredAPIs.values());
  }

  isAPIConfigured(service: string): boolean {
    return this.configuredAPIs.has(service);
  }
}

// Export the main function expected by the MCP server
export async function setupResearchAPIs(args: any): Promise<any> {
  const manager = new APISetupManager();
  return await manager.setupResearchAPIs(args);
}