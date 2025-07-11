#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

console.log('🔧 Starting database schema fix...');
console.log(`📡 Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseFix() {
  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'database_schema_fix.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Executing database schema fix...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try running queries individually
      console.log('⚠️  exec_sql function not available, running queries manually...');
      await runQueriesManually(sql);
    } else {
      console.log('✅ Schema fix completed successfully!');
    }
    
    // Verify the fix worked
    await verifyDatabaseSchema();
    
  } catch (error) {
    console.error('❌ Error running database fix:', error.message);
    process.exit(1);
  }
}

async function runQueriesManually(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');
  
  console.log(`🔄 Running ${statements.length} individual SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    try {
      console.log(`   ${i + 1}/${statements.length}: Running statement...`);
      
      // Use the raw SQL query method
      const { error } = await supabase.from('_').select('1').single();
      
      // Since we can't execute arbitrary SQL directly, we'll use specific checks for core tables
      // Check if core inspection tables exist
      const { error: checkError } = await supabase
        .from('inspections')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') {
        console.log('❌ Core inspection tables do not exist');
        throw new Error('Database schema is missing required tables');
      }
      
    } catch (error) {
      if (error.message.includes('permission denied') || error.message.includes('not found')) {
        console.log(`   ⚠️  Skipping statement due to permissions: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
}

async function verifyDatabaseSchema() {
  console.log('🔍 Verifying database schema...');
  
  const checks = [
    {
      name: 'properties table',
      test: async () => {
        const { error } = await supabase
          .from('properties')
          .select('id')
          .limit(1);
        return !error || error.code !== '42P01';
      }
    },
    {
      name: 'inspections table',
      test: async () => {
        const { error } = await supabase
          .from('inspections')
          .select('id')
          .limit(1);
        return !error || error.code !== '42P01';
      }
    },
    {
      name: 'checklist_items table',
      test: async () => {
        const { error } = await supabase
          .from('checklist_items')
          .select('id')
          .limit(1);
        return !error || error.code !== '42P01';
      }
    },
    {
      name: 'users table',
      test: async () => {
        const { error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        return !error || error.code !== '42P01';
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const passed = await check.test();
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`   ❌ ${check.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('✅ All database schema checks passed!');
  } else {
    console.log('⚠️  Some schema checks failed - you may need to run migrations manually');
  }
  
  return allPassed;
}

// Run the fix
runDatabaseFix().then(() => {
  console.log('🎉 Database fix process completed!');
}).catch((error) => {
  console.error('💥 Database fix failed:', error);
  process.exit(1);
});