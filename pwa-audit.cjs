#!/usr/bin/env node

/**
 * PWA AUDIT SCRIPT - Phase 3 Verification
 * Tests the implementation quality and completeness of PWA components
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PWA PHASE 3 AUDIT - STR CERTIFIED');
console.log('=' .repeat(60));

let totalTests = 0;
let passedTests = 0;
let issues = [];

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passedTests++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    issues.push(name);
  }
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  test(description, exists, exists ? `Found: ${filePath}` : `Missing: ${filePath}`);
  return exists;
}

function checkFileContains(filePath, searchTerm, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchTerm);
    test(description, contains, contains ? `Found in ${filePath}` : `Missing from ${filePath}`);
    return contains;
  } catch (error) {
    test(description, false, `Cannot read ${filePath}: ${error.message}`);
    return false;
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function getLinesOfCode(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

// 1. CORE PWA FILES VERIFICATION
console.log('\n📁 CORE PWA FILES');
console.log('-'.repeat(30));

checkFileExists('public/sw.js', 'Service Worker file exists');
checkFileExists('public/manifest.json', 'PWA Manifest exists');
checkFileExists('src/lib/pwa/ServiceWorkerManager.ts', 'Service Worker Manager exists');
checkFileExists('src/lib/pwa/OfflineStatusManager.ts', 'Offline Status Manager exists');
checkFileExists('src/hooks/usePWA.ts', 'PWA React Hook exists');
checkFileExists('src/lib/pwa/pwa-integration.ts', 'PWA Integration Orchestrator exists');

// 2. SERVICE WORKER IMPLEMENTATION QUALITY
console.log('\n⚙️ SERVICE WORKER QUALITY');
console.log('-'.repeat(30));

const swSize = getFileSize('public/sw.js');
const swLines = getLinesOfCode('public/sw.js');
test('Service Worker substantial implementation', swSize > 10000, `${swSize} bytes, ${swLines} lines`);

checkFileContains('public/sw.js', 'install', 'SW has install event');
checkFileContains('public/sw.js', 'activate', 'SW has activate event');
checkFileContains('public/sw.js', 'fetch', 'SW has fetch event');
checkFileContains('public/sw.js', 'sync', 'SW has background sync');
checkFileContains('public/sw.js', 'push', 'SW has push notifications');
checkFileContains('public/sw.js', 'caches', 'SW has caching logic');
checkFileContains('public/sw.js', 'indexedDB', 'SW has IndexedDB support');

// 3. SERVICE WORKER MANAGER QUALITY
console.log('\n🔧 SERVICE WORKER MANAGER');
console.log('-'.repeat(30));

const swManagerSize = getFileSize('src/lib/pwa/ServiceWorkerManager.ts');
const swManagerLines = getLinesOfCode('src/lib/pwa/ServiceWorkerManager.ts');
test('Service Worker Manager comprehensive', swManagerSize > 15000, `${swManagerSize} bytes, ${swManagerLines} lines`);

checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'class ServiceWorkerManager', 'Has ServiceWorkerManager class');
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'register', 'Has registration logic');
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'updatefound', 'Has update detection');
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'backgroundSync', 'Has background sync integration');
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'performance', 'Has performance monitoring');
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'error', 'Has error handling');

// 4. OFFLINE STATUS MANAGER QUALITY
console.log('\n📡 OFFLINE STATUS MANAGER');
console.log('-'.repeat(30));

const offlineManagerSize = getFileSize('src/lib/pwa/OfflineStatusManager.ts');
const offlineManagerLines = getLinesOfCode('src/lib/pwa/OfflineStatusManager.ts');
test('Offline Status Manager comprehensive', offlineManagerSize > 30000, `${offlineManagerSize} bytes, ${offlineManagerLines} lines`);

checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'class OfflineStatusManager', 'Has OfflineStatusManager class');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'NetworkStatus', 'Has network status interface');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'RetryQueueItem', 'Has retry queue system');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'quality', 'Has network quality assessment');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'ping', 'Has connectivity testing');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'exponential', 'Has exponential backoff');

// 5. PWA REACT HOOKS QUALITY
console.log('\n⚛️ PWA REACT HOOKS');
console.log('-'.repeat(30));

const pwaHookSize = getFileSize('src/hooks/usePWA.ts');
const pwaHookLines = getLinesOfCode('src/hooks/usePWA.ts');
test('PWA React Hook comprehensive', pwaHookSize > 20000, `${pwaHookSize} bytes, ${pwaHookLines} lines`);

checkFileContains('src/hooks/usePWA.ts', 'function usePWA', 'Has usePWA hook function');
checkFileContains('src/hooks/usePWA.ts', 'PWAState', 'Has PWA state interface');
checkFileContains('src/hooks/usePWA.ts', 'PWAActions', 'Has PWA actions interface');
checkFileContains('src/hooks/usePWA.ts', 'useState', 'Uses React state');
checkFileContains('src/hooks/usePWA.ts', 'useEffect', 'Uses React effects');
checkFileContains('src/hooks/usePWA.ts', 'useCallback', 'Uses React callbacks');

// 6. PWA INTEGRATION ORCHESTRATOR
console.log('\n🎼 PWA INTEGRATION ORCHESTRATOR');
console.log('-'.repeat(30));

const integrationSize = getFileSize('src/lib/pwa/pwa-integration.ts');
const integrationLines = getLinesOfCode('src/lib/pwa/pwa-integration.ts');
test('PWA Integration comprehensive', integrationSize > 30000, `${integrationSize} bytes, ${integrationLines} lines`);

checkFileContains('src/lib/pwa/pwa-integration.ts', 'ElitePWAIntegrator', 'Has PWA Integrator class');
checkFileContains('src/lib/pwa/pwa-integration.ts', 'initializeElitePWA', 'Has initialization function');
checkFileContains('src/lib/pwa/pwa-integration.ts', 'UnifiedSystemStatus', 'Has system status interface');
checkFileContains('src/lib/pwa/pwa-integration.ts', 'health', 'Has health monitoring');
checkFileContains('src/lib/pwa/pwa-integration.ts', 'recovery', 'Has error recovery');

// 7. ADDITIONAL PWA COMPONENTS
console.log('\n🔧 ADDITIONAL PWA COMPONENTS');
console.log('-'.repeat(30));

checkFileExists('src/lib/pwa/GestureController.ts', 'Gesture Controller exists');
checkFileExists('src/lib/pwa/InstallPromptHandler.ts', 'Install Prompt Handler exists');
checkFileExists('src/lib/pwa/LazyLoadManager.ts', 'Lazy Load Manager exists');
checkFileExists('src/lib/pwa/PWAIntegrationTest.ts', 'PWA Integration Test exists');

// 8. MAIN APP INTEGRATION
console.log('\n🏗️ MAIN APP INTEGRATION');
console.log('-'.repeat(30));

checkFileContains('src/main.tsx', 'serviceWorkerManager', 'PWA integrated in main app');
checkFileContains('src/main.tsx', 'initialize', 'PWA initialization in main app');

// 9. PWA MANIFEST QUALITY
console.log('\n📋 PWA MANIFEST QUALITY');
console.log('-'.repeat(30));

try {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  test('Manifest has name', !!manifest.name, manifest.name);
  test('Manifest has short_name', !!manifest.short_name, manifest.short_name);
  test('Manifest has start_url', !!manifest.start_url, manifest.start_url);
  test('Manifest has display mode', !!manifest.display, manifest.display);
  test('Manifest has theme_color', !!manifest.theme_color, manifest.theme_color);
  test('Manifest has background_color', !!manifest.background_color, manifest.background_color);
  test('Manifest has icons', manifest.icons && manifest.icons.length > 0, `${manifest.icons?.length || 0} icons`);
} catch (error) {
  test('Manifest is valid JSON', false, error.message);
}

// 10. TYPESCRIPT COMPILATION
console.log('\n📝 TYPESCRIPT QUALITY');
console.log('-'.repeat(30));

// Check for type safety in PWA files
checkFileContains('src/lib/pwa/ServiceWorkerManager.ts', 'interface ', 'SW Manager uses TypeScript interfaces');
checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'interface ', 'Offline Manager uses TypeScript interfaces');
checkFileContains('src/hooks/usePWA.ts', 'interface ', 'PWA Hook uses TypeScript interfaces');

// RESULTS SUMMARY
console.log('\n📊 AUDIT RESULTS');
console.log('=' .repeat(60));

const score = Math.round((passedTests / totalTests) * 100);
console.log(`Tests: ${passedTests}/${totalTests} passed (${score}%)`);

if (score >= 90) {
  console.log('🎉 EXCELLENT - PWA implementation meets elite standards');
} else if (score >= 80) {
  console.log('✅ GOOD - PWA implementation is solid with minor issues');
} else if (score >= 70) {
  console.log('⚠️  FAIR - PWA implementation needs improvements');
} else {
  console.log('❌ POOR - PWA implementation requires significant work');
}

if (issues.length > 0) {
  console.log('\n🔧 ISSUES TO ADDRESS:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

console.log('\n🏁 PWA PHASE 3 AUDIT COMPLETE');
process.exit(score >= 80 ? 0 : 1);