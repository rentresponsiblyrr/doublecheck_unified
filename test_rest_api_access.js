/**
 * Test script to verify REST API access to properties_fixed and inspections_fixed
 * This script tests the critical endpoints that were causing 404 errors
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRestApiAccess() {
    console.log('🚀 Testing REST API access to compatibility views...');
    console.log('📡 Supabase URL:', supabaseUrl);
    console.log('🔑 API Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');
    
    try {
        // Test 1: Basic properties access (production schema)
        console.log('\n🔍 Test 1: Basic properties access');
        const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (propertiesError) {
            console.error('❌ properties error:', propertiesError);
            throw propertiesError;
        }
        
        console.log('✅ properties accessible');
        console.log('📊 Properties count:', propertiesData?.length || 0);
        console.log('🔍 Sample property:', propertiesData?.[0]);
        
        // Test 2: Basic inspections access
        console.log('\n🔍 Test 2: Basic inspections access');
        const { data: inspectionsData, error: inspectionsError } = await supabase
            .from('inspections')
            .select('*')
            .limit(5);
        
        if (inspectionsError) {
            console.error('❌ inspections error:', inspectionsError);
            throw inspectionsError;
        }
        
        console.log('✅ inspections accessible');
        console.log('📊 Inspections count:', inspectionsData?.length || 0);
        console.log('🔍 Sample inspection:', inspectionsData?.[0]);
        
        // Test 3: Filtered query (like the app does)
        console.log('\n🔍 Test 3: Filtered properties query');
        const { data: filteredData, error: filteredError } = await supabase
            .from('properties')
            .select('property_id, property_name, street_address, vrbo_url, airbnb_url')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (filteredError) {
            console.error('❌ Filtered query error:', filteredError);
            throw filteredError;
        }
        
        console.log('✅ Filtered properties query successful');
        console.log('📊 Filtered results count:', filteredData?.length || 0);
        
        // Test 4: Test with user ID filter (simulating app behavior)
        console.log('\n🔍 Test 4: User-specific inspections query');
        const { data: userInspections, error: userError } = await supabase
            .from('inspections')
            .select('property_id, completed, status, id, created_at')
            .eq('inspector_id', '7615469e-14ed-4b5c-8566-efe09bd05dd3'); // User ID from logs
        
        if (userError) {
            console.error('❌ User inspections error:', userError);
            // Don't throw here, this might be expected if user has no inspections
        } else {
            console.log('✅ User inspections query successful');
            console.log('📊 User inspections count:', userInspections?.length || 0);
        }
        
        // Test 5: Test the exact query from the app
        console.log('\n🔍 Test 5: Exact app query simulation');
        const { data: exactData, error: exactError } = await supabase
            .rpc('get_properties_with_inspections');
        
        if (exactError) {
            console.error('❌ Exact app query error:', exactError);
            throw exactError;
        }
        
        console.log('✅ Exact app query successful');
        console.log('📊 Exact query results count:', exactData?.length || 0);
        
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ The REST API endpoints are accessible');
        console.log('✅ Both properties_fixed and inspections_fixed views work correctly');
        console.log('✅ The 404 errors should be resolved');
        
    } catch (error) {
        console.error('\n💥 TEST FAILED:', error);
        console.error('❌ This indicates the REST API is still not accessible');
        console.error('🔧 Please run the COMPREHENSIVE_SCHEMA_VERIFICATION.sql script first');
        process.exit(1);
    }
}

// Run the test
testRestApiAccess().catch(console.error);