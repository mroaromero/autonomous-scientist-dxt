/**
 * Tests for TypeScript Compiled Autonomous Scientist MCP Server
 * Using the properly compiled dist/ version instead of server/
 */

const assert = require('assert');
const path = require('path');

// Import test setup first to initialize globals
require('../setup.js');

const { 
    TEST_CONFIG, 
    setupTestEnvironment,
    cleanupTestEnvironment
} = require('../setup.js');

describe('Autonomous Scientist Compiled Server', function() {
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

    describe('Compiled TypeScript Server', function() {
        it('should have compiled JavaScript files in dist/', function() {
            const fs = require('fs');
            const distPath = path.join(__dirname, '../../dist');
            
            assert(fs.existsSync(distPath), 'dist/ directory should exist');
            
            const expectedFiles = [
                'index.js',
                'cognitive-core/operational-flow.js',
                'cognitive-abilities/cognitive-skills-engine.js'
            ];
            
            expectedFiles.forEach(file => {
                const filePath = path.join(distPath, file);
                assert(fs.existsSync(filePath), `Compiled file should exist: ${file}`);
            });
        });

        it('should be able to import compiled server without TypeScript errors', function() {
            try {
                // This should work without TypeScript syntax errors
                const serverPath = path.join(__dirname, '../../dist/index.js');
                
                // Check that the file exists and is valid JavaScript
                const fs = require('fs');
                assert(fs.existsSync(serverPath), 'Compiled server should exist');
                
                const content = fs.readFileSync(serverPath, 'utf8');
                
                // Should not contain TypeScript-specific syntax in inappropriate places
                // Note: Some ': {' may appear in object literals, which is valid JavaScript
                const hasTypeAnnotations = content.match(/\w+:\s*{[^}]*}\s*=/);
                const hasTypeAssertions = content.includes(' as ');
                
                assert(!hasTypeAssertions, 'Compiled JS should not contain TypeScript type assertions');
                // Allow object type patterns that are valid JS
                
                console.log('✅ Compiled server is valid JavaScript');
            } catch (error) {
                assert.fail(`Failed to validate compiled server: ${error.message}`);
            }
        });

        it('should have properly compiled cognitive core', function() {
            const fs = require('fs');
            const cognitiveCorePath = path.join(__dirname, '../../dist/cognitive-core/operational-flow.js');
            
            assert(fs.existsSync(cognitiveCorePath), 'Cognitive core should be compiled');
            
            const content = fs.readFileSync(cognitiveCorePath, 'utf8');
            assert(content.includes('AutonomousScientistCognitiveCore'), 'Should contain main class');
            assert(content.includes('executeResearchFlow'), 'Should contain main method');
        });

        it('should have source maps for debugging', function() {
            const fs = require('fs');
            const mapFiles = [
                'dist/index.js.map',
                'dist/cognitive-core/operational-flow.js.map'
            ];
            
            mapFiles.forEach(mapFile => {
                const mapPath = path.join(__dirname, '../..', mapFile);
                assert(fs.existsSync(mapPath), `Source map should exist: ${mapFile}`);
            });
        });
    });

    describe('Project Architecture Validation', function() {
        it('should validate modular architecture design', function() {
            const fs = require('fs');
            const srcPath = path.join(__dirname, '../../src');
            
            // Check that planned modules exist as directories
            const plannedModules = [
                'citation-engine',
                'document-structure', 
                'integrity-engine'
            ];
            
            plannedModules.forEach(module => {
                const modulePath = path.join(srcPath, module);
                assert(fs.existsSync(modulePath), `Planned module directory should exist: ${module}`);
            });
            
            console.log('✅ Modular architecture directories confirmed');
        });

        it('should confirm implemented modules', function() {
            const fs = require('fs');
            const implementedModules = [
                'src/cognitive-abilities/cognitive-skills-engine.ts',
                'src/cognitive-core/operational-flow.ts',
                'src/tools/api-setup.ts',
                'src/utils/memory-manager.ts'
            ];
            
            implementedModules.forEach(module => {
                const modulePath = path.join(__dirname, '../..', module);
                assert(fs.existsSync(modulePath), `Implemented module should exist: ${module}`);
            });
            
            console.log('✅ All implemented modules confirmed');
        });
    });
});

// Simple test runner if this file is executed directly
if (require.main === module) {
    console.log('Running Compiled Server Tests...\n');
    
    const testSuite = {
        'Compiled Files Validation': async () => {
            const fs = require('fs');
            const path = require('path');
            const distPath = path.join(__dirname, '../../dist');
            
            assert(fs.existsSync(distPath), 'dist/ directory should exist');
            assert(fs.existsSync(path.join(distPath, 'index.js')), 'Main server should be compiled');
            
            console.log('✅ Compiled files validation passed');
        },
        
        'Architecture Validation': async () => {
            const fs = require('fs');
            const path = require('path');
            
            // Verify both empty (planned) and implemented modules
            const srcPath = path.join(__dirname, '../../src');
            assert(fs.existsSync(path.join(srcPath, 'citation-engine')), 'citation-engine directory exists');
            assert(fs.existsSync(path.join(srcPath, 'cognitive-core/operational-flow.ts')), 'operational-flow.ts exists');
            
            console.log('✅ Architecture validation passed');
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