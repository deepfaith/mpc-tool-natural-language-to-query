#!/usr/bin/env node

/**
 * RPC Setup and Testing Script
 * This script helps you set up and test RPC functions in Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initializeDatabase, executeDbQuery } from './utils/dbHelpers.js';
import { getSupabaseClient } from './utils/supabaseClient.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

console.log('🚀 Supabase RPC Setup and Testing');
console.log('==================================\n');

async function setupAndTestRPC() {
  try {
    // Step 1: Initialize database
    console.log('📋 Step 1: Initialize Database Connection');
    console.log('------------------------------------------');
    await initializeDatabase(config);
    console.log('✅ Database initialized\n');

    // Step 2: Get Supabase client
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Step 3: Test if RPC functions exist
    console.log('📋 Step 2: Test RPC Function Availability');
    console.log('------------------------------------------');

    const rpcTests = [
      { name: 'test_rpc', params: {}, description: 'Basic RPC test function' },
      { name: 'execute_sql', params: { sql_query: 'SELECT 1 as test' }, description: 'SQL execution function' },
      { name: 'get_query_stats', params: { table_name: 'users' }, description: 'Table statistics function' }
    ];

    let rpcAvailable = false;

    for (const test of rpcTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        const { data, error } = await client.rpc(test.name, test.params);

        if (error) {
          console.log(`   ❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${test.name}: Working`);
          if (test.name === 'execute_sql') rpcAvailable = true;

          if (data) {
            console.log(`   📊 Result:`, JSON.stringify(data, null, 6));
          }
        }
      } catch (err) {
        console.log(`   ❌ ${test.name}: ${err.message}`);
      }
    }

    console.log('');

    // Step 4: Test complex queries if RPC is available
    if (rpcAvailable) {
      console.log('📋 Step 3: Test Complex Queries via RPC');
      console.log('----------------------------------------');

      const complexQueries = [
        'SELECT COUNT(*) as total_users FROM users',
        'SELECT * FROM users LIMIT 3',
        'SELECT * FROM users;',  // Test semicolon handling
        'SELECT COUNT(*) FROM products;',  // Test semicolon with COUNT
        'SELECT u.first_name, u.last_name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.first_name, u.last_name LIMIT 5',
        'SELECT p.category, COUNT(*) as product_count, AVG(p.price) as avg_price FROM products p GROUP BY p.category',
        'SELECT o.status, COUNT(*) as count FROM orders o GROUP BY o.status'
      ];

      for (const query of complexQueries) {
        try {
          console.log(`\n🔍 Testing: ${query}`);
          const result = await executeDbQuery(query);
          console.log(`   ✅ Success: ${result.length} records`);

          if (result.length > 0) {
            console.log(`   📊 Sample:`, JSON.stringify(result[0], null, 6));
          }
        } catch (err) {
          console.log(`   ❌ Failed: ${err.message}`);
        }
      }
    } else {
      console.log('📋 Step 3: RPC Setup Required');
      console.log('------------------------------');
      console.log('❌ RPC functions are not available in your Supabase database.');
      console.log('');
      console.log('🔧 To set up RPC functions:');
      console.log('');
      console.log('1. Open your Supabase dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy the contents of backend/database/rpc-setup.sql');
      console.log('4. Paste and run the SQL in the editor');
      console.log('5. Run this script again to test');
      console.log('');
      console.log('📄 The backend/database/rpc-setup.sql file contains:');
      console.log('   - execute_sql(): Execute any SELECT query');
      console.log('   - test_rpc(): Test RPC functionality');
      console.log('   - get_query_stats(): Get table statistics');
      console.log('   - Security functions and permissions');
    }

    // Step 5: Performance comparison
    if (rpcAvailable) {
      console.log('\n📋 Step 4: Performance Comparison');
      console.log('----------------------------------');

      const testQuery = 'SELECT COUNT(*) as count FROM users';

      // Test RPC performance
      console.log('🔍 Testing RPC performance...');
      const rpcStart = Date.now();
      try {
        const rpcResult = await client.rpc('execute_sql', { sql_query: testQuery });
        const rpcTime = Date.now() - rpcStart;
        console.log(`   ✅ RPC: ${rpcTime}ms`);
      } catch (err) {
        console.log(`   ❌ RPC failed: ${err.message}`);
      }

      // Test query parsing performance
      console.log('🔍 Testing query parsing performance...');
      const parseStart = Date.now();
      try {
        const parseResult = await executeDbQuery(testQuery);
        const parseTime = Date.now() - parseStart;
        console.log(`   ✅ Query parsing: ${parseTime}ms`);
      } catch (err) {
        console.log(`   ❌ Query parsing failed: ${err.message}`);
      }
    }

    console.log('\n🎉 RPC setup and testing completed!');

    if (rpcAvailable) {
      console.log('\n✅ Your setup is complete and working!');
      console.log('🚀 You can now use complex SQL queries in the application.');
    } else {
      console.log('\n⚠️  RPC setup is required for complex queries.');
      console.log('📖 Follow the instructions above to complete the setup.');
    }

  } catch (error) {
    console.error('\n❌ Setup/testing failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your Supabase credentials are correct');
    console.error('2. Ensure your Supabase project is active');
    console.error('3. Verify you have the required tables (users, products, orders)');
    console.error('4. Check your internet connection');

    if (error.message.includes('JWT')) {
      console.error('5. Your Supabase anon key might be invalid');
    }

    if (error.message.includes('function')) {
      console.error('5. RPC functions need to be installed (see setup instructions above)');
    }
  }
}

// Check environment variables first
console.log('🔧 Environment Check:');
console.log('======================');
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease set these variables and try again.');
  process.exit(1);
}

console.log('✅ All required environment variables are set\n');

// Run the setup and testing
setupAndTestRPC();
