/**
 * Advanced Prompt Injection Protection
 * Provides comprehensive validation against malicious AI prompt manipulation
 * 
 * SECURITY: Protects against prompt injection, jailbreaking, and data exfiltration attacks
 */

import { logger } from '../../utils/logger';
import { piiScrubber, PIIDetectionResult } from './pii-scrubber';

export interface ValidationResult {
  isValid: boolean;
  risks: SecurityRisk[];
  sanitizedPrompt: string;
  confidence: number;
  originalLength: number;
  sanitizedLength: number;
  processingTime: number;
}

export interface SecurityRisk {
  type: RiskType;
  severity: RiskSeverity;
  description: string;
  evidence: string[];
  confidence: number;
}

export enum RiskType {
  PROMPT_INJECTION = 'prompt_injection',
  JAILBREAK_ATTEMPT = 'jailbreak_attempt',
  CODE_INJECTION = 'code_injection',
  DATA_EXFILTRATION = 'data_exfiltration',
  EXCESSIVE_LENGTH = 'excessive_length',
  MALFORMED_INPUT = 'malformed_input',
  PII_EXPOSURE = 'pii_exposure',
  SYSTEM_MANIPULATION = 'system_manipulation'
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface SecurityPattern {
  type: RiskType;
  patterns: RegExp[];
  severity: RiskSeverity;
  description: string;
}

export class PromptValidator {
  private static instance: PromptValidator;
  
  private readonly MAX_PROMPT_LENGTH = 8000; // Reasonable limit for costs
  private readonly MAX_TOKENS_ESTIMATE = 2000; // Rough token estimate
  
  private securityPatterns: SecurityPattern[] = [
    // Prompt injection attempts
    {
      type: RiskType.PROMPT_INJECTION,
      patterns: [
        /ignore\s+(?:previous|all|the)\s+(?:instructions?|prompts?|context)/gi,
        /forget\s+(?:everything|all|previous|your)/gi,
        /system\s*[:\-]\s*you\s+are\s+now/gi,
        /override\s+(?:security|safety|rules)/gi,
        /jailbreak\s+mode/gi,
        /act\s+as\s+(?:if|though)\s+you\s+are/gi
      ],
      severity: RiskSeverity.HIGH,
      description: 'Potential prompt injection attack detected'
    },
    
    // Jailbreak attempts
    {
      type: RiskType.JAILBREAK_ATTEMPT,
      patterns: [
        /(?:DAN|developer\s+mode|god\s+mode)/gi,
        /simulate\s+(?:unrestricted|uncensored|unfiltered)/gi,
        /pretend\s+(?:you|there)\s+(?:are\s+)?no\s+(?:rules|limits|restrictions)/gi,
        /roleplay\s+as\s+(?:an?\s+)?(?:unrestricted|unethical)/gi,
        /break\s+(?:character|protocol|guidelines)/gi
      ],
      severity: RiskSeverity.CRITICAL,
      description: 'Jailbreak attempt detected'
    },
    
    // Code injection
    {
      type: RiskType.CODE_INJECTION,
      patterns: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript\s*:/gi,
        /eval\s*\(/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /subprocess\s*\./gi,
        /import\s+os/gi,
        /require\s*\(['"]/gi
      ],
      severity: RiskSeverity.HIGH,
      description: 'Code injection attempt detected'
    },
    
    // Data exfiltration attempts
    {
      type: RiskType.DATA_EXFILTRATION,
      patterns: [
        /show\s+me\s+(?:all|your|the)\s+(?:data|information|users|passwords)/gi,
        /list\s+(?:all|every)\s+(?:users?|accounts?|passwords?|keys?)/gi,
        /export\s+(?:database|user\s+data|all\s+data)/gi,
        /reveal\s+(?:secrets?|keys?|tokens?|credentials?)/gi,
        /tell\s+me\s+about\s+other\s+(?:users?|customers?|inspections?)/gi
      ],
      severity: RiskSeverity.CRITICAL,
      description: 'Data exfiltration attempt detected'
    },
    
    // System manipulation
    {
      type: RiskType.SYSTEM_MANIPULATION,
      patterns: [
        /change\s+your\s+(?:behavior|personality|rules)/gi,
        /modify\s+(?:system|settings|configuration)/gi,
        /access\s+(?:admin|root|system)\s+(?:mode|panel|functions)/gi,
        /escalate\s+(?:privileges?|permissions?)/gi,
        /sudo\s+/gi,
        /administrator\s+mode/gi
      ],
      severity: RiskSeverity.HIGH,
      description: 'System manipulation attempt detected'
    }
  ];

  private constructor() {
    logger.info('Prompt validator initialized with security patterns', {
      patternsCount: this.securityPatterns.length,
      maxLength: this.MAX_PROMPT_LENGTH
    }, 'PROMPT_VALIDATOR');
  }

  static getInstance(): PromptValidator {
    if (!PromptValidator.instance) {
      PromptValidator.instance = new PromptValidator();
    }
    return PromptValidator.instance;
  }

  /**
   * Comprehensive prompt validation and sanitization
   */
  validatePrompt(
    prompt: string, 
    context?: { 
      userId?: string; 
      source?: string; 
      inspectionId?: string 
    }
  ): ValidationResult {
    const startTime = Date.now();
    const originalLength = prompt?.length || 0;
    
    // Basic input validation
    if (!prompt || typeof prompt !== 'string') {
      return this.createInvalidResult('Empty or invalid prompt', startTime, originalLength);
    }

    if (originalLength === 0) {
      return this.createInvalidResult('Empty prompt not allowed', startTime, originalLength);
    }

    // Length validation
    if (originalLength > this.MAX_PROMPT_LENGTH) {
      return this.createInvalidResult(
        `Prompt too long: ${originalLength} > ${this.MAX_PROMPT_LENGTH}`,
        startTime,
        originalLength,
        RiskType.EXCESSIVE_LENGTH,
        RiskSeverity.MEDIUM
      );
    }

    const risks: SecurityRisk[] = [];
    let sanitizedPrompt = prompt;

    // 1. PII Detection and Scrubbing
    const piiResult = piiScrubber.scrubText(prompt, {
      source: context?.source || 'prompt_validation',
      userId: context?.userId
    });

    if (piiResult.hasPII) {
      risks.push({
        type: RiskType.PII_EXPOSURE,
        severity: RiskSeverity.HIGH,
        description: 'PII detected in prompt',
        evidence: piiResult.detectedTypes,
        confidence: piiResult.confidence
      });
      sanitizedPrompt = piiResult.scrubbedText;
    }

    // 2. Security Pattern Detection
    for (const securityPattern of this.securityPatterns) {
      const evidence: string[] = [];
      
      for (const pattern of securityPattern.patterns) {
        const matches = sanitizedPrompt.match(pattern);
        if (matches) {
          evidence.push(...matches);
        }
      }
      
      if (evidence.length > 0) {
        risks.push({
          type: securityPattern.type,
          severity: securityPattern.severity,
          description: securityPattern.description,
          evidence,
          confidence: this.calculatePatternConfidence(evidence, securityPattern)
        });
        
        // Remove malicious patterns
        for (const pattern of securityPattern.patterns) {
          sanitizedPrompt = sanitizedPrompt.replace(pattern, '[REMOVED_SECURITY_RISK]');
        }
      }
    }

    // 3. Additional heuristic checks
    this.performHeuristicChecks(sanitizedPrompt, risks);

    // 4. Final sanitization
    sanitizedPrompt = this.performFinalSanitization(sanitizedPrompt);

    const processingTime = Date.now() - startTime;
    const sanitizedLength = sanitizedPrompt.length;

    // Determine overall validity
    const criticalRisks = risks.filter(r => r.severity === RiskSeverity.CRITICAL);
    const highRisks = risks.filter(r => r.severity === RiskSeverity.HIGH);
    
    const isValid = criticalRisks.length === 0 && highRisks.length <= 1;

    // Calculate confidence
    const confidence = this.calculateOverallConfidence(risks, originalLength, sanitizedLength);

    // Log validation result
    this.logValidationResult({
      isValid,
      risks,
      originalLength,
      sanitizedLength,
      processingTime,
      userId: context?.userId,
      source: context?.source,
      inspectionId: context?.inspectionId
    });

    return {
      isValid,
      risks,
      sanitizedPrompt,
      confidence,
      originalLength,
      sanitizedLength,
      processingTime
    };
  }

  /**
   * Quick validation for simple use cases
   */
  isPromptSafe(prompt: string): boolean {
    const result = this.validatePrompt(prompt);
    return result.isValid;
  }

  /**
   * Validate and sanitize prompts for batch processing
   */
  validateBatch(prompts: string[], context?: { userId?: string; source?: string }): ValidationResult[] {
    return prompts.map(prompt => this.validatePrompt(prompt, context));
  }

  private createInvalidResult(
    reason: string, 
    startTime: number, 
    originalLength: number,
    riskType: RiskType = RiskType.MALFORMED_INPUT,
    severity: RiskSeverity = RiskSeverity.HIGH
  ): ValidationResult {
    return {
      isValid: false,
      risks: [{
        type: riskType,
        severity,
        description: reason,
        evidence: [reason],
        confidence: 100
      }],
      sanitizedPrompt: '',
      confidence: 0,
      originalLength,
      sanitizedLength: 0,
      processingTime: Date.now() - startTime
    };
  }

  private performHeuristicChecks(prompt: string, risks: SecurityRisk[]): void {
    // Check for excessive repetition (possible attack)
    const words = prompt.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Only count meaningful words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    const maxRepetition = Math.max(...Array.from(wordCounts.values()));
    if (maxRepetition > 10) {
      risks.push({
        type: RiskType.MALFORMED_INPUT,
        severity: RiskSeverity.MEDIUM,
        description: 'Excessive word repetition detected',
        evidence: [`Max repetition: ${maxRepetition}`],
        confidence: 80
      });
    }
    
    // Check for unusual character patterns
    const specialCharRatio = (prompt.match(/[^a-zA-Z0-9\s.,!?-]/g) || []).length / prompt.length;
    if (specialCharRatio > 0.3) {
      risks.push({
        type: RiskType.MALFORMED_INPUT,
        severity: RiskSeverity.LOW,
        description: 'High special character ratio',
        evidence: [`Ratio: ${(specialCharRatio * 100).toFixed(1)}%`],
        confidence: 60
      });
    }
  }

  private performFinalSanitization(prompt: string): string {
    // Remove any remaining problematic patterns
    return prompt
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, this.MAX_PROMPT_LENGTH); // Ensure length limit
  }

  private calculatePatternConfidence(evidence: string[], pattern: SecurityPattern): number {
    // Base confidence on pattern severity and evidence count
    const baseConfidence = {
      [RiskSeverity.LOW]: 60,
      [RiskSeverity.MEDIUM]: 75,
      [RiskSeverity.HIGH]: 90,
      [RiskSeverity.CRITICAL]: 95
    }[pattern.severity];
    
    // Increase confidence with more evidence
    const evidenceBonus = Math.min(evidence.length * 5, 20);
    
    return Math.min(baseConfidence + evidenceBonus, 100);
  }

  private calculateOverallConfidence(
    risks: SecurityRisk[], 
    originalLength: number, 
    sanitizedLength: number
  ): number {
    if (risks.length === 0) {
      return 95; // High confidence for clean prompts
    }
    
    const highRiskCount = risks.filter(r => 
      r.severity === RiskSeverity.HIGH || r.severity === RiskSeverity.CRITICAL
    ).length;
    
    const reductionRatio = (originalLength - sanitizedLength) / originalLength;
    
    // Lower confidence for high-risk content and significant changes
    const confidence = 100 - (highRiskCount * 15) - (reductionRatio * 30);
    
    return Math.max(confidence, 0);
  }

  private logValidationResult(result: {
    isValid: boolean;
    risks: SecurityRisk[];
    originalLength: number;
    sanitizedLength: number;
    processingTime: number;
    userId?: string;
    source?: string;
    inspectionId?: string;
  }): void {
    const logLevel = result.isValid ? 'info' : 'warn';
    const riskSummary = result.risks.map(r => `${r.type}:${r.severity}`).join(', ');
    
    logger[logLevel]('Prompt validation completed', {
      isValid: result.isValid,
      riskCount: result.risks.length,
      risks: riskSummary,
      originalLength: result.originalLength,
      sanitizedLength: result.sanitizedLength,
      reductionPercent: ((result.originalLength - result.sanitizedLength) / result.originalLength * 100).toFixed(1),
      processingTime: result.processingTime,
      userId: result.userId,
      source: result.source,
      inspectionId: result.inspectionId
    }, 'PROMPT_VALIDATION');
  }

  /**
   * Get validation statistics for monitoring
   */
  getStats(): {
    patternsCount: number;
    maxPromptLength: number;
    supportedRiskTypes: RiskType[];
    lastUpdate: string;
  } {
    return {
      patternsCount: this.securityPatterns.reduce((sum, pattern) => sum + pattern.patterns.length, 0),
      maxPromptLength: this.MAX_PROMPT_LENGTH,
      supportedRiskTypes: Object.values(RiskType),
      lastUpdate: new Date().toISOString()
    };
  }
}

// Singleton export
export const promptValidator = PromptValidator.getInstance();