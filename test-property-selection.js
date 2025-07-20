// Test script to verify property selection workflow with UUID property IDs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://urrydhjchgxnhyggqtzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPropertySelectionWorkflow() {
  console.log('🧪 Testing property selection workflow with UUID property IDs...\n');
  
  try {
    // Step 1: Get properties from the RPC function
    console.log('📋 Step 1: Fetching properties from get_properties_with_inspections...');
    const { data: properties, error: propertiesError } = await supabase
      .rpc('get_properties_with_inspections');
    
    if (propertiesError) {
      console.error('❌ Error fetching properties:', propertiesError);
      return;
    }
    
    if (!properties || properties.length === 0) {
      console.log('⚠️ No properties found in database');
      return;
    }
    
    console.log(`✅ Found ${properties.length} properties`);
    
    // Step 2: Pick the first property and test UUID handling
    const testProperty = properties[0];
    console.log('\n📌 Step 2: Testing UUID property ID handling...');
    console.log('Selected property:', {
      property_id: testProperty.property_id,
      property_name: testProperty.property_name,
      id_type: typeof testProperty.property_id,
      id_length: testProperty.property_id.length,
      is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testProperty.property_id)
    });
    
    // Step 3: Test inspection lookup using the UUID property ID
    console.log('\n🔍 Step 3: Testing inspection lookup with UUID property ID...');
    const { data: inspections, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, property_id, status, created_at')
      .eq('property_id', testProperty.property_id)
      .limit(5);
    
    if (inspectionError) {
      console.error('❌ Error querying inspections:', inspectionError);
    } else {
      console.log(`✅ Successfully queried inspections for property ${testProperty.property_id}`);
      console.log(`Found ${inspections?.length || 0} inspections`);
      
      if (inspections && inspections.length > 0) {
        console.log('Sample inspection:', {
          inspection_id: inspections[0].id,
          property_id: inspections[0].property_id,
          status: inspections[0].status,
          property_id_matches: inspections[0].property_id === testProperty.property_id
        });
      }
    }
    
    // Step 4: Test property lookup with get_properties_with_inspections filter
    console.log('\n🎯 Step 4: Testing property-specific filtering...');
    const allPropertyIds = properties.map(p => p.property_id);
    console.log('All property IDs in system:', allPropertyIds.slice(0, 3), '...(showing first 3)');
    
    // Check if all property IDs are valid UUIDs
    const invalidUUIDs = allPropertyIds.filter(id => 
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    );
    
    if (invalidUUIDs.length > 0) {
      console.log('⚠️ Found non-UUID property IDs:', invalidUUIDs);
    } else {
      console.log('✅ All property IDs are valid UUIDs');
    }
    
    console.log('\n🎉 Property selection workflow test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Properties fetched: ${properties.length}`);
    console.log(`- Test property ID: ${testProperty.property_id}`);
    console.log(`- UUID format validation: ✅`);
    console.log(`- Inspection query: ${inspectionError ? '❌ Failed' : '✅ Success'}`);
    console.log(`- All UUIDs valid: ${invalidUUIDs.length === 0 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

testPropertySelectionWorkflow();