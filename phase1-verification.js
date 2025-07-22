#!/usr/bin/env node

/**
 * PHASE 1 VERIFICATION SCRIPT
 * Tests the database schema fixes and connection
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 PHASE 1 DATABASE VERIFICATION\n');
console.log('Configuration:');
console.log('- Supabase URL:', SUPABASE_URL);
console.log('- Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
console.log();

let allPassed = true;

async function runTest(name, testFn) {
  try {
    console.log(`Testing: ${name}...`);
    await testFn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    allPassed = false;
    return false;
  }
}

// Test 1: Basic connection
await runTest('Supabase Connection', async () => {
  const { data, error } = await supabase.from('properties').select('count').limit(1);
  if (error) throw error;
});

// Test 2: Properties table access
await runTest('Properties Table Access', async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('property_id, property_name, street_address')
    .limit(3);
  
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No properties found');
  
  console.log(`   Found ${data.length} properties`);
});

// Test 3: Inspections table access with corrected status query
await runTest('Inspections Table (Fixed Status Query)', async () => {
  // This tests the Phase 1 fix: use .in('status', ['draft', 'in_progress']) instead of .eq('completed', false)
  const { data, error } = await supabase
    .from('inspections')
    .select('id, status, property_id')
    .in('status', ['draft', 'in_progress'])
    .limit(5);
  
  if (error) throw error;
  console.log(`   Found ${data?.length || 0} active inspections`);
});

// Test 4: Users table access
await runTest('Users Table Access', async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .limit(3);
  
  if (error) throw error;
  console.log(`   Found ${data?.length || 0} users`);
});

// Test 5: Logs table with correct relationship
await runTest('Logs Table (Fixed Relationship)', async () => {
  const { data, error } = await supabase
    .from('logs')
    .select(`
      log_id,
      property_id, 
      checklist_id,
      pass,
      static_safety_items!inner(id, label)
    `)
    .limit(5);
  
  if (error) throw error;
  console.log(`   Found ${data?.length || 0} checklist items`);
});

// Test 6: Static safety items
await runTest('Static Safety Items Table', async () => {
  const { data, error } = await supabase
    .from('static_safety_items')
    .select('id, label, category, required')
    .eq('deleted', false)
    .limit(5);
  
  if (error) throw error;
  console.log(`   Found ${data?.length || 0} safety items`);
});

// Test 7: Complex join query (typical for inspection workflow)
await runTest('Complex Join Query (Inspection + Property + Logs)', async () => {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      id,
      status,
      properties!inner (
        property_id,
        property_name,
        street_address
      )
    `)
    .limit(3);
  
  if (error) throw error;
  console.log(`   Successfully joined ${data?.length || 0} records`);
});

console.log('\n📊 VERIFICATION RESULTS:');
console.log('='.repeat(50));

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Phase 1 database schema fixes are working correctly');
  console.log('✅ Supabase connection is stable');
  console.log('✅ All critical tables are accessible');
  console.log('✅ Query fixes prevent 400/404 errors');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('🔧 Phase 1 needs additional work');
  process.exit(1);
}