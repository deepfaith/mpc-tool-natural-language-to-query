#!/usr/bin/env node

/**
 * Test script to verify simple queries work correctly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase, executeDbQuery } from './utils/dbHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

console.log('🧪 Testing Simple Queries');
console.log('==========================\n');

async function testQueries() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase(config);
    console.log('✅ Database initialized\n');

    // Test queries that should work
    const testQueries = [
      'SELECT * FROM users',
      'SELECT * FROM users;',
      'select * from users',
      'select * from users;',
      'SELECT * FROM products',
      'SELECT * FROM orders',
      'SELECT COUNT(*) FROM users',
      'SELECT COUNT(*) as total FROM users',
      'SELECT * FROM users LIMIT 5',
      'SELECT * FROM users LIMIT 3;',
      'SELECT id, first_name, email FROM users',
      'SELECT name, price FROM products',
      'SELECT * FROM users WHERE city = \'New York\'',
      'SELECT * FROM products WHERE price = 100'
    ];

    console.log(`🚀 Testing ${testQueries.length} queries...\n`);

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`📝 Test ${i + 1}/${testQueries.length}: "${query}"`);
      
      try {
        const startTime = Date.now();
        const result = await executeDbQuery(query);
        const duration = Date.now() - startTime;
        
        console.log(`   ✅ Success! ${result.length} records in ${duration}ms`);
        
        if (result.length > 0) {
          const sampleKeys = Object.keys(result[0]).slice(0, 3);
          console.log(`   📊 Sample columns: ${sampleKeys.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('🎉 Query testing completed!');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    console.error('\n🔧 Make sure:');
    console.error('1. Your Supabase credentials are set');
    console.error('2. Your database has the required tables (users, products, orders)');
    console.error('3. Your tables have some data');
  }
}

testQueries();
