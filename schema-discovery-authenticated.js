// PHASE 1 FINAL COMPLETION - AUTHENTICATED SCHEMA DISCOVERY
// Execute this in browser console at http://localhost:3003 after logging in

console.log("🔍 PHASE 1 FINAL SCHEMA DISCOVERY PROTOCOL");
console.log("Timestamp:", new Date().toISOString());

const executeSchemaDiscovery = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    authentication: {},
    properties: {},
    inspections: {},
    logs: {},
    staticSafetyItems: {},
    relationships: {}
  };

  // STEP 1: Verify Authentication
  console.log("\n🔐 STEP 1: AUTHENTICATION VERIFICATION");
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("❌ Authentication error:", error);
      results.authentication = {
        status: 'FAILED',
        error: error.message
      };
      return results;
    }
    
    if (!user) {
      console.error("❌ No user authenticated - please log in first");
      results.authentication = {
        status: 'NO_USER',
        message: 'Please log in through the application first'
      };
      return results;
    }

    console.log("✅ Authentication successful");
    console.log("👤 User:", user.email);
    console.log("🆔 User ID:", user.id);
    
    results.authentication = {
      status: 'SUCCESS',
      email: user.email,
      id: user.id
    };

  } catch (authError) {
    console.error("❌ Authentication exception:", authError);
    results.authentication = {
      status: 'EXCEPTION',
      error: authError.message
    };
    return results;
  }

  // STEP 2: Properties Table Schema Discovery
  console.log("\n🏠 STEP 2: PROPERTIES TABLE SCHEMA DISCOVERY");
  try {
    const startTime = performance.now();
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    const duration = performance.now() - startTime;

    if (propertiesError) {
      console.error("❌ Properties table access failed:", propertiesError);
      results.properties = {
        status: 'FAILED',
        error: propertiesError,
        duration: duration
      };
    } else if (propertiesData && propertiesData.length > 0) {
      const columns = Object.keys(propertiesData[0]);
      console.log("✅ Properties table accessible");
      console.log("📊 Performance:", duration.toFixed(2), "ms");
      console.log("📋 Columns found:", columns);
      console.log("🔍 Column details:");
      
      columns.forEach(col => {
        const value = propertiesData[0][col];
        const type = typeof value;
        console.log(`   - ${col}: ${type} (sample: ${value})`);
      });

      results.properties = {
        status: 'SUCCESS',
        columns: columns,
        sampleData: propertiesData[0],
        duration: duration,
        dataType: typeof propertiesData[0]
      };
    } else {
      console.log("⚠️ Properties table empty");
      results.properties = {
        status: 'EMPTY',
        duration: duration
      };
    }
  } catch (propException) {
    console.error("❌ Properties discovery exception:", propException);
    results.properties = {
      status: 'EXCEPTION',
      error: propException.message
    };
  }

  // STEP 3: Inspections Table Schema Discovery
  console.log("\n📋 STEP 3: INSPECTIONS TABLE SCHEMA DISCOVERY");
  try {
    const startTime = performance.now();
    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*')
      .limit(1);

    const duration = performance.now() - startTime;

    if (inspectionsError) {
      console.error("❌ Inspections table access failed:", inspectionsError);
      results.inspections = {
        status: 'FAILED',
        error: inspectionsError,
        duration: duration
      };
    } else if (inspectionsData && inspectionsData.length > 0) {
      const columns = Object.keys(inspectionsData[0]);
      console.log("✅ Inspections table accessible");
      console.log("📊 Performance:", duration.toFixed(2), "ms");
      console.log("📋 Columns found:", columns);
      console.log("🔍 Column details:");
      
      columns.forEach(col => {
        const value = inspectionsData[0][col];
        const type = typeof value;
        console.log(`   - ${col}: ${type} (sample: ${value})`);
      });

      results.inspections = {
        status: 'SUCCESS',
        columns: columns,
        sampleData: inspectionsData[0],
        duration: duration
      };
    } else {
      console.log("⚠️ Inspections table empty");
      results.inspections = {
        status: 'EMPTY',
        duration: duration
      };
    }
  } catch (inspException) {
    console.error("❌ Inspections discovery exception:", inspException);
    results.inspections = {
      status: 'EXCEPTION',
      error: inspException.message
    };
  }

  // STEP 4: Logs Table Schema Discovery
  console.log("\n📝 STEP 4: LOGS TABLE SCHEMA DISCOVERY");
  try {
    const startTime = performance.now();
    const { data: logsData, error: logsError } = await supabase
      .from('checklist_items')
      .select('*')
      .limit(1);

    const duration = performance.now() - startTime;

    if (logsError) {
      console.error("❌ Logs table access failed:", logsError);
      results.logs = {
        status: 'FAILED',
        error: logsError,
        duration: duration
      };
    } else if (logsData && logsData.length > 0) {
      const columns = Object.keys(logsData[0]);
      console.log("✅ Logs table accessible");
      console.log("📊 Performance:", duration.toFixed(2), "ms");
      console.log("📋 Columns found:", columns);
      console.log("🔍 Column details:");
      
      columns.forEach(col => {
        const value = logsData[0][col];
        const type = typeof value;
        console.log(`   - ${col}: ${type} (sample: ${value})`);
      });

      results.logs = {
        status: 'SUCCESS',
        columns: columns,
        sampleData: logsData[0],
        duration: duration
      };
    } else {
      console.log("⚠️ Logs table empty");
      results.logs = {
        status: 'EMPTY',
        duration: duration
      };
    }
  } catch (logsException) {
    console.error("❌ Logs discovery exception:", logsException);
    results.logs = {
      status: 'EXCEPTION',
      error: logsException.message
    };
  }

  // STEP 5: Static Safety Items Table Discovery
  console.log("\n🛡️ STEP 5: STATIC SAFETY ITEMS TABLE SCHEMA DISCOVERY");
  try {
    const startTime = performance.now();
    const { data: staticData, error: staticError } = await supabase
      .from('static_safety_items')
      .select('*')
      .limit(1);

    const duration = performance.now() - startTime;

    if (staticError) {
      console.error("❌ Static safety items access failed:", staticError);
      results.staticSafetyItems = {
        status: 'FAILED',
        error: staticError,
        duration: duration
      };
    } else if (staticData && staticData.length > 0) {
      const columns = Object.keys(staticData[0]);
      console.log("✅ Static safety items accessible");
      console.log("📊 Performance:", duration.toFixed(2), "ms");
      console.log("📋 Columns found:", columns);
      console.log("🔍 Column details:");
      
      columns.forEach(col => {
        const value = staticData[0][col];
        const type = typeof value;
        console.log(`   - ${col}: ${type} (sample: ${value})`);
      });

      results.staticSafetyItems = {
        status: 'SUCCESS',
        columns: columns,
        sampleData: staticData[0],
        duration: duration
      };
    } else {
      console.log("⚠️ Static safety items table empty");
      results.staticSafetyItems = {
        status: 'EMPTY',
        duration: duration
      };
    }
  } catch (staticException) {
    console.error("❌ Static safety items discovery exception:", staticException);
    results.staticSafetyItems = {
      status: 'EXCEPTION',
      error: staticException.message
    };
  }

  // STEP 6: Relationship Testing
  console.log("\n🔗 STEP 6: RELATIONSHIP DISCOVERY AND TESTING");
  
  // Test different relationship patterns
  const relationshipTests = [
    {
      name: "logs_to_static_safety_items_default",
      description: "Default relationship syntax",
      query: () => supabase.from('checklist_items').select('*, static_safety_items(*)').limit(1)
    },
    {
      name: "logs_to_static_safety_items_checklist_id",
      description: "Explicit checklist_id foreign key",
      query: () => supabase.from('checklist_items').select('*, static_safety_items!checklist_id(*)').limit(1)
    },
    {
      name: "logs_to_static_safety_items_inner_join",
      description: "Inner join with static safety items",
      query: () => supabase.from('checklist_items').select('*, static_safety_items!inner(*)').limit(1)
    }
  ];

  results.relationships = {};

  for (const test of relationshipTests) {
    try {
      console.log(`\n   Testing: ${test.name}`);
      console.log(`   Description: ${test.description}`);
      
      const startTime = performance.now();
      const { data, error } = await test.query();
      const duration = performance.now() - startTime;

      if (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        results.relationships[test.name] = {
          status: 'FAILED',
          error: error.message,
          duration: duration
        };
      } else {
        console.log(`   ✅ SUCCESS: Retrieved ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`   📊 Sample relationship data:`, data[0]);
        }
        results.relationships[test.name] = {
          status: 'SUCCESS',
          dataCount: data?.length || 0,
          sampleData: data?.[0] || null,
          duration: duration
        };
      }
    } catch (relException) {
      console.log(`   ❌ EXCEPTION: ${relException.message}`);
      results.relationships[test.name] = {
        status: 'EXCEPTION',
        error: relException.message
      };
    }
  }

  // FINAL ANALYSIS
  console.log("\n=== SCHEMA DISCOVERY COMPLETE ===");
  
  const successfulTables = Object.keys(results).filter(key => 
    key !== 'timestamp' && key !== 'authentication' && key !== 'relationships' && 
    results[key].status === 'SUCCESS'
  ).length;

  const successfulRelationships = Object.keys(results.relationships).filter(key => 
    results.relationships[key].status === 'SUCCESS'
  ).length;

  console.log("📊 DISCOVERY SUMMARY:");
  console.log(`   🗄️ Tables discovered: ${successfulTables}/4`);
  console.log(`   🔗 Working relationships: ${successfulRelationships}/${relationshipTests.length}`);
  console.log(`   🔐 Authentication: ${results.authentication.status}`);

  if (successfulTables === 4 && successfulRelationships > 0) {
    console.log("🎉 SCHEMA DISCOVERY SUCCESS - ALL TABLES ACCESSIBLE");
    console.log("✅ READY FOR SERVICE LAYER UPDATES");
  } else {
    console.log("⚠️ SCHEMA DISCOVERY INCOMPLETE - REVIEW FAILED ITEMS");
  }

  console.log("\n📤 COPY THIS COMPLETE OUTPUT FOR IMPLEMENTATION");
  console.log("📋 Use discovered schema to update service layer references");

  return results;
};

// Execute schema discovery
executeSchemaDiscovery().catch(error => {
  console.error("🚨 SCHEMA DISCOVERY FAILED:", error);
});