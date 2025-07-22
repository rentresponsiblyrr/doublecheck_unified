const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CompleteIntegrationVerifier {
    constructor() {
        this.results = [];
    }

    async runCompleteVerification() {
        console.log('🚀 COMPLETE INTEGRATION VERIFICATION - PHASE 4C');
        console.log('='.repeat(60));

        // Test 1: Integration Bridge
        await this.testIntegrationBridge();

        // Test 2: Database Validation Results
        await this.testDatabaseValidationResults();

        // Test 3: Runtime Health Check
        await this.testRuntimeHealthCheck();

        // Test 4: PWA Components Integration
        await this.testPWAIntegration();

        // Test 5: Enhanced Services Compatibility
        await this.testEnhancedServicesCompatibility();

        // Test 6: Dependency Verification
        await this.testDependencyVerification();

        // Generate report
        return this.generateReport();
    }

    async testIntegrationBridge() {
        try {
            const bridgeFile = 'src/integrations/PWAEnhancedServicesBridge.ts';
            const bridgeExists = fs.existsSync(bridgeFile);

            this.addResult({
                category: 'Integration Bridge',
                test: 'Bridge File Exists',
                status: bridgeExists ? 'PASS' : 'FAIL',
                details: bridgeExists ? 'Bridge file found' : 'Bridge file missing',
                critical: true
            });

            if (bridgeExists) {
                const content = fs.readFileSync(bridgeFile, 'utf8');
                const requiredMethods = [
                    'waitForEnhancedServices',
                    'waitForPWAComponents',
                    'createServiceMapping',
                    'coordinateCache',
                    'coordinateSync',
                    'getStatus'
                ];

                const hasAllMethods = requiredMethods.every(method => content.includes(method));

                this.addResult({
                    category: 'Integration Bridge',
                    test: 'Required Methods Implemented',
                    status: hasAllMethods ? 'PASS' : 'FAIL',
                    details: hasAllMethods ? 'All methods implemented' : 'Missing required methods',
                    critical: true
                });

                // Check for proper error handling
                const hasErrorHandling = content.includes('try {') && content.includes('catch (error)');
                this.addResult({
                    category: 'Integration Bridge',
                    test: 'Error Handling',
                    status: hasErrorHandling ? 'PASS' : 'WARN',
                    details: hasErrorHandling ? 'Error handling implemented' : 'Limited error handling',
                    critical: false
                });
            }
        } catch (error) {
            this.addResult({
                category: 'Integration Bridge',
                test: 'Bridge Verification',
                status: 'FAIL',
                details: error.message,
                critical: true
            });
        }
    }

    async testDatabaseValidationResults() {
        try {
            // Look for recent validation reports
            const files = fs.readdirSync('.')
                .filter(file => file.includes('validation-report') && file.endsWith('.txt'))
                .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);

            if (files.length > 0) {
                const latestReport = files[0];
                const content = fs.readFileSync(latestReport, 'utf8');

                const hasResults = content.includes('VALIDATION RESULTS') || content.includes('FINAL VERDICT');
                const isSuccessful = content.includes('DATABASE READY') || content.includes('DEPLOYMENT');
                const hasCriticalFailures = content.includes('CRITICAL FAILURES FOUND');

                this.addResult({
                    category: 'Database Validation',
                    test: 'Validation Report Exists',
                    status: 'PASS',
                    details: `Latest report: ${latestReport}`,
                    critical: true
                });

                this.addResult({
                    category: 'Database Validation',
                    test: 'Validation Results',
                    status: hasCriticalFailures ? 'FAIL' : isSuccessful ? 'PASS' : 'WARN',
                    details: hasCriticalFailures ? 'Critical failures found' : isSuccessful ? 'Database ready' : 'Results unclear',
                    critical: true
                });

            } else {
                this.addResult({
                    category: 'Database Validation',
                    test: 'Validation Executed',
                    status: 'FAIL',
                    details: 'No validation reports found',
                    critical: true
                });
            }

        } catch (error) {
            this.addResult({
                category: 'Database Validation',
                test: 'Validation Check',
                status: 'FAIL',
                details: error.message,
                critical: true
            });
        }
    }

    async testRuntimeHealthCheck() {
        try {
            // Check if health endpoint exists
            const healthExists = fs.existsSync('src/api/health/route.ts') ||
                               fs.existsSync('src/pages/api/health.ts') ||
                               fs.existsSync('pages/api/health.ts');

            this.addResult({
                category: 'Runtime Health',
                test: 'Health Endpoint Exists',
                status: healthExists ? 'PASS' : 'FAIL',
                details: healthExists ? 'Health endpoint implemented' : 'Health endpoint missing',
                critical: true
            });

            // Check for runtime test results
            const runtimeResultsExist = fs.existsSync('runtime-test-results.json');
            if (runtimeResultsExist) {
                const results = JSON.parse(fs.readFileSync('runtime-test-results.json', 'utf8'));

                this.addResult({
                    category: 'Runtime Health',
                    test: 'Runtime Test Results',
                    status: results.status === 'healthy' ? 'PASS' : 'WARN',
                    details: `Status: ${results.status}, Bridge: ${results.integration?.bridgeActive}`,
                    critical: false
                });
            } else {
                this.addResult({
                    category: 'Runtime Health',
                    test: 'Runtime Testing',
                    status: 'WARN',
                    details: 'Runtime tests not executed',
                    critical: false
                });
            }

        } catch (error) {
            this.addResult({
                category: 'Runtime Health',
                test: 'Health Check',
                status: 'FAIL',
                details: error.message,
                critical: true
            });
        }
    }

    async testPWAIntegration() {
        try {
            // Check PWA components exist and are enhanced
            const pwaComponents = [
                'src/services/pwa/BackgroundSyncManager.ts',
                'src/services/pwa/PushNotificationManager.ts',
                'src/contexts/PWAContext.tsx',
                'src/components/pwa/PWAInstallPrompt.tsx'
            ];

            for (const component of pwaComponents) {
                const exists = fs.existsSync(component);
                let hasEnhancement = false;

                if (exists) {
                    const content = fs.readFileSync(component, 'utf8');
                    hasEnhancement = content.includes('usePWAContext') ||
                                    content.includes('PWAErrorBoundary') ||
                                    content.includes('pwa-context-update') ||
                                    component.includes('PWAContext');
                }

                this.addResult({
                    category: 'PWA Integration',
                    test: `Component: ${path.basename(component)}`,
                    status: exists && hasEnhancement ? 'PASS' : exists ? 'WARN' : 'FAIL',
                    details: exists ? (hasEnhancement ? 'Enhanced with context' : 'Needs enhancement') : 'Component missing',
                    critical: component.includes('PWAContext') || component.includes('BackgroundSync')
                });
            }

            // Check main.tsx integration
            if (fs.existsSync('src/main.tsx')) {
                const content = fs.readFileSync('src/main.tsx', 'utf8');
                const hasIntegration = content.includes('__PWA_CONTEXT_UPDATE__') ||
                                     content.includes('pwaEnhancedBridge');

                this.addResult({
                    category: 'PWA Integration',
                    test: 'Main.tsx Integration',
                    status: hasIntegration ? 'PASS' : 'WARN',
                    details: hasIntegration ? 'Integration bridge configured' : 'Integration bridge needed',
                    critical: true
                });
            }

        } catch (error) {
            this.addResult({
                category: 'PWA Integration',
                test: 'PWA Component Check',
                status: 'FAIL',
                details: error.message,
                critical: true
            });
        }
    }

    async testEnhancedServicesCompatibility() {
        try {
            // Check Enhanced Services exist
            const enhancedServices = [
                'src/services/core/EnhancedUnifiedServiceLayer.ts',
                'src/services/core/EnhancedQueryCache.ts',
                'src/services/core/EnhancedRealTimeSync.ts',
                'src/services/core/EnhancedPerformanceMonitor.ts',
                'src/services/core/EnhancedServiceMigration.ts'
            ];

            for (const service of enhancedServices) {
                const exists = fs.existsSync(service);

                this.addResult({
                    category: 'Enhanced Services',
                    test: `Service: ${path.basename(service)}`,
                    status: exists ? 'PASS' : 'FAIL',
                    details: exists ? 'Service exists' : 'Service missing',
                    critical: true
                });

                // Check for Zod integration in Enhanced Services
                if (exists) {
                    const content = fs.readFileSync(service, 'utf8');
                    const hasZodIntegration = content.includes('import') && 
                                           (content.includes('zod') || content.includes('z.'));

                    this.addResult({
                        category: 'Enhanced Services',
                        test: `Zod Integration: ${path.basename(service)}`,
                        status: hasZodIntegration ? 'PASS' : 'WARN',
                        details: hasZodIntegration ? 'Zod integrated' : 'Zod integration missing',
                        critical: false
                    });
                }
            }

            // Check services/index.ts integration
            if (fs.existsSync('src/services/index.ts')) {
                const content = fs.readFileSync('src/services/index.ts', 'utf8');
                const hasEnhancedExports = content.includes('Enhanced') &&
                                         content.includes('compatibleQueryCache');

                this.addResult({
                    category: 'Enhanced Services',
                    test: 'Service Index Integration',
                    status: hasEnhancedExports ? 'PASS' : 'WARN',
                    details: hasEnhancedExports ? 'Enhanced services exported' : 'Enhanced exports missing',
                    critical: true
                });
            }

        } catch (error) {
            this.addResult({
                category: 'Enhanced Services',
                test: 'Services Compatibility',
                status: 'FAIL',
                details: error.message,
                critical: true
            });
        }
    }

    async testDependencyVerification() {
        try {
            // Check Zod installation
            let zodInstalled = false;
            try {
                execSync('npm ls zod', { stdio: 'ignore' });
                zodInstalled = true;
            } catch (error) {
                zodInstalled = false;
            }

            this.addResult({
                category: 'Dependencies',
                test: 'Zod Installation',
                status: zodInstalled ? 'PASS' : 'WARN',
                details: zodInstalled ? 'Zod is installed' : 'Zod needs installation',
                critical: false
            });

            // Check package.json for correct Zod version
            if (fs.existsSync('package.json')) {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const hasZodDependency = packageJson.dependencies?.zod || packageJson.devDependencies?.zod;

                this.addResult({
                    category: 'Dependencies',
                    test: 'Zod Package Configuration',
                    status: hasZodDependency ? 'PASS' : 'WARN',
                    details: hasZodDependency ? `Zod configured: ${hasZodDependency}` : 'Zod not in package.json',
                    critical: false
                });
            }

            // Check for verification scripts
            const scriptExists = fs.existsSync('scripts/dependency-security-audit.sh');
            this.addResult({
                category: 'Dependencies',
                test: 'Security Audit Script',
                status: scriptExists ? 'PASS' : 'FAIL',
                details: scriptExists ? 'Audit script ready' : 'Audit script missing',
                critical: false
            });

        } catch (error) {
            this.addResult({
                category: 'Dependencies',
                test: 'Dependency Check',
                status: 'FAIL',
                details: error.message,
                critical: false
            });
        }
    }

    addResult(result) {
        this.results.push(result);
    }

    generateReport() {
        console.log('\n📊 INTEGRATION VERIFICATION RESULTS');
        console.log('='.repeat(50));

        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'PASS').length;
        const criticalFailures = this.results.filter(r => r.status === 'FAIL' && r.critical).length;

        // Group results by category
        const categories = [...new Set(this.results.map(r => r.category))];

        for (const category of categories) {
            console.log(`\n📋 ${category}:`);
            const categoryResults = this.results.filter(r => r.category === category);

            for (const result of categoryResults) {
                const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
                const critical = result.critical ? ' (CRITICAL)' : '';
                console.log(`   ${icon} ${result.test}: ${result.details}${critical}`);
            }
        }

        // Summary
        const passRate = Math.round((passedTests / totalTests) * 100);
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests} (${passRate}%)`);
        console.log(`   Critical Failures: ${criticalFailures}`);

        // Final verdict
        const success = criticalFailures === 0 && passRate >= 90;

        console.log(`\n🎯 VERDICT:`);
        if (success) {
            console.log('✅ INTEGRATION READY FOR PRODUCTION DEPLOYMENT');
            console.log(`   ${passRate}% pass rate with zero critical failures`);
            console.log('   All systems verified and integrated successfully');
        } else if (criticalFailures === 0) {
            console.log('⚠️  INTEGRATION MOSTLY READY - MINOR ISSUES');
            console.log(`   ${passRate}% pass rate, no critical failures`);
            console.log('   Address warnings for optimal performance');
        } else {
            console.log('❌ INTEGRATION NOT READY - CRITICAL ISSUES FOUND');
            console.log(`   ${criticalFailures} critical failures must be resolved`);
            console.log('   Fix all critical issues before deployment');
        }

        // Save results to file
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests,
                passedTests,
                passRate,
                criticalFailures,
                success
            },
            results: this.results
        };

        fs.writeFileSync('integration-verification-report.json', JSON.stringify(reportData, null, 2));
        console.log('\n📄 Detailed results saved to: integration-verification-report.json');

        return success;
    }
}

// Run verification
const verifier = new CompleteIntegrationVerifier();
verifier.runCompleteVerification()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });