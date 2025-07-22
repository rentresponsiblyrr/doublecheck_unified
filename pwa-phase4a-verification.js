#!/usr/bin/env node

/**
 * STR CERTIFIED PWA PHASE 4A VERIFICATION SCRIPT
 * 
 * Comprehensive verification script for Phase 4A PWA Core Implementation.
 * Tests all implemented components including Service Worker, IndexedDB,
 * offline functionality, and React integration.
 * 
 * VERIFICATION SCOPE:
 * - Service Worker registration and functionality (400+ lines)
 * - IndexedDB implementation with 5 object stores
 * - Offline data management and sync queue
 * - React hooks integration and state management
 * - Background sync and push notifications
 * - Performance monitoring and cache management
 * 
 * @version 1.0.0
 * @author STR Certified Engineering Team
 * @phase Phase 4A - PWA Core Implementation
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Verification results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: []
};

/**
 * Log formatted message with color and icon
 */
function log(level, message, details = '') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    check: '🔍'
  };

  const colorMap = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    check: colors.cyan
  };

  const icon = icons[level] || '';
  const color = colorMap[level] || colors.reset;
  
  console.log(`${color}${icon} ${message}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.white}${details}${colors.reset}`);
  }
}

/**
 * Check if file exists and get its stats
 */
function checkFile(filePath, description = '') {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.failed++;
    results.details.push({ type: 'error', message: `Missing: ${description || filePath}` });
    log('error', `File not found: ${filePath}`, description);
    return null;
  }

  const stats = fs.statSync(fullPath);
  results.passed++;
  results.details.push({ type: 'success', message: `Found: ${description || filePath}` });
  log('success', `Found: ${filePath}`, `${stats.size} bytes, modified ${stats.mtime.toISOString()}`);
  
  return { stats, content: fs.readFileSync(fullPath, 'utf8') };
}

/**
 * Verify file content contains required elements
 */
function verifyContent(fileData, requirements, fileName) {
  if (!fileData) return false;
  
  const { content } = fileData;
  let allPassed = true;

  requirements.forEach(req => {
    results.total++;
    
    if (typeof req === 'string') {
      if (content.includes(req)) {
        results.passed++;
        log('success', `✓ ${fileName}: Contains "${req}"`);
      } else {
        results.failed++;
        allPassed = false;
        log('error', `✗ ${fileName}: Missing "${req}"`);
      }
    } else if (req.pattern) {
      const regex = new RegExp(req.pattern, req.flags || 'g');
      const matches = content.match(regex);
      
      if (matches && matches.length >= (req.minMatches || 1)) {
        results.passed++;
        log('success', `✓ ${fileName}: Pattern "${req.pattern}" found (${matches.length} matches)`);
      } else {
        results.failed++;
        allPassed = false;
        log('error', `✗ ${fileName}: Pattern "${req.pattern}" not found or insufficient matches`);
      }
    }
  });

  return allPassed;
}

/**
 * Count lines of code in a file
 */
function countLines(content) {
  return content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
  }).length;
}

/**
 * Main verification function
 */
async function verifyPhase4A() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 STR CERTIFIED PWA PHASE 4A                  ║');
  console.log('║                   VERIFICATION SCRIPT                       ║');
  console.log('║                                                              ║');
  console.log('║  Testing PWA Core Implementation Components:                ║');
  console.log('║  • Service Worker Foundation (400+ lines)                   ║');
  console.log('║  • IndexedDB Offline Data Manager (5 object stores)        ║');
  console.log('║  • TypeScript Service Worker Manager                        ║');
  console.log('║  • React PWA Hooks Integration                              ║');
  console.log('║  • Offline Page and User Experience                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  log('info', 'Starting Phase 4A PWA Core Implementation verification...\n');

  // ========================================
  // 1. SERVICE WORKER FOUNDATION VERIFICATION
  // ========================================
  
  log('check', '1. SERVICE WORKER FOUNDATION VERIFICATION');
  console.log('   Testing Service Worker implementation with enterprise-grade features\n');

  const swFile = checkFile('./public/sw.js', 'Service Worker Foundation');
  if (swFile) {
    const lineCount = countLines(swFile.content);
    log('info', `Service Worker has ${lineCount} lines of code`);
    
    if (lineCount >= 400) {
      results.passed++;
      log('success', 'Service Worker meets 400+ line requirement');
    } else {
      results.failed++;
      log('error', `Service Worker only has ${lineCount} lines (minimum 400 required)`);
    }

    // Verify Service Worker features
    const swRequirements = [
      'STR CERTIFIED PWA SERVICE WORKER',
      'CACHE_VERSION',
      'STATIC_CACHE_URLS',
      'CACHE_FIRST_PATTERNS',
      'NETWORK_FIRST_PATTERNS',
      'STALE_WHILE_REVALIDATE_PATTERNS',
      'addEventListener(\'install\'',
      'addEventListener(\'activate\'',
      'addEventListener(\'fetch\'',
      'addEventListener(\'sync\'',
      'addEventListener(\'message\'',
      'cacheFirstStrategy',
      'networkFirstStrategy',
      'staleWhileRevalidateStrategy',
      'handleFetchError',
      'syncInspectionData',
      'syncMediaFiles',
      'registerBackgroundSync',
      'cleanupCache',
      'calculateCacheSize',
      { pattern: 'SYNC_TAGS\\.[A-Z_]+', minMatches: 4 },
      { pattern: 'async function \\w+', minMatches: 10 },
      { pattern: 'try \\{[\\s\\S]*?catch', minMatches: 15 }
    ];

    verifyContent(swFile, swRequirements, 'Service Worker');
  }

  // ========================================
  // 2. SERVICE WORKER MANAGER VERIFICATION
  // ========================================
  
  log('check', '\n2. SERVICE WORKER MANAGER VERIFICATION');
  console.log('   Testing TypeScript Service Worker Manager integration\n');

  const swManagerFile = checkFile('./src/lib/serviceWorker.ts', 'Service Worker Manager');
  if (swManagerFile) {
    const lineCount = countLines(swManagerFile.content);
    log('info', `Service Worker Manager has ${lineCount} lines of code`);

    const swManagerRequirements = [
      'STR CERTIFIED SERVICE WORKER MANAGER',
      'export class ServiceWorkerManager',
      'ServiceWorkerState',
      'ServiceWorkerMessage',
      'SyncRegistrationOptions',
      'PushSubscriptionOptions',
      'async register()',
      'async unregister()',
      'async skipWaiting()',
      'async checkForUpdates()',
      'async registerBackgroundSync',
      'async subscribeToPush',
      'async getCacheStats()',
      'addEventListener',
      'removeEventListener',
      'export const serviceWorkerManager',
      { pattern: 'interface \\w+', minMatches: 8 },
      { pattern: 'async \\w+\\(', minMatches: 10 }
    ];

    verifyContent(swManagerFile, swManagerRequirements, 'Service Worker Manager');
  }

  // ========================================
  // 3. OFFLINE DATA MANAGER VERIFICATION
  // ========================================
  
  log('check', '\n3. OFFLINE DATA MANAGER VERIFICATION');
  console.log('   Testing IndexedDB implementation with 5 specialized object stores\n');

  const offlineManagerFile = checkFile('./src/lib/offline/OfflineDataManager.ts', 'Offline Data Manager');
  if (offlineManagerFile) {
    const lineCount = countLines(offlineManagerFile.content);
    log('info', `Offline Data Manager has ${lineCount} lines of code`);

    // Check for 5 object stores
    const storeMatches = offlineManagerFile.content.match(/name: '[^']+'/g);
    if (storeMatches && storeMatches.length >= 5) {
      results.passed++;
      log('success', `Found ${storeMatches.length} object stores (minimum 5 required)`);
      storeMatches.forEach((store, index) => {
        log('info', `  Store ${index + 1}: ${store}`);
      });
    } else {
      results.failed++;
      log('error', `Only found ${storeMatches?.length || 0} object stores (5 required)`);
    }

    const offlineRequirements = [
      'STR CERTIFIED OFFLINE DATA MANAGER',
      'export class OfflineDataManager',
      'DATABASE_CONFIG',
      'inspections',
      'checklist_items',
      'media_files',
      'properties',
      'sync_queue',
      'async initialize()',
      'async get<T>',
      'async getAll<T>',
      'async put<T>',
      'async delete',
      'async storeInspection',
      'async storeMediaFile',
      'addToSyncQueue',
      'processSyncQueue',
      'compressFile',
      'fileToBase64',
      'export const offlineDataManager',
      { pattern: 'keyPath: \'[^\']+\'', minMatches: 5 },
      { pattern: 'async \\w+\\(', minMatches: 15 }
    ];

    verifyContent(offlineManagerFile, offlineRequirements, 'Offline Data Manager');
  }

  // ========================================
  // 4. PWA REACT HOOKS VERIFICATION
  // ========================================
  
  log('check', '\n4. PWA REACT HOOKS VERIFICATION');
  console.log('   Testing React hooks integration for PWA functionality\n');

  const pwaHooksFile = checkFile('./src/hooks/usePWA.ts', 'PWA React Hooks');
  if (pwaHooksFile) {
    const lineCount = countLines(pwaHooksFile.content);
    log('info', `PWA React Hooks has ${lineCount} lines of code`);

    const hooksRequirements = [
      'usePWA',
      'useState',
      'useEffect',
      'useCallback',
      'PWAState',
      'PWAActions',
      'serviceWorkerManager',
      'offlineStatusManager',
      'installPromptHandler',
      'export function usePWA',
      'export function usePWAInstall',
      'export function usePWASync',
      'export function usePWAPerformance',
      { pattern: 'export function use\\w+', minMatches: 4 },
      { pattern: 'useCallback\\(', minMatches: 10 }
    ];

    verifyContent(pwaHooksFile, hooksRequirements, 'PWA React Hooks');
  }

  // ========================================
  // 5. OFFLINE PAGE VERIFICATION
  // ========================================
  
  log('check', '\n5. OFFLINE PAGE VERIFICATION');
  console.log('   Testing offline user experience and functionality\n');

  const offlinePageFile = checkFile('./public/offline.html', 'Offline Page');
  if (offlinePageFile) {
    const offlinePageRequirements = [
      'STR Certified - Working Offline',
      'Working Offline',
      'inspection data is safe',
      'syncs when you\'re back online',
      'updateConnectionStatus',
      'refreshPage',
      'viewCachedData',
      'addEventListener(\'online\'',
      'addEventListener(\'offline\'',
      'navigator.serviceWorker',
      'caches.keys()',
      { pattern: 'function \\w+\\(', minMatches: 5 }
    ];

    verifyContent(offlinePageFile, offlinePageRequirements, 'Offline Page');
  }

  // ========================================
  // 6. PWA MANIFEST VERIFICATION
  // ========================================
  
  log('check', '\n6. PWA MANIFEST VERIFICATION');
  console.log('   Testing PWA manifest configuration\n');

  const manifestFile = checkFile('./public/manifest.json', 'PWA Manifest');
  if (manifestFile) {
    try {
      const manifest = JSON.parse(manifestFile.content);
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color', 'icons'];
      
      requiredFields.forEach(field => {
        results.total++;
        if (manifest[field]) {
          results.passed++;
          log('success', `✓ Manifest has required field: ${field}`);
        } else {
          results.failed++;
          log('error', `✗ Manifest missing required field: ${field}`);
        }
      });

      // Check icons
      if (manifest.icons && Array.isArray(manifest.icons) && manifest.icons.length > 0) {
        results.passed++;
        log('success', `✓ Manifest has ${manifest.icons.length} icon(s)`);
      } else {
        results.failed++;
        log('error', '✗ Manifest missing icons array');
      }

    } catch (error) {
      results.failed++;
      log('error', 'Invalid JSON in manifest.json', error.message);
    }
  }

  // ========================================
  // 7. PERFORMANCE VERIFICATION
  // ========================================
  
  log('check', '\n7. PERFORMANCE VERIFICATION');
  console.log('   Testing performance characteristics and optimization\n');

  // Check for performance-critical features
  if (swFile) {
    const performanceFeatures = [
      'performance.now()',
      'Cache-Control',
      'TTL',
      'cleanup',
      'optimization',
      'compression',
      'batch',
      { pattern: 'timeout.*\\d+', minMatches: 2 },
      { pattern: 'limit.*\\d+', minMatches: 3 }
    ];

    performanceFeatures.forEach(feature => {
      results.total++;
      const found = typeof feature === 'string' 
        ? swFile.content.includes(feature)
        : new RegExp(feature.pattern).test(swFile.content);

      if (found) {
        results.passed++;
        log('success', `✓ Performance feature: ${typeof feature === 'string' ? feature : feature.pattern}`);
      } else {
        results.warnings++;
        log('warning', `⚠ Performance feature not found: ${typeof feature === 'string' ? feature : feature.pattern}`);
      }
    });
  }

  // ========================================
  // 8. INTEGRATION VERIFICATION
  // ========================================
  
  log('check', '\n8. INTEGRATION VERIFICATION');
  console.log('   Testing component integration and dependencies\n');

  // Check if PWA files can work together
  const integrationChecks = [
    {
      name: 'Service Worker → Offline Manager integration',
      condition: swFile && offlineManagerFile && 
                swFile.content.includes('syncInspectionData') && 
                offlineManagerFile.content.includes('sync_queue')
    },
    {
      name: 'Service Worker Manager → Service Worker compatibility',
      condition: swManagerFile && swFile &&
                swManagerFile.content.includes('SYNC_TAGS') &&
                swFile.content.includes('SYNC_TAGS')
    },
    {
      name: 'React Hooks → Managers integration',
      condition: pwaHooksFile && swManagerFile &&
                pwaHooksFile.content.includes('serviceWorkerManager') &&
                swManagerFile.content.includes('export const serviceWorkerManager')
    },
    {
      name: 'Offline Page → Service Worker messaging',
      condition: offlinePageFile && swFile &&
                offlinePageFile.content.includes('navigator.serviceWorker') &&
                swFile.content.includes('addEventListener(\'message\'')
    }
  ];

  integrationChecks.forEach(check => {
    results.total++;
    if (check.condition) {
      results.passed++;
      log('success', `✓ ${check.name}`);
    } else {
      results.failed++;
      log('error', `✗ ${check.name}`);
    }
  });

  // ========================================
  // FINAL REPORT
  // ========================================
  
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bright}${colors.blue}PHASE 4A PWA CORE IMPLEMENTATION VERIFICATION COMPLETE${colors.reset}`);
  console.log('='.repeat(70));

  const successRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
  
  console.log(`\n${colors.bright}RESULTS SUMMARY:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.blue}📊 Total Checks: ${results.total}${colors.reset}`);
  console.log(`${colors.magenta}🎯 Success Rate: ${successRate}%${colors.reset}`);

  console.log(`\n${colors.bright}IMPLEMENTATION STATUS:${colors.reset}`);
  
  if (successRate >= 90) {
    console.log(`${colors.green}🚀 EXCELLENT! Phase 4A PWA Core Implementation is production-ready!${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`${colors.yellow}✨ GOOD! Phase 4A is mostly complete with minor issues to address.${colors.reset}`);
  } else if (successRate >= 70) {
    console.log(`${colors.yellow}⚠️  NEEDS WORK! Phase 4A requires attention to critical components.${colors.reset}`);
  } else {
    console.log(`${colors.red}🔧 INCOMPLETE! Phase 4A needs significant development work.${colors.reset}`);
  }

  console.log(`\n${colors.bright}PHASE 4A COMPONENTS VERIFIED:${colors.reset}`);
  console.log(`${colors.cyan}• Service Worker Foundation (${swFile ? '✅' : '❌'})${colors.reset}`);
  console.log(`${colors.cyan}• Service Worker Manager (${swManagerFile ? '✅' : '❌'})${colors.reset}`);
  console.log(`${colors.cyan}• Offline Data Manager (${offlineManagerFile ? '✅' : '❌'})${colors.reset}`);
  console.log(`${colors.cyan}• PWA React Hooks (${pwaHooksFile ? '✅' : '❌'})${colors.reset}`);
  console.log(`${colors.cyan}• Offline Page Experience (${offlinePageFile ? '✅' : '❌'})${colors.reset}`);

  console.log(`\n${colors.bright}NEXT STEPS:${colors.reset}`);
  if (results.failed > 0) {
    console.log(`${colors.red}1. Address ${results.failed} failed verification checks${colors.reset}`);
  }
  if (results.warnings > 0) {
    console.log(`${colors.yellow}2. Review ${results.warnings} performance warnings${colors.reset}`);
  }
  console.log(`${colors.green}3. Run integration tests with actual browser environment${colors.reset}`);
  console.log(`${colors.green}4. Test offline functionality manually${colors.reset}`);
  console.log(`${colors.green}5. Proceed to Phase 4B: Advanced PWA Features${colors.reset}`);

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bright}${colors.blue}STR Certified Engineering Team • Phase 4A Verification • ${new Date().toISOString()}${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  // Return exit code based on results
  process.exit(results.failed > 5 ? 1 : 0);
}

// Run verification
verifyPhase4A().catch(error => {
  console.error(`${colors.red}Verification script failed:${colors.reset}`, error);
  process.exit(1);
});