#!/usr/bin/env node

/**
 * Security Scan Script
 * Validates STR Certified security standards
 * 
 * SECURITY STANDARDS:
 * - No API keys exposed in client code
 * - Input validation on all user inputs
 * - XSS protection through sanitization
 * - SQL injection prevention
 * - Secure authentication patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class SecurityScan {
  constructor() {
    this.vulnerabilities = [];
    this.stats = {
      filesScanned: 0,
      vulnerabilitiesFound: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0
    };
  }

  async runScan() {
    console.log('🔒 STR Certified Security Scan');
    console.log('=' .repeat(35));
    
    await this.scanCodebase();
    await this.checkEnvironmentFiles();
    await this.validateAuthPatterns();
    
    this.generateReport();
    
    if (this.stats.highRisk > 0) {
      console.log('\n❌ SECURITY SCAN FAILED - HIGH RISK VULNERABILITIES');
      process.exit(1);
    } else if (this.stats.mediumRisk > 0) {
      console.log('\n⚠️  SECURITY SCAN PASSED WITH WARNINGS');
      process.exit(0);
    } else {
      console.log('\n✅ SECURITY SCAN PASSED');
      process.exit(0);
    }
  }

  /**
   * Scan entire codebase for security issues
   */
  async scanCodebase() {
    console.log('\n🔍 Scanning codebase for security vulnerabilities...');
    
    const srcDir = path.join(projectRoot, 'src');
    await this.scanDirectory(srcDir);
  }

  /**
   * Recursively scan directory
   */
  async scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.shouldScanFile(entry.name)) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
    }
  }

  shouldSkipDirectory(name) {
    return ['node_modules', '.git', 'dist', 'build', 'coverage'].includes(name) || name.startsWith('.');
  }

  shouldScanFile(name) {
    return /\.(ts|tsx|js|jsx|json|env)$/.test(name);
  }

  /**
   * Scan individual file for security issues
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);
      this.stats.filesScanned++;

      // Run security checks
      this.checkAPIKeyExposure(relativePath, content);
      this.checkInputValidation(relativePath, content);
      this.checkXSSVulnerabilities(relativePath, content);
      this.checkSQLInjection(relativePath, content);
      this.checkInsecurePatterns(relativePath, content);
      
    } catch (error) {
      console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check for exposed API keys and secrets
   */
  checkAPIKeyExposure(filePath, content) {
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{32,}/g,  // OpenAI API keys
      /AIzaSy[a-zA-Z0-9_-]{33}/g,  // Google API keys
      /AKIA[0-9A-Z]{16}/g,  // AWS Access Key ID
      /ya29\.[0-9A-Za-z_-]+/g,  // Google OAuth tokens
      /(password|secret|key|token|auth)\s*[:=]\s*['"][^'"]{8,}/gi,  // Generic secrets
      /Bearer\s+[a-zA-Z0-9._-]{20,}/g  // Bearer tokens
    ];

    for (const pattern of secretPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        
        // Skip if it's in a comment or documentation
        const line = content.split('\n')[lineNum - 1];
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue;
        }
        
        this.addVulnerability('EXPOSED_SECRET', 'HIGH', filePath, lineNum,
          `Potential API key or secret exposed: ${match[0].substring(0, 20)}...`);
      }
    }
  }

  /**
   * Check for missing input validation
   */
  checkInputValidation(filePath, content) {
    // Check for direct user input usage without validation
    const unsafeInputPatterns = [
      /params\.\w+(?!\s*\?\.|\.trim\(\)|\.toString\(\))/g,  // Direct param usage
      /req\.body\.[\w.]+(?!\s*\?\.|\.trim\(\))/g,  // Direct body usage
      /searchParams\.get\([^)]+\)(?!\s*\?\.|\.trim\(\))/g,  // Direct search param usage
      /window\.location\.search(?!\s*\?\.|\.trim\(\))/g  // Direct location search usage
    ];

    for (const pattern of unsafeInputPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addVulnerability('MISSING_INPUT_VALIDATION', 'MEDIUM', filePath, lineNum,
          `Direct user input usage without validation: ${match[0]}`);
      }
    }
  }

  /**
   * Check for XSS vulnerabilities
   */
  checkXSSVulnerabilities(filePath, content) {
    const xssPatterns = [
      /dangerouslySetInnerHTML/g,  // React dangerous HTML
      /innerHTML\s*=(?!.*DOMPurify)/g,  // Direct innerHTML without sanitization
      /document\.write\(/g,  // Document.write usage
      /eval\(/g,  // Eval usage
      /new Function\(/g  // Function constructor
    ];

    for (const pattern of xssPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addVulnerability('XSS_VULNERABILITY', 'HIGH', filePath, lineNum,
          `Potential XSS vulnerability: ${match[0]}`);
      }
    }
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  checkSQLInjection(filePath, content) {
    // Check for string concatenation in SQL-like queries
    const sqlPatterns = [
      /`.*SELECT.*\$\{[^}]*\}/gi,  // Template literal with variable in SELECT
      /`.*INSERT.*\$\{[^}]*\}/gi,  // Template literal with variable in INSERT
      /`.*UPDATE.*\$\{[^}]*\}/gi,  // Template literal with variable in UPDATE
      /`.*DELETE.*\$\{[^}]*\}/gi,  // Template literal with variable in DELETE
      /".*SELECT.*"\s*\+/gi,  // String concatenation in SELECT
      /".*INSERT.*"\s*\+/gi   // String concatenation in INSERT
    ];

    for (const pattern of sqlPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addVulnerability('SQL_INJECTION', 'HIGH', filePath, lineNum,
          `Potential SQL injection via string concatenation`);
      }
    }
  }

  /**
   * Check for other insecure patterns
   */
  checkInsecurePatterns(filePath, content) {
    const insecurePatterns = [
      {
        pattern: /console\.log.*(?:password|token|secret|key)/gi,
        severity: 'MEDIUM',
        message: 'Sensitive data logged to console'
      },
      {
        pattern: /localStorage\.setItem.*(?:password|token|secret|key)/gi,
        severity: 'HIGH',
        message: 'Sensitive data stored in localStorage'
      },
      {
        pattern: /sessionStorage\.setItem.*(?:password|token|secret|key)/gi,
        severity: 'MEDIUM',
        message: 'Sensitive data stored in sessionStorage'
      },
      {
        pattern: /document\.cookie\s*=.*(?:password|token|secret|key)/gi,
        severity: 'HIGH',
        message: 'Sensitive data stored in cookie without security flags'
      },
      {
        pattern: /Math\.random\(\)/g,
        severity: 'LOW',
        message: 'Math.random() is not cryptographically secure'
      }
    ];

    for (const { pattern, severity, message } of insecurePatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addVulnerability('INSECURE_PATTERN', severity, filePath, lineNum, message);
      }
    }
  }

  /**
   * Check environment files for security issues
   */
  async checkEnvironmentFiles() {
    console.log('\n🔧 Checking environment configuration...');
    
    const envFiles = ['.env', '.env.local', '.env.production', '.env.staging'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        
        // Check for placeholder values
        if (content.includes('your-api-key-here') || content.includes('changeme')) {
          this.addVulnerability('PLACEHOLDER_VALUES', 'HIGH', envFile, 1,
            'Placeholder values found in environment file');
        }
        
        // Check for overly permissive CORS
        if (content.includes('CORS_ORIGIN=*')) {
          this.addVulnerability('PERMISSIVE_CORS', 'MEDIUM', envFile, 1,
            'Overly permissive CORS configuration');
        }
      }
    }
  }

  /**
   * Validate authentication patterns
   */
  async validateAuthPatterns() {
    console.log('\n🔐 Validating authentication patterns...');
    
    const authFiles = [
      'src/contexts/AuthContext.tsx',
      'src/hooks/useAuth.ts',
      'src/services/authService.ts'
    ];
    
    for (const authFile of authFiles) {
      const authPath = path.join(projectRoot, authFile);
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, 'utf8');
        
        // Check for secure authentication patterns
        if (!content.includes('supabase.auth.')) {
          this.addVulnerability('WEAK_AUTH', 'MEDIUM', authFile, 1,
            'Authentication not using Supabase secure patterns');
        }
        
        // Check for token validation
        if (content.includes('token') && !content.includes('verify')) {
          this.addVulnerability('MISSING_TOKEN_VALIDATION', 'HIGH', authFile, 1,
            'JWT tokens not properly validated');
        }
      }
    }
  }

  /**
   * Add vulnerability to the list
   */
  addVulnerability(type, severity, file, line, message) {
    this.vulnerabilities.push({
      type,
      severity,
      file,
      line,
      message,
      timestamp: new Date().toISOString()
    });
    
    this.stats.vulnerabilitiesFound++;
    
    switch (severity) {
      case 'HIGH':
        this.stats.highRisk++;
        break;
      case 'MEDIUM':
        this.stats.mediumRisk++;
        break;
      case 'LOW':
        this.stats.lowRisk++;
        break;
    }
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Generate security scan report
   */
  generateReport() {
    console.log('\n📊 SECURITY SCAN REPORT');
    console.log('-'.repeat(30));
    console.log(`Files Scanned: ${this.stats.filesScanned}`);
    console.log(`Vulnerabilities Found: ${this.stats.vulnerabilitiesFound}`);
    console.log(`High Risk: ${this.stats.highRisk}`);
    console.log(`Medium Risk: ${this.stats.mediumRisk}`);
    console.log(`Low Risk: ${this.stats.lowRisk}`);

    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 SECURITY VULNERABILITIES:');
      console.log('='.repeat(40));
      
      const grouped = this.groupBySeverity();
      
      for (const [severity, vulns] of Object.entries(grouped)) {
        if (vulns.length > 0) {
          console.log(`\n${severity} RISK (${vulns.length}):`);
          vulns.forEach(v => {
            console.log(`  • ${v.file}:${v.line} - ${v.message}`);
          });
        }
      }
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Remove or secure all exposed API keys');
      console.log('2. Add input validation to all user inputs');
      console.log('3. Sanitize all dynamic HTML content');
      console.log('4. Use parameterized queries for database operations');
      console.log('5. Implement secure token storage and validation');
    }

    // Save detailed report
    const reportPath = path.join(projectRoot, 'security-scan.json');
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      vulnerabilities: this.vulnerabilities,
      passed: this.stats.highRisk === 0
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }

  /**
   * Group vulnerabilities by severity
   */
  groupBySeverity() {
    const grouped = { HIGH: [], MEDIUM: [], LOW: [] };
    
    for (const vuln of this.vulnerabilities) {
      grouped[vuln.severity].push(vuln);
    }
    
    return grouped;
  }
}

// Run the security scan
const scanner = new SecurityScan();
scanner.runScan().catch(error => {
  console.error('Security scan failed:', error);
  process.exit(1);
});