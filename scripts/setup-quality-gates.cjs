#!/usr/bin/env node

/**
 * STR Certified Quality Gates Setup Script
 * 
 * This script sets up the quality gates infrastructure for the project:
 * - Installs Git hooks
 * - Validates required tools and dependencies
 * - Creates necessary scripts and configurations
 * - Verifies the setup is working correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up STR Certified Quality Gates...\n');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function printStatus(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkCommand(command, description) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    printStatus(colors.green, `✅ ${description} found`);
    return true;
  } catch (error) {
    printStatus(colors.red, `❌ ${description} not found`);
    return false;
  }
}

function setupGitHooks() {
  printStatus(colors.blue, '🔧 Setting up Git hooks...');
  
  const preCommitSource = path.join(process.cwd(), 'pre-commit-quality-gate.sh');
  const preCommitTarget = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
  
  if (!fs.existsSync(preCommitSource)) {
    printStatus(colors.red, '❌ Pre-commit script not found');
    return false;
  }
  
  try {
    // Copy and make executable
    fs.copyFileSync(preCommitSource, preCommitTarget);
    fs.chmodSync(preCommitTarget, '755');
    printStatus(colors.green, '✅ Pre-commit hook installed');
    return true;
  } catch (error) {
    printStatus(colors.red, `❌ Failed to install pre-commit hook: ${error.message}`);
    return false;
  }
}

function validateDependencies() {
  printStatus(colors.blue, '🔍 Validating dependencies...');
  
  const required = [
    { cmd: 'node', desc: 'Node.js' },
    { cmd: 'npm', desc: 'npm' },
    { cmd: 'git', desc: 'Git' }
  ];
  
  let allFound = true;
  for (const { cmd, desc } of required) {
    if (!checkCommand(cmd, desc)) {
      allFound = false;
    }
  }
  
  return allFound;
}

function validatePackageScripts() {
  printStatus(colors.blue, '📦 Validating package.json scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    printStatus(colors.red, '❌ package.json not found');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = [
    'typecheck',
    'lint',
    'lint:fix',
    'format:check',
    'format',
    'test:run',
    'security-scan',
    'architecture-compliance',
    'quality-gates',
    'setup:quality-gates',
    'quality:fix-docs',
    'audit:comprehensive'
  ];
  
  let allFound = true;
  for (const script of requiredScripts) {
    if (pkg.scripts && pkg.scripts[script]) {
      printStatus(colors.green, `✅ Script '${script}' found`);
    } else {
      printStatus(colors.yellow, `⚠️ Script '${script}' missing`);
      allFound = false;
    }
  }
  
  return allFound;
}

function testQualityGates() {
  printStatus(colors.blue, '🧪 Testing quality gates...');
  
  try {
    // Test TypeScript compilation
    execSync('npm run typecheck', { stdio: 'ignore' });
    printStatus(colors.green, '✅ TypeScript compilation works');
  } catch (error) {
    printStatus(colors.yellow, '⚠️ TypeScript compilation has issues (will be caught by pre-commit)');
  }
  
  try {
    // Test ESLint
    execSync('npm run lint -- --max-warnings 1000', { stdio: 'ignore' });
    printStatus(colors.green, '✅ ESLint works');
  } catch (error) {
    printStatus(colors.yellow, '⚠️ ESLint has issues (will be caught by pre-commit)');
  }
  
  return true;
}

function generateProgressScript() {
  printStatus(colors.blue, '📊 Creating progress validation script...');
  
  const scriptContent = `#!/bin/bash
# STR Certified Progress Validation Script
echo "=== DAILY PROGRESS VALIDATION ==="
echo "Date: $(date)"
echo "Components: $(find src/components -name '*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "Type violations: $(grep -r ': any' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "God components: $(find src/components -name '*.tsx' -exec wc -l {} + 2>/dev/null | awk '$1 > 300' | wc -l | tr -d ' ')"
echo "TS errors: $(npm run typecheck 2>&1 | grep 'error TS' | wc -l | tr -d ' ')"
echo "=== END VALIDATION ==="
`;
  
  const scriptPath = path.join(process.cwd(), 'validate_progress.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  printStatus(colors.green, '✅ Progress validation script created');
  
  return true;
}

function main() {
  let success = true;
  
  // Step 1: Validate dependencies
  if (!validateDependencies()) {
    printStatus(colors.red, '❌ Missing required dependencies');
    success = false;
  }
  
  // Step 2: Validate package.json scripts
  if (!validatePackageScripts()) {
    printStatus(colors.yellow, '⚠️ Some package.json scripts are missing');
  }
  
  // Step 3: Setup Git hooks
  if (!setupGitHooks()) {
    printStatus(colors.red, '❌ Failed to setup Git hooks');
    success = false;
  }
  
  // Step 4: Generate helper scripts
  if (!generateProgressScript()) {
    printStatus(colors.red, '❌ Failed to generate progress script');
    success = false;
  }
  
  // Step 5: Test quality gates
  testQualityGates();
  
  console.log('\\n' + '='.repeat(50));
  
  if (success) {
    printStatus(colors.green, '🎉 Quality Gates setup completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Run: npm run quality-gates');
    console.log('2. Run: npm run audit:comprehensive');
    console.log('3. Make a test commit to verify pre-commit hook');
  } else {
    printStatus(colors.red, '❌ Quality Gates setup failed!');
    console.log('\\nPlease fix the issues above and run again.');
    process.exit(1);
  }
}

// Run the setup
main();