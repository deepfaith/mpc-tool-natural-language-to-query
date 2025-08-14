#!/usr/bin/env node

/**
 * Interactive MCP Tool Tester
 * This provides a CLI interface to test MCP tools directly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';
import { initializeSupabaseForMCP } from './utils/supabaseClient.js';
import { executeNaturalLanguageQueryTool } from './controllers/dynamicToolHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

// Setup readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '🤖 Query> '
});

let isInitialized = false;

console.log('🚀 MCP Tool Interactive Tester');
console.log('===============================\n');

// Initialize the system
async function initialize() {
  try {
    console.log('🔄 Initializing Supabase and MCP tools...');
    await initializeSupabaseForMCP(config);
    console.log('✅ System initialized successfully!\n');
    
    showHelp();
    isInitialized = true;
    rl.prompt();
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('\n💡 Make sure your environment variables are set:');
    console.error('   export SUPABASE_URL="https://your-project-ref.supabase.co"');
    console.error('   export SUPABASE_ANON_KEY="your-anon-key"');
    console.error('   export OPENAI_API_KEY="your-openai-key"');
    process.exit(1);
  }
}

function showHelp() {
  console.log('📖 Available Commands:');
  console.log('======================');
  console.log('• Type any natural language query to test the MCP tool');
  console.log('• /help - Show this help message');
  console.log('• /examples - Show example queries');
  console.log('• /clear - Clear the screen');
  console.log('• /exit or /quit - Exit the program');
  console.log('• Ctrl+C - Force exit\n');
  
  console.log('💡 Example queries:');
  console.log('   "Show all users"');
  console.log('   "Count products by category"');
  console.log('   "Find orders with status pending"');
  console.log('   "Show users from New York"\n');
}

function showExamples() {
  const examples = [
    {
      category: 'Simple Queries',
      queries: [
        'Show all users',
        'List all products',
        'Display recent orders'
      ]
    },
    {
      category: 'Filtered Queries',
      queries: [
        'Show users from California',
        'Find products under $50',
        'List pending orders'
      ]
    },
    {
      category: 'Aggregation Queries',
      queries: [
        'Count total users',
        'Sum order amounts',
        'Average product price'
      ]
    },
    {
      category: 'Complex Queries',
      queries: [
        'Show users who have placed orders',
        'Find top selling products',
        'List orders with their user details'
      ]
    }
  ];

  console.log('\n📝 Example Queries by Category:');
  console.log('================================');
  
  examples.forEach(category => {
    console.log(`\n🏷️  ${category.category}:`);
    category.queries.forEach(query => {
      console.log(`   • "${query}"`);
    });
  });
  console.log('');
}

async function executeQuery(query) {
  if (!isInitialized) {
    console.log('❌ System not initialized yet. Please wait...');
    return;
  }

  console.log(`\n🔍 Executing: "${query}"`);
  console.log('⏳ Processing...\n');

  const startTime = Date.now();

  try {
    // Execute the MCP tool
    const result = await executeNaturalLanguageQueryTool({
      nl_query: query,
      language: 'English',
      tone: 'neutral'
    }, config);

    const executionTime = Date.now() - startTime;

    // Display results
    console.log('✅ Query executed successfully!');
    console.log(`⏱️  Execution time: ${executionTime}ms\n`);

    if (result.content && result.content[0] && result.content[0].text) {
      try {
        const parsedResult = JSON.parse(result.content[0].text);
        
        console.log('📊 Results:');
        console.log('===========');
        
        if (parsedResult.generated_query) {
          console.log(`🔧 Generated SQL: ${parsedResult.generated_query}`);
        }
        
        if (parsedResult.data && Array.isArray(parsedResult.data)) {
          console.log(`📈 Found ${parsedResult.data.length} records:`);
          
          if (parsedResult.data.length > 0) {
            // Display first few records
            const displayCount = Math.min(5, parsedResult.data.length);
            console.log('\n📋 Sample Data:');
            
            for (let i = 0; i < displayCount; i++) {
              console.log(`\n   Record ${i + 1}:`);
              Object.entries(parsedResult.data[i]).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
              });
            }
            
            if (parsedResult.data.length > displayCount) {
              console.log(`\n   ... and ${parsedResult.data.length - displayCount} more records`);
            }
          }
        }
        
        if (parsedResult.ai_summary) {
          console.log(`\n🤖 AI Summary: ${parsedResult.ai_summary}`);
        }
        
      } catch (parseError) {
        console.log('📄 Raw Response:');
        console.log(result.content[0].text);
      }
    } else {
      console.log('📄 Response:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    
    if (error.message.includes('OpenAI')) {
      console.error('💡 Check your OpenAI API key');
    } else if (error.message.includes('Supabase') || error.message.includes('database')) {
      console.error('💡 Check your Supabase connection');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Handle user input
rl.on('line', async (input) => {
  const command = input.trim();
  
  if (!command) {
    rl.prompt();
    return;
  }

  // Handle special commands
  if (command.startsWith('/')) {
    switch (command.toLowerCase()) {
      case '/help':
        showHelp();
        break;
      case '/examples':
        showExamples();
        break;
      case '/clear':
        console.clear();
        console.log('🚀 MCP Tool Interactive Tester');
        console.log('===============================\n');
        break;
      case '/exit':
      case '/quit':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('💡 Type /help for available commands');
    }
  } else {
    // Execute as a natural language query
    await executeQuery(command);
  }
  
  rl.prompt();
});

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Handle process exit
process.on('exit', () => {
  console.log('🏁 MCP Tool Tester closed');
});

// Start the application
initialize();
