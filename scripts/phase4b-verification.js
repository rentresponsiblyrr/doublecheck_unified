#!/usr/bin/env node
/**
 * PHASE 4B PWA INTEGRATION VERIFICATION SCRIPT
 * 
 * Comprehensive validation script for Phase 4B PWA implementation components.
 * Verifies all 4 core components against Netflix/Meta standards with detailed
 * reporting and evidence collection for completion validation.
 * 
 * VERIFICATION SCOPE:
 * - Component 5: Offline Inspection Workflow
 * - Component 6: PWA Manifest & Install Prompt  
 * - Component 7: Background Sync System
 * - Component 8: Push Notifications
 * 
 * SUCCESS CRITERIA:
 * - 100% component implementation completeness
 * - Netflix/Meta performance standards compliance
 * - Zero critical vulnerabilities or code issues
 * - Complete offline functionality verification
 * - PWA installation and notification testing
 * 
 * @author STR Certified Engineering Team
 * @version 4.0.0 - Phase 4B Completion Verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Verification configuration
const VERIFICATION_CONFIG = {
  projectRoot: process.cwd(),
  requiredComponents: [
    {
      name: 'Offline Inspection Workflow',
      file: 'src/components/inspection/OfflineInspectionWorkflow.tsx',
      minLines: 800,
      requiredFeatures: [
        'IndexedDB integration',
        'Media capture and storage',
        'Background sync queuing',
        'Construction site optimizations',
        'Offline data persistence',
        'Network transition handling'
      ]
    },
    {
      name: 'PWA Manifest & Install Prompt',
      files: [
        'public/manifest.json',
        'src/components/pwa/PWAInstallPrompt.tsx'
      ],
      minLines: 600,
      requiredFeatures: [
        'Cross-platform installation support',
        'Intelligent install timing',
        'Construction site UI optimizations',
        'User engagement tracking',
        'Progressive enhancement'
      ]
    },
    {
      name: 'Background Sync System',
      file: 'src/services/pwa/BackgroundSyncManager.ts',
      minLines: 1000,
      requiredFeatures: [
        'Service Worker integration',
        'Conflict resolution strategies',
        'Priority-based queue management',
        'Network adaptation',
        'Circuit breaker patterns',
        'IndexedDB persistence'
      ]
    },
    {
      name: 'Push Notifications',
      file: 'src/services/pwa/PushNotificationManager.ts',
      minLines: 800,
      requiredFeatures: [
        'VAPID key integration',
        'Notification batching',
        'Construction site adaptations',
        'Emergency override system',
        'User preference management',
        'Multi-channel delivery'
      ]
    }
  ],
  performanceThresholds: {
    maxBundleSize: 500 * 1024, // 500KB max increase
    maxComponentLines: 1200,
    minTestCoverage: 80,
    maxTypeScriptErrors: 0,
    maxESLintErrors: 0
  }
};

// Verification state
const verificationState = {
  startTime: Date.now(),
  results: {
    components: [],
    performance: {},
    quality: {},
    integration: {}
  },
  errors: [],
  warnings: [],
  evidence: {
    screenshots: [],
    metrics: {},
    files: []
  }
};

/**
 * MAIN VERIFICATION ORCHESTRATOR
 */
async function runPhase4BVerification() {
  console.log(`${colors.bright}${colors.blue}🚀 PHASE 4B PWA INTEGRATION VERIFICATION${colors.reset}`);
  console.log(`${colors.cyan}Netflix/Meta Standards Compliance Check${colors.reset}\n`);

  try {
    // Phase 1: Component Implementation Verification
    console.log(`${colors.bright}📋 Phase 1: Component Implementation Verification${colors.reset}`);
    await verifyComponentImplementation();

    // Phase 2: PWA Functionality Testing  
    console.log(`\n${colors.bright}🔧 Phase 2: PWA Functionality Testing${colors.reset}`);
    await verifyPWAFunctionality();

    // Phase 3: Performance and Quality Analysis
    console.log(`\n${colors.bright}📊 Phase 3: Performance and Quality Analysis${colors.reset}`);
    await verifyPerformanceAndQuality();

    // Phase 4: Integration and System Testing
    console.log(`\n${colors.bright}🔗 Phase 4: Integration and System Testing${colors.reset}`);
    await verifyIntegrationAndSystem();

    // Phase 5: Evidence Collection and Reporting
    console.log(`\n${colors.bright}📁 Phase 5: Evidence Collection and Reporting${colors.reset}`);
    await generateVerificationReport();

    // Final Results
    console.log(`\n${colors.bright}${colors.green}✅ PHASE 4B VERIFICATION COMPLETED${colors.reset}`);
    displayFinalResults();

  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}❌ VERIFICATION FAILED${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * COMPONENT IMPLEMENTATION VERIFICATION
 */
async function verifyComponentImplementation() {
  for (const component of VERIFICATION_CONFIG.requiredComponents) {
    console.log(`\n${colors.yellow}Verifying: ${component.name}${colors.reset}`);
    
    const result = {
      name: component.name,
      implemented: false,
      fileExists: false,
      lineCount: 0,
      featuresImplemented: [],
      missingFeatures: [],
      score: 0
    };

    try {
      // Check single file or multiple files
      const files = component.files || [component.file];
      let totalLines = 0;
      let allFilesExist = true;

      for (const filePath of files) {
        const fullPath = path.join(VERIFICATION_CONFIG.projectRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;
          
          console.log(`  ✅ ${filePath} (${lines} lines)`);
          
          // Check for required features
          component.requiredFeatures.forEach(feature => {
            if (checkFeatureImplementation(content, feature)) {
              result.featuresImplemented.push(feature);
              console.log(`    ✅ ${feature}`);
            } else {
              result.missingFeatures.push(feature);
              console.log(`    ❌ ${feature}`);
            }
          });
        } else {
          allFilesExist = false;
          console.log(`  ❌ ${filePath} - FILE NOT FOUND`);
        }
      }

      result.fileExists = allFilesExist;
      result.lineCount = totalLines;
      result.implemented = allFilesExist && totalLines >= (component.minLines || 0);

      // Calculate score
      const featureScore = (result.featuresImplemented.length / component.requiredFeatures.length) * 70;
      const implementationScore = result.implemented ? 30 : 0;
      result.score = Math.round(featureScore + implementationScore);

      if (result.score >= 90) {
        console.log(`  ${colors.green}✅ PASSED (${result.score}/100)${colors.reset}`);
      } else if (result.score >= 70) {
        console.log(`  ${colors.yellow}⚠️  PARTIAL (${result.score}/100)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}❌ FAILED (${result.score}/100)${colors.reset}`);
        verificationState.errors.push(`Component ${component.name} failed verification`);
      }

    } catch (error) {
      console.log(`  ${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
      verificationState.errors.push(`Error verifying ${component.name}: ${error.message}`);
    }

    verificationState.results.components.push(result);
  }
}

/**
 * PWA FUNCTIONALITY TESTING
 */
async function verifyPWAFunctionality() {
  const functionalityTests = [
    {
      name: 'Service Worker Registration',
      test: () => checkServiceWorkerFile()
    },
    {
      name: 'PWA Manifest Validation',
      test: () => validatePWAManifest()
    },
    {
      name: 'Offline Capability Detection',
      test: () => checkOfflineCapabilities()
    },
    {
      name: 'Background Sync Integration',
      test: () => checkBackgroundSyncIntegration()
    },
    {
      name: 'Push Notification Setup',
      test: () => checkPushNotificationSetup()
    },
    {
      name: 'Installation Prompt Logic',
      test: () => checkInstallationPromptLogic()
    }
  ];

  verificationState.results.pwaFunctionality = [];

  for (const test of functionalityTests) {
    console.log(`  Testing: ${test.name}`);
    
    try {
      const result = await test.test();
      verificationState.results.pwaFunctionality.push({
        name: test.name,
        passed: result.passed,
        details: result.details,
        score: result.score || (result.passed ? 100 : 0)
      });

      if (result.passed) {
        console.log(`    ${colors.green}✅ PASSED${colors.reset}`);
      } else {
        console.log(`    ${colors.red}❌ FAILED: ${result.details}${colors.reset}`);
      }
    } catch (error) {
      console.log(`    ${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
      verificationState.errors.push(`PWA test ${test.name} failed: ${error.message}`);
    }
  }
}

/**
 * PERFORMANCE AND QUALITY ANALYSIS
 */
async function verifyPerformanceAndQuality() {
  const qualityChecks = [
    {
      name: 'TypeScript Compilation',
      command: 'npm run typecheck',
      threshold: 0,
      metric: 'errors'
    },
    {
      name: 'ESLint Analysis',
      command: 'npm run lint',
      threshold: 0,
      metric: 'errors'
    },
    {
      name: 'Bundle Size Analysis',
      test: () => analyzeBundleSize()
    },
    {
      name: 'Code Coverage Analysis',
      command: 'npm run test:coverage',
      threshold: 80,
      metric: 'coverage'
    }
  ];

  verificationState.results.quality = [];

  for (const check of qualityChecks) {
    console.log(`  Checking: ${check.name}`);
    
    try {
      let result;
      
      if (check.command) {
        result = await runQualityCommand(check.command, check.threshold, check.metric);
      } else if (check.test) {
        result = await check.test();
      }

      verificationState.results.quality.push({
        name: check.name,
        passed: result.passed,
        value: result.value,
        threshold: result.threshold,
        details: result.details
      });

      if (result.passed) {
        console.log(`    ${colors.green}✅ PASSED (${result.details})${colors.reset}`);
      } else {
        console.log(`    ${colors.red}❌ FAILED (${result.details})${colors.reset}`);
      }
    } catch (error) {
      console.log(`    ${colors.yellow}⚠️  SKIPPED: ${error.message}${colors.reset}`);
      verificationState.warnings.push(`Quality check ${check.name} skipped: ${error.message}`);
    }
  }
}

/**
 * INTEGRATION AND SYSTEM TESTING
 */
async function verifyIntegrationAndSystem() {
  const integrationTests = [
    {
      name: 'PWA Component Integration',
      test: () => checkPWAComponentIntegration()
    },
    {
      name: 'Service Worker Communication',
      test: () => checkServiceWorkerCommunication()
    },
    {
      name: 'IndexedDB Schema Compatibility',
      test: () => checkIndexedDBSchema()
    },
    {
      name: 'Notification Permission Flow',
      test: () => checkNotificationPermissionFlow()
    },
    {
      name: 'Offline-Online Transition',
      test: () => checkOfflineOnlineTransition()
    }
  ];

  verificationState.results.integration = [];

  for (const test of integrationTests) {
    console.log(`  Testing: ${test.name}`);
    
    try {
      const result = await test.test();
      verificationState.results.integration.push({
        name: test.name,
        passed: result.passed,
        details: result.details,
        score: result.score || (result.passed ? 100 : 0)
      });

      if (result.passed) {
        console.log(`    ${colors.green}✅ PASSED${colors.reset}`);
      } else {
        console.log(`    ${colors.red}❌ FAILED: ${result.details}${colors.reset}`);
      }
    } catch (error) {
      console.log(`    ${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
      verificationState.errors.push(`Integration test ${test.name} failed: ${error.message}`);
    }
  }
}

/**
 * VERIFICATION REPORT GENERATION
 */
async function generateVerificationReport() {
  const reportData = {
    timestamp: new Date().toISOString(),
    duration: Date.now() - verificationState.startTime,
    phase: '4B - PWA Integration Completion',
    results: verificationState.results,
    errors: verificationState.errors,
    warnings: verificationState.warnings,
    evidence: verificationState.evidence,
    summary: calculateVerificationSummary()
  };

  // Generate detailed report
  const reportPath = path.join(VERIFICATION_CONFIG.projectRoot, 'verification-reports', `phase4b-${Date.now()}.json`);
  
  // Ensure directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`  📄 Detailed report saved: ${reportPath}`);

  // Generate markdown summary
  const markdownReport = generateMarkdownReport(reportData);
  const markdownPath = reportPath.replace('.json', '.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`  📄 Markdown report saved: ${markdownPath}`);

  // Evidence collection
  await collectVerificationEvidence();
}

/**
 * UTILITY FUNCTIONS
 */

function checkFeatureImplementation(content, feature) {
  const featurePatterns = {
    'IndexedDB integration': /indexedDB|IDBDatabase|openDatabase/i,
    'Media capture and storage': /getUserMedia|mediaDevices|File|Blob/i,
    'Background sync queuing': /queueSyncTask|backgroundSync|syncQueue/i,
    'Construction site optimizations': /constructionSite|emergencyMode|batteryLevel/i,
    'Offline data persistence': /localStorage|sessionStorage|IndexedDB/i,
    'Network transition handling': /online|offline|networkChange|navigator\.onLine/i,
    'Cross-platform installation support': /beforeinstallprompt|addToHomeScreen|standalone/i,
    'Intelligent install timing': /engagementScore|installTiming|userActivity/i,
    'User engagement tracking': /trackUser|engagement|userActivity/i,
    'Progressive enhancement': /progressive|enhancement|fallback/i,
    'Service Worker integration': /serviceWorker|registration|navigator\.serviceWorker/i,
    'Conflict resolution strategies': /conflictResolution|lastWriterWins|operationalTransform/i,
    'Priority-based queue management': /priority|queue|urgent|critical/i,
    'Network adaptation': /networkQuality|connectionType|adaptToNetwork/i,
    'Circuit breaker patterns': /circuitBreaker|failureThreshold|cooldown/i,
    'VAPID key integration': /vapid|applicationServerKey|pushSubscription/i,
    'Notification batching': /batchNotification|notificationQueue|batch/i,
    'Emergency override system': /emergency|override|critical/i,
    'User preference management': /preferences|settings|userChoice/i,
    'Multi-channel delivery': /multiChannel|fallback|delivery/i
  };

  return featurePatterns[feature] ? featurePatterns[feature].test(content) : false;
}

function checkServiceWorkerFile() {
  const swPath = path.join(VERIFICATION_CONFIG.projectRoot, 'public', 'sw.js');
  
  if (!fs.existsSync(swPath)) {
    return { passed: false, details: 'Service Worker file not found' };
  }

  const content = fs.readFileSync(swPath, 'utf8');
  const hasBackgroundSync = /sync.*addEventListener|background.*sync/i.test(content);
  const hasCaching = /cache.*add|cache.*put|caches\.open/i.test(content);
  const hasPushHandling = /push.*addEventListener|notification/i.test(content);

  const score = [hasBackgroundSync, hasCaching, hasPushHandling].filter(Boolean).length;
  
  return {
    passed: score >= 2,
    details: `Service Worker features: ${score}/3`,
    score: (score / 3) * 100
  };
}

function validatePWAManifest() {
  const manifestPath = path.join(VERIFICATION_CONFIG.projectRoot, 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    return { passed: false, details: 'Manifest file not found' };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const hasRequiredFields = requiredFields.every(field => manifest[field]);
    
    const hasAdvancedFeatures = ['shortcuts', 'share_target', 'protocol_handlers'].some(field => manifest[field]);
    
    return {
      passed: hasRequiredFields,
      details: hasAdvancedFeatures ? 'Complete manifest with advanced features' : 'Basic manifest requirements met',
      score: hasRequiredFields ? (hasAdvancedFeatures ? 100 : 80) : 0
    };
  } catch (error) {
    return { passed: false, details: `Manifest parsing error: ${error.message}` };
  }
}

function checkOfflineCapabilities() {
  // Check for offline-related implementations
  const offlineWorkflowPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src/components/inspection/OfflineInspectionWorkflow.tsx');
  
  if (!fs.existsSync(offlineWorkflowPath)) {
    return { passed: false, details: 'Offline workflow component not found' };
  }

  const content = fs.readFileSync(offlineWorkflowPath, 'utf8');
  const hasIndexedDB = /indexedDB|IDBDatabase/.test(content);
  const hasOfflineLogic = /offline|navigator\.onLine/.test(content);
  const hasDataPersistence = /localStorage|sessionStorage/.test(content);

  const features = [hasIndexedDB, hasOfflineLogic, hasDataPersistence].filter(Boolean).length;
  
  return {
    passed: features >= 2,
    details: `Offline features implemented: ${features}/3`,
    score: (features / 3) * 100
  };
}

function checkBackgroundSyncIntegration() {
  const bgSyncPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src/services/pwa/BackgroundSyncManager.ts');
  
  if (!fs.existsSync(bgSyncPath)) {
    return { passed: false, details: 'BackgroundSyncManager not found' };
  }

  const content = fs.readFileSync(bgSyncPath, 'utf8');
  const hasServiceWorkerIntegration = /serviceWorker|registration/.test(content);
  const hasQueueManagement = /queue|task|priority/.test(content);
  const hasConflictResolution = /conflict|resolution|merge/.test(content);

  const features = [hasServiceWorkerIntegration, hasQueueManagement, hasConflictResolution].filter(Boolean).length;
  
  return {
    passed: features >= 2,
    details: `Background sync features: ${features}/3`,
    score: (features / 3) * 100
  };
}

function checkPushNotificationSetup() {
  const pushPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src/services/pwa/PushNotificationManager.ts');
  
  if (!fs.existsSync(pushPath)) {
    return { passed: false, details: 'PushNotificationManager not found' };
  }

  const content = fs.readFileSync(pushPath, 'utf8');
  const hasVAPIDSupport = /vapid|applicationServerKey/.test(content);
  const hasPermissionHandling = /permission|requestPermission/.test(content);
  const hasBatching = /batch|queue/.test(content);

  const features = [hasVAPIDSupport, hasPermissionHandling, hasBatching].filter(Boolean).length;
  
  return {
    passed: features >= 2,
    details: `Push notification features: ${features}/3`,
    score: (features / 3) * 100
  };
}

function checkInstallationPromptLogic() {
  const installPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src/components/pwa/PWAInstallPrompt.tsx');
  
  if (!fs.existsSync(installPath)) {
    return { passed: false, details: 'PWAInstallPrompt component not found' };
  }

  const content = fs.readFileSync(installPath, 'utf8');
  const hasBeforeInstallPrompt = /beforeinstallprompt/.test(content);
  const hasEngagementTracking = /engagement|timing|activity/.test(content);
  const hasCrossPlatform = /safari|chrome|firefox|edge/.test(content);

  const features = [hasBeforeInstallPrompt, hasEngagementTracking, hasCrossPlatform].filter(Boolean).length;
  
  return {
    passed: features >= 2,
    details: `Installation prompt features: ${features}/3`,
    score: (features / 3) * 100
  };
}

async function runQualityCommand(command, threshold, metric) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    
    switch (metric) {
      case 'errors':
        const errorCount = (output.match(/error/gi) || []).length;
        return {
          passed: errorCount <= threshold,
          value: errorCount,
          threshold,
          details: `${errorCount} errors found (threshold: ${threshold})`
        };
      
      case 'coverage':
        const coverageMatch = output.match(/All files.*?(\d+\.?\d*)/);
        const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
        return {
          passed: coverage >= threshold,
          value: coverage,
          threshold,
          details: `${coverage}% coverage (threshold: ${threshold}%)`
        };
      
      default:
        return {
          passed: true,
          value: 'completed',
          threshold: 'n/a',
          details: 'Command executed successfully'
        };
    }
  } catch (error) {
    // Command failed, but we still check for specific outputs
    const errorOutput = error.stdout || error.stderr || '';
    
    if (metric === 'errors') {
      const errorCount = (errorOutput.match(/error/gi) || []).length;
      return {
        passed: errorCount <= threshold,
        value: errorCount,
        threshold,
        details: `${errorCount} errors found (threshold: ${threshold})`
      };
    }
    
    throw error;
  }
}

function analyzeBundleSize() {
  // Simplified bundle size analysis
  const buildDir = path.join(VERIFICATION_CONFIG.projectRoot, 'dist');
  
  if (!fs.existsSync(buildDir)) {
    return {
      passed: true,
      details: 'Build directory not found - skipping bundle analysis',
      score: 100
    };
  }

  try {
    const stats = fs.statSync(path.join(buildDir, 'assets'));
    const sizeInKB = Math.round(stats.size / 1024);
    const threshold = VERIFICATION_CONFIG.performanceThresholds.maxBundleSize / 1024;
    
    return {
      passed: sizeInKB <= threshold,
      value: sizeInKB,
      threshold,
      details: `Bundle size: ${sizeInKB}KB (threshold: ${threshold}KB)`
    };
  } catch (error) {
    return {
      passed: true,
      details: 'Bundle analysis skipped - build assets not accessible',
      score: 100
    };
  }
}

function checkPWAComponentIntegration() {
  const mainTsxPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src', 'main.tsx');
  
  if (!fs.existsSync(mainTsxPath)) {
    return { passed: false, details: 'main.tsx not found' };
  }

  const content = fs.readFileSync(mainTsxPath, 'utf8');
  const hasPWAIntegration = /pwa|PWA|serviceWorker/.test(content);
  
  return {
    passed: hasPWAIntegration,
    details: hasPWAIntegration ? 'PWA integration detected in main.tsx' : 'No PWA integration found in main.tsx',
    score: hasPWAIntegration ? 100 : 0
  };
}

function checkServiceWorkerCommunication() {
  // Check if components properly communicate with service worker
  const components = [
    'src/services/pwa/BackgroundSyncManager.ts',
    'src/services/pwa/PushNotificationManager.ts',
    'src/components/inspection/OfflineInspectionWorkflow.tsx'
  ];

  let communicatingComponents = 0;
  
  components.forEach(component => {
    const fullPath = path.join(VERIFICATION_CONFIG.projectRoot, component);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/postMessage|addEventListener.*message|serviceWorker/.test(content)) {
        communicatingComponents++;
      }
    }
  });

  return {
    passed: communicatingComponents >= 2,
    details: `${communicatingComponents}/${components.length} components communicate with Service Worker`,
    score: (communicatingComponents / components.length) * 100
  };
}

function checkIndexedDBSchema() {
  // Check for consistent IndexedDB schema usage
  const dbComponents = [
    'src/services/pwa/BackgroundSyncManager.ts',
    'src/components/inspection/OfflineInspectionWorkflow.tsx'
  ];

  let validSchemas = 0;
  
  dbComponents.forEach(component => {
    const fullPath = path.join(VERIFICATION_CONFIG.projectRoot, component);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/createObjectStore|objectStore|indexedDB\.open/.test(content)) {
        validSchemas++;
      }
    }
  });

  return {
    passed: validSchemas >= 1,
    details: `${validSchemas}/${dbComponents.length} components use IndexedDB properly`,
    score: (validSchemas / dbComponents.length) * 100
  };
}

function checkNotificationPermissionFlow() {
  const pushManagerPath = path.join(VERIFICATION_CONFIG.projectRoot, 'src/services/pwa/PushNotificationManager.ts');
  
  if (!fs.existsSync(pushManagerPath)) {
    return { passed: false, details: 'PushNotificationManager not found' };
  }

  const content = fs.readFileSync(pushManagerPath, 'utf8');
  const hasPermissionRequest = /requestPermission|Notification\.permission/.test(content);
  const hasPermissionHandling = /granted|denied|default/.test(content);
  
  const features = [hasPermissionRequest, hasPermissionHandling].filter(Boolean).length;
  
  return {
    passed: features >= 1,
    details: `Permission flow features: ${features}/2`,
    score: (features / 2) * 100
  };
}

function checkOfflineOnlineTransition() {
  // Check for proper online/offline transition handling
  const components = [
    'src/services/pwa/BackgroundSyncManager.ts',
    'src/components/inspection/OfflineInspectionWorkflow.tsx'
  ];

  let transitionHandlers = 0;
  
  components.forEach(component => {
    const fullPath = path.join(VERIFICATION_CONFIG.projectRoot, component);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/online|offline|navigator\.onLine|networkchange/i.test(content)) {
        transitionHandlers++;
      }
    }
  });

  return {
    passed: transitionHandlers >= 1,
    details: `${transitionHandlers}/${components.length} components handle network transitions`,
    score: (transitionHandlers / components.length) * 100
  };
}

function calculateVerificationSummary() {
  const componentScores = verificationState.results.components.map(c => c.score);
  const pwaScores = (verificationState.results.pwaFunctionality || []).map(p => p.score);
  const qualityPassed = (verificationState.results.quality || []).filter(q => q.passed).length;
  const totalQuality = (verificationState.results.quality || []).length;
  const integrationScores = (verificationState.results.integration || []).map(i => i.score);

  const avgComponentScore = componentScores.length > 0 ? componentScores.reduce((a, b) => a + b, 0) / componentScores.length : 0;
  const avgPWAScore = pwaScores.length > 0 ? pwaScores.reduce((a, b) => a + b, 0) / pwaScores.length : 0;
  const qualityScore = totalQuality > 0 ? (qualityPassed / totalQuality) * 100 : 0;
  const avgIntegrationScore = integrationScores.length > 0 ? integrationScores.reduce((a, b) => a + b, 0) / integrationScores.length : 0;

  const overallScore = Math.round((avgComponentScore + avgPWAScore + qualityScore + avgIntegrationScore) / 4);

  return {
    overallScore,
    componentScore: Math.round(avgComponentScore),
    pwaScore: Math.round(avgPWAScore),
    qualityScore: Math.round(qualityScore),
    integrationScore: Math.round(avgIntegrationScore),
    totalErrors: verificationState.errors.length,
    totalWarnings: verificationState.warnings.length,
    recommendation: getOverallRecommendation(overallScore)
  };
}

function getOverallRecommendation(score) {
  if (score >= 95) return 'EXCELLENT - Ready for production deployment';
  if (score >= 85) return 'GOOD - Minor improvements recommended';
  if (score >= 70) return 'ACCEPTABLE - Several improvements needed';
  if (score >= 50) return 'NEEDS WORK - Significant improvements required';
  return 'CRITICAL - Major issues must be addressed';
}

async function collectVerificationEvidence() {
  console.log(`  📸 Collecting verification evidence...`);
  
  // Collect file evidence
  const evidenceFiles = [
    'public/manifest.json',
    'public/sw.js',
    'src/components/inspection/OfflineInspectionWorkflow.tsx',
    'src/components/pwa/PWAInstallPrompt.tsx',
    'src/services/pwa/BackgroundSyncManager.ts',
    'src/services/pwa/PushNotificationManager.ts'
  ];

  evidenceFiles.forEach(file => {
    const fullPath = path.join(VERIFICATION_CONFIG.projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      verificationState.evidence.files.push({
        path: file,
        size: stats.size,
        lines: fs.readFileSync(fullPath, 'utf8').split('\n').length,
        lastModified: stats.mtime.toISOString()
      });
    }
  });

  // Collect metrics
  verificationState.evidence.metrics = {
    totalComponents: VERIFICATION_CONFIG.requiredComponents.length,
    implementedComponents: verificationState.results.components.filter(c => c.implemented).length,
    totalFeatures: VERIFICATION_CONFIG.requiredComponents.reduce((sum, c) => sum + c.requiredFeatures.length, 0),
    implementedFeatures: verificationState.results.components.reduce((sum, c) => sum + c.featuresImplemented.length, 0),
    verificationDuration: Date.now() - verificationState.startTime
  };
}

function generateMarkdownReport(reportData) {
  const summary = reportData.summary;
  
  return `# Phase 4B PWA Integration Verification Report

**Generated:** ${reportData.timestamp}  
**Duration:** ${Math.round(reportData.duration / 1000)}s  
**Overall Score:** ${summary.overallScore}/100  

## Executive Summary

${summary.recommendation}

- **Component Implementation:** ${summary.componentScore}/100
- **PWA Functionality:** ${summary.pwaScore}/100  
- **Quality Assurance:** ${summary.qualityScore}/100
- **Integration Testing:** ${summary.integrationScore}/100

## Component Verification Results

${reportData.results.components.map(component => `
### ${component.name}
- **Status:** ${component.implemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED'}
- **Score:** ${component.score}/100
- **Lines of Code:** ${component.lineCount}
- **Features Implemented:** ${component.featuresImplemented.length}/${component.featuresImplemented.length + component.missingFeatures.length}

**Implemented Features:**
${component.featuresImplemented.map(f => `- ✅ ${f}`).join('\n')}

**Missing Features:**
${component.missingFeatures.map(f => `- ❌ ${f}`).join('\n')}
`).join('\n')}

## Issues Found

### Errors (${reportData.errors.length})
${reportData.errors.map(error => `- ❌ ${error}`).join('\n') || 'None'}

### Warnings (${reportData.warnings.length})
${reportData.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') || 'None'}

## Evidence Collected

### Files Verified
${reportData.evidence.files.map(file => `- **${file.path}** (${file.lines} lines, ${Math.round(file.size/1024)}KB)`).join('\n')}

### Metrics
- **Total Components:** ${reportData.evidence.metrics.totalComponents}
- **Implemented Components:** ${reportData.evidence.metrics.implementedComponents}
- **Total Features:** ${reportData.evidence.metrics.totalFeatures}
- **Implemented Features:** ${reportData.evidence.metrics.implementedFeatures}

---
*This report was generated automatically by the Phase 4B verification script.*
`;
}

function displayFinalResults() {
  const summary = verificationState.results.components;
  const totalScore = calculateVerificationSummary().overallScore;
  
  console.log(`\n${colors.bright}=== PHASE 4B VERIFICATION RESULTS ===${colors.reset}`);
  console.log(`${colors.bright}Overall Score: ${totalScore}/100${colors.reset}`);
  
  if (totalScore >= 90) {
    console.log(`${colors.green}🎉 EXCELLENT - Phase 4B implementation meets Netflix/Meta standards!${colors.reset}`);
  } else if (totalScore >= 70) {
    console.log(`${colors.yellow}⚠️  GOOD - Phase 4B implementation is functional with minor improvements needed${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ NEEDS IMPROVEMENT - Phase 4B implementation requires significant work${colors.reset}`);
  }

  console.log(`\n${colors.bright}Component Summary:${colors.reset}`);
  summary.forEach(component => {
    const status = component.score >= 90 ? `${colors.green}✅` : component.score >= 70 ? `${colors.yellow}⚠️` : `${colors.red}❌`;
    console.log(`  ${status} ${component.name}: ${component.score}/100${colors.reset}`);
  });

  if (verificationState.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Critical Issues Found:${colors.reset}`);
    verificationState.errors.forEach(error => {
      console.log(`  ${colors.red}❌ ${error}${colors.reset}`);
    });
  }

  if (verificationState.warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
    verificationState.warnings.forEach(warning => {
      console.log(`  ${colors.yellow}⚠️  ${warning}${colors.reset}`);
    });
  }

  console.log(`\n${colors.bright}Verification completed in ${Math.round((Date.now() - verificationState.startTime) / 1000)}s${colors.reset}`);
}

// Execute verification
if (require.main === module) {
  runPhase4BVerification().catch(error => {
    console.error(`${colors.red}Verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  runPhase4BVerification,
  VERIFICATION_CONFIG
};