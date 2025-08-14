#!/usr/bin/env node

/**
 * Debug script to test specific query parsing
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase, executeDbQuery } from './utils/dbHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

console.log('🐛 Debug Query Parsing');
console.log('======================\n');

async function debugQuery() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase(config);
    console.log('✅ Database initialized\n');

    // Test the specific query that's failing
    const testQuery = 'SELECT * FROM users';
    console.log(`🔍 Testing query: "${testQuery}"`);
    console.log('Query length:', testQuery.length);
    console.log('Query trimmed:', `"${testQuery.trim()}"`);
    console.log('Query lowercase:', `"${testQuery.toLowerCase().trim()}"`);
    
    // Test the regex pattern manually
    const lowerQuery = testQuery.toLowerCase().trim();
    const pattern = /^select\s+\*\s+from\s+(\w+)(?:\s+limit\s+(\d+))?(?:\s*;)?$/;
    const match = lowerQuery.match(pattern);
    
    console.log('\n🧪 Manual Regex Test:');
    console.log('Pattern:', pattern.toString());
    console.log('Test string:', `"${lowerQuery}"`);
    console.log('Match result:', match);
    
    if (match) {
      console.log('✅ Pattern should match!');
      console.log('Table name:', match[1]);
      console.log('Limit:', match[2]);
    } else {
      console.log('❌ Pattern does not match');
      
      // Test simpler patterns
      console.log('\n🔍 Testing simpler patterns:');
      
      const patterns = [
        /^select\s+\*\s+from\s+users$/,
        /^select\s+\*\s+from\s+\w+$/,
        /^select.*from.*users/,
        /select.*\*/
      ];
      
      patterns.forEach((pat, index) => {
        const result = lowerQuery.match(pat);
        console.log(`Pattern ${index + 1} (${pat.toString()}):`, result ? '✅ Match' : '❌ No match');
      });
    }
    
    console.log('\n🚀 Executing actual query...');
    const result = await executeDbQuery(testQuery);
    console.log('✅ Query executed successfully!');
    console.log('Result count:', result.length);
    if (result.length > 0) {
      console.log('Sample result:', JSON.stringify(result[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugQuery();
