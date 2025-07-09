// AI Decision Logger Service for STR Certified
// Tracks AI decisions, reasoning, and context for multi-AI collaboration

import { logger } from '../../utils/logger';
import { supabase } from '../supabase';
import { errorReporter } from '../monitoring/error-reporter';

// AI Decision Types
export interface AIDecision {
  id: string;
  timestamp: string;
  session_id: string;
  ai_agent: string; // e.g., "claude-sonnet-4", "gpt-4", etc.
  decision_type: AIDecisionType;
  action: string;
  context: AIDecisionContext;
  reasoning: string;
  confidence: number; // 0-100
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_files: string[];
  related_decisions: string[]; // IDs of related decisions
  outcomes?: AIDecisionOutcome[];
  metadata: Record<string, any>;
}

export type AIDecisionType = 
  | 'code_creation'
  | 'code_modification'
  | 'code_deletion'
  | 'architectural_choice'
  | 'bug_fix'
  | 'refactoring'
  | 'security_enhancement'
  | 'performance_optimization'
  | 'testing_strategy'
  | 'documentation_update'
  | 'dependency_change'
  | 'configuration_change'
  | 'database_schema_change'
  | 'api_design'
  | 'user_interface_change'
  | 'business_logic_change'
  | 'integration_change'
  | 'deployment_change'
  | 'monitoring_setup'
  | 'error_handling'
  | 'data_migration'
  | 'workflow_optimization'
  | 'technical_debt_resolution';

export interface AIDecisionContext {
  user_request: string;
  system_state: string;
  available_information: string[];
  constraints: string[];
  assumptions: string[];
  alternatives_considered: string[];
  risks_identified: string[];
  dependencies: string[];
  success_criteria: string[];
  rollback_plan?: string;
}

export interface AIDecisionOutcome {
  timestamp: string;
  outcome_type: 'success' | 'failure' | 'partial_success' | 'needs_review';
  description: string;
  metrics?: Record<string, number>;
  follow_up_actions?: string[];
  lessons_learned?: string[];
}

export interface AIHandoffContext {
  session_id: string;
  timestamp: string;
  ai_agent: string;
  next_ai_agent?: string;
  current_state: string;
  incomplete_tasks: string[];
  important_decisions: string[];
  context_for_next_ai: string;
  technical_debt_identified: string[];
  recommendations: string[];
  warnings: string[];
}

export interface AIDecisionQuery {
  session_id?: string;
  ai_agent?: string;
  decision_type?: AIDecisionType;
  date_range?: {
    start: string;
    end: string;
  };
  impact_level?: AIDecision['impact_level'];
  files?: string[];
  limit?: number;
}

export class AIDecisionLogger {
  private static instance: AIDecisionLogger;
  private decisions: AIDecision[] = [];
  private currentSessionId: string;
  private currentAIAgent: string;
  private handoffContext: AIHandoffContext | null = null;
  private maxLocalDecisions = 500;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.currentSessionId = this.generateSessionId();
    this.currentAIAgent = this.detectAIAgent();
    this.startFlushTimer();
  }

  static getInstance(): AIDecisionLogger {
    if (!AIDecisionLogger.instance) {
      AIDecisionLogger.instance = new AIDecisionLogger();
    }
    return AIDecisionLogger.instance;
  }

  /**
   * Log a new AI decision with full context
   */
  async logDecision(decision: Omit<AIDecision, 'id' | 'timestamp' | 'session_id' | 'ai_agent'>): Promise<string> {
    const decisionId = this.generateDecisionId();
    
    const fullDecision: AIDecision = {
      id: decisionId,
      timestamp: new Date().toISOString(),
      session_id: this.currentSessionId,
      ai_agent: this.currentAIAgent,
      ...decision
    };

    // Add to local cache
    this.decisions.push(fullDecision);

    // Maintain local cache size
    if (this.decisions.length > this.maxLocalDecisions) {
      this.decisions = this.decisions.slice(-this.maxLocalDecisions);
    }

    // Log to regular logger for development
    logger.info(`AI Decision: ${decision.action}`, {
      decision_id: decisionId,
      type: decision.decision_type,
      impact: decision.impact_level,
      confidence: decision.confidence,
      files: decision.affected_files,
      reasoning: decision.reasoning.substring(0, 200) + '...'
    }, 'AI_DECISION');

    try {
      // Flush immediately for critical decisions
      if (decision.impact_level === 'critical') {
        await this.flushToDatabase([fullDecision]);
      }
    } catch (error) {
      errorReporter.reportError(error, {
        context: 'AI_DECISION_LOGGING',
        decision_id: decisionId,
        decision_type: decision.decision_type
      });
    }

    return decisionId;
  }

  /**
   * Log a simple decision with minimal context
   */
  async logSimpleDecision(
    action: string,
    decision_type: AIDecisionType,
    reasoning: string,
    affected_files: string[] = [],
    impact_level: AIDecision['impact_level'] = 'medium'
  ): Promise<string> {
    return this.logDecision({
      decision_type,
      action,
      context: {
        user_request: 'Not specified',
        system_state: 'Current state at time of decision',
        available_information: ['System analysis', 'Code review'],
        constraints: [],
        assumptions: [],
        alternatives_considered: [],
        risks_identified: [],
        dependencies: [],
        success_criteria: []
      },
      reasoning,
      confidence: 85, // Default confidence
      impact_level,
      affected_files,
      related_decisions: [],
      metadata: {}
    });
  }

  /**
   * Update decision outcome
   */
  async updateDecisionOutcome(
    decisionId: string,
    outcome: AIDecisionOutcome
  ): Promise<void> {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (decision) {
      if (!decision.outcomes) {
        decision.outcomes = [];
      }
      decision.outcomes.push(outcome);

      // Log outcome
      logger.info(`Decision outcome updated: ${outcome.outcome_type}`, {
        decision_id: decisionId,
        outcome_type: outcome.outcome_type,
        description: outcome.description
      }, 'AI_DECISION_OUTCOME');
    }
  }

  /**
   * Set handoff context for next AI
   */
  setHandoffContext(context: Omit<AIHandoffContext, 'session_id' | 'timestamp' | 'ai_agent'>): void {
    this.handoffContext = {
      session_id: this.currentSessionId,
      timestamp: new Date().toISOString(),
      ai_agent: this.currentAIAgent,
      ...context
    };

    logger.info('AI handoff context set', {
      next_ai: context.next_ai_agent,
      incomplete_tasks: context.incomplete_tasks.length,
      important_decisions: context.important_decisions.length,
      warnings: context.warnings.length
    }, 'AI_HANDOFF');
  }

  /**
   * Get handoff context from previous AI
   */
  getHandoffContext(): AIHandoffContext | null {
    return this.handoffContext;
  }

  /**
   * Query decisions with filters
   */
  queryDecisions(query: AIDecisionQuery): AIDecision[] {
    let filtered = [...this.decisions];

    if (query.session_id) {
      filtered = filtered.filter(d => d.session_id === query.session_id);
    }

    if (query.ai_agent) {
      filtered = filtered.filter(d => d.ai_agent === query.ai_agent);
    }

    if (query.decision_type) {
      filtered = filtered.filter(d => d.decision_type === query.decision_type);
    }

    if (query.impact_level) {
      filtered = filtered.filter(d => d.impact_level === query.impact_level);
    }

    if (query.files && query.files.length > 0) {
      filtered = filtered.filter(d => 
        d.affected_files.some(file => 
          query.files!.some(queryFile => file.includes(queryFile))
        )
      );
    }

    if (query.date_range) {
      filtered = filtered.filter(d => {
        const timestamp = new Date(d.timestamp);
        const start = new Date(query.date_range!.start);
        const end = new Date(query.date_range!.end);
        return timestamp >= start && timestamp <= end;
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get decisions related to specific files
   */
  getDecisionsForFiles(files: string[]): AIDecision[] {
    return this.queryDecisions({ files });
  }

  /**
   * Get recent decisions
   */
  getRecentDecisions(limit: number = 20): AIDecision[] {
    return this.queryDecisions({ limit });
  }

  /**
   * Get critical decisions
   */
  getCriticalDecisions(): AIDecision[] {
    return this.queryDecisions({ impact_level: 'critical' });
  }

  /**
   * Get current session decisions
   */
  getCurrentSessionDecisions(): AIDecision[] {
    return this.queryDecisions({ session_id: this.currentSessionId });
  }

  /**
   * Export decisions for analysis
   */
  exportDecisions(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.decisions, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'decision_type', 'action', 'confidence', 'impact_level', 'affected_files', 'reasoning'];
      const rows = this.decisions.map(d => [
        d.timestamp,
        d.decision_type,
        d.action,
        d.confidence,
        d.impact_level,
        d.affected_files.join(';'),
        d.reasoning.replace(/"/g, '""')
      ]);
      
      return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    }
  }

  /**
   * Generate decision summary report
   */
  generateSummaryReport(): string {
    const totalDecisions = this.decisions.length;
    const decisionsByType = this.decisions.reduce((acc, d) => {
      acc[d.decision_type] = (acc[d.decision_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const decisionsByImpact = this.decisions.reduce((acc, d) => {
      acc[d.impact_level] = (acc[d.impact_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = this.decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions;

    return `
# AI Decision Summary Report
Generated: ${new Date().toISOString()}
Session: ${this.currentSessionId}
AI Agent: ${this.currentAIAgent}

## Overview
- Total Decisions: ${totalDecisions}
- Average Confidence: ${avgConfidence.toFixed(1)}%

## Decisions by Type
${Object.entries(decisionsByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Decisions by Impact Level
${Object.entries(decisionsByImpact).map(([level, count]) => `- ${level}: ${count}`).join('\n')}

## Recent Critical Decisions
${this.getCriticalDecisions().slice(0, 5).map(d => `- ${d.action} (${d.timestamp})`).join('\n')}
`;
  }

  /**
   * Private helper methods
   */
  private generateDecisionId(): string {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectAIAgent(): string {
    // Try to detect the AI agent from environment or user agent
    // For now, default to a generic identifier
    return process.env.AI_AGENT || 'claude-sonnet-4';
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flushToDatabase(this.decisions);
    }, this.flushInterval);
  }

  private async flushToDatabase(decisions: AIDecision[]): Promise<void> {
    if (decisions.length === 0) return;

    try {
      const { error } = await supabase
        .from('ai_decisions')
        .insert(decisions.map(d => ({
          id: d.id,
          timestamp: d.timestamp,
          session_id: d.session_id,
          ai_agent: d.ai_agent,
          decision_type: d.decision_type,
          action: d.action,
          context: d.context,
          reasoning: d.reasoning,
          confidence: d.confidence,
          impact_level: d.impact_level,
          affected_files: d.affected_files,
          related_decisions: d.related_decisions,
          outcomes: d.outcomes,
          metadata: d.metadata
        })));

      if (error) {
        throw error;
      }

      logger.info(`Flushed ${decisions.length} AI decisions to database`, {
        session_id: this.currentSessionId,
        decisions_count: decisions.length
      }, 'AI_DECISION_FLUSH');
    } catch (error) {
      logger.error('Failed to flush AI decisions to database', error, 'AI_DECISION_FLUSH');
      throw error;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    this.flushToDatabase(this.decisions);
  }
}

// Export singleton instance
export const aiDecisionLogger = AIDecisionLogger.getInstance();

// Convenience functions
export const logAIDecision = aiDecisionLogger.logDecision.bind(aiDecisionLogger);
export const logSimpleAIDecision = aiDecisionLogger.logSimpleDecision.bind(aiDecisionLogger);
export const updateDecisionOutcome = aiDecisionLogger.updateDecisionOutcome.bind(aiDecisionLogger);
export const setHandoffContext = aiDecisionLogger.setHandoffContext.bind(aiDecisionLogger);
export const getHandoffContext = aiDecisionLogger.getHandoffContext.bind(aiDecisionLogger);
export const queryAIDecisions = aiDecisionLogger.queryDecisions.bind(aiDecisionLogger);
export const exportAIDecisions = aiDecisionLogger.exportDecisions.bind(aiDecisionLogger);
export const generateDecisionSummary = aiDecisionLogger.generateSummaryReport.bind(aiDecisionLogger);