#!/usr/bin/env node

/**
 * Live MCP Tool Tester - Tests MCP tools without starting a separate server
 * This directly imports and tests the MCP tool functions
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';
import { initializeDatabase, isDatabaseInitialized, getDatabaseStatus } from './utils/dbHelpers.js';
import { executeNaturalLanguageQueryTool } from './controllers/dynamicToolHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

// Setup readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '🔍 Query> '
});

let isReady = false;

console.log('🧪 Live MCP Tool Tester');
console.log('========================');
console.log('This tests MCP tools directly without the MCP server protocol\n');

// Initialize the system
async function initialize() {
  try {
    console.log('🔄 Initializing database connection...');
    await initializeDatabase(config);
    console.log('✅ Database connected successfully!');
    
    console.log('🔄 Testing OpenAI connection...');
    // Quick test of AI functionality
    const testResult = await executeNaturalLanguageQueryTool({
      nl_query: 'SELECT 1 as test',
      language: 'English',
      tone: 'neutral'
    }, config);
    
    if (testResult) {
      console.log('✅ OpenAI connection working!');
    }
    
    console.log('\n🎉 System ready for testing!\n');
    showQuickHelp();
    isReady = true;
    rl.prompt();
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    
    if (error.message.includes('Supabase') || error.message.includes('database')) {
      console.error('• Check your Supabase credentials');
      console.error('• Ensure SUPABASE_HOST and SUPABASE_PASSWORD are set');
    }
    
    if (error.message.includes('OpenAI')) {
      console.error('• Check your OpenAI API key');
      console.error('• Ensure OPENAI_API_KEY is set');
    }
    
    console.error('\n💡 Set environment variables:');
    console.error('export SUPABASE_HOST="db.your-project-ref.supabase.co"');
    console.error('export SUPABASE_PASSWORD="your-database-password"');
    console.error('export OPENAI_API_KEY="your-openai-key"');
    
    process.exit(1);
  }
}

function showQuickHelp() {
  console.log('💡 Quick Start:');
  console.log('• Type any question about your data');
  console.log('• Type "help" for more commands');
  console.log('• Type "exit" to quit\n');
  
  console.log('🎯 Try these examples:');
  console.log('• "Show all users"');
  console.log('• "Count products by category"');
  console.log('• "Find pending orders"\n');
}

function showFullHelp() {
  console.log('\n📖 Available Commands:');
  console.log('======================');
  console.log('help     - Show this help');
  console.log('examples - Show example queries');
  console.log('stats    - Show database statistics');
  console.log('clear    - Clear screen');
  console.log('exit     - Exit program\n');
  
  console.log('🔍 Query Examples:');
  console.log('==================');
  console.log('Simple:');
  console.log('• "Show all users"');
  console.log('• "List products"');
  console.log('• "Display orders"');
  console.log('\nFiltered:');
  console.log('• "Show users from California"');
  console.log('• "Find products under $100"');
  console.log('• "List orders from last week"');
  console.log('\nAggregated:');
  console.log('• "Count users by city"');
  console.log('• "Sum order totals"');
  console.log('• "Average product price"');
  console.log('\nComplex:');
  console.log('• "Show users who have placed orders"');
  console.log('• "Find top selling products"');
  console.log('• "List orders with customer details"\n');
}

async function showStats() {
  console.log('\n📊 Database Statistics:');
  console.log('=======================');
  
  try {
    const queries = [
      { name: 'Users', query: 'Count total users' },
      { name: 'Products', query: 'Count total products' },
      { name: 'Orders', query: 'Count total orders' }
    ];
    
    for (const { name, query } of queries) {
      try {
        const result = await executeNaturalLanguageQueryTool({
          nl_query: query,
          language: 'English',
          tone: 'neutral'
        }, config);
        
        if (result.content && result.content[0]) {
          const parsed = JSON.parse(result.content[0].text);
          if (parsed.data && parsed.data[0]) {
            const count = Object.values(parsed.data[0])[0];
            console.log(`📈 ${name}: ${count}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${name}: Error getting count`);
      }
    }
  } catch (error) {
    console.log('❌ Could not retrieve statistics');
  }
  
  console.log('');
}

async function executeQuery(query) {
  if (!isReady || !isDatabaseInitialized()) {
    console.log('❌ System not ready. Please wait for initialization...');
    const status = getDatabaseStatus();
    console.log('📊 Database Status:', status);
    return;
  }

  console.log(`\n🤖 Processing: "${query}"`);
  console.log('⏳ Thinking...');

  const startTime = Date.now();

  try {
    const result = await executeNaturalLanguageQueryTool({
      nl_query: query,
      language: 'English',
      tone: 'neutral'
    }, config);

    const duration = Date.now() - startTime;
    console.log(`✅ Completed in ${duration}ms\n`);

    if (result.content && result.content[0] && result.content[0].text) {
      try {
        const parsed = JSON.parse(result.content[0].text);
        
        // Show generated SQL
        if (parsed.generated_query) {
          console.log('🔧 SQL Generated:');
          console.log(`   ${parsed.generated_query}\n`);
        }
        
        // Show results
        if (parsed.data) {
          console.log(`📊 Results (${parsed.data.length} records):`);
          
          if (parsed.data.length > 0) {
            // Show first 3 records
            const showCount = Math.min(3, parsed.data.length);
            
            for (let i = 0; i < showCount; i++) {
              console.log(`\n   ${i + 1}. ${JSON.stringify(parsed.data[i], null, 6)}`);
            }
            
            if (parsed.data.length > showCount) {
              console.log(`\n   ... and ${parsed.data.length - showCount} more`);
            }
          } else {
            console.log('   No records found');
          }
        }
        
        // Show AI summary
        if (parsed.ai_summary) {
          console.log(`\n🤖 Summary: ${parsed.ai_summary}`);
        }
        
      } catch (parseError) {
        console.log('📄 Raw response:');
        console.log(result.content[0].text);
      }
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    if (error.message.includes('SQL')) {
      console.error('💡 Try rephrasing your question');
    }
  }

  console.log('\n' + '-'.repeat(50));
}

// Handle user input
rl.on('line', async (input) => {
  const command = input.trim().toLowerCase();
  
  if (!command) {
    rl.prompt();
    return;
  }

  switch (command) {
    case 'help':
      showFullHelp();
      break;
    case 'examples':
      showFullHelp();
      break;
    case 'stats':
      await showStats();
      break;
    case 'clear':
      console.clear();
      console.log('🧪 Live MCP Tool Tester');
      console.log('========================\n');
      break;
    case 'exit':
    case 'quit':
      console.log('👋 Goodbye!');
      process.exit(0);
      break;
    default:
      await executeQuery(input.trim());
  }
  
  rl.prompt();
});

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

// Start the application
console.log('⏳ Initializing...\n');
initialize();
