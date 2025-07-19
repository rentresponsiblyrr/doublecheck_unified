#!/usr/bin/env node

/**
 * Clean Data Reset Script
 * Purpose: Keep only 5 properties and clean all related data
 * This should resolve inspection creation failures from data inconsistencies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from multiple sources
config();

// Try different environment variable names
const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                   process.env.SUPABASE_URL || 
                   'https://urrydhjchgxnhyggqtzr.supabase.co';

const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 
                   process.env.SUPABASE_ANON_KEY ||
                   process.env.SUPABASE_KEY;

console.log('🔍 Environment check:');
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Found' : '❌ Missing');
console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
console.log('  Using URL:', supabaseUrl);
console.log('  Using Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.log('\n💡 You can also create a .env file with:');
  console.log('VITE_SUPABASE_URL=https://urrydhjchgxnhyggqtzr.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDataReset() {
  console.log('🧹 Starting clean data reset...');
  
  try {
    // Step 1: Get current properties count using RPC function
    console.log('\n📊 Current state:');
    const { data: allProperties, error: propError } = await supabase
      .rpc('get_properties_with_inspections');
    
    if (propError) {
      console.error('❌ Error fetching properties:', propError);
      return;
    }
    
    // Transform the RPC result to match our expected format
    const propertiesData = allProperties?.map(prop => ({
      id: prop.property_id,
      name: prop.property_name,
      created_at: prop.created_at || new Date().toISOString()
    })) || [];
    
    console.log(`📍 Found ${propertiesData.length} properties in database`);
    propertiesData.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.name} (${prop.id}) - ${prop.created_at}`);
    });

    if (propertiesData.length <= 5) {
      console.log('✅ Already have 5 or fewer properties. No cleanup needed.');
      return;
    }

    // Step 2: Select properties to keep (oldest 5)
    const propertiesToKeep = propertiesData.slice(0, 5);
    const propertiesToDelete = propertiesData.slice(5);
    
    console.log('\n✅ Properties to KEEP (5):');
    propertiesToKeep.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.name} (${prop.id})`);
    });
    
    console.log('\n🗑️  Properties to DELETE:');
    propertiesToDelete.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.name} (${prop.id})`);
    });

    // Get user confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('\n⚠️  This will permanently delete data. Continue? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.');
      return;
    }

    console.log('\n🚀 Starting cleanup process...');

    // Step 3: Get inspections for properties to delete
    const propertyIdsToDelete = propertiesToDelete.map(p => p.id);
    
    const { data: inspectionsToDelete, error: inspError } = await supabase
      .from('inspections')
      .select('id')
      .in('property_id', propertyIdsToDelete.map(id => id.toString()));
    
    if (inspError) {
      console.error('❌ Error fetching inspections:', inspError);
      return;
    }
    
    console.log(`📋 Found ${inspectionsToDelete?.length || 0} inspections to delete`);

    // Step 4: Get checklist items for those inspections
    if (inspectionsToDelete && inspectionsToDelete.length > 0) {
      const inspectionIdsToDelete = inspectionsToDelete.map(i => i.id);
      
      const { data: checklistItemsToDelete, error: checklistError } = await supabase
        .from('logs')
        .select('id')
        .in('inspection_id', inspectionIdsToDelete);
      
      if (checklistError) {
        console.error('❌ Error fetching checklist items:', checklistError);
        return;
      }
      
      console.log(`✅ Found ${checklistItemsToDelete?.length || 0} checklist items to delete`);

      // Step 5: Delete media files for checklist items
      if (checklistItemsToDelete && checklistItemsToDelete.length > 0) {
        const checklistItemIds = checklistItemsToDelete.map(c => c.id);
        
        const { error: mediaDeleteError } = await supabase
          .from('media')
          .delete()
          .in('checklist_item_id', checklistItemIds);
        
        if (mediaDeleteError) {
          console.error('⚠️  Error deleting media files:', mediaDeleteError);
        } else {
          console.log('✅ Deleted media files');
        }

        // Step 6: Delete audit feedback
        const { error: auditDeleteError } = await supabase
          .from('audit_feedback')
          .delete()
          .in('checklist_item_id', checklistItemIds);
        
        if (auditDeleteError) {
          console.error('⚠️  Error deleting audit feedback:', auditDeleteError);
        } else {
          console.log('✅ Deleted audit feedback');
        }

        // Step 7: Delete checklist items
        const { error: checklistDeleteError } = await supabase
          .from('logs')
          .delete()
          .in('id', checklistItemIds);
        
        if (checklistDeleteError) {
          console.error('❌ Error deleting checklist items:', checklistDeleteError);
          return;
        }
        console.log('✅ Deleted checklist items');
      }

      // Step 8: Delete inspection reports
      const { error: reportsDeleteError } = await supabase
        .from('inspection_reports')
        .delete()
        .in('inspection_id', inspectionIdsToDelete);
      
      if (reportsDeleteError) {
        console.error('⚠️  Error deleting inspection reports:', reportsDeleteError);
      } else {
        console.log('✅ Deleted inspection reports');
      }

      // Step 9: Delete inspections
      const { error: inspectionDeleteError } = await supabase
        .from('inspections')
        .delete()
        .in('id', inspectionIdsToDelete);
      
      if (inspectionDeleteError) {
        console.error('❌ Error deleting inspections:', inspectionDeleteError);
        return;
      }
      console.log('✅ Deleted inspections');
    }

    // Step 10: Delete properties
    const { error: propertyDeleteError } = await supabase
      .from('properties')
      .delete()
      .in('id', propertyIdsToDelete);
    
    if (propertyDeleteError) {
      console.error('❌ Error deleting properties:', propertyDeleteError);
      return;
    }
    console.log('✅ Deleted properties');

    // Step 11: Clean up orphaned records
    console.log('\n🧽 Cleaning up orphaned records...');
    
    // Get all remaining checklist item IDs
    const { data: remainingChecklistItems } = await supabase
      .from('inspection_checklist_items')
      .select('id');
    
    const remainingChecklistItemIds = remainingChecklistItems?.map(c => c.id) || [];

    // Delete orphaned media
    if (remainingChecklistItemIds.length > 0) {
      const { error: orphanMediaError } = await supabase
        .from('media')
        .delete()
        .not('checklist_item_id', 'in', `(${remainingChecklistItemIds.map(id => `'${id}'`).join(',')})`);
      
      if (orphanMediaError) {
        console.error('⚠️  Error cleaning orphaned media:', orphanMediaError);
      } else {
        console.log('✅ Cleaned orphaned media files');
      }
    }

    // Step 12: Verify final state using RPC function
    console.log('\n📊 Final state:');
    const { data: finalPropertiesRaw, error: finalError } = await supabase
      .rpc('get_properties_with_inspections');
    
    if (finalError) {
      console.error('❌ Error verifying final state:', finalError);
      return;
    }
    
    const finalProperties = finalPropertiesRaw?.map(prop => ({
      id: prop.property_id,
      name: prop.property_name,
      created_at: prop.created_at || new Date().toISOString()
    })) || [];
    
    console.log(`✅ Final property count: ${finalProperties.length}`);
    finalProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.name} (${prop.id})`);
    });

    // Get counts for other tables
    const { count: inspectionCount } = await supabase
      .from('inspections_fixed')
      .select('*', { count: 'exact', head: true });
    
    const { count: checklistCount } = await supabase
      .from('inspection_checklist_items')
      .select('*', { count: 'exact', head: true });
    
    const { count: mediaCount } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Remaining inspections: ${inspectionCount || 0}`);
    console.log(`✅ Remaining checklist items: ${checklistCount || 0}`);
    console.log(`📁 Remaining media files: ${mediaCount || 0}`);

    console.log('\n🎉 Clean data reset completed successfully!');
    console.log('✅ You can now try creating an inspection for "Rhododendron Mountain Retreat"');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
cleanDataReset().then(() => {
  console.log('\n🏁 Script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});