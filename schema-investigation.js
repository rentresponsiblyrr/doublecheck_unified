#!/usr/bin/env node

/**
 * SCHEMA INVESTIGATION SCRIPT
 * Discovers the actual database schema structure
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 SCHEMA INVESTIGATION\n');

async function investigateTable(tableName) {
  console.log(`\n📋 TABLE: ${tableName}`);
  console.log('='.repeat(30));
  
  try {
    // Get first few rows to understand structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error accessing ${tableName}:`, error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ Columns (${columns.length}):`);
      columns.forEach(col => {
        const value = data[0][col];
        const type = typeof value;
        const sample = value !== null ? String(value).substring(0, 50) : 'null';
        console.log(`   - ${col}: ${type} | Sample: "${sample}"`);
      });
    } else {
      console.log(`⚠️  ${tableName} exists but is empty`);
    }
  } catch (err) {
    console.log(`❌ Failed to access ${tableName}:`, err.message);
  }
}

// Investigate all tables
const tables = [
  'properties',
  'inspections', 
  'users',
  'logs',
  'static_safety_items',
  'media'
];

for (const table of tables) {
  await investigateTable(table);
}

// Test relationships
console.log('\n🔗 RELATIONSHIP TESTING');
console.log('='.repeat(40));

// Test properties-inspections relationship
try {
  console.log('\n🔍 Testing properties -> inspections relationship...');
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      inspections(*)
    `)
    .limit(1);
    
  if (error) {
    console.log('❌ Properties-Inspections relationship error:', error.message);
  } else {
    console.log('✅ Properties-Inspections relationship works');
  }
} catch (err) {
  console.log('❌ Properties-Inspections test failed:', err.message);
}

// Test logs-static_safety_items relationship
try {
  console.log('\n🔍 Testing logs -> static_safety_items relationship...');
  const { data, error } = await supabase
    .from('logs')
    .select(`
      *,
      static_safety_items(*)
    `)
    .limit(1);
    
  if (error) {
    console.log('❌ Logs-StaticSafetyItems relationship error:', error.message);
  } else {
    console.log('✅ Logs-StaticSafetyItems relationship works');
  }
} catch (err) {
  console.log('❌ Logs-StaticSafetyItems test failed:', err.message);
}

console.log('\n📊 INVESTIGATION COMPLETE');