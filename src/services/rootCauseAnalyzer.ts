/**
 * @fileoverview Automated Root Cause Analysis System
 * AI-powered system that analyzes error patterns, code context, and system state
 * to automatically identify root causes of bugs and suggest fixes
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { ErrorDetails, ErrorPattern, SystemContext } from '@/types/errorTypes';

interface RootCauseAnalysis {
  confidence: number;
  category: 'database' | 'frontend' | 'authentication' | 'api' | 'configuration' | 'infrastructure';
  rootCause: string;
  technicalExplanation: string;
  userImpact: string;
  suggestedFixes: SuggestedFix[];
  relatedErrors: string[];
  preventionStrategies: string[];
}

interface SuggestedFix {
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  codeChanges?: CodeChange[];
  configChanges?: ConfigChange[];
  estimatedEffort: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CodeChange {
  file: string;
  description: string;
  example: string;
}

interface ConfigChange {
  component: string;
  setting: string;
  value: string;
  description: string;
}

export class RootCauseAnalyzer {
  private openai: OpenAI;
  private analysisCache = new Map<string, RootCauseAnalysis>();

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured for root cause analysis');
    }
    this.openai = new OpenAI({ 
      apiKey, 
      dangerouslyAllowBrowser: true 
    });
  }

  /**
   * Analyze error details and system context to determine root cause
   */
  async analyzeRootCause(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    relatedErrors: ErrorPattern[] = []
  ): Promise<RootCauseAnalysis> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(errorDetails, systemContext);
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey)!;
      }

      // Gather comprehensive context
      const analysisContext = await this.gatherAnalysisContext(errorDetails, systemContext, relatedErrors);
      
      // Perform AI-powered root cause analysis
      const analysis = await this.performAIAnalysis(analysisContext);
      
      // Enhance with system-specific insights
      const enhancedAnalysis = await this.enhanceWithSystemInsights(analysis, errorDetails);
      
      // Cache the result
      this.analysisCache.set(cacheKey, enhancedAnalysis);
      
      // Store analysis for learning
      await this.storeAnalysisForLearning(errorDetails, enhancedAnalysis);
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('❌ Root cause analysis failed:', error);
      return this.getFallbackAnalysis(errorDetails);
    }
  }

  /**
   * Gather comprehensive context for analysis
   */
  private async gatherAnalysisContext(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    relatedErrors: ErrorPattern[]
  ): Promise<string> {
    const context = {
      error: {
        message: errorDetails.message,
        stack: errorDetails.stack,
        code: errorDetails.code,
        type: errorDetails.type,
        frequency: errorDetails.frequency,
        affectedUsers: errorDetails.affectedUsers,
        firstSeen: errorDetails.firstSeen,
        lastSeen: errorDetails.lastSeen
      },
      system: {
        browser: systemContext.browser,
        os: systemContext.os,
        url: systemContext.url,
        userAgent: systemContext.userAgent,
        timestamp: systemContext.timestamp,
        sessionId: systemContext.sessionId
      },
      patterns: relatedErrors.map(err => ({
        pattern: err.pattern,
        frequency: err.frequency,
        correlation: err.correlation
      })),
      recentChanges: await this.getRecentSystemChanges(),
      databaseHealth: await this.getDatabaseHealthMetrics(),
      systemMetrics: await this.getSystemMetrics()
    };

    return JSON.stringify(context, null, 2);
  }

  /**
   * Perform AI-powered analysis using OpenAI
   */
  private async performAIAnalysis(context: string): Promise<RootCauseAnalysis> {
    const prompt = `
You are an expert software engineer analyzing a production bug in an AI-powered vacation rental inspection platform. 

SYSTEM ARCHITECTURE:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Real-time + Auth + Storage)
- AI Services: OpenAI GPT-4V + Custom Learning Models
- Mobile: Progressive Web App with offline capabilities
- Deployment: Railway with Docker containerization

CONTEXT:
${context}

Please provide a comprehensive root cause analysis following this structure:

1. CONFIDENCE LEVEL (0-100): How confident are you in this analysis?

2. CATEGORY: Choose the most likely category:
   - database: Database constraints, queries, connections, RLS policies
   - frontend: React components, state management, UI/UX issues
   - authentication: Supabase auth, user sessions, permissions
   - api: API calls, network requests, external services
   - configuration: Environment variables, build configs, deployment
   - infrastructure: Railway deployment, server resources, networking

3. ROOT CAUSE: One-sentence summary of the underlying issue

4. TECHNICAL EXPLANATION: Detailed technical explanation of what's happening

5. USER IMPACT: How this affects the end users' experience

6. SUGGESTED FIXES: Provide 3-5 fixes in order of priority:
   - Type: immediate/short_term/long_term
   - Priority: critical/high/medium/low
   - Description: What to do
   - Code changes: Specific file and code examples if applicable
   - Config changes: Specific configuration changes if applicable
   - Estimated effort: Time estimate
   - Risk level: low/medium/high

7. RELATED ERRORS: List any error patterns that might be related

8. PREVENTION STRATEGIES: How to prevent similar issues in the future

Format your response as valid JSON matching the RootCauseAnalysis interface.
`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert software engineer specializing in production bug analysis and root cause identification. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No analysis response received from AI');
    }

    try {
      return JSON.parse(analysisText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI analysis response:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error('Invalid JSON response from AI analysis');
    }
  }

  /**
   * Enhance analysis with system-specific insights
   */
  private async enhanceWithSystemInsights(
    analysis: RootCauseAnalysis,
    errorDetails: ErrorDetails
  ): Promise<RootCauseAnalysis> {
    // Add STR Certified specific enhancements
    const enhancements = {
      // Add inspection-specific context if error relates to inspections
      inspectionContext: await this.getInspectionContext(errorDetails),
      
      // Add property-specific context if error relates to properties
      propertyContext: await this.getPropertyContext(errorDetails),
      
      // Add AI service health if error relates to AI features
      aiServiceHealth: await this.getAIServiceHealth(errorDetails)
    };

    // Enhance suggested fixes with system-specific recommendations
    const enhancedFixes = analysis.suggestedFixes.map(fix => ({
      ...fix,
      systemSpecificNotes: this.addSystemSpecificNotes(fix, errorDetails)
    }));

    return {
      ...analysis,
      suggestedFixes: enhancedFixes,
      systemInsights: enhancements
    } as RootCauseAnalysis;
  }

  /**
   * Get recent system changes that might be related
   */
  private async getRecentSystemChanges(): Promise<any[]> {
    try {
      // In a real system, this would check git commits, deployments, config changes
      // For now, return placeholder data
      return [
        {
          type: 'deployment',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Updated inspection creation logic'
        },
        {
          type: 'config',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          description: 'Database migration for status constraints'
        }
      ];
    } catch (error) {
      console.error('❌ Failed to get recent changes:', error);
      return [];
    }
  }

  /**
   * Get database health metrics
   */
  private async getDatabaseHealthMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('pg_stat_database')
        .select('numbackends, xact_commit, xact_rollback')
        .limit(1);

      if (error) throw error;

      return {
        activeConnections: data?.[0]?.numbackends || 0,
        successfulTransactions: data?.[0]?.xact_commit || 0,
        rolledBackTransactions: data?.[0]?.xact_rollback || 0,
        healthStatus: 'healthy' // Simplified for now
      };
    } catch (error) {
      return {
        healthStatus: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get system performance metrics
   */
  private async getSystemMetrics(): Promise<any> {
    return {
      memoryUsage: this.getMemoryUsage(),
      performanceMetrics: this.getPerformanceMetrics(),
      networkHealth: 'stable' // Simplified for now
    };
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8 ? 'high' : 'normal'
      };
    }
    return { available: false };
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): any {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        networkLatency: navigation.responseStart - navigation.requestStart
      };
    }
    return { available: false };
  }

  /**
   * Get inspection-related context
   */
  private async getInspectionContext(errorDetails: ErrorDetails): Promise<any> {
    if (!errorDetails.message.toLowerCase().includes('inspection')) {
      return null;
    }

    try {
      const { count: totalInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true });

      const { count: failedInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        totalInspections,
        recentFailures: failedInspections,
        failureRate: failedInspections / Math.max(totalInspections, 1)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get property-related context
   */
  private async getPropertyContext(errorDetails: ErrorDetails): Promise<any> {
    if (!errorDetails.message.toLowerCase().includes('property')) {
      return null;
    }

    try {
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      return {
        totalProperties,
        avgPropertiesPerUser: totalProperties / 10 // Simplified calculation
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get AI service health
   */
  private async getAIServiceHealth(errorDetails: ErrorDetails): Promise<any> {
    if (!errorDetails.message.toLowerCase().includes('ai')) {
      return null;
    }

    return {
      openaiStatus: 'operational', // Would check actual status
      lastSuccessfulCall: new Date().toISOString(),
      rateLimitStatus: 'normal'
    };
  }

  /**
   * Add system-specific notes to fixes
   */
  private addSystemSpecificNotes(fix: SuggestedFix, errorDetails: ErrorDetails): string[] {
    const notes: string[] = [];

    if (fix.type === 'immediate' && errorDetails.code === '23514') {
      notes.push('Database constraint issue - requires immediate SQL migration');
      notes.push('Test in staging environment first');
    }

    if (fix.category === 'database') {
      notes.push('Coordinate with DBA for production changes');
      notes.push('Backup database before applying fixes');
    }

    return notes;
  }

  /**
   * Store analysis for machine learning improvements
   */
  private async storeAnalysisForLearning(
    errorDetails: ErrorDetails,
    analysis: RootCauseAnalysis
  ): Promise<void> {
    try {
      await supabase
        .from('root_cause_analyses')
        .insert({
          error_message: errorDetails.message,
          error_code: errorDetails.code,
          analysis_confidence: analysis.confidence,
          root_cause_category: analysis.category,
          root_cause: analysis.rootCause,
          suggested_fixes: analysis.suggestedFixes,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Failed to store analysis for learning:', error);
    }
  }

  /**
   * Generate cache key for analysis
   */
  private generateCacheKey(errorDetails: ErrorDetails, systemContext: SystemContext): string {
    return `${errorDetails.message}-${errorDetails.code}-${systemContext.url}`.slice(0, 100);
  }

  /**
   * Provide fallback analysis when AI analysis fails
   */
  private getFallbackAnalysis(errorDetails: ErrorDetails): RootCauseAnalysis {
    return {
      confidence: 30,
      category: 'frontend',
      rootCause: 'Unable to perform automated analysis - manual investigation required',
      technicalExplanation: 'The automated root cause analysis system encountered an error. Manual investigation is recommended.',
      userImpact: 'Users may experience degraded functionality',
      suggestedFixes: [
        {
          type: 'immediate',
          priority: 'high',
          description: 'Investigate error manually using available logs and context',
          estimatedEffort: '2-4 hours',
          riskLevel: 'low'
        }
      ],
      relatedErrors: [],
      preventionStrategies: [
        'Improve error logging and monitoring',
        'Add more comprehensive error context collection'
      ]
    };
  }
}

export const rootCauseAnalyzer = new RootCauseAnalyzer();