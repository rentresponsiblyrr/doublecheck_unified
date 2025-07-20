#!/usr/bin/env node

/**
 * Debug Inspection Creation for Rhododendron Mountain Retreat
 * Purpose: Identify why inspection creation is failing with 400 errors
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = 'https://urrydhjchgxnhyggqtzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycnlkaGpjaGd4bmh5Z2dxdHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODM2NjAsImV4cCI6MjA2NTg1OTY2MH0.IrtFxZzLLjxUOfpOrt5Llw8EnyvuWI6WDOuvsvFDFaM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInspectionCreation() {
  console.log('🔍 Debugging inspection creation for Rhododendron Mountain Retreat...');
  
  try {
    // Step 1: Get Rhododendron Mountain Retreat property details
    console.log('\n📊 Step 1: Finding Rhododendron Mountain Retreat...');
    const { data: properties, error: propError } = await supabase
      .rpc('get_properties_with_inspections');
    
    if (propError) {
      console.error('❌ Error fetching properties:', propError);
      return;
    }
    
    const rhododendronProperty = properties?.find(p => 
      p.property_name?.toLowerCase().includes('rhododendron')
    );
    
    if (!rhododendronProperty) {
      console.error('❌ Rhododendron Mountain Retreat not found!');
      console.log('Available properties:');
      properties?.forEach((prop, i) => {
        console.log(`   ${i + 1}. ${prop.property_name} (${prop.property_id})`);
      });
      return;
    }
    
    console.log('✅ Found Rhododendron Mountain Retreat:');
    console.log(`   ID: ${rhododendronProperty.property_id}`);
    console.log(`   Name: ${rhododendronProperty.property_name}`);
    console.log(`   Inspections: ${rhododendronProperty.inspection_count}`);
    console.log(`   Last Inspection: ${rhododendronProperty.latest_inspection_date || 'None'}`);
    
    // Step 2: Check if there are existing active inspections
    console.log('\n🔍 Step 2: Checking for existing active inspections...');
    
    try {
      // Try to get existing inspections using RPC or direct query
      console.log('Attempting to check existing inspections...');
      
      // Since direct table access is blocked, let's try the RPC data
      if (rhododendronProperty.inspection_count > 0) {
        console.log(`⚠️  Property has ${rhododendronProperty.inspection_count} existing inspections`);
        console.log('   This might be causing conflicts for new inspection creation');
      } else {
        console.log('✅ No existing inspections found');
      }
    } catch (inspError) {
      console.log('⚠️  Unable to check existing inspections due to RLS restrictions');
    }
    
    // Step 3: Test the create_inspection_compatibility RPC function
    console.log('\n🧪 Step 3: Testing create_inspection_compatibility RPC function...');
    
    try {
      const { data: inspectionResult, error: createError } = await supabase
        .rpc('create_inspection_compatibility', {
          property_id: rhododendronProperty.property_id
        });
      
      if (createError) {
        console.error('❌ RPC create_inspection_secure failed:');
        console.error('   Code:', createError.code);
        console.error('   Message:', createError.message);
        console.error('   Details:', createError.details);
        console.error('   Hint:', createError.hint);
        
        // Analyze the error
        if (createError.code === '23505') {
          console.log('\n💡 Analysis: Unique constraint violation - duplicate inspection exists');
        } else if (createError.code === '23514') {
          console.log('\n💡 Analysis: Check constraint violation - invalid data format');
        } else if (createError.code === '42P01') {
          console.log('\n💡 Analysis: Table/function does not exist');
        } else if (createError.code === 'PGRST116') {
          console.log('\n💡 Analysis: RLS policy blocking access');
        } else {
          console.log('\n💡 Analysis: Unknown error - see details above');
        }
      } else {
        console.log('✅ RPC function succeeded:', inspectionResult);
        console.log('🎉 Inspection creation should work now!');
      }
    } catch (rpcError) {
      console.error('❌ RPC call failed with exception:', rpcError);
    }
    
    // Step 4: Check auth and permissions
    console.log('\n🔐 Step 4: Checking authentication and permissions...');
    
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      console.log('💡 This might be why inspection creation is failing - no valid session');
    } else if (!authUser.user) {
      console.log('⚠️  No authenticated user found');
      console.log('💡 Inspection creation requires authentication');
    } else {
      console.log('✅ User authenticated:');
      console.log(`   ID: ${authUser.user.id}`);
      console.log(`   Email: ${authUser.user.email}`);
      console.log(`   Role: ${authUser.user.user_metadata?.role || 'unknown'}`);
    }
    
    // Step 5: Recommendations
    console.log('\n📋 Step 5: Recommendations:');
    
    if (rhododendronProperty.inspection_count > 0) {
      console.log('1. 🔧 Consider cleaning up existing inspections for this property');
      console.log('2. 🔍 Check if there are draft/in-progress inspections blocking new ones');
    }
    
    if (!authUser.user) {
      console.log('3. 🔐 Ensure user is properly authenticated before creating inspections');
    }
    
    console.log('4. 🧹 Clear browser cache and localStorage');
    console.log('5. 🔄 Try creating inspection again after clearing cache');
    console.log('6. 📱 Test on a different browser/device to rule out cache issues');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugInspectionCreation().then(() => {
  console.log('\n🏁 Debug script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});