/**
 * @fileoverview Test Data Factories
 * Enterprise-grade test data generation using Factory pattern
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'factory.ts';
import type { InspectionStatus } from '@/types/inspection-status';

// Property Factory
export const PropertyFactory = Factory.define(() => ({
  property_id: faker.number.int({ min: 1, max: 10000 }),
  property_name: faker.company.name() + ' ' + faker.location.buildingNumber(),
  street_address: faker.location.streetAddress(),
  vrbo_url: faker.internet.url(),
  airbnb_url: faker.internet.url(),
  created_at: faker.date.recent().toISOString(),
  created_by: faker.string.uuid(),
  scraped_at: faker.date.recent().toISOString()
}));

// User/Profile Factory
export const ProfileFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  full_name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['inspector', 'auditor', 'admin']) as 'inspector' | 'auditor' | 'admin',
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString()
}));

// Inspection Factory
export const InspectionFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  property_id: faker.number.int({ min: 1, max: 10000 }).toString(),
  inspector_id: faker.string.uuid(),
  status: faker.helpers.arrayElement([
    'draft', 'in_progress', 'completed', 'pending_review', 
    'in_review', 'approved', 'rejected', 'needs_revision', 'cancelled'
  ]) as InspectionStatus,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  start_time: faker.date.past().toISOString(),
  end_time: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
  notes: faker.lorem.paragraph()
}));

// Safety Item Factory
export const SafetyItemFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  title: faker.helpers.arrayElement([
    'Smoke Detector Test',
    'Carbon Monoxide Detector Check',
    'Fire Extinguisher Inspection',
    'Exit Route Verification',
    'Electrical Safety Check',
    'Stair Safety Assessment',
    'Pool Safety Inspection',
    'Window Safety Check'
  ]),
  category: faker.helpers.arrayElement([
    'fire_safety', 'electrical', 'structural', 'pool_spa', 
    'security', 'accessibility', 'environmental'
  ]),
  required: faker.datatype.boolean(),
  evidence_type: faker.helpers.arrayElement(['photo', 'video', 'none']),
  deleted: false,
  created_at: faker.date.past().toISOString()
}));

// Checklist Item (Logs) Factory
export const ChecklistItemFactory = Factory.define(() => ({
  log_id: faker.number.int({ min: 1, max: 100000 }),
  property_id: faker.number.int({ min: 1, max: 10000 }),
  checklist_id: faker.string.uuid(), // References static_safety_items.id
  ai_result: faker.helpers.arrayElement(['pass', 'fail', 'needs_review', null]),
  inspector_remarks: faker.datatype.boolean() ? faker.lorem.sentence() : null,
  pass: faker.datatype.boolean(),
  inspector_id: faker.string.uuid(),
  created_at: faker.date.past().toISOString()
}));

// Media/Photo Factory
export const MediaFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  log_id: faker.number.int({ min: 1, max: 100000 }),
  file_path: `/uploads/${faker.string.uuid()}.jpg`,
  file_type: 'image/jpeg',
  file_size: faker.number.int({ min: 50000, max: 5000000 }),
  upload_status: faker.helpers.arrayElement(['pending', 'uploading', 'completed', 'failed']),
  created_at: faker.date.past().toISOString()
}));

// Error Details Factory for Testing AI Systems
export const ErrorDetailsFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  timestamp: faker.date.recent().toISOString(),
  level: faker.helpers.arrayElement(['error', 'warn', 'info']) as 'error' | 'warn' | 'info',
  message: faker.lorem.sentence(),
  stack: faker.datatype.boolean() ? faker.lorem.lines(5) : undefined,
  component: faker.helpers.arrayElement([
    'PhotoCapture', 'InspectionForm', 'PropertyList', 'AuthService'
  ]),
  userId: faker.string.uuid(),
  sessionId: faker.string.uuid(),
  userAgent: faker.internet.userAgent(),
  url: faker.internet.url(),
  additionalContext: {
    propertyId: faker.number.int({ min: 1, max: 10000 }),
    inspectionId: faker.string.uuid(),
    feature: faker.helpers.arrayElement(['inspection', 'upload', 'authentication', 'navigation'])
  }
}));

// System Context Factory for AI Testing
export const SystemContextFactory = Factory.define(() => ({
  timestamp: faker.date.recent().toISOString(),
  environment: 'test',
  version: '1.0.0',
  userAgent: faker.internet.userAgent(),
  sessionDuration: faker.number.int({ min: 60, max: 7200 }),
  pageLoadTime: faker.number.int({ min: 500, max: 5000 }),
  memoryUsage: {
    used: faker.number.int({ min: 50000000, max: 200000000 }),
    total: faker.number.int({ min: 100000000, max: 500000000 })
  },
  networkLatency: faker.number.int({ min: 20, max: 500 }),
  batteryLevel: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
  connectionType: faker.helpers.arrayElement(['wifi', '4g', '5g', 'ethernet'])
}));

// AI Prediction Factory
export const AIPredictionFactory = Factory.define(() => ({
  classification: {
    category: faker.helpers.arrayElement(['safety', 'compliance', 'maintenance', 'aesthetic']),
    subcategory: faker.helpers.arrayElement(['electrical', 'plumbing', 'structural', 'cosmetic']),
    severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']) as 'low' | 'medium' | 'high' | 'critical'
  },
  confidence: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 3 }),
  reasoning: faker.lorem.paragraph(),
  suggestedActions: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
    faker.lorem.sentence()
  ),
  riskAssessment: {
    level: faker.helpers.arrayElement(['low', 'medium', 'high']),
    factors: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => 
      faker.lorem.words(3)
    )
  }
}));

// Mock API Response Factory
export const ApiResponseFactory = Factory.define(() => ({
  data: null,
  error: null,
  status: faker.number.int({ min: 200, max: 500 }),
  statusText: faker.helpers.arrayElement(['OK', 'Created', 'Bad Request', 'Unauthorized', 'Not Found', 'Internal Server Error']),
  count: faker.number.int({ min: 0, max: 1000 })
}));

// Test Scenario Factory for Complex Testing
export const TestScenarioFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  steps: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, index) => ({
    step: index + 1,
    action: faker.helpers.arrayElement([
      'navigate_to_page', 'click_element', 'fill_input', 
      'upload_file', 'wait_for_element', 'verify_text'
    ]),
    target: faker.lorem.words(2),
    value: faker.datatype.boolean() ? faker.lorem.word() : null,
    expectedResult: faker.lorem.sentence()
  })),
  expectedOutcome: faker.lorem.sentence(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
  tags: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => 
    faker.helpers.arrayElement(['smoke', 'regression', 'integration', 'performance', 'security'])
  )
}));

// Load Test Configuration Factory
export const LoadTestConfigFactory = Factory.define(() => ({
  target: 'http://localhost:3000',
  phases: [
    {
      duration: faker.number.int({ min: 30, max: 300 }),
      arrivalRate: faker.number.int({ min: 1, max: 50 }),
      name: 'ramp_up'
    },
    {
      duration: faker.number.int({ min: 60, max: 600 }),
      arrivalRate: faker.number.int({ min: 10, max: 100 }),
      name: 'sustained_load'
    },
    {
      duration: faker.number.int({ min: 30, max: 300 }),
      arrivalRate: faker.number.int({ min: 1, max: 20 }),
      name: 'ramp_down'
    }
  ],
  scenarios: [
    {
      name: 'property_inspection_flow',
      weight: 70
    },
    {
      name: 'photo_upload_flow', 
      weight: 20
    },
    {
      name: 'report_generation_flow',
      weight: 10
    }
  ]
}));

// Performance Metrics Factory
export const PerformanceMetricsFactory = Factory.define(() => ({
  timestamp: faker.date.recent().toISOString(),
  metrics: {
    // Core Web Vitals
    largestContentfulPaint: faker.number.int({ min: 500, max: 4000 }),
    firstInputDelay: faker.number.int({ min: 10, max: 300 }),
    cumulativeLayoutShift: faker.number.float({ min: 0, max: 0.5, fractionDigits: 3 }),
    firstContentfulPaint: faker.number.int({ min: 300, max: 2000 }),
    timeToFirstByte: faker.number.int({ min: 50, max: 800 }),
    
    // Memory and Performance
    usedJSHeapSize: faker.number.int({ min: 10000000, max: 100000000 }),
    totalJSHeapSize: faker.number.int({ min: 20000000, max: 200000000 }),
    jsHeapSizeLimit: faker.number.int({ min: 100000000, max: 500000000 }),
    
    // Navigation Timing
    domContentLoaded: faker.number.int({ min: 500, max: 3000 }),
    loadComplete: faker.number.int({ min: 1000, max: 5000 }),
    
    // Custom STR Certified Metrics
    databaseQueryTime: faker.number.int({ min: 10, max: 500 }),
    imageLoadTime: faker.number.int({ min: 200, max: 2000 }),
    authenticationTime: faker.number.int({ min: 100, max: 1000 })
  }
}));

// Export utility functions for common test patterns
export const TestDataUtils = {
  /**
   * Create a complete inspection workflow test data set
   */
  createInspectionWorkflow: () => {
    const property = PropertyFactory.build();
    const inspector = ProfileFactory.build({ role: 'inspector' });
    const inspection = InspectionFactory.build({ 
      property_id: property.property_id.toString(),
      inspector_id: inspector.id 
    });
    const safetyItems = Array.from({ length: 5 }, () => SafetyItemFactory.build());
    const checklistItems = safetyItems.map(item => 
      ChecklistItemFactory.build({ 
        property_id: property.property_id,
        checklist_id: item.id,
        inspector_id: inspector.id
      })
    );
    
    return {
      property,
      inspector,
      inspection,
      safetyItems,
      checklistItems
    };
  },

  /**
   * Create test data for error scenarios
   */
  createErrorScenario: () => {
    const error = ErrorDetailsFactory.build();
    const context = SystemContextFactory.build();
    const prediction = AIPredictionFactory.build();
    
    return { error, context, prediction };
  },

  /**
   * Create API response mocks
   */
  createApiMocks: {
    success: (data?: unknown) => ApiResponseFactory.build({ 
      data, 
      error: null, 
      status: 200, 
      statusText: 'OK' 
    }),
    error: (message: string, status = 500) => ApiResponseFactory.build({ 
      data: null, 
      error: { message }, 
      status, 
      statusText: 'Error' 
    })
  },

  /**
   * Create performance test data
   */
  createPerformanceTestData: (count = 10) => 
    Array.from({ length: count }, () => PerformanceMetricsFactory.build())
};