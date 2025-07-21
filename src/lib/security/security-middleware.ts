/**
 * @fileoverview Enterprise Security Middleware
 * Comprehensive security middleware layer for request/response security
 * 
 * Features:
 * - OWASP Top 10 protection middleware
 * - Request/response security scanning
 * - Real-time threat detection integration
 * - Automated security response
 * - Security headers management
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { log } from '../logging/enterprise-logger';
import { enterpriseServiceTracer } from '../services/enterprise-service-tracer';
import { EnterpriseSecurityManager } from './enterprise-security-manager';
import { ThreatDetectionEngine, type SecurityEvent } from './threat-detection-engine';

// Type definitions for request/response bodies
type RequestBody = string | Record<string, unknown> | FormData | ArrayBuffer | Blob | null | undefined;
type ResponseBody = string | Record<string, unknown> | null | undefined;
type SanitizedData = string | Record<string, unknown> | null;

export interface SecurityMiddlewareConfig {
  // Security scanning settings
  scanning: {
    enableRequestScanning: boolean;
    enableResponseScanning: boolean;
    enableRealTimeAnalysis: boolean;
    maxRequestSize: number;
    maxResponseSize: number;
  };
  
  // Header security settings
  headers: {
    enableSecurityHeaders: boolean;
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXFrameOptions: boolean;
    enableXContentType: boolean;
    customHeaders: Record<string, string>;
  };
  
  // Request validation settings
  validation: {
    enableInputSanitization: boolean;
    enableSQLInjectionPrevention: boolean;
    enableXSSPrevention: boolean;
    enableCSRFProtection: boolean;
    enableFileUploadSecurity: boolean;
  };
  
  // Response protection settings
  response: {
    enableDataLeakPrevention: boolean;
    enableSensitiveDataMasking: boolean;
    enableErrorSanitization: boolean;
    enableResponseValidation: boolean;
  };
  
  // Rate limiting settings
  rateLimiting: {
    enableGlobalRateLimit: boolean;
    enablePerUserRateLimit: boolean;
    enablePerIPRateLimit: boolean;
    globalLimit: { requests: number; windowMs: number };
    userLimit: { requests: number; windowMs: number };
    ipLimit: { requests: number; windowMs: number };
  };
}

export interface SecurityContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  
  // Security state
  riskScore: number;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  securityFlags: string[];
  
  // Request metadata
  method: string;
  path: string;
  contentType?: string;
  contentLength?: number;
  
  // Authentication context
  isAuthenticated: boolean;
  authMethod?: string;
  permissions: string[];
}

export interface SecurityScanResult {
  passed: boolean;
  riskScore: number;
  violations: SecurityViolation[];
  warnings: SecurityWarning[];
  sanitized?: SanitizedData;
  blocked: boolean;
  reason?: string;
}

export interface SecurityViolation {
  type: 'sql_injection' | 'xss' | 'csrf' | 'file_upload' | 'data_leak' | 'rate_limit' | 'authorization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string; // 'header' | 'body' | 'query' | 'path'
  details: Record<string, unknown>;
  mitigated: boolean;
}

export interface SecurityWarning {
  type: string;
  description: string;
  recommendation: string;
}

class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityMiddlewareConfig;
  private securityManager: EnterpriseSecurityManager;
  private threatDetection: ThreatDetectionEngine;
  private rateLimitCounters = new Map<string, { count: number; resetTime: number }>();

  private constructor(config: SecurityMiddlewareConfig) {
    this.config = config;
    this.securityManager = EnterpriseSecurityManager.getInstance();
    this.threatDetection = ThreatDetectionEngine.getInstance();
  }

  static initialize(config: SecurityMiddlewareConfig): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware(config);
    }
    return SecurityMiddleware.instance;
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      throw new Error('SecurityMiddleware not initialized. Call initialize() first.');
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Main request security middleware
   */
  async processRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: RequestBody,
    query?: Record<string, string>
  ): Promise<{ 
    context: SecurityContext; 
    result: SecurityScanResult;
    modifiedRequest?: {
      headers: Record<string, string>;
      body?: RequestBody;
      query?: Record<string, string>;
    };
  }> {
    return enterpriseServiceTracer.traceServiceOperation(
      'security-middleware',
      'processRequest',
      async () => {
        const startTime = performance.now();
        
        // Extract security context
        const context = this.extractSecurityContext(method, path, headers, body);
        
        // Initialize scan result
        const result: SecurityScanResult = {
          passed: true,
          riskScore: 0,
          violations: [],
          warnings: [],
          blocked: false,
        };
        
        // 1. Rate limiting check
        if (!this.checkRateLimits(context, result)) {
          return { context, result };
        }
        
        // 2. Authentication and authorization validation
        await this.validateAuthAndAuthz(context, result);
        
        // 3. Input validation and sanitization
        const sanitizedRequest = await this.validateAndSanitizeInput(
          { headers, body, query },
          context,
          result
        );
        
        // 4. CSRF protection
        if (this.config.validation.enableCSRFProtection) {
          this.validateCSRFToken(headers, context, result);
        }
        
        // 5. File upload security (if applicable)
        if (this.config.validation.enableFileUploadSecurity && body) {
          await this.validateFileUploads(body, context, result);
        }
        
        // 6. Create security event for threat detection
        if (this.config.scanning.enableRealTimeAnalysis) {
          const securityEvent = this.createSecurityEvent(context, {
            headers,
            body,
            query,
          });
          
          const threatAnalysis = await this.threatDetection.analyzeEvent(securityEvent);
          
          // Update context with threat analysis
          context.riskScore = Math.max(context.riskScore, threatAnalysis.anomalyScore * 100);
          context.threatLevel = threatAnalysis.severityLevel;
          
          if (threatAnalysis.isAnomaly) {
            result.violations.push({
              type: 'authorization', // Generic type for anomalies
              severity: threatAnalysis.severityLevel,
              description: threatAnalysis.explanation,
              location: 'request',
              details: {
                threatVectors: threatAnalysis.threatVectors,
                confidence: threatAnalysis.confidence,
              },
              mitigated: false,
            });
          }
        }
        
        // 7. Determine final security state
        this.finalizeSecurityResult(context, result);
        
        // 8. Log security events
        this.logSecurityEvent(context, result, performance.now() - startTime);
        
        return {
          context,
          result,
          modifiedRequest: sanitizedRequest,
        };
      },
      { critical: true }
    );
  }

  /**
   * Response security middleware
   */
  async processResponse(
    context: SecurityContext,
    statusCode: number,
    headers: Record<string, string>,
    body?: ResponseBody
  ): Promise<{
    secureHeaders: Record<string, string>;
    sanitizedBody?: ResponseBody;
    violations: SecurityViolation[];
  }> {
    return enterpriseServiceTracer.traceServiceOperation(
      'security-middleware',
      'processResponse',
      async () => {
        const violations: SecurityViolation[] = [];
        
        // 1. Add security headers
        const secureHeaders = this.addSecurityHeaders(headers, context);
        
        // 2. Scan response for sensitive data leaks
        let sanitizedBody = body;
        if (this.config.response.enableDataLeakPrevention && body) {
          const leakScan = await this.scanForDataLeaks(body, context);
          if (leakScan.violations.length > 0) {
            violations.push(...leakScan.violations);
            sanitizedBody = leakScan.sanitized;
          }
        }
        
        // 3. Sanitize error responses
        if (this.config.response.enableErrorSanitization && statusCode >= 400) {
          sanitizedBody = this.sanitizeErrorResponse(sanitizedBody, context);
        }
        
        // 4. Validate response content
        if (this.config.response.enableResponseValidation) {
          const validationResult = this.validateResponseContent(sanitizedBody, context);
          violations.push(...validationResult.violations);
        }
        
        return {
          secureHeaders,
          sanitizedBody,
          violations,
        };
      },
      { critical: true }
    );
  }

  /**
   * Extract security context from request
   */
  private extractSecurityContext(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: RequestBody
  ): SecurityContext {
    const requestId = headers['x-request-id'] || this.generateRequestId();
    const ipAddress = this.extractClientIP(headers);
    const userAgent = headers['user-agent'] || 'unknown';
    
    // Extract user context (simplified - would integrate with actual auth system)
    const userId = headers['x-user-id'];
    const sessionId = headers['x-session-id'];
    const authToken = headers['authorization'];
    
    return {
      requestId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      riskScore: 0,
      threatLevel: 'none',
      securityFlags: [],
      method: method.toUpperCase(),
      path,
      contentType: headers['content-type'],
      contentLength: body ? JSON.stringify(body).length : 0,
      isAuthenticated: !!authToken,
      authMethod: authToken ? 'bearer' : undefined,
      permissions: [], // Would be populated from user session
    };
  }

  /**
   * Rate limiting validation
   */
  private checkRateLimits(context: SecurityContext, result: SecurityScanResult): boolean {
    if (!this.config.rateLimiting.enableGlobalRateLimit) return true;
    
    // Global rate limit
    if (this.config.rateLimiting.enableGlobalRateLimit) {
      if (!this.checkRateLimit('global', this.config.rateLimiting.globalLimit)) {
        result.violations.push({
          type: 'rate_limit',
          severity: 'medium',
          description: 'Global rate limit exceeded',
          location: 'request',
          details: { limit: this.config.rateLimiting.globalLimit },
          mitigated: true,
        });
        result.blocked = true;
        result.reason = 'rate_limit_exceeded';
        return false;
      }
    }
    
    // Per-IP rate limit
    if (this.config.rateLimiting.enablePerIPRateLimit) {
      const ipKey = `ip:${context.ipAddress}`;
      if (!this.checkRateLimit(ipKey, this.config.rateLimiting.ipLimit)) {
        result.violations.push({
          type: 'rate_limit',
          severity: 'high',
          description: 'IP rate limit exceeded',
          location: 'request',
          details: { 
            ipAddress: context.ipAddress,
            limit: this.config.rateLimiting.ipLimit,
          },
          mitigated: true,
        });
        result.blocked = true;
        result.reason = 'ip_rate_limit_exceeded';
        return false;
      }
    }
    
    // Per-user rate limit
    if (this.config.rateLimiting.enablePerUserRateLimit && context.userId) {
      const userKey = `user:${context.userId}`;
      if (!this.checkRateLimit(userKey, this.config.rateLimiting.userLimit)) {
        result.violations.push({
          type: 'rate_limit',
          severity: 'medium',
          description: 'User rate limit exceeded',
          location: 'request',
          details: { 
            userId: context.userId,
            limit: this.config.rateLimiting.userLimit,
          },
          mitigated: true,
        });
        result.blocked = true;
        result.reason = 'user_rate_limit_exceeded';
        return false;
      }
    }
    
    return true;
  }

  /**
   * Input validation and sanitization
   */
  private async validateAndSanitizeInput(
    request: { headers: Record<string, string>; body?: RequestBody; query?: Record<string, string> },
    context: SecurityContext,
    result: SecurityScanResult
  ): Promise<{ headers: Record<string, string>; body?: RequestBody; query?: Record<string, string> }> {
    const sanitized = { ...request };
    
    // Validate and sanitize query parameters
    if (request.query && this.config.validation.enableInputSanitization) {
      for (const [key, value] of Object.entries(request.query)) {
        const validation = this.securityManager.validateInput(value, 'html', {
          ipAddress: context.ipAddress,
          location: `query.${key}`,
        });
        
        if (!validation.isValid) {
          result.violations.push({
            type: validation.threats.includes('sql_injection_attempt') ? 'sql_injection' : 'xss',
            severity: 'high',
            description: `Malicious input detected in query parameter: ${key}`,
            location: 'query',
            details: { parameter: key, threats: validation.threats },
            mitigated: true,
          });
        }
        
        if (sanitized.query) {
          sanitized.query[key] = validation.sanitized;
        }
        
        result.riskScore += validation.threats.length * 10;
      }
    }
    
    // Validate and sanitize request body
    if (request.body && this.config.validation.enableInputSanitization) {
      const bodyValidation = await this.validateRequestBody(request.body, context);
      result.violations.push(...bodyValidation.violations);
      result.warnings.push(...bodyValidation.warnings);
      result.riskScore += bodyValidation.riskScore;
      sanitized.body = bodyValidation.sanitized;
    }
    
    return sanitized;
  }

  /**
   * Validate request body for security threats
   */
  private async validateRequestBody(
    body: RequestBody,
    context: SecurityContext
  ): Promise<{
    violations: SecurityViolation[];
    warnings: SecurityWarning[];
    riskScore: number;
    sanitized: SanitizedData;
  }> {
    const violations: SecurityViolation[] = [];
    const warnings: SecurityWarning[] = [];
    let riskScore = 0;
    let sanitized = body;
    
    if (typeof body === 'string') {
      // Validate string content
      const validation = this.securityManager.validateInput(body, 'html', {
        ipAddress: context.ipAddress,
        location: 'body',
      });
      
      if (!validation.isValid) {
        validation.threats.forEach(threat => {
          violations.push({
            type: threat.includes('sql') ? 'sql_injection' : 'xss',
            severity: 'high',
            description: `${threat} detected in request body`,
            location: 'body',
            details: { threat },
            mitigated: true,
          });
        });
      }
      
      riskScore += validation.threats.length * 15;
      sanitized = validation.sanitized;
      
    } else if (typeof body === 'object' && body !== null) {
      // Recursively validate object properties
      sanitized = await this.sanitizeObjectRecursively(body, context, violations);
      riskScore = violations.length * 10;
    }
    
    return { violations, warnings, riskScore, sanitized };
  }

  /**
   * Add security headers to response
   */
  private addSecurityHeaders(
    existingHeaders: Record<string, string>,
    context: SecurityContext
  ): Record<string, string> {
    const secureHeaders = { ...existingHeaders };
    
    if (this.config.headers.enableSecurityHeaders) {
      // Strict Transport Security
      if (this.config.headers.enableHSTS) {
        secureHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
      }
      
      // Content Security Policy
      if (this.config.headers.enableCSP) {
        secureHeaders['Content-Security-Policy'] = this.generateCSPHeader(context);
      }
      
      // X-Frame-Options
      if (this.config.headers.enableXFrameOptions) {
        secureHeaders['X-Frame-Options'] = 'DENY';
      }
      
      // X-Content-Type-Options
      if (this.config.headers.enableXContentType) {
        secureHeaders['X-Content-Type-Options'] = 'nosniff';
      }
      
      // Additional security headers
      secureHeaders['X-XSS-Protection'] = '1; mode=block';
      secureHeaders['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      secureHeaders['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';
      
      // Custom headers
      Object.assign(secureHeaders, this.config.headers.customHeaders);
    }
    
    return secureHeaders;
  }

  /**
   * Scan response for data leaks
   */
  private async scanForDataLeaks(
    body: ResponseBody,
    context: SecurityContext
  ): Promise<{
    violations: SecurityViolation[];
    sanitized: ResponseBody;
  }> {
    const violations: SecurityViolation[] = [];
    let sanitized = body;
    
    if (typeof body === 'string') {
      // Check for sensitive patterns
      const sensitivePatterns = [
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
        { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, type: 'credit_card' },
        { pattern: /\b[A-Za-z0-9]{32,}\b/g, type: 'api_key' },
      ];
      
      for (const { pattern, type } of sensitivePatterns) {
        const matches = body.match(pattern);
        if (matches) {
          violations.push({
            type: 'data_leak',
            severity: 'high',
            description: `Potential ${type} leak detected in response`,
            location: 'body',
            details: { 
              type,
              matchCount: matches.length,
              preview: matches[0].substring(0, 10) + '...',
            },
            mitigated: true,
          });
          
          // Mask sensitive data
          sanitized = body.replace(pattern, '[REDACTED]');
        }
      }
    }
    
    return { violations, sanitized };
  }

  /**
   * Create security event for threat detection
   */
  private createSecurityEvent(
    context: SecurityContext,
    request: { headers: Record<string, string>; body?: RequestBody; query?: Record<string, string> }
  ): SecurityEvent {
    return {
      id: `event_${context.requestId}`,
      timestamp: context.timestamp,
      userId: context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      eventType: 'http_request',
      operation: `${context.method} ${context.path}`,
      resource: context.path,
      parameters: {
        headers: request.headers,
        body: request.body,
        query: request.query,
      },
      httpMethod: context.method,
      requestSize: context.contentLength,
      initialRiskScore: context.riskScore,
      correlationId: context.requestId,
      traceId: context.requestId,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // Helper methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractClientIP(headers: Record<string, string>): string {
    return headers['x-forwarded-for']?.split(',')[0] || 
           headers['x-real-ip'] || 
           headers['x-client-ip'] || 
           'unknown';
  }

  private checkRateLimit(
    key: string,
    limit: { requests: number; windowMs: number }
  ): boolean {
    const now = Date.now();
    const counter = this.rateLimitCounters.get(key);
    
    if (!counter || now > counter.resetTime) {
      this.rateLimitCounters.set(key, {
        count: 1,
        resetTime: now + limit.windowMs,
      });
      return true;
    }
    
    if (counter.count >= limit.requests) {
      return false;
    }
    
    counter.count++;
    return true;
  }

  private async validateAuthAndAuthz(
    context: SecurityContext,
    result: SecurityScanResult
  ): Promise<void> {
    // Authentication validation would integrate with actual auth system
    if (!context.isAuthenticated && this.requiresAuthentication(context.path)) {
      result.violations.push({
        type: 'authorization',
        severity: 'high',
        description: 'Authentication required for this resource',
        location: 'request',
        details: { path: context.path },
        mitigated: false,
      });
    }
  }

  private validateCSRFToken(
    headers: Record<string, string>,
    context: SecurityContext,
    result: SecurityScanResult
  ): void {
    if (this.requiresCSRFProtection(context.method, context.path)) {
      const csrfToken = headers['x-csrf-token'];
      if (!csrfToken || !this.validateCSRFTokenValue(csrfToken, context)) {
        result.violations.push({
          type: 'csrf',
          severity: 'high',
          description: 'Invalid or missing CSRF token',
          location: 'header',
          details: { method: context.method, path: context.path },
          mitigated: false,
        });
      }
    }
  }

  private async validateFileUploads(
    body: RequestBody,
    context: SecurityContext,
    result: SecurityScanResult
  ): Promise<void> {
    // File upload validation logic
    if (body && typeof body === 'object' && body.files) {
      // Validate file types, sizes, etc.
    }
  }

  private async sanitizeObjectRecursively(
    obj: Record<string, unknown>,
    context: SecurityContext,
    violations: SecurityViolation[]
  ): Promise<Record<string, unknown>> {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const sanitized: Record<string, unknown> = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const validation = this.securityManager.validateInput(value, 'html', {
          ipAddress: context.ipAddress,
          location: `body.${key}`,
        });
        
        if (!validation.isValid) {
          validation.threats.forEach(threat => {
            violations.push({
              type: threat.includes('sql') ? 'sql_injection' : 'xss',
              severity: 'high',
              description: `${threat} detected in field: ${key}`,
              location: 'body',
              details: { field: key, threat },
              mitigated: true,
            });
          });
        }
        
        sanitized[key] = validation.sanitized;
      } else if (typeof value === 'object') {
        sanitized[key] = await this.sanitizeObjectRecursively(value, context, violations);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private generateCSPHeader(context: SecurityContext): string {
    // Generate dynamic CSP based on context
    return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
  }

  private sanitizeErrorResponse(body: ResponseBody, context: SecurityContext): ResponseBody {
    // Sanitize error responses to prevent information disclosure
    if (typeof body === 'object' && body.error) {
      return {
        error: 'An error occurred',
        code: body.code || 'GENERIC_ERROR',
        timestamp: Date.now(),
      };
    }
    return body;
  }

  private validateResponseContent(
    body: ResponseBody,
    context: SecurityContext
  ): { violations: SecurityViolation[] } {
    // Validate response content
    return { violations: [] };
  }

  private finalizeSecurityResult(
    context: SecurityContext,
    result: SecurityScanResult
  ): void {
    // Determine if request should be blocked
    const criticalViolations = result.violations.filter(v => v.severity === 'critical');
    const highViolations = result.violations.filter(v => v.severity === 'high');
    
    if (criticalViolations.length > 0 || highViolations.length > 2) {
      result.blocked = true;
      result.reason = 'security_violations';
    }
    
    result.passed = !result.blocked && result.violations.length === 0;
    
    // Update context threat level
    if (result.riskScore > 80) {
      context.threatLevel = 'critical';
    } else if (result.riskScore > 60) {
      context.threatLevel = 'high';
    } else if (result.riskScore > 40) {
      context.threatLevel = 'medium';
    } else if (result.riskScore > 20) {
      context.threatLevel = 'low';
    }
  }

  private logSecurityEvent(
    context: SecurityContext,
    result: SecurityScanResult,
    processingTime: number
  ): void {
    const logLevel = result.blocked ? 'warn' : result.violations.length > 0 ? 'info' : 'debug';
    
    log[logLevel]('Security middleware processed request', {
      component: 'security-middleware',
      requestId: context.requestId,
      userId: context.userId,
      method: context.method,
      path: context.path,
      ipAddress: context.ipAddress,
      threatLevel: context.threatLevel,
      riskScore: result.riskScore,
      violationCount: result.violations.length,
      warningCount: result.warnings.length,
      blocked: result.blocked,
      reason: result.reason,
      processingTimeMs: Math.round(processingTime),
    }, result.blocked ? 'SECURITY_REQUEST_BLOCKED' : 'SECURITY_REQUEST_PROCESSED');
  }

  private requiresAuthentication(path: string): boolean {
    // Define paths that require authentication
    const protectedPaths = ['/admin', '/api/user', '/api/properties'];
    return protectedPaths.some(p => path.startsWith(p));
  }

  private requiresCSRFProtection(method: string, path: string): boolean {
    // CSRF protection for state-changing operations
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !path.startsWith('/api/auth');
  }

  private validateCSRFTokenValue(token: string, context: SecurityContext): boolean {
    // CSRF token validation logic
    return token.length >= 32; // Simplified validation
  }
}

export { SecurityMiddleware };
export default SecurityMiddleware;