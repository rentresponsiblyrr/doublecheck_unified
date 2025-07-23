// SIMPLE SCHEMA DISCOVERY TEST
// Try multiple ways to access Supabase client

console.log("🔍 SIMPLE SCHEMA DISCOVERY TEST");
console.log("Timestamp:", new Date().toISOString());

// Test different ways to access Supabase
const testSupabaseAccess = async () => {
  console.log("\n🔍 Testing Supabase client access...");
  
  let client = null;
  
  // Method 1: Global supabase
  if (typeof supabase !== 'undefined') {
    console.log("✅ Found global 'supabase' client");
    client = supabase;
  }
  
  // Method 2: Window.supabase
  if (!client && typeof window !== 'undefined' && window.supabase) {
    console.log("✅ Found window.supabase client");
    client = window.supabase;
  }
  
  // Method 3: Check for any supabase-related globals
  if (!client) {
    const globals = Object.keys(window || {}).filter(key => 
      key.toLowerCase().includes('supabase')
    );
    console.log("🔍 Supabase-related globals found:", globals);
    
    if (globals.length > 0) {
      client = window[globals[0]];
      console.log("✅ Using client from:", globals[0]);
    }
  }
  
  if (!client) {
    console.log("❌ No Supabase client found");
    console.log("Available globals:", Object.keys(window || {}));
    return;
  }
  
  console.log("\n🧪 Testing basic client functionality...");
  
  try {
    // Test 1: Check if client has auth
    if (client.auth) {
      console.log("✅ Client has auth module");
      
      // Test authentication
      const { data: { user }, error } = await client.auth.getUser();
      if (error) {
        console.log("❌ Auth error:", error.message);
      } else if (user) {
        console.log("✅ User authenticated:", user.email);
        
        // Test database access with authenticated user
        console.log("\n📊 Testing database table access...");
        
        const tables = ['properties', 'inspections', 'logs', 'static_safety_items'];
        
        for (const table of tables) {
          try {
            const { data, error } = await client
              .from(table)
              .select('*')
              .limit(1);
            
            if (error) {
              console.log(`❌ ${table}: ${error.message}`);
            } else {
              console.log(`✅ ${table}: accessible (${data?.length || 0} records)`);
              
              if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log(`   📋 Columns: ${columns.join(', ')}`);
              }
            }
          } catch (tableError) {
            console.log(`❌ ${table}: Exception - ${tableError.message}`);
          }
        }
        
        // Test relationship
        console.log("\n🔗 Testing logs-static_safety_items relationship...");
        try {
          const { data, error } = await client
            .from('checklist_items')
            .select('*, static_safety_items!checklist_id(*)')
            .limit(1);
          
          if (error) {
            console.log("❌ Relationship test failed:", error.message);
          } else {
            console.log("✅ Relationship test successful");
            console.log("📊 Sample data:", data?.[0]);
          }
        } catch (relError) {
          console.log("❌ Relationship test exception:", relError.message);
        }
        
      } else {
        console.log("❌ No user authenticated - please log in first");
      }
    } else {
      console.log("❌ Client missing auth module");
    }
  } catch (clientError) {
    console.log("❌ Client test failed:", clientError.message);
  }
};

// Execute the test
testSupabaseAccess().catch(error => {
  console.error("🚨 Schema discovery test failed:", error);
});