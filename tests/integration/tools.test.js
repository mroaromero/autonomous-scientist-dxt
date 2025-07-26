/**
 * Integration Tests for Autonomous Scientist Tools
 * Tests tool functionality with real MCP server integration
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs-extra');
const { 
    TEST_CONFIG,
    SAMPLE_PDF_CONTENT,
    SAMPLE_LITERATURE_SEARCH_RESULT,
    setupTestEnvironment,
    cleanupTestEnvironment,
    assertToolResponse,
    createMockServer
} = require('../setup.js');

describe('Tool Integration Tests', function() {
    let testEnv;
    let server;

    // Increase timeout for integration tests
    this.timeout(30000);

    before(async function() {
        testEnv = await setupTestEnvironment();
        
        // Set up environment for testing
        process.env.USER_CONFIG_PRIMARY_DISCIPLINE = TEST_CONFIG.primary_discipline;
        process.env.USER_CONFIG_WORKSPACE_DIRECTORY = TEST_CONFIG.workspace_directory;
        process.env.NODE_ENV = 'test';
    });

    after(async function() {
        await cleanupTestEnvironment();
        delete process.env.USER_CONFIG_PRIMARY_DISCIPLINE;
        delete process.env.USER_CONFIG_WORKSPACE_DIRECTORY;
        delete process.env.NODE_ENV;
    });

    beforeEach(function() {
        // Create a fresh server instance for each test
        const AutonomousScientistServer = require('../../server/index.js');
        server = new AutonomousScientistServer();
    });

    describe('API Setup Tool', function() {
        it('should execute setup_research_apis tool', async function() {
            const args = { interactive: false };
            const result = await server.executeToolSafely('setup_research_apis', args);
            
            assertToolResponse(result);
            assert(result.content.length > 0);
            assert(result.content[0].text.includes('API') || result.content[0].text.includes('setup'));
        });

        it('should validate API keys when provided', async function() {
            const args = {
                service: 'semantic_scholar',
                key: 'test-key-123'
            };
            
            const result = await server.executeToolSafely('validate_api_key', args);
            assertToolResponse(result);
        });
    });

    describe('Literature Search Tool', function() {
        it('should execute comprehensive literature search', async function() {
            const args = {
                query: 'cognitive psychology',
                discipline: 'psychology',
                max_results: 5
            };
            
            const result = await server.executeToolSafely('comprehensive_literature_search', args);
            
            assertToolResponse(result);
            assert(result.content.length > 0);
            
            // Should mention search results or sources
            const text = result.content[0].text.toLowerCase();
            assert(
                text.includes('search') || 
                text.includes('results') || 
                text.includes('papers') ||
                text.includes('semantic scholar') ||
                text.includes('arxiv')
            );
        });

        it('should handle empty search queries gracefully', async function() {
            const args = {
                query: '',
                discipline: 'psychology'
            };
            
            try {
                const result = await server.executeToolSafely('comprehensive_literature_search', args);
                assertToolResponse(result);
            } catch (error) {
                // Should handle gracefully rather than crash
                assert(error.message.includes('query') || error.message.includes('search'));
            }
        });
    });

    describe('PDF Processing Tool', function() {
        it('should handle PDF processing requests', async function() {
            // Create a mock PDF file for testing
            const testPdfPath = path.join(testEnv.workspace, 'test.pdf');
            await fs.writeFile(testPdfPath, 'Mock PDF content for testing');
            
            const args = {
                file_path: testPdfPath,
                language: 'auto',
                extract_metadata: true
            };
            
            const result = await server.executeToolSafely('process_academic_pdf', args);
            
            assertToolResponse(result);
            assert(result.content.length > 0);
            
            // Clean up test file
            await fs.remove(testPdfPath);
        });

        it('should handle missing PDF files gracefully', async function() {
            const args = {
                file_path: '/nonexistent/file.pdf',
                language: 'auto'
            };
            
            const result = await server.executeToolSafely('process_academic_pdf', args);
            assertToolResponse(result);
            
            // Should indicate file not found or error
            const text = result.content[0].text.toLowerCase();
            assert(
                text.includes('not found') || 
                text.includes('error') || 
                text.includes('cannot') ||
                text.includes('invalid')
            );
        });
    });

    describe('Discipline Analysis Tool', function() {
        it('should analyze content by discipline', async function() {
            const args = {
                content: 'This is a sample psychology research paper about cognitive behavior and learning processes.',
                discipline: 'psychology',
                analysis_type: 'comprehensive'
            };
            
            const result = await server.executeToolSafely('analyze_by_discipline', args);
            
            assertToolResponse(result);
            assert(result.content.length > 0);
            
            // Should mention analysis or discipline-specific terms
            const text = result.content[0].text.toLowerCase();
            assert(
                text.includes('analysis') || 
                text.includes('psychology') || 
                text.includes('discipline') ||
                text.includes('research')
            );
        });

        it('should handle different discipline types', async function() {
            const disciplines = ['psychology', 'neuroscience', 'education', 'sociology'];
            
            for (const discipline of disciplines) {
                const args = {
                    content: `Sample ${discipline} research content.`,
                    discipline: discipline,
                    analysis_type: 'theoretical'
                };
                
                const result = await server.executeToolSafely('analyze_by_discipline', args);
                assertToolResponse(result);
            }
        });
    });

    describe('LaTeX Generation Tool', function() {
        it('should generate LaTeX papers', async function() {
            const args = {
                title: 'Test Research Paper',
                discipline: 'psychology',
                citation_style: 'apa',
                paper_type: 'journal',
                content_sections: [
                    { title: 'Introduction', content: 'Test introduction content' },
                    { title: 'Methods', content: 'Test methods content' }
                ]
            };
            
            const result = await server.executeToolSafely('generate_latex_paper', args);
            
            assertToolResponse(result);
            assert(result.content.length > 0);
            
            // Should mention LaTeX or document generation
            const text = result.content[0].text.toLowerCase();
            assert(
                text.includes('latex') || 
                text.includes('document') || 
                text.includes('generated') ||
                text.includes('paper')
            );
        });

        it('should handle different citation styles', async function() {
            const styles = ['apa', 'mla', 'chicago'];
            
            for (const style of styles) {
                const args = {
                    title: `Test Paper - ${style.toUpperCase()}`,
                    discipline: 'psychology',
                    citation_style: style
                };
                
                const result = await server.executeToolSafely('generate_latex_paper', args);
                assertToolResponse(result);
            }
        });
    });

    describe('Discipline-Specific Tools', function() {
        it('should execute psychology-specific analysis', async function() {
            const args = {
                paper_content: 'This is a psychology research paper about cognitive processes and experimental design.',
                analysis_focus: ['methodology', 'statistics']
            };
            
            const result = await server.executeToolSafely('analyze_psychology_research', args);
            assertToolResponse(result);
        });

        it('should execute neuroscience-specific analysis', async function() {
            const args = {
                paper_content: 'This neuroscience paper discusses fMRI studies and brain connectivity patterns.',
                methodology_type: 'fmri',
                brain_regions: ['prefrontal cortex', 'hippocampus']
            };
            
            const result = await server.executeToolSafely('analyze_neuroscience_paper', args);
            assertToolResponse(result);
        });
    });

    describe('Enhanced Research Tools', function() {
        it('should access Semantic Scholar datasets', async function() {
            const args = {
                query: 'machine learning',
                dataset_type: 'papers',
                limit: 5
            };
            
            const result = await server.executeToolSafely('access_semantic_scholar_datasets', args);
            assertToolResponse(result);
        });

        it('should perform advanced ArXiv search', async function() {
            const args = {
                query: 'neural networks',
                category: 'cs.LG',
                max_results: 10
            };
            
            const result = await server.executeToolSafely('search_arxiv_advanced', args);
            assertToolResponse(result);
        });

        it('should access CrossRef data files', async function() {
            const args = {
                year: 2023,
                data_type: 'works',
                sample_size: 100
            };
            
            const result = await server.executeToolSafely('access_crossref_data_file', args);
            assertToolResponse(result);
        });
    });

    describe('Tool Error Handling', function() {
        it('should handle tool execution timeouts', async function() {
            // This test would require mocking a long-running operation
            // For now, we'll test that the timeout mechanism exists
            assert(typeof server.executeToolSafely === 'function');
        });

        it('should handle invalid tool arguments', async function() {
            const args = {
                invalid_parameter: 'test'
            };
            
            const result = await server.executeToolSafely('setup_research_apis', args);
            assertToolResponse(result);
        });

        it('should provide meaningful error messages', async function() {
            try {
                await server.executeToolSafely('nonexistent_tool', {});
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Unknown tool'));
            }
        });
    });
});

// Simple test runner for integration tests
if (require.main === module) {
    console.log('Running Tool Integration Tests...\n');
    
    const basicIntegrationTests = {
        'Literature Search Integration': async () => {
            const testEnv = await setupTestEnvironment();
            process.env.USER_CONFIG_WORKSPACE_DIRECTORY = testEnv.workspace;
            
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            const result = await server.executeToolSafely('comprehensive_literature_search', {
                query: 'test query',
                discipline: 'psychology',
                max_results: 1
            });
            
            assertToolResponse(result);
            await cleanupTestEnvironment();
            console.log('✅ Literature search integration test passed');
        },
        
        'Tool Definition Integrity': async () => {
            const AutonomousScientistServer = require('../../server/index.js');
            const server = new AutonomousScientistServer();
            
            const tools = server.getToolDefinitions();
            assert(tools.length >= 15, 'Should have at least 15 tools defined');
            
            // Verify each tool has required properties
            tools.forEach(tool => {
                assert(tool.name, `Tool missing name: ${JSON.stringify(tool)}`);
                assert(tool.description, `Tool missing description: ${tool.name}`);
                assert(tool.inputSchema, `Tool missing schema: ${tool.name}`);
            });
            
            console.log('✅ Tool definition integrity test passed');
        }
    };
    
    // Run tests
    (async () => {
        let passed = 0;
        let failed = 0;
        
        for (const [name, test] of Object.entries(basicIntegrationTests)) {
            try {
                await test();
                passed++;
            } catch (error) {
                console.error(`❌ ${name} failed:`, error.message);
                failed++;
            }
        }
        
        console.log(`\nIntegration Test Results: ${passed} passed, ${failed} failed`);
        process.exit(failed > 0 ? 1 : 0);
    })();
}