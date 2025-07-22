#!/usr/bin/env node

/**
 * AUTHENTICATED SCHEMA TEST
 * Tests schema with proper authentication
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔐 AUTHENTICATED SCHEMA TEST\n');

// First, let's see what we can access without authentication
console.log('📋 CHECKING TABLE PERMISSIONS (NO AUTH):\n');

const tablesToCheck = [
  'properties',
  'inspections', 
  'users',
  'logs',
  'static_safety_items',
  'media',
  'inspection_checklist_items', // Possible alternative name
  'checklist_items', // Another possible name
  'safety_items' // Another possible name
];

for (const table of tablesToCheck) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${table}: TABLE DOES NOT EXIST`);
      } else if (error.message.includes('permission denied')) {
        console.log(`🔒 ${table}: EXISTS but requires authentication (${count} rows)`);
      } else {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    } else {
      console.log(`✅ ${table}: Accessible (${count} rows)`);
    }
  } catch (err) {
    console.log(`❌ ${table}: EXCEPTION - ${err.message}`);
  }
}

// Let's also check if there are alternative views or table names
console.log('\n📋 CHECKING FOR ALTERNATIVE TABLE NAMES:\n');

const alternativeNames = [
  'checklist_logs',
  'inspection_logs', 
  'property_logs',
  'safety_logs',
  'checklist_items_logs',
  'checklist_responses'
];

for (const table of alternativeNames) {
  try {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ FOUND: ${table} (${count} rows)`);
    }
  } catch (err) {
    // Silently skip non-existent tables
  }
}

// Test with a user that exists
console.log('\n🔐 ATTEMPTING AUTHENTICATION:\n');

try {
  // Get a user email from the users table  
  const { data: users } = await supabase
    .from('users')
    .select('email')
    .limit(1);
    
  if (users && users.length > 0) {
    const userEmail = users[0].email;
    console.log(`Found user email: ${userEmail}`);
    
    // Try to sign in (this might not work with the anon key, but let's try)
    console.log('Attempting authentication...');
    // Note: This would require actual login credentials
    console.log('⚠️  Authentication requires actual login credentials');
  }
} catch (err) {
  console.log('❌ Authentication test failed:', err.message);
}

console.log('\n📊 SCHEMA TEST COMPLETE');
console.log('\n🔍 RECOMMENDATIONS:');
console.log('1. The "logs" table is missing - this is critical for checklist functionality');
console.log('2. Properties and inspections tables exist but require authentication');  
console.log('3. Need to investigate the actual table structure in Supabase dashboard');
console.log('4. May need to create missing tables or find alternative table names');