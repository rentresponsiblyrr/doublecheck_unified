#!/usr/bin/env tsx

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface TestConfig {
  url: string;
  device: 'mobile' | 'desktop';
  name: string;
}

const testConfigs: TestConfig[] = [
  { url: 'http://localhost:3000', name: 'Landing Page', device: 'mobile' },
  { url: 'http://localhost:3000/inspector', name: 'Inspector Dashboard', device: 'mobile' },
  { url: 'http://localhost:3000/inspector/inspection/1', name: 'Inspection Detail', device: 'mobile' },
  { url: 'http://localhost:3000', name: 'Landing Page Desktop', device: 'desktop' },
];

const performanceThresholds = {
  performance: 85,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  pwa: 90,
};

async function runLighthouse(url: string, device: 'mobile' | 'desktop') {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
    formFactor: device,
    screenEmulation: device === 'mobile' ? {
      mobile: true,
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
    } : {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
    },
    throttling: device === 'mobile' ? {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    } : {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return runnerResult;
}

function analyzeResults(name: string, categories: any) {
  console.log(chalk.blue(`\n📊 ${name}`));
  console.log('=' .repeat(50));

  let allPassed = true;

  Object.entries(categories).forEach(([key, category]: [string, any]) => {
    const score = Math.round(category.score * 100);
    const threshold = performanceThresholds[key] || 0;
    const passed = score >= threshold;
    
    allPassed = allPassed && passed;

    const icon = passed ? '✅' : '❌';
    const color = passed ? chalk.green : chalk.red;
    
    console.log(`${icon} ${category.title}: ${color(score + '%')} (threshold: ${threshold}%)`);
    
    // Show specific metrics for performance
    if (key === 'performance' && category.auditRefs) {
      const metrics = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'speed-index',
        'time-to-interactive',
        'total-blocking-time',
        'cumulative-layout-shift',
      ];
      
      metrics.forEach(metric => {
        const audit = category.auditRefs.find((a: any) => a.id === metric);
        if (audit) {
          console.log(`   - ${metric}: ${audit.scoreDisplayMode}`);
        }
      });
    }
  });

  return allPassed;
}

async function generateHTMLReport(results: any[], timestamp: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>STR Certified Lighthouse Report - ${timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .test { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .pass { background: #e7f5e7; }
    .fail { background: #ffe7e7; }
    .metric { margin: 10px 0; }
    .score { font-size: 24px; font-weight: bold; }
    h1 { color: #333; }
    h2 { color: #666; }
  </style>
</head>
<body>
  <h1>STR Certified Lighthouse Performance Report</h1>
  <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
  
  ${results.map(result => `
    <div class="test ${result.passed ? 'pass' : 'fail'}">
      <h2>${result.name}</h2>
      <p>Device: ${result.device}</p>
      ${Object.entries(result.scores).map(([key, score]) => `
        <div class="metric">
          <strong>${key}:</strong> 
          <span class="score">${score}%</span>
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>
  `;

  writeFileSync(join(process.cwd(), `lighthouse-report-${timestamp}.html`), html);
}

async function main() {
  console.log(chalk.blue('🚀 Starting Lighthouse Performance Testing'));
  console.log('=' .repeat(50));

  const results: any[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const config of testConfigs) {
    try {
      console.log(chalk.yellow(`\n🔍 Testing: ${config.name} (${config.device})`));
      
      const result = await runLighthouse(config.url, config.device);
      const { lhr } = result;
      
      const passed = analyzeResults(config.name, lhr.categories);
      
      results.push({
        name: config.name,
        device: config.device,
        url: config.url,
        passed,
        scores: Object.entries(lhr.categories).reduce((acc, [key, cat]: [string, any]) => {
          acc[key] = Math.round(cat.score * 100);
          return acc;
        }, {}),
        metrics: lhr.audits,
      });

      // Save individual JSON report
      writeFileSync(
        join(process.cwd(), `lighthouse-${config.name.replace(/\s+/g, '-')}-${timestamp}.json`),
        JSON.stringify(lhr, null, 2)
      );

    } catch (error) {
      console.error(chalk.red(`❌ Error testing ${config.name}: ${error.message}`));
    }
  }

  // Generate summary
  console.log(chalk.blue('\n📋 Summary'));
  console.log('=' .repeat(50));

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`Total Tests: ${totalCount}`);
  console.log(chalk.green(`✅ Passed: ${passedCount}`));
  console.log(chalk.red(`❌ Failed: ${totalCount - passedCount}`));

  // Calculate average scores
  const avgScores = {};
  results.forEach(result => {
    Object.entries(result.scores).forEach(([key, score]) => {
      if (!avgScores[key]) avgScores[key] = [];
      avgScores[key].push(score);
    });
  });

  console.log(chalk.blue('\n📊 Average Scores:'));
  Object.entries(avgScores).forEach(([key, scores]: [string, any]) => {
    const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    const threshold = performanceThresholds[key];
    const passed = avg >= threshold;
    console.log(`${passed ? '✅' : '❌'} ${key}: ${avg}% (threshold: ${threshold}%)`);
  });

  // Generate HTML report
  await generateHTMLReport(results, timestamp);
  console.log(chalk.green(`\n📄 HTML report generated: lighthouse-report-${timestamp}.html`));

  // Mobile-specific recommendations
  console.log(chalk.blue('\n💡 Mobile Performance Recommendations:'));
  
  const recommendations = [
    'Implement image lazy loading for inspection photos',
    'Use WebP format for better compression',
    'Minimize JavaScript bundle size with code splitting',
    'Implement virtual scrolling for long lists',
    'Cache API responses with service worker',
    'Preload critical fonts',
    'Use CSS containment for better rendering performance',
  ];

  recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });

  process.exit(passedCount === totalCount ? 0 : 1);
}

main().catch(console.error);