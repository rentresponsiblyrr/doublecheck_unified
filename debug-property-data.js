// Debug script to check what get_properties_with_inspections returns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://urrydhjchgxnhyggqtzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPropertyData() {
  console.log('🔍 Debugging property data from get_properties_with_inspections function...\n');
  
  try {
    // Call the function
    const { data, error } = await supabase.rpc('get_properties_with_inspections');
    
    if (error) {
      console.error('❌ Error calling function:', error);
      return;
    }
    
    console.log(`✅ Function returned ${data?.length || 0} properties\n`);
    
    if (data && data.length > 0) {
      console.log('📊 Sample property data:');
      const sample = data[0];
      console.log('Property 1:', {
        property_id: sample.property_id,
        property_id_type: typeof sample.property_id,
        property_id_length: sample.property_id?.toString().length,
        property_name: sample.property_name,
        property_address: sample.property_address,
        inspection_count: sample.inspection_count,
        all_fields: Object.keys(sample)
      });
      
      if (data.length > 1) {
        console.log('\nProperty 2:', {
          property_id: data[1].property_id,
          property_id_type: typeof data[1].property_id,
          property_id_length: data[1].property_id?.toString().length,
          property_name: data[1].property_name
        });
      }
      
      console.log('\n🔍 All property IDs and types:');
      data.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. ID: ${prop.property_id} (${typeof prop.property_id}) - ${prop.property_name}`);
      });
    }
    
    // Also test direct properties table access
    console.log('\n🔍 Checking direct properties table access...');
    const { data: directData, error: directError } = await supabase
      .from('properties')
      .select('*')
      .limit(3);
      
    if (directError) {
      console.error('❌ Error accessing properties table directly:', directError);
    } else {
      console.log('✅ Direct properties table data:');
      directData?.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. ID: ${prop.property_id} (${typeof prop.property_id}) - ${prop.property_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugPropertyData();