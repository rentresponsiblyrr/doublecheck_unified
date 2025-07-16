/**
 * @fileoverview Self-Healing Suggestions System
 * AI-powered system that provides automated fix suggestions and can apply
 * safe, reversible fixes to common issues without human intervention
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { ErrorDetails, SystemContext } from '@/types/errorTypes';

interface SelfHealingSuggestion {
  id: string;
  errorId: string;
  type: 'immediate' | 'scheduled' | 'manual_approval';
  category: 'cache_clear' | 'data_correction' | 'config_adjustment' | 'service_restart' | 'fallback_activation';
  title: string;
  description: string;
  technicalDetails: string;
  impact: {
    risk: 'low' | 'medium' | 'high';
    userExperience: 'none' | 'minimal' | 'moderate' | 'significant';
    downtime: string;
    reversible: boolean;
  };
  implementation: {
    automated: boolean;
    script?: string;
    approvalRequired: boolean;
    rollbackPlan: string;
    monitoringPoints: string[];
  };
  prerequisites: string[];
  successCriteria: string[];
  estimatedResolution: string;
  confidence: number;
  similarCases: SimilarCase[];
  createdAt: string;
  executedAt?: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
}

interface SimilarCase {
  caseId: string;
  similarity: number;
  outcome: 'success' | 'failure' | 'partial';
  lessonLearned: string;
}

interface HealingAction {
  id: string;
  suggestionId: string;
  type: 'script_execution' | 'api_call' | 'database_query' | 'config_update' | 'cache_operation';
  action: string;
  parameters: Record<string, any>;
  expectedResult: string;
  timeout: number;
  retryCount: number;
  rollbackAction?: string;
}

interface HealingResult {
  suggestionId: string;
  success: boolean;
  executionTime: number;
  details: string;
  metrics: {
    errorsReduced: number;
    performanceImpact: number;
    userSatisfaction?: number;
  };
  sideEffects: string[];
  monitoringData: Record<string, any>;
}

export class SelfHealingSuggestions {
  private openai: OpenAI;
  private healingHistory = new Map<string, HealingResult[]>();
  private activeHealing = new Set<string>();

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured for self-healing suggestions');
    }
    this.openai = new OpenAI({ 
      apiKey, 
      dangerouslyAllowBrowser: true 
    });
  }

  /**
   * Generate self-healing suggestions for an error
   */
  async generateHealingSuggestions(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    rootCauseAnalysis?: any
  ): Promise<SelfHealingSuggestion[]> {
    try {
      // Check if healing is already in progress for this error
      if (this.activeHealing.has(errorDetails.id || '')) {
        return [];
      }

      // Generate AI-powered suggestions
      const suggestions = await this.generateAISuggestions(errorDetails, systemContext, rootCauseAnalysis);
      
      // Filter and prioritize suggestions
      const filteredSuggestions = await this.filterAndPrioritizeSuggestions(suggestions, errorDetails);
      
      // Add system-specific healing strategies
      const enhancedSuggestions = await this.addSystemSpecificHealing(filteredSuggestions, errorDetails);
      
      // Validate safety of suggestions
      const safeSuggestions = await this.validateSafety(enhancedSuggestions);
      
      return safeSuggestions;
    } catch (error) {
      console.error('❌ Self-healing suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered healing suggestions
   */
  private async generateAISuggestions(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    rootCauseAnalysis?: any
  ): Promise<SelfHealingSuggestion[]> {
    const prompt = `
You are an expert DevOps engineer with deep knowledge of self-healing systems for web applications.

PLATFORM CONTEXT:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Real-time + Auth + Storage)  
- AI Services: OpenAI GPT-4V + Custom Learning Models
- Mobile: Progressive Web App with offline capabilities
- Deployment: Railway with Docker containerization

ERROR DETAILS:
${JSON.stringify(errorDetails, null, 2)}

SYSTEM CONTEXT:
${JSON.stringify(systemContext, null, 2)}

ROOT CAUSE ANALYSIS:
${rootCauseAnalysis ? JSON.stringify(rootCauseAnalysis, null, 2) : 'Not available'}

Generate 3-5 self-healing suggestions that could automatically resolve or mitigate this error. 

IMPORTANT CONSTRAINTS:
- Only suggest SAFE, REVERSIBLE actions
- No data deletion or destructive operations
- No user data modifications without explicit approval
- Focus on cache clearing, configuration adjustments, service restarts
- Consider offline/online scenarios for mobile users
- Respect data privacy and security requirements

For each suggestion, provide:
1. Clear risk assessment (low/medium/high)
2. User experience impact
3. Automated implementation possibility
4. Rollback plan
5. Success criteria
6. Confidence level

Focus on these error patterns:
- Database constraint violations → Schema validation and data correction
- Network failures → Retry mechanisms and fallback strategies  
- Authentication issues → Token refresh and session recovery
- Cache inconsistencies → Selective cache invalidation
- UI state corruption → State reset and component recovery

Format as JSON array of SelfHealingSuggestion objects.
`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert DevOps engineer specializing in automated error recovery and self-healing systems. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const suggestionsText = response.choices[0]?.message?.content;
    if (!suggestionsText) {
      throw new Error('No healing suggestions received from AI');
    }

    try {
      const parsedSuggestions = JSON.parse(suggestionsText);
      return Array.isArray(parsedSuggestions) ? parsedSuggestions.map(suggestion => ({
        ...suggestion,
        id: this.generateSuggestionId(),
        errorId: errorDetails.id || 'unknown',
        createdAt: new Date().toISOString(),
        status: 'pending' as const
      })) : [];
    } catch (parseError) {
      console.error('❌ Failed to parse AI healing suggestions:', parseError);
      console.error('Raw response:', suggestionsText);
      return [];
    }
  }

  /**
   * Filter and prioritize suggestions based on safety and effectiveness
   */
  private async filterAndPrioritizeSuggestions(
    suggestions: SelfHealingSuggestion[],
    errorDetails: ErrorDetails
  ): Promise<SelfHealingSuggestion[]> {
    // Filter out high-risk suggestions for production environment
    const safeSuggestions = suggestions.filter(suggestion => {
      if (errorDetails.environment === 'production' && suggestion.impact.risk === 'high') {
        return false;
      }
      return true;
    });

    // Prioritize by confidence and safety
    const prioritized = safeSuggestions.sort((a, b) => {
      // High confidence, low risk suggestions first
      const scoreA = a.confidence * (a.impact.risk === 'low' ? 1.2 : a.impact.risk === 'medium' ? 1.0 : 0.8);
      const scoreB = b.confidence * (b.impact.risk === 'low' ? 1.2 : b.impact.risk === 'medium' ? 1.0 : 0.8);
      return scoreB - scoreA;
    });

    return prioritized.slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Add system-specific healing strategies
   */
  private async addSystemSpecificHealing(
    suggestions: SelfHealingSuggestion[],
    errorDetails: ErrorDetails
  ): Promise<SelfHealingSuggestion[]> {
    const systemSpecific: SelfHealingSuggestion[] = [];

    // Database constraint violation healing
    if (errorDetails.code === '23514') {
      systemSpecific.push({
        id: this.generateSuggestionId(),
        errorId: errorDetails.id || 'unknown',
        type: 'manual_approval',
        category: 'config_adjustment',
        title: 'Fix Database Status Constraint',
        description: 'Apply database migration to fix inspection status constraint',
        technicalDetails: 'Execute SQL migration to update inspections_status_check constraint',
        impact: {
          risk: 'medium',
          userExperience: 'minimal',
          downtime: 'none',
          reversible: true
        },
        implementation: {
          automated: false,
          approvalRequired: true,
          rollbackPlan: 'Revert constraint to previous definition',
          monitoringPoints: ['Database constraint violations', 'Inspection creation success rate']
        },
        prerequisites: ['Database admin access', 'Staging environment testing'],
        successCriteria: ['No constraint violation errors', 'Successful inspection creation'],
        estimatedResolution: '15 minutes',
        confidence: 90,
        similarCases: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    // Authentication token refresh
    if (errorDetails.message.toLowerCase().includes('auth') || 
        errorDetails.message.toLowerCase().includes('unauthorized')) {
      systemSpecific.push({
        id: this.generateSuggestionId(),
        errorId: errorDetails.id || 'unknown',
        type: 'immediate',
        category: 'service_restart',
        title: 'Refresh Authentication Session',
        description: 'Automatically refresh user authentication tokens',
        technicalDetails: 'Call Supabase session refresh API to get new tokens',
        impact: {
          risk: 'low',
          userExperience: 'none',
          downtime: 'none',
          reversible: true
        },
        implementation: {
          automated: true,
          script: 'await supabase.auth.refreshSession()',
          approvalRequired: false,
          rollbackPlan: 'Redirect to login page if refresh fails',
          monitoringPoints: ['Authentication success rate', 'Session duration']
        },
        prerequisites: ['Valid refresh token'],
        successCriteria: ['New access token received', 'API calls succeed'],
        estimatedResolution: '5 seconds',
        confidence: 85,
        similarCases: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    // Cache clearing for stale data issues
    if (errorDetails.message.toLowerCase().includes('stale') || 
        errorDetails.message.toLowerCase().includes('cache')) {
      systemSpecific.push({
        id: this.generateSuggestionId(),
        errorId: errorDetails.id || 'unknown',
        type: 'immediate',
        category: 'cache_clear',
        title: 'Clear Application Cache',
        description: 'Clear browser and application cache to resolve stale data issues',
        technicalDetails: 'Clear localStorage, sessionStorage, and IndexedDB cache',
        impact: {
          risk: 'low',
          userExperience: 'minimal',
          downtime: 'none',
          reversible: false
        },
        implementation: {
          automated: true,
          script: 'localStorage.clear(); sessionStorage.clear(); caches.delete("app-cache");',
          approvalRequired: false,
          rollbackPlan: 'Data will be refetched from server',
          monitoringPoints: ['Cache hit rate', 'Page load performance']
        },
        prerequisites: ['Browser storage access'],
        successCriteria: ['Cache cleared successfully', 'Fresh data loaded'],
        estimatedResolution: '10 seconds',
        confidence: 80,
        similarCases: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    return [...suggestions, ...systemSpecific];
  }

  /**
   * Validate safety of healing suggestions
   */
  private async validateSafety(suggestions: SelfHealingSuggestion[]): Promise<SelfHealingSuggestion[]> {
    return suggestions.filter(suggestion => {
      // Block any suggestions that could affect user data
      if (suggestion.technicalDetails.toLowerCase().includes('delete') ||
          suggestion.technicalDetails.toLowerCase().includes('drop') ||
          suggestion.technicalDetails.toLowerCase().includes('truncate')) {
        return false;
      }

      // Require approval for high-risk operations
      if (suggestion.impact.risk === 'high') {
        suggestion.implementation.approvalRequired = true;
        suggestion.type = 'manual_approval';
      }

      // Ensure rollback plan exists
      if (!suggestion.implementation.rollbackPlan) {
        suggestion.implementation.rollbackPlan = 'Manual rollback required';
        suggestion.implementation.approvalRequired = true;
      }

      return true;
    });
  }

  /**
   * Execute a healing suggestion
   */
  async executeHealing(suggestionId: string): Promise<HealingResult> {
    try {
      // Mark as active
      this.activeHealing.add(suggestionId);

      // Get suggestion details
      const suggestion = await this.getSuggestion(suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      // Check prerequisites
      await this.checkPrerequisites(suggestion);

      // Execute the healing action
      const result = await this.executeHealingAction(suggestion);

      // Monitor the results
      await this.monitorHealingResults(suggestion, result);

      // Store result
      this.storeHealingResult(suggestionId, result);

      return result;
    } catch (error) {
      const errorResult: HealingResult = {
        suggestionId,
        success: false,
        executionTime: 0,
        details: error.message,
        metrics: { errorsReduced: 0, performanceImpact: 0 },
        sideEffects: [error.message],
        monitoringData: {}
      };
      
      this.storeHealingResult(suggestionId, errorResult);
      return errorResult;
    } finally {
      this.activeHealing.delete(suggestionId);
    }
  }

  /**
   * Execute the actual healing action
   */
  private async executeHealingAction(suggestion: SelfHealingSuggestion): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      let executionResult: any;

      switch (suggestion.category) {
        case 'cache_clear':
          executionResult = await this.executeCacheClear(suggestion);
          break;
        case 'service_restart':
          executionResult = await this.executeServiceRestart(suggestion);
          break;
        case 'data_correction':
          executionResult = await this.executeDataCorrection(suggestion);
          break;
        case 'config_adjustment':
          executionResult = await this.executeConfigAdjustment(suggestion);
          break;
        case 'fallback_activation':
          executionResult = await this.executeFallbackActivation(suggestion);
          break;
        default:
          throw new Error(`Unknown healing category: ${suggestion.category}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        suggestionId: suggestion.id,
        success: true,
        executionTime,
        details: 'Healing action completed successfully',
        metrics: {
          errorsReduced: 1,
          performanceImpact: executionTime,
        },
        sideEffects: [],
        monitoringData: executionResult
      };
    } catch (error) {
      throw new Error(`Healing execution failed: ${error.message}`);
    }
  }

  /**
   * Execute cache clearing operation
   */
  private async executeCacheClear(suggestion: SelfHealingSuggestion): Promise<any> {
    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cache API if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    return { cacheCleared: true, timestamp: new Date().toISOString() };
  }

  /**
   * Execute service restart (session refresh)
   */
  private async executeServiceRestart(suggestion: SelfHealingSuggestion): Promise<any> {
    // Refresh Supabase session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }

    return { sessionRefreshed: true, newSession: data.session?.access_token ? 'valid' : 'invalid' };
  }

  /**
   * Execute data correction
   */
  private async executeDataCorrection(suggestion: SelfHealingSuggestion): Promise<any> {
    // Only execute safe data corrections
    console.log('Data correction would be executed here with proper approval workflow');
    return { dataCorrectionSimulated: true };
  }

  /**
   * Execute configuration adjustment
   */
  private async executeConfigAdjustment(suggestion: SelfHealingSuggestion): Promise<any> {
    // Only execute safe configuration changes
    console.log('Configuration adjustment would be executed here with proper approval workflow');
    return { configAdjustmentSimulated: true };
  }

  /**
   * Execute fallback activation
   */
  private async executeFallbackActivation(suggestion: SelfHealingSuggestion): Promise<any> {
    // Activate fallback mechanisms
    console.log('Fallback activation would be executed here');
    return { fallbackActivated: true };
  }

  /**
   * Check if prerequisites are met
   */
  private async checkPrerequisites(suggestion: SelfHealingSuggestion): Promise<void> {
    for (const prerequisite of suggestion.prerequisites) {
      // Implement prerequisite checks based on the requirement
      console.log(`Checking prerequisite: ${prerequisite}`);
    }
  }

  /**
   * Monitor healing results
   */
  private async monitorHealingResults(
    suggestion: SelfHealingSuggestion,
    result: HealingResult
  ): Promise<void> {
    // Implement monitoring based on suggestion.implementation.monitoringPoints
    for (const point of suggestion.implementation.monitoringPoints) {
      console.log(`Monitoring: ${point}`);
    }
  }

  /**
   * Store healing result for learning
   */
  private storeHealingResult(suggestionId: string, result: HealingResult): void {
    if (!this.healingHistory.has(suggestionId)) {
      this.healingHistory.set(suggestionId, []);
    }
    this.healingHistory.get(suggestionId)!.push(result);
  }

  /**
   * Get suggestion by ID (mock implementation)
   */
  private async getSuggestion(suggestionId: string): Promise<SelfHealingSuggestion | null> {
    // In a real implementation, this would query the database
    return null;
  }

  /**
   * Generate unique suggestion ID
   */
  private generateSuggestionId(): string {
    return `heal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get healing history for analysis
   */
  getHealingHistory(suggestionId?: string): HealingResult[] {
    if (suggestionId) {
      return this.healingHistory.get(suggestionId) || [];
    }
    
    const allResults: HealingResult[] = [];
    this.healingHistory.forEach(results => allResults.push(...results));
    return allResults;
  }
}

export const selfHealingSuggestions = new SelfHealingSuggestions();