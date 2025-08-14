#!/usr/bin/env node

/**
 * Test script to verify semicolon handling is fixed
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase, executeDbQuery } from './utils/dbHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

console.log('🔧 Testing Semicolon Handling Fix');
console.log('=================================\n');

async function testSemicolonHandling() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase(config);
    console.log('✅ Database initialized\n');

    // Test queries with various semicolon patterns
    const testQueries = [
      // Basic queries without semicolons
      { query: 'SELECT * FROM users', description: 'No semicolon' },
      { query: 'SELECT COUNT(*) FROM users', description: 'COUNT without semicolon' },
      
      // Queries with single semicolon
      { query: 'SELECT * FROM users;', description: 'Single semicolon' },
      { query: 'SELECT COUNT(*) FROM users;', description: 'COUNT with semicolon' },
      
      // Queries with multiple semicolons
      { query: 'SELECT * FROM users;;', description: 'Double semicolon' },
      { query: 'SELECT * FROM users;;;', description: 'Triple semicolon' },
      
      // Queries with semicolons and whitespace
      { query: 'SELECT * FROM users; ', description: 'Semicolon with trailing space' },
      { query: 'SELECT * FROM users;  \n', description: 'Semicolon with whitespace and newline' },
      { query: '  SELECT * FROM users;  ', description: 'Leading and trailing whitespace with semicolon' },
      
      // More complex queries
      { query: 'SELECT id, first_name, last_name FROM users LIMIT 5;', description: 'Complex query with semicolon' },
      { query: 'SELECT COUNT(*) as total FROM users WHERE city IS NOT NULL;', description: 'WHERE clause with semicolon' }
    ];

    console.log(`🧪 Testing ${testQueries.length} queries with different semicolon patterns...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < testQueries.length; i++) {
      const { query, description } = testQueries[i];
      console.log(`📝 Test ${i + 1}/${testQueries.length}: ${description}`);
      console.log(`   Query: "${query}"`);
      
      try {
        const startTime = Date.now();
        const result = await executeDbQuery(query);
        const duration = Date.now() - startTime;
        
        console.log(`   ✅ Success! ${result.length} records in ${duration}ms`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failCount++;
        
        // Show more details for syntax errors
        if (error.message.includes('syntax error')) {
          console.log(`   🔍 This was a syntax error - the fix may need more work`);
        }
      }
      
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Successful queries: ${successCount}`);
    console.log(`❌ Failed queries: ${failCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / testQueries.length) * 100)}%`);

    if (failCount === 0) {
      console.log('\n🎉 All tests passed! Semicolon handling is working correctly.');
    } else if (successCount > failCount) {
      console.log('\n⚠️  Most tests passed, but some issues remain.');
      console.log('💡 The failing queries might need additional fixes.');
    } else {
      console.log('\n❌ Many tests failed. The semicolon fix needs more work.');
    }

    // Test specific problematic patterns
    console.log('\n🔍 Testing Edge Cases:');
    console.log('======================');
    
    const edgeCases = [
      'SELECT 1 as test;',
      'SELECT \'hello\' as greeting;',
      'SELECT * FROM users WHERE first_name = \'John\';'
    ];

    for (const edgeCase of edgeCases) {
      try {
        console.log(`Testing: ${edgeCase}`);
        const result = await executeDbQuery(edgeCase);
        console.log(`✅ Edge case passed: ${result.length} records`);
      } catch (error) {
        console.log(`❌ Edge case failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test setup failed:', error.message);
    console.error('\n🔧 Make sure:');
    console.error('1. Your Supabase credentials are set');
    console.error('2. Your database has the required tables');
    console.error('3. RPC functions are installed (run npm run setup-rpc or use backend/database/rpc-setup.sql)');
  }
}

testSemicolonHandling();
