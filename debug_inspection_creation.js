// Debug script for inspection creation failure
// Run this in browser console on app.doublecheckverified.com

console.log('🔍 Starting inspection creation debug for Rhododendron Mountain Retreat...');

// First, let's capture the enhanced error information
async function debugInspectionCreation() {
  try {
    // Get the property ID for Rhododendron Mountain Retreat
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name, status, added_by')
      .ilike('name', '%rhododendron%retreat%');
    
    if (propError) {
      console.error('❌ Property lookup failed:', propError);
      return;
    }
    
    if (!properties || properties.length === 0) {
      console.error('❌ Rhododendron Mountain Retreat property not found');
      return;
    }
    
    const property = properties[0];
    console.log('🏠 Found property:', property);
    
    // Check current user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication issue:', authError);
      return;
    }
    
    console.log('👤 Current user:', { id: user.id, email: user.email });
    
    // Check for existing inspections
    const { data: existingInspections, error: inspError } = await supabase
      .from('inspections')
      .select('id, status, completed, start_time, inspector_id')
      .eq('property_id', property.id);
    
    if (inspError) {
      console.error('❌ Inspection lookup failed:', inspError);
    } else {
      console.log('📋 Existing inspections:', existingInspections);
    }
    
    // Check static safety items
    const { count: safetyItemsCount, error: safetyError } = await supabase
      .from('static_safety_items')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false)
      .eq('required', true);
    
    if (safetyError) {
      console.error('❌ Safety items check failed:', safetyError);
    } else {
      console.log('🔧 Static safety items count:', safetyItemsCount);
    }
    
    // Test the RPC function directly
    console.log('🧪 Testing create_inspection_secure RPC function...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_inspection_secure', {
      p_property_id: property.id,
      p_inspector_id: user.id
    });
    
    if (rpcError) {
      console.error('❌ RPC Function Error Details:', {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint
      });
    } else {
      console.log('✅ RPC function succeeded:', rpcResult);
    }
    
    // Test direct insert as fallback
    console.log('🧪 Testing direct insert fallback...');
    const { data: insertResult, error: insertError } = await supabase
      .from('inspections')
      .insert({
        property_id: property.id,
        inspector_id: user.id,
        start_time: new Date().toISOString(),
        completed: false,
        status: 'draft'
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ Direct Insert Error Details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Direct insert succeeded:', insertResult);
      
      // Clean up test insertion
      await supabase
        .from('inspections')
        .delete()
        .eq('id', insertResult.id);
      console.log('🧹 Cleaned up test inspection');
    }
    
  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Run the debug
debugInspectionCreation();