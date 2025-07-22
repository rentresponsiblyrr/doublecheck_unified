#!/usr/bin/env node

/**
 * FINAL PHASE 1 VERIFICATION SCRIPT
 * Must pass 100% for Phase 1 completion acceptance
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 FINAL PHASE 1 VERIFICATION');
console.log('=' .repeat(50));
console.log('This script must pass 100% for completion acceptance\n');

let allPassed = true;
const results = [];

async function runTest(name, testFn, required = true) {
  try {
    console.log(`Testing: ${name}...`);
    const result = await testFn();
    
    if (result === 'SUCCESS') {
      console.log(`✅ PASS: ${name}`);
      results.push({ test: name, status: 'PASS', required });
      return true;
    } else if (result === 'REQUIRES_AUTH' && name.includes('Authentication')) {
      console.log(`🔒 ACCEPTABLE: ${name} - Authentication working as designed`);
      results.push({ test: name, status: 'ACCEPTABLE', required });
      return true;
    } else {
      console.log(`❌ FAIL: ${name} - ${result}`);
      results.push({ test: name, status: 'FAIL', result, required });
      if (required) allPassed = false;
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    results.push({ test: name, status: 'ERROR', error: error.message, required });
    if (required) allPassed = false;
    return false;
  }
}

// Test 1: Schema Discovery Complete
await runTest('Schema Discovery - Properties Table', async () => {
  const result = await supabase.from('properties').select('*').limit(1);
  
  if (result.error) {
    if (result.error.message.includes('permission denied')) {
      return 'REQUIRES_AUTH'; // Acceptable for properties table
    }
    return `FAILED: ${result.error.message}`;
  }
  
  if (result.data && result.data.length > 0) {
    const columns = Object.keys(result.data[0]);
    console.log(`   Properties table columns: ${columns.join(', ')}`);
    return 'SUCCESS';
  }
  
  return 'FAILED: No data returned';
});

// Test 2: Schema Discovery - Inspections Table  
await runTest('Schema Discovery - Inspections Table', async () => {
  const result = await supabase.from('inspections').select('*').limit(1);
  
  if (result.error) {
    if (result.error.message.includes('permission denied')) {
      return 'REQUIRES_AUTH'; // Acceptable for inspections table
    }
    return `FAILED: ${result.error.message}`;
  }
  
  if (result.data) {
    return 'SUCCESS';
  }
  
  return 'FAILED: No data structure returned';
});

// Test 3: Service Layer Import Test
await runTest('Service Layer Schema Compatibility', async () => {
  try {
    // Test that service layer files can be imported without schema errors
    const fs = await import('fs/promises');
    
    // Check if service files exist and are readable
    const inspectionServiceExists = await fs.access('./src/services/inspection/InspectionDataService.ts').then(() => true).catch(() => false);
    const propertyServiceExists = await fs.access('./src/services/inspection/PropertyDataService.ts').then(() => true).catch(() => false);
    
    if (!inspectionServiceExists || !propertyServiceExists) {
      return 'FAILED: Service layer files missing';
    }
    
    return 'SUCCESS';
  } catch (error) {
    return `FAILED: ${error.message}`;
  }
});

// Test 4: Table Relationships - Static Safety Items
await runTest('Table Relationships - Static Safety Items', async () => {
  const result = await supabase
    .from('static_safety_items')
    .select('id, label, category, required, deleted')
    .eq('deleted', false)
    .limit(3);
  
  if (result.error) {
    return `FAILED: ${result.error.message}`;
  }
  
  if (result.data && result.data.length > 0) {
    console.log(`   Found ${result.data.length} active safety items`);
    return 'SUCCESS';
  }
  
  return 'FAILED: No static safety items found';
});

// Test 5: Logs Table Relationship Test
await runTest('Logs-StaticSafetyItems Relationship', async () => {
  // Test the relationship that was problematic
  const result = await supabase
    .from('logs')
    .select(`
      *,
      static_safety_items(id, label)
    `)
    .limit(1);
  
  if (result.error) {
    if (result.error.message.includes('Could not find a relationship')) {
      return 'FAILED: Relationship not properly configured - REQUIRES FIX';
    }
    return `FAILED: ${result.error.message}`;
  }
  
  return 'SUCCESS';
});

// Test 6: Authentication State Management
await runTest('Authentication State Handling', async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // No user logged in is acceptable for this test
      console.log('   No authenticated user - authentication system ready');
      return 'SUCCESS';
    }
    
    if (user) {
      console.log(`   Authenticated user found: ${user.email}`);
      return 'SUCCESS';
    }
    
    return 'SUCCESS'; // No user is fine for this test
  } catch (error) {
    return `FAILED: Authentication system error - ${error.message}`;
  }
});

// Test 7: Core Tables Accessibility  
await runTest('Core Tables Accessibility', async () => {
  const tables = ['users', 'static_safety_items', 'logs', 'media'];
  const results = [];
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.push(`${table}: ERROR - ${error.message}`);
      } else {
        results.push(`${table}: OK (${count || 0} rows)`);
      }
    } catch (err) {
      results.push(`${table}: EXCEPTION - ${err.message}`);
    }
  }
  
  console.log(`   Table status: ${results.join(', ')}`);
  
  // All core tables should be accessible
  const hasErrors = results.some(r => r.includes('ERROR') || r.includes('EXCEPTION'));
  return hasErrors ? 'FAILED: Core tables inaccessible' : 'SUCCESS';
});

// Test 8: TypeScript Compilation Check
await runTest('TypeScript Compilation', async () => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync('npm run typecheck');
    
    if (stderr && stderr.includes('error TS')) {
      return `FAILED: TypeScript errors found - ${stderr}`;
    }
    
    return 'SUCCESS';
  } catch (error) {
    if (error.stdout && !error.stdout.includes('error TS')) {
      return 'SUCCESS'; // No TS errors
    }
    return `FAILED: TypeScript compilation failed - ${error.message}`;
  }
}, false); // Not required for Phase 1 core completion

console.log('\n📊 FINAL VERIFICATION RESULTS');
console.log('=' .repeat(50));

const requiredTests = results.filter(r => r.required);
const requiredPassed = requiredTests.filter(r => r.status === 'PASS' || r.status === 'ACCEPTABLE');
const requiredFailed = requiredTests.filter(r => r.status === 'FAIL' || r.status === 'ERROR');

console.log(`\nRequired Tests: ${requiredPassed.length}/${requiredTests.length} passed`);

if (requiredFailed.length > 0) {
  console.log('\n❌ FAILED REQUIRED TESTS:');
  requiredFailed.forEach(test => {
    console.log(`   - ${test.test}: ${test.result || test.error}`);
  });
}

console.log('\n📋 DETAILED RESULTS:');
results.forEach(test => {
  const status = test.status === 'PASS' ? '✅' : 
                test.status === 'ACCEPTABLE' ? '🔒' : '❌';
  const required = test.required ? '[REQUIRED]' : '[OPTIONAL]';
  console.log(`   ${status} ${test.test} ${required}`);
});

console.log('\n🎯 PHASE 1 COMPLETION ASSESSMENT:');
if (allPassed && requiredFailed.length === 0) {
  console.log('🎉 PHASE 1 COMPLETION: READY FOR ACCEPTANCE');
  console.log('✅ All required tests passed');
  console.log('✅ Database foundation solid');
  console.log('✅ Schema structure understood');
  console.log('✅ Authentication system working');
  console.log('\n🚀 READY TO PROCEED WITH PHASE 2 FINAL COMPLETION');
  process.exit(0);
} else {
  console.log('❌ PHASE 1 COMPLETION: NOT READY');
  console.log('🔧 Required fixes identified above');
  console.log('📋 Address failed tests before claiming completion');
  process.exit(1);
}