/**
 * PII Scrubbing Service for AI Data Processing
 * Removes sensitive personally identifiable information before sending data to AI services
 * 
 * SECURITY: This service ensures compliance with GDPR Article 6 and data minimization principles
 */

import { logger } from '../../utils/logger';

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: PIIType[];
  scrubbedText: string;
  confidence: number;
  originalLength: number;
  scrubbedLength: number;
}

export enum PIIType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  ADDRESS = 'address',
  NAME = 'name',
  IP_ADDRESS = 'ip_address',
  URL_WITH_TOKEN = 'url_with_token',
  API_KEY = 'api_key',
  CUSTOM = 'custom'
}

interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  replacement: string;
  confidence: number;
}

export class PIIScrubber {
  private static instance: PIIScrubber;
  
  private patterns: PIIPattern[] = [
    // Email addresses
    {
      type: PIIType.EMAIL,
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      confidence: 95
    },
    
    // Phone numbers (various formats)
    {
      type: PIIType.PHONE,
      regex: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      replacement: '[PHONE_REDACTED]',
      confidence: 90
    },
    
    // SSN patterns
    {
      type: PIIType.SSN,
      regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
      confidence: 95
    },
    
    // Credit card numbers (basic patterns)
    {
      type: PIIType.CREDIT_CARD,
      regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
      confidence: 85
    },
    
    // IP addresses
    {
      type: PIIType.IP_ADDRESS,
      regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      replacement: '[IP_REDACTED]',
      confidence: 80
    },
    
    // URLs with tokens or sensitive parameters
    {
      type: PIIType.URL_WITH_TOKEN,
      regex: /https?:\/\/[^\s]+(?:token|key|secret|auth|api)[^\s]*/gi,
      replacement: '[URL_WITH_TOKEN_REDACTED]',
      confidence: 90
    },
    
    // API keys (common patterns)
    {
      type: PIIType.API_KEY,
      regex: /(?:sk-|pk_|rk_)[A-Za-z0-9]{20,}/g,
      replacement: '[API_KEY_REDACTED]',
      confidence: 98
    }
  ];

  private constructor() {
    logger.info('PII Scrubber initialized with security patterns', {}, 'PII_SCRUBBER');
  }

  static getInstance(): PIIScrubber {
    if (!PIIScrubber.instance) {
      PIIScrubber.instance = new PIIScrubber();
    }
    return PIIScrubber.instance;
  }

  /**
   * Scrub PII from text before sending to AI services
   */
  scrubText(text: string, context?: { source?: string; userId?: string }): PIIDetectionResult {
    if (!text || typeof text !== 'string') {
      return {
        hasPII: false,
        detectedTypes: [],
        scrubbedText: text || '',
        confidence: 100,
        originalLength: 0,
        scrubbedLength: 0
      };
    }

    const originalLength = text.length;
    let scrubbedText = text;
    const detectedTypes: PIIType[] = [];
    let maxConfidence = 0;

    // Apply each PII pattern
    for (const pattern of this.patterns) {
      const matches = scrubbedText.match(pattern.regex);
      if (matches && matches.length > 0) {
        detectedTypes.push(pattern.type);
        scrubbedText = scrubbedText.replace(pattern.regex, pattern.replacement);
        maxConfidence = Math.max(maxConfidence, pattern.confidence);
        
        // Log PII detection for security audit
        logger.warn('PII detected and scrubbed', {
          type: pattern.type,
          matchCount: matches.length,
          source: context?.source,
          userId: context?.userId,
          confidence: pattern.confidence
        }, 'PII_DETECTION');
      }
    }

    // Additional name detection (basic heuristic)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    if (namePattern.test(scrubbedText)) {
      const nameMatches = scrubbedText.match(namePattern);
      if (nameMatches && nameMatches.length > 0) {
        // Only scrub if it looks like a real name (not property names, etc.)
        const suspiciousNames = nameMatches.filter(name => 
          !name.includes('Property') && 
          !name.includes('Rental') &&
          !name.includes('Suite') &&
          name.length > 5
        );
        
        if (suspiciousNames.length > 0) {
          detectedTypes.push(PIIType.NAME);
          scrubbedText = scrubbedText.replace(namePattern, '[NAME_REDACTED]');
          maxConfidence = Math.max(maxConfidence, 70);
        }
      }
    }

    const result: PIIDetectionResult = {
      hasPII: detectedTypes.length > 0,
      detectedTypes,
      scrubbedText,
      confidence: maxConfidence,
      originalLength,
      scrubbedLength: scrubbedText.length
    };

    // Log scrubbing result for compliance audit
    if (result.hasPII) {
      logger.info('PII scrubbing completed', {
        detectedTypes: result.detectedTypes,
        originalLength: result.originalLength,
        scrubbedLength: result.scrubbedLength,
        reductionPercent: ((result.originalLength - result.scrubbedLength) / result.originalLength * 100).toFixed(1),
        source: context?.source
      }, 'PII_SCRUBBING');
    }

    return result;
  }

  /**
   * Scrub PII from objects (recursive)
   */
  scrubObject(
    obj: unknown, 
    context?: { source?: string; userId?: string }
  ): unknown {
    if (typeof obj === 'string') {
      return this.scrubText(obj, context).scrubbedText;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubObject(item, context));
    }
    
    if (obj && typeof obj === 'object') {
      const scrubbed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip certain fields that should never be scrubbed
        if (this.isExemptField(key)) {
          scrubbed[key] = value;
        } else {
          scrubbed[key] = this.scrubObject(value, context);
        }
      }
      return scrubbed;
    }
    
    return obj;
  }

  /**
   * Check if a field should be exempt from PII scrubbing
   */
  private isExemptField(fieldName: string): boolean {
    const exemptFields = [
      'id',
      'uuid',
      'timestamp',
      'created_at',
      'updated_at',
      'property_id',
      'inspection_id',
      'status',
      'type',
      'category',
      'version',
      'hash'
    ];
    
    return exemptFields.includes(fieldName.toLowerCase());
  }

  /**
   * Validate that data is safe to send to AI services
   */
  validateDataForAI(
    data: unknown, 
    source: string
  ): { safe: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (typeof data === 'string') {
      const result = this.scrubText(data, { source });
      if (result.hasPII) {
        issues.push(`PII detected: ${result.detectedTypes.join(', ')}`);
      }
    } else if (typeof data === 'object') {
      // Check for common problematic fields
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
      const checkObject = (obj: unknown, path: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Check field names
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
              issues.push(`Sensitive field detected: ${currentPath}`);
            }
            
            // Recursively check values
            if (typeof value === 'string') {
              const result = this.scrubText(value, { source });
              if (result.hasPII) {
                issues.push(`PII in field ${currentPath}: ${result.detectedTypes.join(', ')}`);
              }
            } else if (typeof value === 'object') {
              checkObject(value, currentPath);
            }
          }
        }
      };
      
      checkObject(data);
    }
    
    return {
      safe: issues.length === 0,
      issues
    };
  }

  /**
   * Get scrubbing statistics for compliance reporting
   */
  getStats(): {
    patternsCount: number;
    supportedTypes: PIIType[];
    lastUpdate: string;
  } {
    return {
      patternsCount: this.patterns.length,
      supportedTypes: this.patterns.map(p => p.type),
      lastUpdate: new Date().toISOString()
    };
  }
}

// Singleton export
export const piiScrubber = PIIScrubber.getInstance();