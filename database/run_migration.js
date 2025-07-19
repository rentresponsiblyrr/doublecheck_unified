#!/usr/bin/env node

/**
 * Database Migration Script for Inspector Presence System
 * 
 * This script creates the missing inspector_presence table and related functions
 * that are required for the real-time collaboration features.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please add these to your .env file or environment.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting inspector presence migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'create_inspector_presence.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Loaded migration SQL file');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('📝 Trying direct SQL execution...');
      const { data: directData, error: directError } = await supabase
        .from('_placeholder')
        .select('*')
        .limit(0); // This will fail but let us know if connection works
      
      if (directError && !directError.message.includes('does not exist')) {
        throw directError;
      }
      
      // For Supabase, we need to run this through the dashboard SQL editor
      // or use the Supabase CLI. Let's provide instructions instead.
      console.log('');
      console.log('📋 Manual Migration Required');
      console.log('=====================================');
      console.log('');
      console.log('Please run the following steps:');
      console.log('');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Copy and paste the contents of:');
      console.log(`   ${sqlPath}`);
      console.log('4. Execute the SQL script');
      console.log('');
      console.log('Or use the Supabase CLI:');
      console.log(`   supabase db reset`);
      console.log(`   # Or apply the specific migration`);
      console.log('');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Created:');
    console.log('  - inspector_presence table');
    console.log('  - update_inspector_presence() function');
    console.log('  - get_active_inspectors() function');
    console.log('  - cleanup_stale_presence() function');
    console.log('  - Row Level Security policies');
    console.log('  - Performance indexes');
    console.log('');
    console.log('🎉 Real-time collaboration features are now available!');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error && !error.message.includes('permission denied')) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 STR Certified - Inspector Presence Migration');
  console.log('===============================================');
  console.log('');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.log('');
    console.log('Please check your Supabase configuration and try again.');
    process.exit(1);
  }
  
  console.log('');
  await runMigration();
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration };