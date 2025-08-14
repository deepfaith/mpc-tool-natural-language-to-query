import { spawn } from 'child_process';

// Start the MCP server as a child process
const mcpServer = spawn('node', ['index.js']);

// Listen for server output
mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(`[MCP Server]: ${output}`);
  // Try to parse and print JSON response
  try {
    const json = JSON.parse(output);
    if (json.result && json.result.result && json.result.result.ai_summary) {
      console.log('\nReceived dynamicQuery response:', JSON.stringify(json.result.result, null, 2));
      mcpServer.kill();
    }
  } catch (e) {
    // Ignore non-JSON output
  }
});

mcpServer.stderr.on('data', (data) => {
  process.stderr.write(`[MCP Server Error]: ${data}`);
});

// Send a tools/dynamicQuery request after a short delay to allow server startup
setTimeout(() => {
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id: '2',
    method: 'tools/dynamicQuery',
    params: {
      nl_query: 'Find customers who have both a housing loan and a personal loan.',
      language: 'English',
      tone: 'formal'
    }
  }) + '\n';
  mcpServer.stdin.write(request);
}, 2000); 