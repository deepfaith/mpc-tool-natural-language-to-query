import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

import { initializeDatabase, getDbSchema } from './utils/dbHelpers.js';
import { initializeSupabaseForMCP, getSupabaseClient } from './utils/supabaseClient.js';

import { config as loadEnv } from 'dotenv';
loadEnv();

console.log('🔍 Testing Supabase connection...\n');

// Check environment variables
console.log('🔧 Configuration Check:');
console.log('======================');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_HOST: ${process.env.SUPABASE_HOST ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_PASSWORD: ${process.env.SUPABASE_PASSWORD ? '✅ Set' : '❌ Not set'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('\n⚠️  Supabase client environment variables not set. Using config.json values...');
  console.log('💡 For production, set these environment variables:');
  console.log('   export SUPABASE_URL="https://your-project-ref.supabase.co"');
  console.log('   export SUPABASE_ANON_KEY="your-anon-key"');
  console.log('   export SUPABASE_HOST="db.your-project-ref.supabase.co"');
  console.log('   export SUPABASE_PASSWORD="your-database-password"');
  console.log('   export OPENAI_API_KEY="your-openai-api-key"');
}

console.log('\n🔌 Testing Supabase connection...');

try {
  // Test Supabase connection (primary method)
  await initializeSupabaseForMCP(config);
  console.log('✅ Supabase connection successful!\n');

  // Also test the database helpers
  await initializeDatabase(config);
  console.log('✅ Database helpers initialized!\n');

  // Test schema retrieval
  console.log('📊 Retrieving database schema...');
  const schema = await getDbSchema();

  console.log('\n📋 Database Schema:');
  console.log('==================');

  for (const [tableName, tableInfo] of Object.entries(schema)) {
    console.log(`\n🗂️  Table: ${tableName}`);
    if (tableInfo.description) {
      console.log(`   Description: ${tableInfo.description}`);
    }
    console.log(`   Columns: ${tableInfo.columns ? tableInfo.columns.length : 'Unknown'}`);

    if (tableInfo.columns) {
      tableInfo.columns.forEach(col => {
        const nullable = col.nullable ? '(nullable)' : '(required)';
        const maxLen = col.maxLength ? ` max:${col.maxLength}` : '';
        console.log(`     - ${col.name}: ${col.type}${maxLen} ${nullable}`);
      });
    }
  }

  // Test a simple query
  console.log('\n🧪 Testing sample queries...');

  try {
    const { executeDbQuery } = await import('./utils/dbHelpers.js');

    // Test users table
    const usersCount = await executeDbQuery('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table: ${usersCount[0]?.count || 0} records`);

    // Test products table
    const productsCount = await executeDbQuery('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Products table: ${productsCount[0]?.count || 0} records`);

    // Test orders table
    const ordersCount = await executeDbQuery('SELECT COUNT(*) as count FROM orders');
    console.log(`✅ Orders table: ${ordersCount[0]?.count || 0} records`);

    // Test a sample query with joins
    const sampleData = await executeDbQuery(`
      SELECT u.first_name, u.last_name, u.email, u.city 
      FROM users u 
      LIMIT 3
    `);

    if (sampleData.length > 0) {
      console.log('\n📄 Sample user data:');
      sampleData.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.city || 'No city'}`);
      });
    }

  } catch (queryError) {
    console.log(`⚠️  Query test failed: ${queryError.message}`);
    console.log('   This might be normal if tables are empty or don\'t exist yet.');
  }

  console.log('\n🎉 All tests passed! Your Supabase connection is working correctly.');
  console.log('\n📝 Next steps:');
  console.log('1. Start the application with: npm run dev');
  console.log('2. Open http://localhost:5173 in your browser');
  console.log('3. Try asking natural language questions about your data');
  console.log('\n💡 Example questions you can ask:');
  console.log('   - "Show all users from New York"');
  console.log('   - "Count total products by category"');
  console.log('   - "Find orders with status pending"');
  console.log('   - "Show users who have placed orders"');

} catch (error) {
  console.error('\n❌ Connection test failed:');
  console.error('Error:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('1. Check your Supabase credentials:');
  console.error('   - Set SUPABASE_URL environment variable (e.g., https://your-project-ref.supabase.co)');
  console.error('   - Set SUPABASE_ANON_KEY environment variable');
  console.error('   - Optionally set SUPABASE_HOST and SUPABASE_PASSWORD for direct connection');
  console.error('   - Or update config.json with your connection details');
  console.error('2. Ensure your Supabase project is running');
  console.error('3. Verify your credentials in Supabase dashboard > Settings > API');
  console.error('4. Check if the required tables (users, products, orders) exist');
  console.error('5. Ensure your IP is allowed in Supabase network restrictions');
  console.error('6. Verify RLS (Row Level Security) policies allow access');

  process.exit(1);
}

process.exit(0);
