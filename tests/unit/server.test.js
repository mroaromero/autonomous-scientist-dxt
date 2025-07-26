/**
 * Unit Tests for Autonomous Scientist MCP Server
 * Tests core server functionality, configuration, and tool handlers
 */

const assert = require('assert');
const { 
    TEST_CONFIG, 
    createMockServer, 
    createMockTransport,
    setupTestEnvironment,
    cleanupTestEnvironment,
    assertToolResponse,
    assertPromptResponse
} = require('../setup.js');

// Mock the MCP SDK before requiring the server
const mockSDK = {
    Server: createMockServer,
    StdioServerTransport: createMockTransport
};

// Override require for MCP SDK modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === '@modelcontextprotocol/sdk/server/index.js') {
        return { Server: mockSDK.Server };
    }
    if (id === '@modelcontextprotocol/sdk/server/stdio.js') {
        return { StdioServerTransport: mockSDK.StdioServerTransport };
    }
    return originalRequire.apply(this, arguments);
};

describe('Autonomous Scientist MCP Server', function() {
    let testEnv;

    before(async function() {
        testEnv = await setupTestEnvironment();
        
        // Set test environment variables
        process.env.USER_CONFIG_PRIMARY_DISCIPLINE = TEST_CONFIG.primary_discipline;
        process.env.USER_CONFIG_DEFAULT_CITATION_STYLE = TEST_CONFIG.default_citation_style;
        process.env.USER_CONFIG_CACHE_SIZE_GB = TEST_CONFIG.cache_size_gb.toString();
        process.env.USER_CONFIG_WORKSPACE_DIRECTORY = TEST_CONFIG.workspace_directory;
    });

    after(async function() {
        await cleanupTestEnvironment();
        
        // Clean up environment variables
        delete process.env.USER_CONFIG_PRIMARY_DISCIPLINE;
        delete process.env.USER_CONFIG_DEFAULT_CITATION_STYLE;
        delete process.env.USER_CONFIG_CACHE_SIZE_GB;
        delete process.env.USER_CONFIG_WORKSPACE_DIRECTORY;
    });

    describe('Server Initialization', function() {
        it('should initialize with correct configuration', function() {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert.strictEqual(server.config.primary_discipline, TEST_CONFIG.primary_discipline);
            assert.strictEqual(server.config.default_citation_style, TEST_CONFIG.default_citation_style);
            assert.strictEqual(server.config.cache_size_gb, TEST_CONFIG.cache_size_gb);
        });

        it('should have memory manager initialized', function() {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert(server.memoryManager);
            assert(typeof server.memoryManager === 'object');
        });

        it('should have error handler initialized', function() {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert(server.errorHandler);
            assert(typeof server.errorHandler === 'object');
        });
    });

    describe('Tool Definitions', function() {
        let server;

        beforeEach(function() {
            const AutonomousScientistServer = require('../../server/index.js');
            server = new AutonomousScientistServer();
        });

        it('should define all required tools', function() {
            const tools = server.getToolDefinitions();
            
            assert(Array.isArray(tools));
            assert(tools.length > 0);
            
            // Check for key tools
            const toolNames = tools.map(tool => tool.name);
            const requiredTools = [
                'setup_research_apis',
                'process_academic_pdf',
                'comprehensive_literature_search',
                'analyze_by_discipline',
                'generate_latex_paper'
            ];
            
            requiredTools.forEach(toolName => {
                assert(toolNames.includes(toolName), `Missing required tool: ${toolName}`);
            });
        });

        it('should have valid tool schemas', function() {
            const tools = server.getToolDefinitions();
            
            tools.forEach(tool => {
                assert(tool.name, 'Tool missing name');
                assert(tool.description, 'Tool missing description');
                assert(tool.inputSchema, 'Tool missing input schema');
                assert(tool.inputSchema.type === 'object', 'Tool schema must be object type');
            });
        });

        it('should include discipline-specific tools', function() {
            const tools = server.getToolDefinitions();
            const toolNames = tools.map(tool => tool.name);
            
            const disciplineTools = [
                'analyze_psychology_research',
                'analyze_neuroscience_paper'
            ];
            
            disciplineTools.forEach(toolName => {
                assert(toolNames.includes(toolName), `Missing discipline tool: ${toolName}`);
            });
        });
    });

    describe('Configuration Loading', function() {
        it('should load configuration from environment variables', function() {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert.strictEqual(server.config.primary_discipline, 'psychology');
            assert.strictEqual(server.config.default_citation_style, 'apa');
            assert.strictEqual(server.config.cache_size_gb, 1);
        });

        it('should use default values for missing configuration', function() {
            // Temporarily remove environment variables
            const originalDiscipline = process.env.USER_CONFIG_PRIMARY_DISCIPLINE;
            delete process.env.USER_CONFIG_PRIMARY_DISCIPLINE;
            
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert.strictEqual(server.config.primary_discipline, 'psychology');
            
            // Restore environment variable
            if (originalDiscipline) {
                process.env.USER_CONFIG_PRIMARY_DISCIPLINE = originalDiscipline;
            }
        });

        it('should parse array configurations correctly', function() {
            process.env.USER_CONFIG_OCR_LANGUAGES = 'en,es,fr';
            
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert(Array.isArray(server.config.ocr_languages));
            assert.strictEqual(server.config.ocr_languages.length, 3);
            assert(server.config.ocr_languages.includes('en'));
            assert(server.config.ocr_languages.includes('es'));
            assert(server.config.ocr_languages.includes('fr'));
            
            delete process.env.USER_CONFIG_OCR_LANGUAGES;
        });
    });

    describe('Tool Execution Safety', function() {
        let server;

        beforeEach(function() {
            const AutonomousScientistServer = require('../../server/index.js');
            server = new AutonomousScientistServer();
        });

        it('should handle unknown tools gracefully', async function() {
            try {
                await server.executeToolSafely('unknown_tool', {});
                assert.fail('Should have thrown an error for unknown tool');
            } catch (error) {
                assert(error.message.includes('Unknown tool'));
            }
        });

        it('should enrich arguments with configuration', async function() {
            // Mock a tool to capture the enriched arguments
            const originalSetupAPIs = require('../../server/tools/api-setup.js').setupResearchAPIs;
            let capturedArgs = null;
            
            require('../../server/tools/api-setup.js').setupResearchAPIs = async function(args) {
                capturedArgs = args;
                return { content: [{ type: 'text', text: 'Test response' }] };
            };
            
            await server.executeToolSafely('setup_research_apis', { test: 'value' });
            
            assert(capturedArgs);
            assert(capturedArgs._config);
            assert(capturedArgs._workspace);
            assert.strictEqual(capturedArgs.test, 'value');
            
            // Restore original function
            require('../../server/tools/api-setup.js').setupResearchAPIs = originalSetupAPIs;
        });
    });
});

// Simple test runner if this file is executed directly
if (require.main === module) {
    console.log('Running Autonomous Scientist Server Tests...\n');
    
    // Run basic tests
    const testSuite = {
        'Server Initialization': async () => {
            const testEnv = await setupTestEnvironment();
            
            process.env.USER_CONFIG_PRIMARY_DISCIPLINE = 'psychology';
            process.env.USER_CONFIG_WORKSPACE_DIRECTORY = testEnv.workspace;
            
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            assert(server.config);
            assert(server.memoryManager);
            assert(server.errorHandler);
            
            await cleanupTestEnvironment();
            console.log('✅ Server initialization test passed');
        },
        
        'Tool Definitions': async () => {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            const tools = server.getToolDefinitions();
            
            assert(Array.isArray(tools));
            assert(tools.length > 10);
            
            console.log('✅ Tool definitions test passed');
        }
    };
    
    // Run tests
    (async () => {
        let passed = 0;
        let failed = 0;
        
        for (const [name, test] of Object.entries(testSuite)) {
            try {
                await test();
                passed++;
            } catch (error) {
                console.error(`❌ ${name} failed:`, error.message);
                failed++;
            }
        }
        
        console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
        process.exit(failed > 0 ? 1 : 0);
    })();
}