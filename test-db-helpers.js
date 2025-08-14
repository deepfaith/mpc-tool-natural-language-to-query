#!/usr/bin/env node

/**
 * Test script to verify dbHelpers.js works correctly with Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  initializeDatabase, 
  isDatabaseInitialized, 
  getDatabaseStatus,
  getDbSchema,
  executeDbQuery,
  getActiveDbType
} from './utils/dbHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

console.log('🧪 Testing dbHelpers.js with Supabase');
console.log('=====================================\n');

async function runTests() {
  try {
    // Test 1: Check initial status
    console.log('📋 Test 1: Initial Database Status');
    console.log('-----------------------------------');
    let status = getDatabaseStatus();
    console.log('Initial status:', status);
    console.log('Is initialized:', isDatabaseInitialized());
    console.log('Active DB type:', getActiveDbType());
    console.log('');

    // Test 2: Initialize database
    console.log('📋 Test 2: Initialize Database');
    console.log('-------------------------------');
    await initializeDatabase(config);
    
    status = getDatabaseStatus();
    console.log('Post-init status:', status);
    console.log('Is initialized:', isDatabaseInitialized());
    console.log('Active DB type:', getActiveDbType());
    console.log('');

    // Test 3: Get database schema
    console.log('📋 Test 3: Get Database Schema');
    console.log('-------------------------------');
    try {
      const schema = await getDbSchema();
      console.log('✅ Schema retrieved successfully');
      console.log('Tables found:', Object.keys(schema));
      
      // Show details for first table
      const firstTable = Object.keys(schema)[0];
      if (firstTable) {
        console.log(`\nDetails for '${firstTable}' table:`);
        console.log('Description:', schema[firstTable].description);
        console.log('Columns:', schema[firstTable].columns.length);
        schema[firstTable].columns.slice(0, 3).forEach(col => {
          console.log(`  - ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(required)'}`);
        });
      }
    } catch (error) {
      console.log('❌ Schema retrieval failed:', error.message);
    }
    console.log('');

    // Test 4: Execute simple queries
    console.log('📋 Test 4: Execute Database Queries');
    console.log('------------------------------------');
    
    const testQueries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT * FROM users LIMIT 3',
      'SELECT COUNT(*) as count FROM products',
      'SELECT * FROM products LIMIT 2'
    ];

    for (const query of testQueries) {
      try {
        console.log(`\n🔍 Testing query: ${query}`);
        const result = await executeDbQuery(query);
        console.log(`✅ Success! Found ${result.length} records`);
        
        if (result.length > 0) {
          console.log('Sample result:', JSON.stringify(result[0], null, 2));
        }
      } catch (error) {
        console.log(`❌ Query failed: ${error.message}`);
      }
    }

    // Test 5: Test error handling
    console.log('\n📋 Test 5: Error Handling');
    console.log('--------------------------');
    
    const invalidQueries = [
      'DELETE FROM users', // Should be blocked
      'INSERT INTO users VALUES (1)', // Should be blocked
      'SELECT * FROM nonexistent_table', // Should fail gracefully
    ];

    for (const query of invalidQueries) {
      try {
        console.log(`\n🔍 Testing invalid query: ${query}`);
        await executeDbQuery(query);
        console.log('❌ Query should have failed but didn\'t!');
      } catch (error) {
        console.log(`✅ Correctly blocked/failed: ${error.message}`);
      }
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Final Database Status:');
    console.log('==========================');
    const finalStatus = getDatabaseStatus();
    console.log('Has direct connection:', finalStatus.hasDirectConnection);
    console.log('Has Supabase client:', finalStatus.hasSupabaseClient);
    console.log('Database type:', finalStatus.dbType);
    console.log('Is initialized:', finalStatus.isInitialized);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_ANON_KEY');
    console.error('   - SUPABASE_HOST (optional)');
    console.error('   - SUPABASE_PASSWORD (optional)');
    console.error('2. Verify your Supabase project is running');
    console.error('3. Check your database has the expected tables (users, products, orders)');
    
    process.exit(1);
  }
}

// Check environment variables
console.log('🔧 Environment Check:');
console.log('======================');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_HOST: ${process.env.SUPABASE_HOST ? '✅ Set' : '⚪ Optional'}`);
console.log(`SUPABASE_PASSWORD: ${process.env.SUPABASE_PASSWORD ? '✅ Set' : '⚪ Optional'}`);
console.log('');

// Run the tests
runTests().catch(console.error);
