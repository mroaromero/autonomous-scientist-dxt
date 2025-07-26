#!/usr/bin/env node

/**
 * Test script to verify MCP server functionality
 */

console.error('🔬 Testing MCP Server...');

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'bundle.js');

console.error(`📍 Server path: ${serverPath}`);

// Test 1: Can we start the server?
console.error('📋 Test 1: Starting server...');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasOutput = false;
let initResponse = '';

server.stdout.on('data', (data) => {
  hasOutput = true;
  initResponse += data.toString();
  console.error('📤 Server stdout:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error('❌ Server stderr:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('💥 Server spawn error:', error.message);
  process.exit(1);
});

// Test 2: Send MCP initialization
setTimeout(() => {
  console.error('📋 Test 2: Sending MCP initialization...');
  
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  server.stdin.write(JSON.stringify(initMessage) + '\n');
}, 1000);

// Test 3: Check for response
setTimeout(() => {
  console.error('📋 Test 3: Checking response...');
  
  if (!hasOutput) {
    console.error('❌ No output from server after 3 seconds');
  } else {
    console.error('✅ Server produced output');
    try {
      const response = JSON.parse(initResponse);
      console.error('✅ Valid JSON response:', response);
    } catch (e) {
      console.error('⚠️  Response not valid JSON:', initResponse);
    }
  }
  
  server.kill();
  process.exit(0);
}, 3000);

// Cleanup
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});