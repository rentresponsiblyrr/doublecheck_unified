/**
 * @fileoverview Artillery Load Test Processor
 * Custom functions for advanced load testing scenarios
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Custom functions for Artillery scenarios
module.exports = {
  // Generate realistic test data
  generateTestData,
  
  // Custom authentication handler
  handleAuthentication,
  
  // Simulate realistic user behavior
  simulateUserThinking,
  
  // Validate AI responses
  validateAIResponse,
  
  // Track custom metrics
  trackCustomMetrics,
  
  // Chaos engineering hooks
  injectChaos,
  
  // Setup and teardown functions
  setupScenario,
  teardownScenario
};

/**
 * Generate realistic test data for load testing
 */
function generateTestData(requestParams, context, ee, next) {
  // Generate realistic property data
  context.vars.propertyData = {
    property_name: `Test Property ${crypto.randomUUID().slice(0, 8)}`,
    street_address: `${Math.floor(Math.random() * 9999) + 1} Test Street`,
    property_type: randomChoice(['house', 'apartment', 'condo', 'cabin']),
    bedrooms: Math.floor(Math.random() * 5) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    max_guests: Math.floor(Math.random() * 8) + 2
  };
  
  // Generate realistic inspector data
  context.vars.inspectorData = {
    full_name: `Test Inspector ${crypto.randomUUID().slice(0, 8)}`,
    email: `inspector.${crypto.randomUUID().slice(0, 8)}@strcertified.com`,
    experience_level: randomChoice(['junior', 'mid', 'senior', 'expert']),
    specializations: randomChoice([
      ['electrical', 'plumbing'],
      ['safety', 'accessibility'],
      ['fire_safety', 'pool_spa'],
      ['structural', 'environmental']
    ])
  };
  
  // Generate realistic inspection context
  context.vars.inspectionContext = {
    weather_conditions: randomChoice(['sunny', 'cloudy', 'rainy', 'snowy']),
    time_of_day: randomChoice(['morning', 'afternoon', 'evening']),
    season: randomChoice(['spring', 'summer', 'fall', 'winter']),
    ambient_temperature: Math.floor(Math.random() * 40) + 50, // 50-90°F
    humidity: Math.floor(Math.random() * 60) + 30 // 30-90%
  };
  
  return next();
}

/**
 * Handle authentication with realistic error simulation
 */
function handleAuthentication(requestParams, context, ee, next) {
  // Simulate occasional authentication failures (2% of the time)
  if (Math.random() < 0.02) {
    context.vars.authError = true;
    context.vars.authErrorType = randomChoice([
      'invalid_credentials',
      'account_locked',
      'service_unavailable',
      'rate_limited'
    ]);
  }
  
  // Add realistic authentication headers
  requestParams.headers = {
    ...requestParams.headers,
    'X-Device-ID': context.vars.deviceId || crypto.randomUUID(),
    'X-App-Version': '1.0.1',
    'X-Platform': randomChoice(['iOS', 'Android', 'Web']),
    'X-Request-ID': crypto.randomUUID()
  };
  
  return next();
}

/**
 * Simulate realistic user thinking time between actions
 */
function simulateUserThinking(requestParams, context, ee, next) {
  const thinkingTime = randomBetween(500, 3000); // 0.5-3 seconds
  
  setTimeout(() => {
    // Track thinking time as a custom metric
    ee.emit('counter', 'user.thinking_time', thinkingTime);
    next();
  }, thinkingTime);
}

/**
 * Validate AI service responses for quality assurance
 */
function validateAIResponse(requestParams, response, context, ee, next) {
  if (!response || !response.body) {
    ee.emit('counter', 'ai.validation.missing_response', 1);
    return next();
  }
  
  try {
    const responseData = JSON.parse(response.body);
    
    // Validate photo quality response
    if (responseData.quality_score !== undefined) {
      const score = responseData.quality_score;
      if (score >= 0 && score <= 1) {
        ee.emit('counter', 'ai.photo_quality.valid_response', 1);
        ee.emit('histogram', 'ai.photo_quality.score', score * 100);
      } else {
        ee.emit('counter', 'ai.photo_quality.invalid_score', 1);
      }
    }
    
    // Validate photo comparison response
    if (responseData.similarity_score !== undefined) {
      const score = responseData.similarity_score;
      if (score >= 0 && score <= 1) {
        ee.emit('counter', 'ai.photo_compare.valid_response', 1);
        ee.emit('histogram', 'ai.photo_compare.similarity', score * 100);
      } else {
        ee.emit('counter', 'ai.photo_compare.invalid_score', 1);
      }
    }
    
    // Validate classification response
    if (responseData.classification) {
      if (responseData.classification.category && responseData.classification.confidence) {
        ee.emit('counter', 'ai.classification.valid_response', 1);
        ee.emit('histogram', 'ai.classification.confidence', responseData.classification.confidence * 100);
      } else {
        ee.emit('counter', 'ai.classification.invalid_response', 1);
      }
    }
    
  } catch (error) {
    ee.emit('counter', 'ai.validation.parse_error', 1);
  }
  
  return next();
}

/**
 * Track custom business metrics
 */
function trackCustomMetrics(requestParams, response, context, ee, next) {
  const startTime = Date.now();
  
  // Track response time by endpoint
  const endpoint = requestParams.url || 'unknown';
  const responseTime = response ? (Date.now() - startTime) : 0;
  
  ee.emit('histogram', `endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.response_time`, responseTime);
  
  // Track success/failure rates by endpoint
  if (response && response.statusCode >= 200 && response.statusCode < 300) {
    ee.emit('counter', `endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.success`, 1);
  } else {
    ee.emit('counter', `endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.failure`, 1);
  }
  
  // Track business-specific metrics
  if (endpoint.includes('/inspections')) {
    ee.emit('counter', 'business.inspection_operations', 1);
  }
  
  if (endpoint.includes('/photos')) {
    ee.emit('counter', 'business.photo_operations', 1);
    if (response && response.statusCode === 201) {
      ee.emit('counter', 'business.photos_uploaded', 1);
    }
  }
  
  if (endpoint.includes('/ai/')) {
    ee.emit('counter', 'business.ai_operations', 1);
  }
  
  return next();
}

/**
 * Inject chaos engineering scenarios
 */
function injectChaos(requestParams, context, ee, next) {
  const chaosType = context.vars.chaosType;
  
  switch (chaosType) {
    case 'network_latency':
      // Simulate network latency
      const latency = randomBetween(2000, 5000);
      setTimeout(next, latency);
      ee.emit('counter', 'chaos.network_latency_injected', 1);
      break;
      
    case 'memory_pressure':
      // Simulate memory pressure by increasing payload size
      if (requestParams.json) {
        requestParams.json.chaosData = 'x'.repeat(1024 * 1024); // 1MB of data
      }
      ee.emit('counter', 'chaos.memory_pressure_injected', 1);
      next();
      break;
      
    case 'cpu_spike':
      // Simulate CPU spike with blocking operation
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait for 100ms
        Math.random();
      }
      ee.emit('counter', 'chaos.cpu_spike_injected', 1);
      next();
      break;
      
    default:
      next();
  }
}

/**
 * Setup scenario with test data and monitoring
 */
function setupScenario(context, ee, next) {
  // Initialize custom tracking
  context.vars.scenarioStartTime = Date.now();
  context.vars.operationCount = 0;
  context.vars.errorCount = 0;
  
  // Generate unique session ID for tracking
  context.vars.sessionId = crypto.randomUUID();
  context.vars.deviceId = crypto.randomUUID();
  
  // Initialize realistic user profile
  context.vars.userProfile = {
    experience_level: randomChoice(['novice', 'intermediate', 'expert']),
    preferred_language: randomChoice(['en', 'es', 'fr']),
    accessibility_needs: Math.random() < 0.1, // 10% of users have accessibility needs
    mobile_device: Math.random() < 0.7 // 70% on mobile
  };
  
  // Setup chaos engineering if enabled
  if (Math.random() < 0.05) { // 5% chaos injection rate
    context.vars.chaosType = randomChoice([
      'network_latency',
      'memory_pressure',
      'cpu_spike'
    ]);
  }
  
  ee.emit('counter', 'scenario.setup_completed', 1);
  return next();
}

/**
 * Teardown scenario and collect final metrics
 */
function teardownScenario(context, ee, next) {
  const scenarioEndTime = Date.now();
  const totalDuration = scenarioEndTime - (context.vars.scenarioStartTime || scenarioEndTime);
  
  // Emit final scenario metrics
  ee.emit('histogram', 'scenario.total_duration', totalDuration);
  ee.emit('counter', 'scenario.operations_completed', context.vars.operationCount || 0);
  ee.emit('counter', 'scenario.errors_encountered', context.vars.errorCount || 0);
  
  // Calculate success rate
  const operationCount = context.vars.operationCount || 0;
  const errorCount = context.vars.errorCount || 0;
  const successRate = operationCount > 0 ? ((operationCount - errorCount) / operationCount) * 100 : 0;
  
  ee.emit('histogram', 'scenario.success_rate', successRate);
  
  // Clean up
  delete context.vars.scenarioStartTime;
  delete context.vars.operationCount;
  delete context.vars.errorCount;
  delete context.vars.sessionId;
  delete context.vars.deviceId;
  
  ee.emit('counter', 'scenario.teardown_completed', 1);
  return next();
}

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate test CSV data file if it doesn't exist
function generateTestDataFile() {
  const csvPath = path.join(__dirname, 'test-data.csv');
  
  if (!fs.existsSync(csvPath)) {
    const headers = 'property_id,inspector_id,property_name\n';
    const rows = Array.from({ length: 1000 }, (_, i) => {
      return `${i + 1},inspector-${crypto.randomUUID().slice(0, 8)},Test Property ${i + 1}`;
    }).join('\n');
    
    fs.writeFileSync(csvPath, headers + rows);
    console.log('Generated test-data.csv with 1000 test properties');
  }
}

// Initialize test data on module load
generateTestDataFile();