/**
 * ======================================================================
 * PHASE 1: COMPREHENSIVE DATABASE SCHEMA VERIFICATION SCRIPT
 * ======================================================================
 * 
 * CRITICAL: This script establishes absolute truth about production schema
 * Execute in browser console with Supabase client available
 * 
 * PURPOSE: Resolve 400/404 database errors in active inspections loading
 * SCOPE: inspections, logs, static_safety_items, properties tables
 */

console.log("=== COMPREHENSIVE SCHEMA VERIFICATION FOR PHASE 1 ===");
console.log("🎯 MISSION: Establish unshakeable database query reliability");
console.log("");

// INSPECTIONS TABLE VERIFICATION
const verifyInspectionsSchema = async () => {
  console.log("1. 📊 INSPECTIONS TABLE VERIFICATION:");
  console.log("   Checking for: completed, status, inspector_id fields");

  try {
    // Get actual structure with error handling
    const { data: sample, error } = await supabase
      .from('inspections')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("   ❌ INSPECTIONS ERROR:", error.message);
      console.error("   🔍 Error details:", error);
      return { error: true, details: error };
    }

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log("   ✅ ACTUAL COLUMNS:", JSON.stringify(columns));
      console.log("   📄 SAMPLE DATA:");
      console.table(sample[0]);

      // Check for critical fields that cause 400 errors
      const hasCompleted = columns.includes('completed');
      const hasStatus = columns.includes('status');
      const hasInspectorId = columns.includes('inspector_id');
      const hasCreatedAt = columns.includes('created_at');
      const hasUpdatedAt = columns.includes('updated_at');

      console.log("   🔍 CRITICAL FIELD ANALYSIS:");
      console.log(`      - completed field: ${hasCompleted ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - status field: ${hasStatus ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - inspector_id field: ${hasInspectorId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - created_at field: ${hasCreatedAt ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - updated_at field: ${hasUpdatedAt ? '✅ EXISTS' : '❌ MISSING'}`);

      // Test actual queries that are failing
      console.log("   🧪 TESTING CURRENT FAILING QUERIES:");
      
      if (hasCompleted) {
        console.log("      Testing .eq('completed', false)...");
        const { data: testData, error: testError } = await supabase
          .from('inspections')
          .select('id')
          .eq('completed', false)
          .limit(1);
        
        if (testError) {
          console.error(`      ❌ COMPLETED QUERY FAILS: ${testError.message}`);
        } else {
          console.log("      ✅ COMPLETED QUERY WORKS");
        }
      }

      if (hasStatus) {
        console.log("      Testing status-based active inspection query...");
        const { data: statusData, error: statusError } = await supabase
          .from('inspections')
          .select('id')
          .in('status', ['draft', 'in_progress'])
          .limit(1);
          
        if (statusError) {
          console.error(`      ❌ STATUS QUERY FAILS: ${statusError.message}`);
        } else {
          console.log("      ✅ STATUS QUERY WORKS");
        }
      }

      return { 
        columns, 
        hasCompleted, 
        hasStatus, 
        hasInspectorId, 
        hasCreatedAt,
        hasUpdatedAt,
        sample: sample[0],
        error: false 
      };
    } else {
      console.log("   ⚠️ NO INSPECTION DATA FOUND - EMPTY TABLE");
      return { error: false, empty: true };
    }
  } catch (exception) {
    console.error("   🚨 EXCEPTION in inspections verification:", exception);
    return { error: true, exception };
  }
};

// LOGS TABLE VERIFICATION 
const verifyLogsSchema = async () => {
  console.log("\n2. 📊 LOGS TABLE VERIFICATION:");
  console.log("   Checking for: inspection_id, checklist_id, static_safety_item_id fields");

  try {
    const { data: sample, error } = await supabase
      .from('logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("   ❌ LOGS ERROR:", error.message);
      console.error("   🔍 Error details:", error);
      return { error: true, details: error };
    }

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log("   ✅ ACTUAL COLUMNS:", JSON.stringify(columns));
      console.log("   📄 SAMPLE DATA:");
      console.table(sample[0]);

      // Check for relationship fields that cause 404 errors
      const hasInspectionId = columns.includes('inspection_id');
      const hasChecklistId = columns.includes('checklist_id');
      const hasStaticSafetyItemId = columns.includes('static_safety_item_id');
      const hasPropertyId = columns.includes('property_id');
      const hasLogId = columns.includes('log_id');

      console.log("   🔍 RELATIONSHIP FIELD ANALYSIS:");
      console.log(`      - inspection_id: ${hasInspectionId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - checklist_id: ${hasChecklistId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - static_safety_item_id: ${hasStaticSafetyItemId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - property_id: ${hasPropertyId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`      - log_id: ${hasLogId ? '✅ EXISTS' : '❌ MISSING'}`);

      return { 
        columns, 
        hasInspectionId, 
        hasChecklistId, 
        hasStaticSafetyItemId, 
        hasPropertyId,
        hasLogId,
        sample: sample[0],
        error: false 
      };
    } else {
      console.log("   ⚠️ NO LOGS DATA FOUND - EMPTY TABLE");
      return { error: false, empty: true };
    }
  } catch (exception) {
    console.error("   🚨 EXCEPTION in logs verification:", exception);
    return { error: true, exception };
  }
};

// STATIC_SAFETY_ITEMS TABLE VERIFICATION
const verifyStaticSafetyItemsSchema = async () => {
  console.log("\n3. 📊 STATIC_SAFETY_ITEMS TABLE VERIFICATION:");
  console.log("   Checking ID type and structure");

  try {
    const { data: sample, error } = await supabase
      .from('static_safety_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("   ❌ STATIC_SAFETY_ITEMS ERROR:", error.message);
      console.error("   🔍 Error details:", error);
      return { error: true, details: error };
    }

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log("   ✅ ACTUAL COLUMNS:", JSON.stringify(columns));
      console.log("   📄 SAMPLE DATA:");
      console.table(sample[0]);

      // Check ID type - critical for relationship queries
      const idValue = sample[0].id;
      const idType = typeof idValue;
      const isUUID = typeof idValue === 'string' && idValue.length === 36;
      const isInteger = typeof idValue === 'number';

      console.log("   🔍 ID FIELD ANALYSIS:");
      console.log(`      - id type: ${idType}`);
      console.log(`      - is UUID: ${isUUID ? '✅ YES' : '❌ NO'}`);
      console.log(`      - is Integer: ${isInteger ? '✅ YES' : '❌ NO'}`);
      console.log(`      - sample id: ${idValue}`);

      return { 
        columns, 
        idType, 
        isUUID, 
        isInteger, 
        idValue,
        sample: sample[0],
        error: false 
      };
    } else {
      console.log("   ⚠️ NO STATIC_SAFETY_ITEMS DATA FOUND - EMPTY TABLE");
      return { error: false, empty: true };
    }
  } catch (exception) {
    console.error("   🚨 EXCEPTION in static_safety_items verification:", exception);
    return { error: true, exception };
  }
};

// RELATIONSHIP VERIFICATION
const verifyRelationships = async (logsSchema, staticSafetyItemsSchema) => {
  console.log("\n4. 🔗 RELATIONSHIP VERIFICATION:");
  console.log("   Testing actual join patterns that are failing");

  if (!logsSchema || logsSchema.error) {
    console.log("   ❌ Cannot verify relationships - logs schema unavailable");
    return { error: true };
  }

  const results = {};

  // Test checklist_id relationship (currently failing)
  if (logsSchema.hasChecklistId) {
    console.log("   🧪 Testing logs -> static_safety_items via checklist_id...");
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('log_id, checklist_id, static_safety_items!checklist_id(id, label)')
        .limit(1);

      if (error) {
        console.error(`      ❌ checklist_id relationship FAILED: ${error.message}`);
        results.checklistIdWorks = false;
        results.checklistIdError = error.message;
      } else {
        console.log("      ✅ checklist_id relationship WORKS");
        results.checklistIdWorks = true;
        if (data && data.length > 0) {
          console.table(data[0]);
        }
      }
    } catch (exception) {
      console.error("      🚨 EXCEPTION testing checklist_id:", exception);
      results.checklistIdWorks = false;
      results.checklistIdException = exception.message;
    }
  }

  // Test static_safety_item_id relationship
  if (logsSchema.hasStaticSafetyItemId) {
    console.log("   🧪 Testing logs -> static_safety_items via static_safety_item_id...");
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('log_id, static_safety_item_id, static_safety_items!static_safety_item_id(id, label)')
        .limit(1);

      if (error) {
        console.error(`      ❌ static_safety_item_id relationship FAILED: ${error.message}`);
        results.staticSafetyItemIdWorks = false;
        results.staticSafetyItemIdError = error.message;
      } else {
        console.log("      ✅ static_safety_item_id relationship WORKS");
        results.staticSafetyItemIdWorks = true;
        if (data && data.length > 0) {
          console.table(data[0]);
        }
      }
    } catch (exception) {
      console.error("      🚨 EXCEPTION testing static_safety_item_id:", exception);
      results.staticSafetyItemIdWorks = false;
      results.staticSafetyItemIdException = exception.message;
    }
  }

  // Test inspection_id relationship  
  if (logsSchema.hasInspectionId) {
    console.log("   🧪 Testing logs -> inspections via inspection_id...");
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('log_id, inspection_id, inspections!inspection_id(id, property_id)')
        .limit(1);

      if (error) {
        console.error(`      ❌ inspection_id relationship FAILED: ${error.message}`);
        results.inspectionIdWorks = false;
        results.inspectionIdError = error.message;
      } else {
        console.log("      ✅ inspection_id relationship WORKS");
        results.inspectionIdWorks = true;
        if (data && data.length > 0) {
          console.table(data[0]);
        }
      }
    } catch (exception) {
      console.error("      🚨 EXCEPTION testing inspection_id:", exception);
      results.inspectionIdWorks = false;
      results.inspectionIdException = exception.message;
    }
  }

  return results;
};

// DATA COUNTS FOR CONTEXT
const getDataCounts = async () => {
  console.log("\n5. 📊 DATA VOLUME ANALYSIS:");

  const tables = ['inspections', 'logs', 'static_safety_items', 'properties'];
  const counts = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
        counts[table] = { error: error.message };
      } else {
        console.log(`   ✅ ${table}: ${count} records`);
        counts[table] = { count };
      }
    } catch (exception) {
      console.log(`   🚨 ${table}: EXCEPTION - ${exception.message}`);
      counts[table] = { exception: exception.message };
    }
  }

  return counts;
};

// EXECUTE COMPLETE VERIFICATION
const runCompleteVerification = async () => {
  console.log("🚀 Starting comprehensive schema verification...\n");
  
  const inspectionsSchema = await verifyInspectionsSchema();
  const logsSchema = await verifyLogsSchema();
  const staticSafetyItemsSchema = await verifyStaticSafetyItemsSchema();
  const relationshipResults = await verifyRelationships(logsSchema, staticSafetyItemsSchema);
  const dataCounts = await getDataCounts();

  console.log("\n" + "=".repeat(60));
  console.log("📋 PHASE 1 VERIFICATION COMPLETE");
  console.log("=".repeat(60));

  // Generate actionable recommendations
  console.log("\n🎯 CRITICAL FINDINGS & REQUIRED ACTIONS:");

  // Inspections table recommendations
  if (inspectionsSchema && !inspectionsSchema.error) {
    if (inspectionsSchema.hasCompleted) {
      console.log("✅ ACTION 1: Keep existing .eq('completed', false) queries");
    } else if (inspectionsSchema.hasStatus) {
      console.log("🔄 ACTION 1: Replace .eq('completed', false) with .in('status', ['draft', 'in_progress'])");
    } else {
      console.log("❌ ACTION 1: CRITICAL - No active inspection field found! Manual investigation required.");
    }
  }

  // Logs relationship recommendations
  if (relationshipResults.checklistIdWorks) {
    console.log("✅ ACTION 2: Keep static_safety_items!checklist_id relationship");
  } else if (relationshipResults.staticSafetyItemIdWorks) {
    console.log("🔄 ACTION 2: Replace checklist_id with static_safety_item_id in relationships");
  } else {
    console.log("❌ ACTION 2: CRITICAL - No working logs -> static_safety_items relationship!");
  }

  // Inspection connection recommendations
  if (relationshipResults.inspectionIdWorks) {
    console.log("✅ ACTION 3: Logs -> inspections relationship works via inspection_id");
  } else if (logsSchema && logsSchema.hasPropertyId) {
    console.log("🔄 ACTION 3: Use property_id for logs -> inspections connection instead");
  } else {
    console.log("❌ ACTION 3: CRITICAL - No way to connect logs to inspections!");
  }

  console.log("\n📋 NEXT IMPLEMENTATION STEPS:");
  console.log("1. Copy this entire console output");
  console.log("2. Update PropertyCardWithResume.tsx line 125");
  console.log("3. Update PropertyDataManager.tsx line 109");
  console.log("4. Update ActiveInspectionDataManager.tsx line 98");
  console.log("5. Test each component individually");
  console.log("6. Verify active inspections loading works");

  console.log("\n🏆 SCHEMA VERIFICATION DATA:");
  return { 
    inspectionsSchema, 
    logsSchema, 
    staticSafetyItemsSchema, 
    relationshipResults, 
    dataCounts,
    timestamp: new Date().toISOString()
  };
};

// AUTO-START VERIFICATION
console.log("⏳ Executing verification in 2 seconds...");
setTimeout(async () => {
  try {
    const results = await runCompleteVerification();
    
    // Store results globally for easy access
    window.SCHEMA_VERIFICATION_RESULTS = results;
    console.log("\n💾 Results stored in window.SCHEMA_VERIFICATION_RESULTS");
    
    console.log("\n🎯 PHASE 1 READY FOR IMPLEMENTATION");
    console.log("Proceed to fix the identified query patterns.");
    
  } catch (error) {
    console.error("🚨 VERIFICATION FAILED:", error);
    console.log("Manual investigation required - check Supabase configuration");
  }
}, 2000);

// Export for manual execution if needed
window.runSchemaVerification = runCompleteVerification;
console.log("📖 MANUAL EXECUTION: Call window.runSchemaVerification() if auto-execution fails");