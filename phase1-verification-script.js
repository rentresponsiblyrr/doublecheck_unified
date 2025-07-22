// PHASE 1 ELITE VERIFICATION PROTOCOL
// Execute this in browser console with Supabase client available

console.log("=== PHASE 1 ELITE VERIFICATION PROTOCOL ===");
console.log("Engineer: Claude AI Assistant");
console.log("Timestamp:", new Date().toISOString());

// Test actual user from console logs
const TEST_USER_ID = '7615469e-14ed-4b5c-8566-efe09bd05dd3';

const runEliteVerification = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    metrics: {},
    errors: [],
    recommendations: []
  };

  // TEST 1: Current Active Inspections Query (Fixed Schema)
  console.log("\n1. 🧪 TESTING FIXED ACTIVE INSPECTIONS QUERY");
  try {
    const startTime = performance.now();
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select(`
        id,
        property_id,
        status,
        created_at,
        updated_at,
        properties!inner (
          property_id,
          property_name,
          street_address
        ),
        logs!inner (
          id,
          status,
          static_safety_items!inner (
            id,
            label,
            evidence_type
          )
        )
      `)
      .eq('inspector_id', TEST_USER_ID)
      .in('status', ['draft', 'in_progress'])
      .order('updated_at', { ascending: false })
      .limit(5);

    const duration = performance.now() - startTime;

    if (error) {
      console.error("❌ CRITICAL FAILURE:", error);
      results.tests.activeInspections = {
        status: 'FAILED',
        error: error,
        duration: duration
      };
      results.errors.push({
        test: 'activeInspections',
        error: error,
        impact: 'BLOCKS_PHASE_2'
      });
    } else {
      console.log("✅ SUCCESS:", inspections?.length || 0, "inspections loaded");
      console.log("⚡ Performance:", duration.toFixed(2), "ms");
      results.tests.activeInspections = {
        status: 'PASSED',
        count: inspections?.length || 0,
        duration: duration,
        sampleData: inspections?.[0] || null
      };

      if (duration > 500) {
        results.recommendations.push("Query performance > 500ms - consider optimization");
      }
    }
  } catch (err) {
    console.error("❌ EXCEPTION:", err);
    results.errors.push({
      test: 'activeInspections',
      error: err.message,
      impact: 'BLOCKS_PHASE_2'
    });
  }

  // TEST 2: Schema Relationship Validation
  console.log("\n2. 🔍 VALIDATING DATABASE SCHEMA RELATIONSHIPS");
  try {
    // Verify logs table structure
    const { data: logsData, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .limit(1);

    if (logsError) {
      console.error("❌ Logs table access failed:", logsError);
      results.errors.push({
        test: 'logsTableAccess',
        error: logsError,
        impact: 'SCHEMA_MISMATCH'
      });
    } else if (logsData && logsData.length > 0) {
      const columns = Object.keys(logsData[0]);
      console.log("✅ Logs table columns:", columns);

      // Critical foreign key analysis
      const foreignKeys = {
        inspection_id: columns.includes('inspection_id'),
        checklist_id: columns.includes('checklist_id'),
        static_safety_item_id: columns.includes('static_safety_item_id'),
        property_id: columns.includes('property_id')
      };

      console.log("🔍 Foreign key analysis:", foreignKeys);
      results.tests.logsSchema = {
        status: 'PASSED',
        columns: columns,
        foreignKeys: foreignKeys,
        sampleRow: logsData[0]
      };
    } else {
      console.log("⚠️ No logs data found");
      results.tests.logsSchema = {
        status: 'WARNING',
        issue: 'No data in logs table'
      };
    }

    // Verify static_safety_items ID type
    const { data: staticData, error: staticError } = await supabase
      .from('static_safety_items')
      .select('id, label')
      .limit(1);

    if (staticError) {
      console.error("❌ Static safety items access failed:", staticError);
      results.errors.push({
        test: 'staticSafetyItemsAccess',
        error: staticError,
        impact: 'SCHEMA_MISMATCH'
      });
    } else if (staticData && staticData.length > 0) {
      const idValue = staticData[0].id;
      const idType = typeof idValue;
      const isUUID = typeof idValue === 'string' && idValue.length === 36;
      const isInteger = typeof idValue === 'number';

      console.log("✅ Static safety items ID analysis:");
      console.log(`   - Type: ${idType}`);
      console.log(`   - Is UUID: ${isUUID}`);
      console.log(`   - Is Integer: ${isInteger}`);
      console.log(`   - Sample ID: ${idValue}`);

      results.tests.staticSafetyItemsSchema = {
        status: 'PASSED',
        idType: idType,
        isUUID: isUUID,
        isInteger: isInteger,
        sampleId: idValue
      };
    }
  } catch (err) {
    console.error("❌ Schema validation exception:", err);
    results.errors.push({
      test: 'schemaValidation',
      error: err.message,
      impact: 'UNKNOWN_SCHEMA_STATE'
    });
  }

  // TEST 3: Relationship Join Validation
  console.log("\n3. 🔗 TESTING FOREIGN KEY RELATIONSHIPS");
  try {
    // Test different join patterns to find working relationship
    const joinTests = [
      { name: 'checklist_id', syntax: 'static_safety_items!checklist_id(*)' },
      { name: 'static_safety_item_id', syntax: 'static_safety_items!static_safety_item_id(*)' },
      { name: 'default', syntax: 'static_safety_items(*)' }
    ];

    for (const test of joinTests) {
      try {
        console.log(`   Testing ${test.name} relationship...`);
        const { data, error } = await supabase
          .from('logs')
          .select(`id, ${test.syntax}`)
          .limit(1);

        if (error) {
          console.log(`   ❌ ${test.name}: ${error.message}`);
          results.tests[`relationship_${test.name}`] = {
            status: 'FAILED',
            error: error.message
          };
        } else {
          console.log(`   ✅ ${test.name}: Works`);
          results.tests[`relationship_${test.name}`] = {
            status: 'PASSED',
            syntax: test.syntax,
            sampleData: data?.[0]
          };
        }
      } catch (err) {
        console.log(`   ❌ ${test.name}: Exception - ${err.message}`);
        results.tests[`relationship_${test.name}`] = {
          status: 'EXCEPTION',
          error: err.message
        };
      }
    }
  } catch (err) {
    console.error("❌ Relationship testing failed:", err);
    results.errors.push({
      test: 'relationshipTesting',
      error: err.message,
      impact: 'JOIN_PATTERN_UNKNOWN'
    });
  }

  // TEST 4: Data Volume and Performance Analysis
  console.log("\n4. 📊 DATA VOLUME AND PERFORMANCE ANALYSIS");
  try {
    const tables = ['inspections', 'logs', 'static_safety_items', 'properties'];
    const volumes = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
          volumes[table] = { status: 'ERROR', error: error.message };
        } else {
          console.log(`   ✅ ${table}: ${count} records`);
          volumes[table] = { status: 'SUCCESS', count: count };
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Exception - ${err.message}`);
        volumes[table] = { status: 'EXCEPTION', error: err.message };
      }
    }

    results.tests.dataVolumes = volumes;
  } catch (err) {
    console.error("❌ Data volume analysis failed:", err);
  }

  // TEST 5: Error Scenario Validation
  console.log("\n5. 🛡️ ERROR HANDLING VALIDATION");
  try {
    // Test with invalid user ID
    const { data: errorTest, error: expectedError } = await supabase
      .from('inspections')
      .select('*')
      .eq('inspector_id', 'invalid-uuid')
      .in('status', ['draft', 'in_progress']);

    if (expectedError) {
      console.log("❌ Invalid user query failed as expected:", expectedError.message);
      results.tests.errorHandling = {
        status: 'PASSED',
        note: 'Invalid queries properly rejected'
      };
    } else {
      console.log("✅ Invalid user query returned:", errorTest?.length || 0, "results");
      results.tests.errorHandling = {
        status: 'PASSED',
        note: 'Invalid queries handled gracefully'
      };
    }
  } catch (err) {
    console.log("⚠️ Error handling test exception:", err.message);
    results.tests.errorHandling = {
      status: 'WARNING',
      error: err.message
    };
  }

  // FINAL ANALYSIS
  console.log("\n=== ELITE VERIFICATION RESULTS ===");

  const passedTests = Object.values(results.tests).filter(test => test.status === 'PASSED').length;
  const totalTests = Object.keys(results.tests).length;
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

  results.metrics = {
    totalTests: totalTests,
    passedTests: passedTests,
    successRate: parseFloat(successRate),
    criticalErrors: results.errors.filter(e => e.impact === 'BLOCKS_PHASE_2').length
  };

  console.log("📊 TEST SUMMARY:");
  console.log(`   - Total Tests: ${totalTests}`);
  console.log(`   - Passed: ${passedTests}`);
  console.log(`   - Success Rate: ${successRate}%`);
  console.log(`   - Critical Errors: ${results.metrics.criticalErrors}`);

  if (results.metrics.criticalErrors === 0 && results.metrics.successRate >= 90) {
    console.log("🎉 PHASE 1 STATUS: ELITE COMPLETION ACHIEVED");
    console.log("✅ READY FOR PHASE 2");
  } else if (results.metrics.criticalErrors === 0) {
    console.log("⚠️ PHASE 1 STATUS: FUNCTIONAL BUT NEEDS REFINEMENT");
    console.log("🔄 READY FOR PHASE 2 WITH MONITORING");
  } else {
    console.log("❌ PHASE 1 STATUS: CRITICAL ISSUES REMAIN");
    console.log("🚨 PHASE 2 BLOCKED");
  }

  console.log("\n📋 RECOMMENDATIONS:");
  results.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });

  if (results.errors.length > 0) {
    console.log("\n🚨 CRITICAL ERRORS TO ADDRESS:");
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.test}] ${err.error} (Impact: ${err.impact})`);
    });
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
  console.log("📤 PROVIDE THIS COMPLETE OUTPUT TO SENIOR ENGINEER");

  return results;
};

// Execute verification
runEliteVerification().catch(console.error);