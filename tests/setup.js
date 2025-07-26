/**
 * Test Setup and Configuration
 * Common utilities and mocks for testing the Autonomous Scientist MCP server
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Test configuration
const TEST_CONFIG = {
    primary_discipline: 'psychology',
    default_citation_style: 'apa',
    cache_size_gb: 1, // Smaller for tests
    max_concurrent_pdfs: 1,
    ocr_languages: ['en'],
    workspace_directory: path.join(os.tmpdir(), 'autonomous-scientist-test'),
    enable_advanced_features: false
};

// Mock MCP SDK components
class MockServer {
    constructor(info, capabilities) {
        this.info = info;
        this.capabilities = capabilities;
        this.handlers = new Map();
    }

    setRequestHandler(schema, handler) {
        const schemaName = typeof schema === 'string' ? schema : schema.name || 'unknown';
        this.handlers.set(schemaName, handler);
    }

    async connect(transport) {
        // Mock connection
        return Promise.resolve();
    }
}

class MockTransport {
    constructor() {
        this.connected = false;
    }

    async connect() {
        this.connected = true;
        return Promise.resolve();
    }
}

// Test fixtures
const SAMPLE_PDF_CONTENT = {
    title: 'Sample Academic Paper',
    authors: ['Dr. Jane Smith', 'Prof. John Doe'],
    abstract: 'This is a sample abstract for testing purposes.',
    content: 'Sample content of an academic paper...',
    metadata: {
        doi: '10.1000/sample.doi',
        year: 2023,
        journal: 'Test Journal of Psychology'
    }
};

const SAMPLE_LITERATURE_SEARCH_RESULT = {
    query: 'cognitive psychology',
    results: [
        {
            title: 'Cognitive Processes in Learning',
            authors: ['Dr. A. Researcher'],
            abstract: 'This paper examines cognitive processes...',
            doi: '10.1000/example.doi1',
            year: 2023
        },
        {
            title: 'Memory and Attention in Psychology',
            authors: ['Prof. B. Scholar'],
            abstract: 'An investigation into memory mechanisms...',
            doi: '10.1000/example.doi2',
            year: 2022
        }
    ]
};

// Helper functions
async function setupTestEnvironment() {
    // Create temporary test workspace
    await fs.ensureDir(TEST_CONFIG.workspace_directory);
    
    // Create test config directory
    const testConfigDir = path.join(os.tmpdir(), '.autonomous-scientist-test');
    await fs.ensureDir(testConfigDir);
    
    return {
        workspace: TEST_CONFIG.workspace_directory,
        configDir: testConfigDir
    };
}

async function cleanupTestEnvironment() {
    try {
        await fs.remove(TEST_CONFIG.workspace_directory);
        const testConfigDir = path.join(os.tmpdir(), '.autonomous-scientist-test');
        await fs.remove(testConfigDir);
    } catch (error) {
        console.warn('Cleanup warning:', error.message);
    }
}

function createMockServer() {
    return new MockServer(
        { name: 'autonomous-scientist-test', version: '6.0.0' },
        { capabilities: { tools: {}, prompts: {} } }
    );
}

function createMockTransport() {
    return new MockTransport();
}

// Assert helpers
function assertToolResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid tool response: must be an object');
    }
    
    if (!response.content || !Array.isArray(response.content)) {
        throw new Error('Invalid tool response: missing content array');
    }
    
    response.content.forEach((item, index) => {
        if (!item.type || !item.text) {
            throw new Error(`Invalid content item at index ${index}: missing type or text`);
        }
    });
}

function assertPromptResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid prompt response: must be an object');
    }
    
    if (!response.description) {
        throw new Error('Invalid prompt response: missing description');
    }
    
    if (!response.messages || !Array.isArray(response.messages)) {
        throw new Error('Invalid prompt response: missing messages array');
    }
}

// Export everything
module.exports = {
    TEST_CONFIG,
    SAMPLE_PDF_CONTENT,
    SAMPLE_LITERATURE_SEARCH_RESULT,
    MockServer,
    MockTransport,
    setupTestEnvironment,
    cleanupTestEnvironment,
    createMockServer,
    createMockTransport,
    assertToolResponse,
    assertPromptResponse
};