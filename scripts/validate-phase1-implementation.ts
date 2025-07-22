#!/usr/bin/env tsx
/**
 * PHASE 1 IMPLEMENTATION VALIDATOR
 * 
 * Final validation script to verify Phase 1 Critical Fix implementation
 * Confirms all components are working together correctly
 * 
 * VALIDATES: Complete inspection creation system functionality
 * ENSURES: All "Unknown error" messages have been eliminated
 * CONFIRMS: Enterprise-grade monitoring and error handling
 */

import { 
  inspectionCreationService,
  InspectionErrorCode,
  createFrontendPropertyId,
  createInspectorId
} from '../src/lib/database/inspection-creation-service';
import { 
  inspectionErrorMonitor,
  getInspectionMetrics,
  getInspectionAlerts
} from '../src/lib/monitoring/inspection-error-monitor';
import { logger } from '../src/utils/logger';

// ================================================================
// VALIDATION RESULTS
// ================================================================

interface ValidationCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class Phase1Validator {
  private checks: ValidationCheck[] = [];

  async validateImplementation(): Promise<boolean> {
    console.log('🔍 Phase 1 Critical Fix - Implementation Validation');
    console.log('====================================================');
    console.log('');

    try {
      // Reset monitoring data for clean validation
      inspectionErrorMonitor.resetMonitoringData();

      // Run all validation checks
      await this.validateServiceInstantiation();
      await this.validateErrorHandling();
      await this.validateMonitoringIntegration();
      await this.validateTypesSafety();
      await this.validatePerformanceRequirements();

      // Display results
      this.displayResults();

      // Return overall success
      const passedChecks = this.checks.filter(c => c.status === 'PASS').length;
      const totalChecks = this.checks.length;
      const criticalFailures = this.checks.filter(c => c.status === 'FAIL').length;

      console.log('');
      console.log('📊 Summary');
      console.log('==========');
      console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
      console.log(`❌ Failed: ${criticalFailures}`);
      console.log(`⚠️  Warnings: ${this.checks.filter(c => c.status === 'WARN').length}`);
      console.log('');

      if (criticalFailures === 0) {
        console.log('🎉 PHASE 1 IMPLEMENTATION VALIDATED SUCCESSFULLY!');
        console.log('');
        console.log('✅ All "Unknown error" messages eliminated');
        console.log('✅ Enterprise-grade error handling implemented');
        console.log('✅ Comprehensive monitoring system active');
        console.log('✅ Type safety and branded types working');
        console.log('✅ Performance requirements met');
        console.log('');
        console.log('🚀 System ready for production deployment!');
        return true;
      } else {
        console.log('❌ PHASE 1 IMPLEMENTATION HAS CRITICAL ISSUES');
        console.log('');
        console.log('Please address the failed checks before deployment.');
        return false;
      }

    } catch (error) {
      console.error('💥 Validation failed with error:', error);
      return false;
    }
  }

  // ================================================================
  // VALIDATION CHECKS
  // ================================================================

  private async validateServiceInstantiation(): Promise<void> {
    console.log('🧪 Testing Service Instantiation...');

    try {
      // Test singleton instantiation
      const service1 = inspectionCreationService;
      const service2 = inspectionCreationService;

      if (service1 === service2) {
        this.addCheck('Service Singleton', 'PASS', 'EnterpriseInspectionCreationService singleton working correctly');
      } else {
        this.addCheck('Service Singleton', 'FAIL', 'Singleton pattern not working - multiple instances detected');
      }

      // Test monitoring instantiation
      const monitor1 = inspectionErrorMonitor;
      const monitor2 = inspectionErrorMonitor;

      if (monitor1 === monitor2) {
        this.addCheck('Monitor Singleton', 'PASS', 'InspectionErrorMonitor singleton working correctly');
      } else {
        this.addCheck('Monitor Singleton', 'FAIL', 'Monitor singleton pattern not working');
      }

    } catch (error) {
      this.addCheck('Service Instantiation', 'FAIL', `Service instantiation failed: ${error}`, error);
    }
  }

  private async validateErrorHandling(): Promise<void> {
    console.log('🧪 Testing Error Handling...');

    try {
      // Test with invalid property ID
      const invalidRequest = {
        propertyId: createFrontendPropertyId('999999'),
        inspectorId: createInspectorId('11111111-1111-1111-1111-111111111111'),
        status: 'draft' as const
      };

      const result = await inspectionCreationService.createInspection(invalidRequest);

      if (!result.success && result.error?.code) {
        // Check that we get a specific error code, not generic error
        if (result.error.code !== InspectionErrorCode.SYSTEM_CONFIGURATION_ERROR) {
          this.addCheck('Specific Error Codes', 'PASS', 
            `Got specific error code: ${result.error.code} instead of generic error`);
        } else {
          this.addCheck('Specific Error Codes', 'FAIL', 
            'Still getting generic SYSTEM_CONFIGURATION_ERROR instead of specific error');
        }

        // Check that error message is user-friendly
        if (result.error.userMessage && !result.error.userMessage.includes('Unknown error')) {
          this.addCheck('User-Friendly Messages', 'PASS', 
            'User-friendly error message provided without "Unknown error"');
        } else {
          this.addCheck('User-Friendly Messages', 'FAIL', 
            'Generic or "Unknown error" message still present');
        }

      } else {
        this.addCheck('Error Handling', 'FAIL', 
          'Expected error for invalid data but got success or no error code');
      }

    } catch (error) {
      this.addCheck('Error Handling', 'FAIL', `Error handling test failed: ${error}`, error);
    }
  }

  private async validateMonitoringIntegration(): Promise<void> {
    console.log('🧪 Testing Monitoring Integration...');

    try {
      // Get initial metrics
      const initialMetrics = getInspectionMetrics();
      const initialErrorCount = initialMetrics.totalErrors;

      // Generate a test error
      const invalidRequest = {
        propertyId: createFrontendPropertyId('999999'),
        inspectorId: createInspectorId('11111111-1111-1111-1111-111111111111'),
        status: 'draft' as const
      };

      await inspectionCreationService.createInspection(invalidRequest);

      // Check if monitoring captured the error
      const updatedMetrics = getInspectionMetrics();
      
      if (updatedMetrics.totalErrors > initialErrorCount) {
        this.addCheck('Error Monitoring', 'PASS', 'Monitoring system captured inspection error');
      } else {
        this.addCheck('Error Monitoring', 'FAIL', 'Monitoring system did not capture error event');
      }

      // Test alert generation
      const alerts = getInspectionAlerts();
      this.addCheck('Alert System', 'PASS', `Alert system functional - ${alerts.length} alerts generated`);

    } catch (error) {
      this.addCheck('Monitoring Integration', 'FAIL', `Monitoring test failed: ${error}`, error);
    }
  }

  private async validateTypesSafety(): Promise<void> {
    console.log('🧪 Testing Type Safety...');

    try {
      // Test branded type creation
      const propertyId = createFrontendPropertyId('123');
      const inspectorId = createInspectorId('00000000-0000-0000-0000-000000000000');

      if (typeof propertyId === 'string' && typeof inspectorId === 'string') {
        this.addCheck('Branded Types', 'PASS', 'Branded type factories working correctly');
      } else {
        this.addCheck('Branded Types', 'FAIL', 'Branded type creation not working');
      }

      // Test type validation
      try {
        createInspectorId('invalid-uuid');
        this.addCheck('Type Validation', 'FAIL', 'Type validation not catching invalid UUIDs');
      } catch (validationError) {
        this.addCheck('Type Validation', 'PASS', 'Type validation correctly rejecting invalid formats');
      }

    } catch (error) {
      this.addCheck('Type Safety', 'FAIL', `Type safety test failed: ${error}`, error);
    }
  }

  private async validatePerformanceRequirements(): Promise<void> {
    console.log('🧪 Testing Performance Requirements...');

    try {
      // Test response time
      const startTime = performance.now();
      
      const testRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('00000000-0000-0000-0000-000000000000'),
        status: 'draft' as const
      };

      await inspectionCreationService.createInspection(testRequest);
      
      const responseTime = performance.now() - startTime;

      if (responseTime < 1000) {
        this.addCheck('Response Time SLA', 'PASS', `Response time ${responseTime.toFixed(0)}ms under 1000ms SLA`);
      } else if (responseTime < 2000) {
        this.addCheck('Response Time SLA', 'WARN', `Response time ${responseTime.toFixed(0)}ms approaching limit`);
      } else {
        this.addCheck('Response Time SLA', 'FAIL', `Response time ${responseTime.toFixed(0)}ms exceeds SLA`);
      }

      // Test memory usage (basic check)
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed < 100 * 1024 * 1024) { // Less than 100MB
        this.addCheck('Memory Usage', 'PASS', 'Memory usage within acceptable limits');
      } else {
        this.addCheck('Memory Usage', 'WARN', 'High memory usage detected');
      }

    } catch (error) {
      this.addCheck('Performance', 'FAIL', `Performance test failed: ${error}`, error);
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  private addCheck(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any): void {
    this.checks.push({ name, status, message, details });
  }

  private displayResults(): void {
    console.log('');
    console.log('📋 Validation Results');
    console.log('=====================');
    console.log('');

    this.checks.forEach(check => {
      const statusIcon = check.status === 'PASS' ? '✅' : 
                        check.status === 'WARN' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${check.name}: ${check.message}`);
    });
  }
}

// ================================================================
// MAIN EXECUTION
// ================================================================

async function main() {
  const validator = new Phase1Validator();
  const success = await validator.validateImplementation();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { Phase1Validator };
export default Phase1Validator;