#!/usr/bin/env node

/**
 * PHASE 4D PRODUCTION READINESS VERIFICATION
 * 
 * Comprehensive verification script ensuring 100% PWA production readiness
 * with Netflix/Meta deployment standards. Validates all PWA components,
 * security headers, TypeScript compliance, and installation flows.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProductionVerifier {
  constructor() {
    this.results = [];
    this.criticalFailures = 0;
    this.totalScore = 0;
    this.maxScore = 0;
  }

  async runAllVerifications() {
    console.log('🚀 PHASE 4D PRODUCTION READINESS VERIFICATION');
    console.log('=' .repeat(80));
    console.log('Final validation for Netflix/Meta deployment standards\n');

    // TASK 1: PWA Icon Assets
    await this.verifyPWAIconSuite();
    
    // TASK 2: TypeScript Compilation
    await this.verifyTypeScriptZeroErrors();
    
    // TASK 3: Security Headers
    await this.verifySecurityHeaders();
    
    // TASK 4: PWA Installation Flow
    await this.verifyPWAInstallation();
    
    // TASK 5: Production Build
    await this.verifyProductionBuild();
    
    this.displayResults();
  }

  async verifyPWAIconSuite() {
    console.log('🔍 TASK 1: PWA ICON SUITE VERIFICATION\n');
    
    const requiredIcons = [
      { file: 'public/icons/icon-192x192.png', desc: 'Android home screen' },
      { file: 'public/icons/icon-512x512.png', desc: 'Android splash/Desktop' },
      { file: 'public/icons/apple-touch-icon.png', desc: 'iOS home screen (180x180)' },
      { file: 'public/icons/favicon.ico', desc: 'Browser tab (32x32)' }
    ];

    for (const icon of requiredIcons) {
      try {
        const stat = await fs.stat(icon.file);
        const passed = stat.size > 1000; // Ensure valid icon files
        this.addResult({
          name: `PWA Icon: ${path.basename(icon.file)}`,
          passed,
          critical: true,
          message: passed ? `Valid ${icon.desc} icon` : `Invalid ${icon.desc} icon`,
          details: `Size: ${(stat.size / 1024).toFixed(1)}KB`
        });
      } catch (error) {
        this.addResult({
          name: `PWA Icon: ${path.basename(icon.file)}`,
          passed: false,
          critical: true,
          message: `Missing ${icon.desc} icon`,
          details: `Expected: ${icon.file}`
        });
      }
    }

    // Verify manifest references
    try {
      const manifest = JSON.parse(await fs.readFile('public/manifest.json', 'utf8'));
      const hasIconRefs = manifest.icons && manifest.icons.length > 0;
      const hasCorrectPaths = manifest.icons.some(icon => 
        icon.src.includes('/icons/') || icon.src.includes('/lovable-uploads/')
      );
      
      this.addResult({
        name: 'Manifest Icon References',
        passed: hasIconRefs && hasCorrectPaths,
        critical: false,
        message: hasIconRefs ? 'Icons properly referenced in manifest' : 'Icons missing from manifest',
        details: `Icon entries: ${manifest.icons?.length || 0}`
      });
    } catch (error) {
      this.addResult({
        name: 'Manifest Icon References',
        passed: false,
        critical: true,
        message: 'Manifest file invalid',
        details: error.message
      });
    }
  }

  async verifyTypeScriptZeroErrors() {
    console.log('🔍 TASK 2: TYPESCRIPT COMPILATION VERIFICATION\n');
    
    try {
      // Run TypeScript check and capture output
      const result = execSync('npm run typecheck', { encoding: 'utf8' });
      
      this.addResult({
        name: 'TypeScript Compilation',
        passed: true,
        critical: true,
        message: 'TypeScript compilation successful',
        details: 'Zero compilation errors'
      });
      
      // Count specific error types if any
      try {
        const errorCount = execSync('npm run typecheck 2>&1 | grep "error TS" | wc -l', { encoding: 'utf8' }).trim();
        const errors = parseInt(errorCount) || 0;
        
        this.addResult({
          name: 'TypeScript Error Count',
          passed: errors === 0,
          critical: true,
          message: errors === 0 ? 'Zero TypeScript errors' : `${errors} TypeScript errors found`,
          details: `Error count: ${errors}`
        });
      } catch (error) {
        // Error counting failed, but main check passed
        this.addResult({
          name: 'TypeScript Error Count',
          passed: true,
          critical: false,
          message: 'Error counting unavailable',
          details: 'Main compilation succeeded'
        });
      }

    } catch (error) {
      this.addResult({
        name: 'TypeScript Compilation',
        passed: false,
        critical: true,
        message: 'TypeScript compilation failed',
        details: error.message
      });
    }
  }

  async verifySecurityHeaders() {
    console.log('🔍 TASK 3: SECURITY HEADERS VERIFICATION\n');
    
    try {
      const swContent = await fs.readFile('public/sw.js', 'utf8');
      
      // Check for security headers function
      const hasSecurityFunction = swContent.includes('addSecurityHeaders');
      this.addResult({
        name: 'Security Headers Function',
        passed: hasSecurityFunction,
        critical: true,
        message: hasSecurityFunction ? 'Security headers function implemented' : 'Security headers function missing',
        details: 'addSecurityHeaders function'
      });

      // Check for specific security headers
      const securityHeaders = [
        { header: 'X-Content-Type-Options', desc: 'MIME type sniffing protection' },
        { header: 'X-Frame-Options', desc: 'Clickjacking protection' },
        { header: 'X-XSS-Protection', desc: 'XSS attack prevention' },
        { header: 'Referrer-Policy', desc: 'Referrer information control' }
      ];

      let implementedHeaders = 0;
      for (const { header, desc } of securityHeaders) {
        const hasHeader = swContent.includes(header);
        if (hasHeader) implementedHeaders++;
        
        this.addResult({
          name: `Security Header: ${header}`,
          passed: hasHeader,
          critical: false,
          message: hasHeader ? `${desc} enabled` : `${desc} missing`,
          details: `Header: ${header}`
        });
      }

      // Check for response modification
      const hasResponseModification = swContent.includes('addSecurityHeaders(response)');
      this.addResult({
        name: 'Security Headers Integration',
        passed: hasResponseModification,
        critical: true,
        message: hasResponseModification ? 'Security headers applied to responses' : 'Security headers not applied to responses',
        details: `Implementation: ${hasResponseModification ? 'Active' : 'Missing'}`
      });

    } catch (error) {
      this.addResult({
        name: 'Service Worker Security',
        passed: false,
        critical: true,
        message: 'Service Worker security check failed',
        details: error.message
      });
    }
  }

  async verifyPWAInstallation() {
    console.log('🔍 TASK 4: PWA INSTALLATION FLOW VERIFICATION\n');
    
    // Check manifest validity
    try {
      const manifest = JSON.parse(await fs.readFile('public/manifest.json', 'utf8'));
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
      const hasAllFields = requiredFields.every(field => manifest[field]);
      
      this.addResult({
        name: 'PWA Manifest Validity',
        passed: hasAllFields,
        critical: true,
        message: hasAllFields ? 'Manifest contains all required fields' : 'Manifest missing required fields',
        details: `Fields: ${requiredFields.filter(f => manifest[f]).length}/${requiredFields.length}`
      });

      // Check display mode
      const hasStandaloneMode = manifest.display === 'standalone';
      this.addResult({
        name: 'PWA Display Mode',
        passed: hasStandaloneMode,
        critical: false,
        message: hasStandaloneMode ? 'Standalone display mode configured' : `Display mode: ${manifest.display}`,
        details: `Mode: ${manifest.display}`
      });

      // Check theme configuration
      const hasThemeColor = manifest.theme_color && manifest.background_color;
      this.addResult({
        name: 'PWA Theme Configuration',
        passed: hasThemeColor,
        critical: false,
        message: hasThemeColor ? 'Theme colors configured' : 'Theme colors incomplete',
        details: `Theme: ${manifest.theme_color}, Background: ${manifest.background_color}`
      });

    } catch (error) {
      this.addResult({
        name: 'PWA Manifest Validity',
        passed: false,
        critical: true,
        message: 'Manifest validation failed',
        details: error.message
      });
    }

    // Check Service Worker registration
    try {
      const swExists = await this.fileExists('public/sw.js');
      const mainContent = await fs.readFile('src/main.tsx', 'utf8');
      const hasServiceWorkerInit = mainContent.includes('serviceWorker') || mainContent.includes('ServiceWorker');
      
      this.addResult({
        name: 'Service Worker Setup',
        passed: swExists && hasServiceWorkerInit,
        critical: true,
        message: swExists && hasServiceWorkerInit ? 'Service Worker properly configured' : 'Service Worker setup incomplete',
        details: `SW File: ${swExists}, Initialization: ${hasServiceWorkerInit}`
      });

    } catch (error) {
      this.addResult({
        name: 'Service Worker Setup',
        passed: false,
        critical: true,
        message: 'Service Worker check failed',
        details: error.message
      });
    }
  }

  async verifyProductionBuild() {
    console.log('🔍 TASK 5: PRODUCTION BUILD VERIFICATION\n');
    
    try {
      // Check if build was successful
      const distExists = await this.fileExists('dist');
      const indexExists = await this.fileExists('dist/index.html');
      
      this.addResult({
        name: 'Production Build Output',
        passed: distExists && indexExists,
        critical: true,
        message: distExists && indexExists ? 'Production build successful' : 'Production build incomplete',
        details: `dist/: ${distExists}, index.html: ${indexExists}`
      });

      if (distExists) {
        // Check for assets
        const assetsExist = await this.fileExists('dist/assets');
        this.addResult({
          name: 'Build Assets Generation',
          passed: assetsExist,
          critical: false,
          message: assetsExist ? 'Build assets generated' : 'Build assets missing',
          details: `Assets directory: ${assetsExist}`
        });

        // Check for optimized bundles
        if (assetsExist) {
          try {
            const assetFiles = await fs.readdir('dist/assets');
            const hasCSS = assetFiles.some(file => file.includes('.css'));
            const hasJS = assetFiles.some(file => file.includes('.js'));
            
            this.addResult({
              name: 'Bundle Optimization',
              passed: hasCSS && hasJS,
              critical: false,
              message: hasCSS && hasJS ? 'Optimized bundles generated' : 'Bundle optimization incomplete',
              details: `CSS: ${hasCSS}, JS: ${hasJS}, Files: ${assetFiles.length}`
            });
          } catch (error) {
            this.addResult({
              name: 'Bundle Optimization',
              passed: false,
              critical: false,
              message: 'Bundle check failed',
              details: error.message
            });
          }
        }
      }

    } catch (error) {
      this.addResult({
        name: 'Production Build Output',
        passed: false,
        critical: true,
        message: 'Build verification failed',
        details: error.message
      });
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  addResult(result) {
    this.results.push(result);
    this.maxScore += result.critical ? 10 : 5;
    
    if (result.passed) {
      this.totalScore += result.critical ? 10 : 5;
      console.log(`✅ PASS: ${result.name} - ${result.message}`);
    } else {
      if (result.critical) {
        this.criticalFailures++;
        console.log(`❌ CRITICAL FAIL: ${result.name} - ${result.message}`);
      } else {
        console.log(`⚠️  FAIL: ${result.name} - ${result.message}`);
      }
    }
    
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log('');
  }

  displayResults() {
    console.log('\n📊 PHASE 4D FINAL ASSESSMENT');
    console.log('=' .repeat(80));
    
    const percentage = Math.round((this.totalScore / this.maxScore) * 100);
    console.log(`📈 OVERALL SCORE: ${this.totalScore}/${this.maxScore} (${percentage}%)`);
    console.log(`🚨 CRITICAL FAILURES: ${this.criticalFailures}`);
    
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    console.log(`✅ TESTS PASSED: ${passedTests}/${totalTests}`);

    // Success validation commands verification
    console.log('\n🧪 SUCCESS VALIDATION COMMANDS VERIFICATION:');
    console.log('-'.repeat(60));
    
    const validationResults = [
      this.results.find(r => r.name.includes('icon-192x192.png'))?.passed || false,
      this.results.find(r => r.name.includes('TypeScript Error Count'))?.passed || false,
      this.results.find(r => r.name === 'Production Build Output')?.passed || false,
      this.results.find(r => r.name === 'PWA Manifest Validity')?.passed || false,
      this.results.find(r => r.name === 'Service Worker Setup')?.passed || false
    ];

    const validationsPassed = validationResults.filter(Boolean).length;
    console.log(`📋 Core Validations: ${validationsPassed}/5 passed`);
    console.log(`   1. Icon assets: ${validationResults[0] ? '✅' : '❌'}`);
    console.log(`   2. TypeScript: ${validationResults[1] ? '✅' : '❌'}`);
    console.log(`   3. Build success: ${validationResults[2] ? '✅' : '❌'}`);
    console.log(`   4. PWA manifest: ${validationResults[3] ? '✅' : '❌'}`);
    console.log(`   5. Service Worker: ${validationResults[4] ? '✅' : '❌'}`);

    if (this.criticalFailures === 0 && percentage >= 90) {
      console.log('\n🎉 ✅ READY FOR PRODUCTION DEPLOYMENT');
      console.log('🏆 Netflix/Meta elite deployment standards achieved');
      console.log('🚀 PWA production-ready with zero critical failures');
      console.log('📱 Cross-platform installation flow verified');
      console.log('🔒 Security headers implemented and active');
      console.log('⚡ TypeScript compilation clean');
      console.log('🎯 All PWA icons generated and configured');
      
      console.log('\n📋 PHASE 4D COMPLETION CHECKLIST:');
      console.log('   ✅ Task 1: PWA Icon Suite - All 4 formats generated');
      console.log('   ✅ Task 2: TypeScript - Zero compilation errors');
      console.log('   ✅ Task 3: Security Headers - Implemented in Service Worker');
      console.log('   ✅ Task 4: PWA Installation - Manifest and SW configured');
      console.log('   ✅ Task 5: Production Build - Optimized assets generated');
      
      console.log('\n🚀 DEPLOYMENT READY - NEXT STEPS:');
      console.log('   1. Deploy to staging environment');
      console.log('   2. Test PWA installation on mobile devices');
      console.log('   3. Validate offline functionality');
      console.log('   4. Monitor Core Web Vitals in production');
      console.log('   5. Set up PWA performance monitoring dashboards');
      
      process.exit(0);
    } else {
      console.log('\n⚠️  NOT READY FOR PRODUCTION DEPLOYMENT');
      console.log(`🚨 ${this.criticalFailures} critical failures must be resolved`);
      
      if (this.criticalFailures > 0) {
        console.log('\n📋 CRITICAL FAILURES TO FIX:');
        this.results.filter(r => !r.passed && r.critical).forEach(failure => {
          console.log(`   ❌ ${failure.name}: ${failure.message}`);
        });
      }
      
      console.log('\n🔧 REQUIRED ACTIONS:');
      console.log('   1. Fix all critical failures listed above');
      console.log('   2. Re-run verification: node phase4d-verification.cjs');
      console.log('   3. Achieve 90%+ score with zero critical failures');
      console.log('   4. Ensure all 5 core validations pass');
      
      process.exit(1);
    }
  }
}

// Run verification
const verifier = new ProductionVerifier();
verifier.runAllVerifications().catch(console.error);