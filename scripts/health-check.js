#!/usr/bin/env node

/**
 * Health Check Script for STR Certified
 * 
 * This script performs comprehensive health checks for the deployed application.
 * Used by Railway for monitoring and alerting.
 * 
 * Usage:
 *   npm run health:check
 *   node scripts/health-check.js [--endpoint=http://localhost:4173] [--full] [--json]
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Configuration
const DEFAULT_ENDPOINT = process.env.HEALTH_CHECK_URL || 'http://localhost:4173';
const TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 10000; // 10 seconds
const MAX_RETRIES = parseInt(process.env.HEALTH_CHECK_RETRIES) || 3;
const RETRY_DELAY = parseInt(process.env.HEALTH_CHECK_RETRY_DELAY) || 2000; // 2 seconds

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  endpoint: DEFAULT_ENDPOINT,
  full: false,
  json: false,
  verbose: false
};

args.forEach(arg => {
  if (arg.startsWith('--endpoint=')) {
    options.endpoint = arg.split('=')[1];
  } else if (arg === '--full') {
    options.full = true;
  } else if (arg === '--json') {
    options.json = true;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
STR Certified Health Check Script

Usage: node scripts/health-check.js [options]

Options:
  --endpoint=URL    Health check endpoint (default: ${DEFAULT_ENDPOINT})
  --full           Perform full health check (default: basic check)
  --json           Output results in JSON format
  --verbose, -v    Verbose output
  --help, -h       Show this help message

Exit codes:
  0 - Healthy
  1 - Unhealthy
  2 - Error during check

Environment Variables:
  HEALTH_CHECK_URL          Health check endpoint URL
  HEALTH_CHECK_TIMEOUT      Request timeout in milliseconds (default: 10000)
  HEALTH_CHECK_RETRIES      Maximum number of retries (default: 3)
  HEALTH_CHECK_RETRY_DELAY  Delay between retries in milliseconds (default: 2000)
`);
    process.exit(0);
  }
});

/**
 * Make HTTP/HTTPS request with timeout and retries
 */
function makeRequest(endpoint, retries = MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(endpoint);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'STR-Certified-Health-Check/1.0',
        'Accept': 'application/json'
      }
    };

    if (options.verbose) {
      console.log(`Making request to: ${endpoint}`);
      console.log(`Request options:`, requestOptions);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parsed: null
          };
          
          // Try to parse JSON response
          try {
            result.parsed = JSON.parse(data);
          } catch (e) {
            // Not JSON, that's ok
          }
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to process response: ${error.message}`));
        }
      });
    });

    req.on('error', async (error) => {
      if (retries > 0) {
        if (options.verbose) {
          console.log(`Request failed, retrying in ${RETRY_DELAY}ms... (${retries} retries left)`);
          console.log(`Error: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        try {
          const result = await makeRequest(endpoint, retries - 1);
          resolve(result);
        } catch (retryError) {
          reject(retryError);
        }
      } else {
        reject(new Error(`Request failed after ${MAX_RETRIES} retries: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });

    req.end();
  });
}

/**
 * Perform health check
 */
async function performHealthCheck() {
  const startTime = Date.now();
  
  try {
    // Determine health check URL
    const healthPath = options.full ? '/health?full=true' : '/health';
    const healthUrl = options.endpoint.endsWith('/') 
      ? options.endpoint.slice(0, -1) + healthPath
      : options.endpoint + healthPath;

    if (options.verbose) {
      console.log(`Starting health check...`);
      console.log(`Endpoint: ${healthUrl}`);
      console.log(`Full check: ${options.full}`);
      console.log(`Timeout: ${TIMEOUT}ms`);
      console.log(`Max retries: ${MAX_RETRIES}`);
    }

    // Make the health check request
    const response = await makeRequest(healthUrl);
    const responseTime = Date.now() - startTime;

    // Analyze response
    const result = {
      healthy: false,
      status: response.status,
      responseTime,
      endpoint: healthUrl,
      timestamp: new Date().toISOString(),
      details: null,
      error: null
    };

    if (response.status === 200) {
      result.healthy = true;
      result.details = response.parsed || { raw: response.body };
      
      // Additional validation for full health checks
      if (options.full && response.parsed) {
        if (response.parsed.status === 'unhealthy') {
          result.healthy = false;
          result.error = 'Service reports unhealthy status';
        } else if (response.parsed.status === 'degraded') {
          result.healthy = true; // Still considered healthy, but with warnings
          result.warning = 'Service reports degraded status';
        }
      }
    } else {
      result.healthy = false;
      result.error = `HTTP ${response.status}`;
      result.details = response.parsed || { raw: response.body };
    }

    return result;

  } catch (error) {
    return {
      healthy: false,
      status: 0,
      responseTime: Date.now() - startTime,
      endpoint: options.endpoint,
      timestamp: new Date().toISOString(),
      error: error.message,
      details: null
    };
  }
}

/**
 * Format and output results
 */
function outputResults(result) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Human-readable output
  const status = result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
  const responseTime = `${result.responseTime}ms`;
  
  console.log(`\n=== STR Certified Health Check ===`);
  console.log(`Status: ${status}`);
  console.log(`Endpoint: ${result.endpoint}`);
  console.log(`Response Time: ${responseTime}`);
  console.log(`Timestamp: ${result.timestamp}`);
  
  if (result.status) {
    console.log(`HTTP Status: ${result.status}`);
  }
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  if (result.warning) {
    console.log(`Warning: ${result.warning}`);
  }

  // Show detailed information for full checks
  if (options.full && result.details && typeof result.details === 'object') {
    console.log(`\n--- Detailed Health Information ---`);
    
    if (result.details.version) {
      console.log(`Version: ${result.details.version}`);
    }
    
    if (result.details.uptime) {
      console.log(`Uptime: ${Math.round(result.details.uptime / 1000)}s`);
    }
    
    if (result.details.environment) {
      console.log(`Environment: ${result.details.environment.deployment || 'unknown'}`);
      console.log(`Node Version: ${result.details.environment.node || 'unknown'}`);
    }
    
    if (result.details.services) {
      console.log(`\n--- Service Status ---`);
      Object.entries(result.details.services).forEach(([name, service]) => {
        const serviceStatus = service.status === 'up' ? '✅' : 
                             service.status === 'degraded' ? '⚠️' : '❌';
        console.log(`${serviceStatus} ${service.name}: ${service.status}`);
        
        if (service.latency) {
          console.log(`   Latency: ${service.latency}ms`);
        }
        
        if (service.error) {
          console.log(`   Error: ${service.error}`);
        }
      });
    }
    
    if (result.details.metrics) {
      console.log(`\n--- System Metrics ---`);
      
      if (result.details.metrics.memory) {
        const mem = result.details.metrics.memory;
        console.log(`Memory Usage: ${mem.percentage?.toFixed(1) || 'N/A'}%`);
        console.log(`Heap Used: ${Math.round((mem.heapUsed || 0) / 1024 / 1024)}MB`);
      }
      
      if (result.details.metrics.performance) {
        const perf = result.details.metrics.performance;
        console.log(`Requests/sec: ${perf.requestsPerSecond?.toFixed(2) || 'N/A'}`);
      }
      
      if (result.details.metrics.errors) {
        const errors = result.details.metrics.errors;
        console.log(`Error Rate: ${errors.rate?.toFixed(4) || 'N/A'}/sec`);
        console.log(`Total Errors: ${errors.total || 0}`);
      }
    }
  }
  
  console.log(`\n=== End Health Check ===\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    if (options.verbose) {
      console.log('STR Certified Health Check Starting...');
      console.log('Configuration:', options);
    }

    const result = await performHealthCheck();
    outputResults(result);
    
    // Exit with appropriate code
    if (result.healthy) {
      if (options.verbose) {
        console.log('Health check completed successfully');
      }
      process.exit(0);
    } else {
      if (options.verbose) {
        console.log('Health check failed');
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Health check error:', error.message);
    
    if (options.json) {
      console.log(JSON.stringify({
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
    }
    
    process.exit(2);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nHealth check interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\nHealth check terminated');
  process.exit(143);
});

// Run the health check
main();