import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config as loadEnv } from 'dotenv';
loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
import { initializeSupabaseForMCP } from './utils/supabaseClient.js';
import { executeNaturalLanguageQueryTool } from './controllers/dynamicToolHandler.js';
import { z } from 'zod';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// ---- Schemas for MCP Request Handlers ----

// Schema for the 'tools/list' method
const ListToolsSchema = z.object({
  method: z.literal('tools/list'),
  params: z.unknown().optional()
});

// Schema for the 'tools/dynamicQuery' method
const DynamicQuerySchema = z.object({
  method: z.literal('tools/dynamicQuery'),
  params: z.object({
    nl_query: z.string(),
    language: z.string().optional(),
    tone: z.string().optional()
  }),
});

// ---- OpenAPI-style Definition for the UI ----
// This is what the UI reads to display the tool. It's just plain JSON.
const dynamicQueryToolDefinition = {
  name: 'dynamicQuery',
  method: 'tools/dynamicQuery',
  description: 'Dynamic natural language query against schema',
  parameters: {
    type: 'object',
    properties: {
      nl_query: { type: 'string', description: "The natural language question to ask." },
      language: { type: 'string', description: "Language for the response (e.g., 'English')." },
      tone: { type: 'string', description: "Tone of the summary (e.g., 'formal')." }
    },
    required: ['nl_query']
  }
  // You can also define the 'response' schema here if the UI needs it.
};

// --- Server Setup ---

try {
  await initializeSupabaseForMCP(config);
  console.error('[MCP] ✅ Supabase initialized and validated');
} catch (error) {
  console.error('[MCP] ❌ Supabase initialization failed:', error.message);
  console.error('[MCP] 💡 Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  console.error('[MCP] 💡 Or update config.json with your Supabase credentials');
  process.exit(1);
}

const mcpServer = new McpServer({
  name: 'data-query-mcp-server',
  version: '1.0.0',
  description: 'Natural language AI data query MCP server'
}, {
  capabilities: { tools: {}, health: true }
});

const transport = new StdioServerTransport(process.stdin, process.stdout);
mcpServer.connect(transport);
console.error('[MCP] 🎯 MCP server is live via stdio 🔌');

// --- Register Handlers Using the Schemas ---

// Register the handler for 'tools/list' using ListToolsSchema
mcpServer.setRequestHandler(ListToolsSchema, async () => {
  console.error('[MCP] Handling tools/list request');
  return {
    result: { tools: [dynamicQueryToolDefinition] }
  };
});
console.error('[MCP] ✅ Registered handler for tools/list');

// Register the handler for 'tools/dynamicQuery' using DynamicQuerySchema
mcpServer.setRequestHandler(DynamicQuerySchema, async (req) => {
  console.error('[MCP] Handling tools/dynamicQuery with params:', req.params);
  try {
    const result = await executeNaturalLanguageQueryTool(req.params, config);
    return { result };
  } catch (err) {
    console.error('[MCP] dynamicQuery error:', err.message);
    return {
      error: { code: -32000, message: err.message }
    };
  }
});
console.error('[MCP] ✅ Registered handler for tools/dynamicQuery');

console.error('[MCP] All handlers registered. Server is ready!');



console.error('[MCP] ✅ MCP Server running on stdio');
