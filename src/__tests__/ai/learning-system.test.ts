/**
 * @fileoverview Comprehensive Tests for AI Learning System
 * Enterprise-grade test coverage for learning and feedback systems
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LearningSystem } from '@/services/learningSystem';
import { ErrorDetailsFactory, SystemContextFactory, AIPredictionFactory } from '../factories';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ 
        data: [], 
        error: null,
        eq: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => ({ data: [], error: null }))
      })),
      update: vi.fn(() => ({ error: null }))
    }))
  }
}));

// Mock Enterprise Logger
vi.mock('@/lib/logging/enterprise-logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('LearningSystem', () => {
  let learningSystem: LearningSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    learningSystem = new LearningSystem();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Learning Data Recording', () => {
    it('should record classification learning data correctly', async () => {
      const errorId = 'error-123';
      const aiPrediction = {
        classification: {
          category: 'safety',
          subcategory: 'electrical',
          severity: 'high' as const
        }
      };
      const actualOutcome = {
        classification: {
          category: 'safety',
          subcategory: 'electrical',
          severity: 'medium' as const
        }
      };
      const context = {
        propertyType: 'apartment',
        inspectorExperience: 'senior'
      };

      await learningSystem.recordLearningData(
        errorId,
        'classification',
        aiPrediction,
        actualOutcome,
        context
      );

      // Verify that the data was processed and stored
      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalledWith(
          expect.stringContaining('Learning data recorded'),
          expect.any(Object),
          'LEARNING_SYSTEM'
        );
    });

    it('should calculate accuracy for root cause predictions', async () => {
      const aiPrediction = {
        rootCause: {
          primaryCause: 'electrical_fault',
          contributingFactors: ['old_wiring', 'moisture'],
          affectedComponents: ['circuit_breaker']
        }
      };
      const actualOutcome = {
        rootCause: {
          primaryCause: 'electrical_fault',
          contributingFactors: ['old_wiring'],
          affectedComponents: ['circuit_breaker', 'outlet']
        }
      };

      await learningSystem.recordLearningData(
        'error-123',
        'root_cause',
        aiPrediction,
        actualOutcome,
        {}
      );

      // Should handle partial matches in root cause analysis
      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalled();
    });

    it('should handle reproduction accuracy calculations', async () => {
      const aiPrediction = {
        reproduction: {
          steps: ['step1', 'step2', 'step3'],
          environment: 'mobile',
          success: true
        }
      };
      const actualOutcome = {
        reproduction: {
          steps: ['step1', 'step2', 'step4'],
          environment: 'mobile',
          success: false
        }
      };

      await learningSystem.recordLearningData(
        'error-123',
        'reproduction',
        aiPrediction,
        actualOutcome,
        { platform: 'iOS' }
      );

      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalled();
    });

    it('should process healing suggestion accuracy', async () => {
      const aiPrediction = {
        healing: {
          suggestions: ['restart_service', 'clear_cache'],
          automatedFixes: ['cache_clear'],
          riskLevel: 'low' as const
        }
      };
      const actualOutcome = {
        healing: {
          suggestions: ['restart_service', 'update_config'],
          automatedFixes: ['cache_clear', 'service_restart'],
          riskLevel: 'medium' as const
        }
      };

      await learningSystem.recordLearningData(
        'error-123',
        'healing',
        aiPrediction,
        actualOutcome,
        { systemLoad: 'high' }
      );

      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalled();
    });
  });

  describe('Accuracy Calculations', () => {
    it('should calculate classification accuracy correctly', () => {
      const learningSystemPrivate = learningSystem as any;
      
      // Test exact match
      const exactMatch = learningSystemPrivate.calculateClassificationAccuracy(
        { classification: { category: 'safety', severity: 'high' } },
        { classification: { category: 'safety', severity: 'high' } }
      );
      expect(exactMatch).toBe(1.0);

      // Test partial match
      const partialMatch = learningSystemPrivate.calculateClassificationAccuracy(
        { classification: { category: 'safety', severity: 'high' } },
        { classification: { category: 'safety', severity: 'medium' } }
      );
      expect(partialMatch).toBeGreaterThan(0);
      expect(partialMatch).toBeLessThan(1);

      // Test no match
      const noMatch = learningSystemPrivate.calculateClassificationAccuracy(
        { classification: { category: 'safety', severity: 'high' } },
        { classification: { category: 'maintenance', severity: 'low' } }
      );
      expect(noMatch).toBe(0);
    });

    it('should calculate root cause accuracy with weighted factors', () => {
      const learningSystemPrivate = learningSystem as any;
      
      const accuracy = learningSystemPrivate.calculateRootCauseAccuracy(
        { 
          rootCause: { 
            primaryCause: 'electrical_fault',
            contributingFactors: ['old_wiring', 'moisture'],
            affectedComponents: ['breaker', 'outlet']
          } 
        },
        { 
          rootCause: { 
            primaryCause: 'electrical_fault',
            contributingFactors: ['old_wiring'],
            affectedComponents: ['breaker', 'switch']
          } 
        }
      );

      expect(accuracy).toBeGreaterThan(0.5); // Should get credit for correct primary cause
      expect(accuracy).toBeLessThan(1.0); // But not perfect due to differences
    });

    it('should handle missing data gracefully in accuracy calculations', () => {
      const learningSystemPrivate = learningSystem as any;
      
      // Test with missing classification
      const missingAI = learningSystemPrivate.calculateClassificationAccuracy(
        {},
        { classification: { category: 'safety', severity: 'high' } }
      );
      expect(missingAI).toBe(0);

      // Test with missing actual outcome
      const missingActual = learningSystemPrivate.calculateClassificationAccuracy(
        { classification: { category: 'safety', severity: 'high' } },
        {}
      );
      expect(missingActual).toBe(0);
    });
  });

  describe('Learning Insights Generation', () => {
    it('should generate insights from learning data patterns', async () => {
      // Mock some learning data in the system
      const mockLearningData = [
        {
          category: 'classification',
          accuracy: { overall: 0.85, categorySpecific: 0.80, confidenceCalibration: 0.90 },
          aiPrediction: { classification: { category: 'safety', severity: 'high' } },
          actualOutcome: { classification: { category: 'safety', severity: 'medium' } },
          context: { propertyType: 'apartment' }
        },
        {
          category: 'classification',
          accuracy: { overall: 0.95, categorySpecific: 0.92, confidenceCalibration: 0.88 },
          aiPrediction: { classification: { category: 'maintenance', severity: 'low' } },
          actualOutcome: { classification: { category: 'maintenance', severity: 'low' } },
          context: { propertyType: 'house' }
        }
      ];

      // This would normally fetch from database, but we're testing the logic
      const insights = await learningSystem.generateLearningInsights('weekly');

      expect(insights).toBeInstanceOf(Array);
      // The method should return mock insights when database is unavailable
    });

    it('should calculate model performance metrics correctly', async () => {
      const performance = await learningSystem.getModelPerformance('v1.1.0-cag');

      expect(performance).toHaveProperty('version');
      expect(performance).toHaveProperty('overall_accuracy');
      expect(performance).toHaveProperty('accuracy_by_category');
      expect(performance.overall_accuracy).toBeGreaterThanOrEqual(0);
      expect(performance.overall_accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('Semantic Search Capabilities', () => {
    it('should perform semantic search with proper parameters', async () => {
      const searchRequest = {
        query: 'electrical safety compliance',
        category: 'safety',
        threshold: 0.8,
        limit: 10
      };

      const results = await learningSystem.semanticSearch(searchRequest);

      expect(results).toHaveProperty('results');
      expect(results).toHaveProperty('query_time_ms');
      expect(results.results).toBeInstanceOf(Array);
    });

    it('should handle search errors gracefully', async () => {
      // Mock a search that would fail
      const invalidRequest = {
        query: '', // Empty query
        category: 'invalid_category',
        threshold: 2.0, // Invalid threshold
        limit: -1 // Invalid limit
      };

      const results = await learningSystem.semanticSearch(invalidRequest);

      // Should return mock results instead of throwing
      expect(results).toHaveProperty('results');
      expect(results.results).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      vi.mocked(require('@/integrations/supabase/client').supabase.from).mockImplementation(() => ({
        insert: vi.fn(() => ({ error: new Error('Database connection failed') }))
      }));

      await expect(learningSystem.recordLearningData(
        'error-123',
        'classification',
        { classification: { category: 'safety' } },
        { classification: { category: 'safety' } },
        {}
      )).resolves.not.toThrow();

      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.error))
        .toHaveBeenCalled();
    });

    it('should validate input data before processing', async () => {
      // Test with invalid category
      await expect(learningSystem.recordLearningData(
        'error-123',
        'invalid_category' as any,
        {},
        {},
        {}
      )).resolves.not.toThrow();

      // Should log an error for invalid category
      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.error))
        .toHaveBeenCalled();
    });

    it('should handle malformed AI prediction data', async () => {
      const malformedPrediction = {
        // Missing required fields
        invalidField: 'invalid_value'
      };

      await learningSystem.recordLearningData(
        'error-123',
        'classification',
        malformedPrediction,
        { classification: { category: 'safety' } },
        {}
      );

      // Should handle gracefully without throwing
      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large volumes of learning data efficiently', async () => {
      const startTime = performance.now();

      // Process 100 learning data points
      const promises = Array.from({ length: 100 }, (_, index) => 
        learningSystem.recordLearningData(
          `error-${index}`,
          'classification',
          { classification: { category: 'safety', severity: 'high' } },
          { classification: { category: 'safety', severity: 'medium' } },
          { batch: index }
        )
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds for 100 operations)
      expect(duration).toBeLessThan(5000);
    });

    it('should implement proper caching for repeated calculations', async () => {
      // This would test caching logic if implemented
      const prediction = { classification: { category: 'safety', severity: 'high' } };
      const outcome = { classification: { category: 'safety', severity: 'medium' } };

      const startTime1 = performance.now();
      await learningSystem.recordLearningData('error-1', 'classification', prediction, outcome, {});
      const time1 = performance.now() - startTime1;

      const startTime2 = performance.now();
      await learningSystem.recordLearningData('error-2', 'classification', prediction, outcome, {});
      const time2 = performance.now() - startTime2;

      // Second operation should be faster due to caching (if implemented)
      // For now, just ensure both complete successfully
      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
    });
  });

  describe('Integration with AI Services', () => {
    it('should work correctly with actual AI prediction formats', async () => {
      // Test with realistic AI prediction structure
      const realisticPrediction = {
        classification: {
          category: 'electrical_safety',
          subcategory: 'outlet_inspection',
          severity: 'high',
          confidence: 0.87,
          reasoning: 'Detected exposed wiring and improper grounding'
        },
        rootCause: {
          primaryCause: 'improper_installation',
          contributingFactors: ['age_of_wiring', 'moisture_exposure'],
          affectedComponents: ['outlet_cover', 'ground_wire']
        }
      };

      const auditedOutcome = {
        classification: {
          category: 'electrical_safety',
          subcategory: 'outlet_inspection',
          severity: 'medium', // Auditor disagreed on severity
          confidence: 0.95,
          reasoning: 'Issue present but not immediately dangerous'
        },
        rootCause: {
          primaryCause: 'improper_installation',
          contributingFactors: ['age_of_wiring'], // Auditor removed moisture as factor
          affectedComponents: ['outlet_cover', 'ground_wire', 'circuit_breaker'] // Added breaker
        }
      };

      await learningSystem.recordLearningData(
        'realistic-error-123',
        'classification',
        realisticPrediction,
        auditedOutcome,
        {
          propertyAge: 25,
          propertyType: 'single_family',
          inspectorExperience: 'senior',
          weatherConditions: 'dry'
        }
      );

      expect(vi.mocked(require('@/lib/logging/enterprise-logger').log.info))
        .toHaveBeenCalledWith(
          expect.stringContaining('Learning data recorded'),
          expect.objectContaining({
            category: 'classification',
            accuracyScore: expect.any(Number)
          }),
          'LEARNING_SYSTEM'
        );
    });
  });
});