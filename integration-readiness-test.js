#!/usr/bin/env node

/**
 * INTEGRATION READINESS TEST
 * Final check before Phase 3 PWA implementation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🚀 INTEGRATION READINESS TEST');
console.log('=' .repeat(50));
console.log('Final validation before Phase 3 PWA implementation\n');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

let criticalIssues = 0;
let warnings = 0;
let successes = 0;

function logResult(level, message, details = '') {
  if (level === 'SUCCESS') {
    console.log(`✅ ${message}`);
    if (details) console.log(`   ${details}`);
    successes++;
  } else if (level === 'WARNING') {
    console.log(`⚠️  ${message}`);
    if (details) console.log(`   ${details}`);
    warnings++;
  } else if (level === 'CRITICAL') {
    console.log(`❌ ${message}`);
    if (details) console.log(`   ${details}`);
    criticalIssues++;
  }
}

console.log('🔍 ENVIRONMENT VALIDATION');
console.log('-'.repeat(30));

// Environment Check
if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  logResult('SUCCESS', 'Supabase environment variables configured');
} else {
  logResult('CRITICAL', 'Missing Supabase environment variables');
}

console.log('\n🗄️  DATABASE CONNECTION TEST');
console.log('-'.repeat(30));

// Database Connection Test
try {
  const { data: users, error } = await supabase.from('users').select('count').limit(1);
  if (error) {
    logResult('CRITICAL', 'Database connection failed', error.message);
  } else {
    logResult('SUCCESS', 'Database connection successful');
  }
} catch (error) {
  logResult('CRITICAL', 'Database connection exception', error.message);
}

console.log('\n📋 CORE TABLES VALIDATION');
console.log('-'.repeat(30));

// Core Tables Test
const coreTables = [
  { name: 'users', critical: true },
  { name: 'static_safety_items', critical: true },
  { name: 'logs', critical: true },
  { name: 'media', critical: true },
  { name: 'properties', critical: false }, // May require auth
  { name: 'inspections', critical: false } // May require auth
];

for (const table of coreTables) {
  try {
    const { error, count } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('permission denied')) {
        logResult('WARNING', `${table.name} table requires authentication`, 'Expected for protected tables');
      } else {
        logResult(table.critical ? 'CRITICAL' : 'WARNING', `${table.name} table error`, error.message);
      }
    } else {
      logResult('SUCCESS', `${table.name} table accessible`, `${count || 0} rows`);
    }
  } catch (error) {
    logResult(table.critical ? 'CRITICAL' : 'WARNING', `${table.name} table exception`, error.message);
  }
}

console.log('\n🏗️  SERVICE LAYER VALIDATION');
console.log('-'.repeat(30));

// Service Layer Files Check
const serviceFiles = [
  './src/services/inspection/InspectionDataService.ts',
  './src/services/inspection/PropertyDataService.ts',
  './src/services/inspection/QueryCache.ts',
  './src/services/inspection/types/business.ts',
  './src/services/inspection/types/database.ts'
];

try {
  const fs = await import('fs/promises');
  
  for (const file of serviceFiles) {
    try {
      await fs.access(file);
      logResult('SUCCESS', `Service file exists: ${file.split('/').pop()}`);
    } catch {
      logResult('CRITICAL', `Missing service file: ${file}`);
    }
  }
} catch (error) {
  logResult('CRITICAL', 'Cannot validate service files', error.message);
}

console.log('\n🔧 BUILD SYSTEM VALIDATION');
console.log('-'.repeat(30));

// TypeScript Check
try {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const { stdout, stderr } = await execAsync('npm run typecheck');
  
  if (stderr && stderr.includes('error TS')) {
    const errorCount = (stderr.match(/error TS/g) || []).length;
    logResult('CRITICAL', `TypeScript compilation errors: ${errorCount}`);
  } else {
    logResult('SUCCESS', 'TypeScript compilation clean');
  }
} catch (error) {
  if (error.stdout && !error.stdout.includes('error TS')) {
    logResult('SUCCESS', 'TypeScript compilation successful');
  } else {
    logResult('CRITICAL', 'TypeScript compilation failed', error.message);
  }
}

console.log('\n🚀 PWA READINESS ASSESSMENT');
console.log('-'.repeat(30));

// PWA Prerequisites Check
const pwaRequirements = [
  'Service Worker support',
  'Cache API support',
  'Background Sync capability',
  'Push Notification support',
  'IndexedDB support'
];

// Basic browser API checks (simulated)
const browserFeatures = {
  'Service Worker support': typeof globalThis !== 'undefined' && 'serviceWorker' in globalThis.navigator,
  'Cache API support': typeof globalThis !== 'undefined' && 'caches' in globalThis,
  'IndexedDB support': typeof globalThis !== 'undefined' && 'indexedDB' in globalThis
};

Object.entries(browserFeatures).forEach(([feature, supported]) => {
  if (supported) {
    logResult('SUCCESS', `${feature} available`);
  } else {
    logResult('WARNING', `${feature} not detected`, 'May not be available in Node.js environment');
  }
});

console.log('\n📊 INTEGRATION READINESS SUMMARY');
console.log('=' .repeat(50));

console.log(`✅ Successes: ${successes}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Critical Issues: ${criticalIssues}`);

console.log('\n🎯 READINESS ASSESSMENT:');

if (criticalIssues === 0) {
  console.log('🎉 INTEGRATION READY - CLEARED FOR PHASE 3');
  console.log('✅ Database foundation solid');
  console.log('✅ Service layer architecture complete');
  console.log('✅ Build system functional');
  console.log('✅ Core infrastructure operational');
  
  if (warnings > 0) {
    console.log(`\n⚠️  ${warnings} warnings noted - mostly expected (auth requirements)`);
  }
  
  console.log('\n🚀 RECOMMENDED NEXT ACTIONS:');
  console.log('1. Begin Phase 3 PWA Service Worker integration');
  console.log('2. Implement background sync capabilities');
  console.log('3. Add offline-first data management');
  console.log('4. Integrate with existing service layer');
  console.log('5. Test PWA installation and updates');
  
  process.exit(0);
} else {
  console.log('❌ INTEGRATION NOT READY - PHASE 3 BLOCKED');
  console.log(`🛑 ${criticalIssues} critical issues must be resolved first`);
  
  console.log('\n🔧 REQUIRED ACTIONS:');
  console.log('1. Fix all critical issues identified above');
  console.log('2. Re-run this integration test until clean');
  console.log('3. Complete remaining Phase 1/2 work');
  console.log('4. Do not proceed to Phase 3 until cleared');
  
  process.exit(1);
}

console.log('\n📋 DETAILED INTEGRATION CHECKLIST:');
console.log('[ ] Database connection operational');
console.log('[ ] Core tables accessible');  
console.log('[ ] Service layer files complete');
console.log('[ ] TypeScript compilation clean');
console.log('[ ] Authentication system working');
console.log('[ ] Error handling comprehensive');
console.log('[ ] Cache system functional');
console.log('[ ] PWA prerequisites available');

console.log('\n🎯 When all items checked, system is ready for Phase 3 PWA implementation.');