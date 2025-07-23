// AI Context Handoff System for STR Certified
// Enables seamless handoffs between different AI coding sessions

import {
  aiDecisionLogger,
  AIDecision,
  AIDecisionType,
} from "./decision-logger";
import { logger } from "../../utils/logger";
import { supabase } from "../supabase";
import { errorReporter } from "../monitoring/error-reporter";

// Context Handoff Types
export interface AIContextHandoff {
  id: string;
  session_id: string;
  timestamp: string;
  from_ai_agent: string;
  to_ai_agent?: string;
  handoff_type: HandoffType;
  context: HandoffContext;
  system_state: SystemState;
  completion_status: CompletionStatus;
  priority_items: PriorityItem[];
  warnings: Warning[];
  recommendations: Recommendation[];
  technical_debt: TechnicalDebt[];
  learning_insights: LearningInsight[];
  next_steps: NextStep[];
  metadata: Record<string, any>;
}

export type HandoffType =
  | "session_end"
  | "task_completion"
  | "escalation"
  | "shift_change"
  | "emergency_handoff"
  | "planned_transition"
  | "context_preservation";

export interface HandoffContext {
  current_task: string;
  user_request: string;
  progress_summary: string;
  completed_objectives: string[];
  incomplete_objectives: string[];
  blocked_items: BlockedItem[];
  assumptions_made: string[];
  constraints_identified: string[];
  risks_assessed: RiskAssessment[];
  dependencies_discovered: string[];
  context_for_next_ai: string;
}

export interface SystemState {
  last_modified_files: FileChange[];
  active_branches: string[];
  database_changes: DatabaseChange[];
  configuration_changes: ConfigurationChange[];
  dependency_changes: DependencyChange[];
  test_status: TestStatus;
  build_status: BuildStatus;
  deployment_status: DeploymentStatus;
  error_state: ErrorState;
  performance_metrics: PerformanceMetrics;
}

export interface CompletionStatus {
  overall_completion: number; // 0-100
  task_breakdown: TaskCompletion[];
  quality_metrics: QualityMetrics;
  testing_coverage: TestingCoverage;
  documentation_status: DocumentationStatus;
  code_review_status: CodeReviewStatus;
}

export interface PriorityItem {
  id: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  urgency: "immediate" | "today" | "this_week" | "later";
  category:
    | "bug"
    | "feature"
    | "security"
    | "performance"
    | "maintenance"
    | "documentation";
  estimated_effort: string;
  dependencies: string[];
  context: string;
}

export interface BlockedItem {
  description: string;
  blocking_reason: string;
  potential_solutions: string[];
  escalation_needed: boolean;
  priority: "critical" | "high" | "medium" | "low";
}

export interface Warning {
  type:
    | "security"
    | "performance"
    | "compatibility"
    | "data_integrity"
    | "user_experience"
    | "business_logic";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affected_areas: string[];
  mitigation_steps: string[];
  monitoring_required: boolean;
}

export interface Recommendation {
  category:
    | "architecture"
    | "performance"
    | "security"
    | "usability"
    | "maintainability"
    | "scalability";
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  rationale: string;
  implementation_steps: string[];
  estimated_impact: string;
  risks: string[];
}

export interface TechnicalDebt {
  area: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  impact: string;
  suggested_solution: string;
  estimated_effort: string;
  priority_score: number;
}

export interface LearningInsight {
  category:
    | "pattern_discovered"
    | "antipattern_identified"
    | "optimization_found"
    | "tool_effectiveness"
    | "process_improvement";
  description: string;
  context: string;
  confidence: number;
  applicability: string;
  validation_needed: boolean;
}

export interface NextStep {
  step: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimated_duration: string;
  prerequisites: string[];
  success_criteria: string[];
  potential_issues: string[];
}

export interface FileChange {
  file_path: string;
  change_type: "created" | "modified" | "deleted" | "renamed";
  lines_changed: number;
  change_description: string;
  ai_decision_id?: string;
}

export interface DatabaseChange {
  type: "schema" | "data" | "migration" | "index" | "constraint";
  description: string;
  impact: "breaking" | "non_breaking" | "enhancement";
  rollback_plan: string;
}

export interface ConfigurationChange {
  component: string;
  setting: string;
  old_value: string;
  new_value: string;
  impact: string;
}

export interface DependencyChange {
  package: string;
  action: "added" | "updated" | "removed";
  old_version?: string;
  new_version?: string;
  reason: string;
  impact: string;
}

export interface TestStatus {
  unit_tests: { passed: number; failed: number; coverage: number };
  integration_tests: { passed: number; failed: number; coverage: number };
  e2e_tests: { passed: number; failed: number; coverage: number };
  failing_tests: string[];
  test_coverage_delta: number;
}

export interface BuildStatus {
  status: "success" | "failure" | "warning" | "in_progress";
  build_time: number;
  warnings: string[];
  errors: string[];
  artifacts_generated: string[];
}

export interface DeploymentStatus {
  environment: string;
  status: "deployed" | "failed" | "pending" | "rollback";
  version: string;
  deployment_time?: string;
  health_check_results: Record<string, boolean>;
}

export interface ErrorState {
  critical_errors: string[];
  warnings: string[];
  unhandled_exceptions: string[];
  performance_issues: string[];
  security_alerts: string[];
}

export interface PerformanceMetrics {
  build_time: number;
  test_execution_time: number;
  bundle_size: number;
  memory_usage: number;
  cpu_usage: number;
  api_response_times: Record<string, number>;
}

export interface TaskCompletion {
  task: string;
  completion_percentage: number;
  status: "completed" | "in_progress" | "blocked" | "not_started";
  quality_score: number;
}

export interface QualityMetrics {
  code_quality_score: number;
  security_score: number;
  performance_score: number;
  maintainability_score: number;
  documentation_score: number;
}

export interface TestingCoverage {
  unit_test_coverage: number;
  integration_test_coverage: number;
  e2e_test_coverage: number;
  critical_path_coverage: number;
}

export interface DocumentationStatus {
  api_documentation: "complete" | "partial" | "missing";
  code_comments: "complete" | "partial" | "missing";
  user_documentation: "complete" | "partial" | "missing";
  technical_documentation: "complete" | "partial" | "missing";
}

export interface CodeReviewStatus {
  peer_review_completed: boolean;
  automated_review_passed: boolean;
  security_review_passed: boolean;
  performance_review_passed: boolean;
  outstanding_issues: string[];
}

export interface RiskAssessment {
  risk_type:
    | "technical"
    | "business"
    | "security"
    | "performance"
    | "usability";
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  description: string;
  mitigation_strategy: string;
  monitoring_plan: string;
}

export class AIContextHandoffManager {
  private static instance: AIContextHandoffManager;
  private handoffs: AIContextHandoff[] = [];
  private currentContext: AIContextHandoff | null = null;
  private maxLocalHandoffs = 100;

  private constructor() {}

  static getInstance(): AIContextHandoffManager {
    if (!AIContextHandoffManager.instance) {
      AIContextHandoffManager.instance = new AIContextHandoffManager();
    }
    return AIContextHandoffManager.instance;
  }

  /**
   * Create a new context handoff
   */
  async createHandoff(
    handoffData: Omit<AIContextHandoff, "id" | "timestamp">,
  ): Promise<string> {
    const handoffId = this.generateHandoffId();

    const handoff: AIContextHandoff = {
      id: handoffId,
      timestamp: new Date().toISOString(),
      ...handoffData,
    };

    this.handoffs.push(handoff);
    this.currentContext = handoff;

    // Maintain local cache size
    if (this.handoffs.length > this.maxLocalHandoffs) {
      this.handoffs = this.handoffs.slice(-this.maxLocalHandoffs);
    }

    // Log the handoff
    await aiDecisionLogger.logSimpleDecision(
      `Context handoff created: ${handoffData.handoff_type}`,
      "workflow_optimization",
      `Creating handoff context for ${handoffData.to_ai_agent || "next AI agent"}: ${handoffData.context.context_for_next_ai}`,
      [],
      "high",
    );

    logger.info(
      "AI context handoff created",
      {
        handoff_id: handoffId,
        type: handoffData.handoff_type,
        from_ai: handoffData.from_ai_agent,
        to_ai: handoffData.to_ai_agent,
        priority_items: handoffData.priority_items.length,
        warnings: handoffData.warnings.length,
        incomplete_objectives: handoffData.context.incomplete_objectives.length,
      },
      "AI_CONTEXT_HANDOFF",
    );

    try {
      await this.persistHandoff(handoff);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_CONTEXT_HANDOFF",
        handoff_id: handoffId,
        handoff_type: handoffData.handoff_type,
      });
    }

    return handoffId;
  }

  /**
   * Get the latest handoff context
   */
  getLatestHandoff(): AIContextHandoff | null {
    return this.currentContext;
  }

  /**
   * Get handoff by ID
   */
  getHandoffById(id: string): AIContextHandoff | null {
    return this.handoffs.find((h) => h.id === id) || null;
  }

  /**
   * Get handoffs by session
   */
  getHandoffsBySession(sessionId: string): AIContextHandoff[] {
    return this.handoffs.filter((h) => h.session_id === sessionId);
  }

  /**
   * Get handoffs by AI agent
   */
  getHandoffsByAI(aiAgent: string): AIContextHandoff[] {
    return this.handoffs.filter(
      (h) => h.from_ai_agent === aiAgent || h.to_ai_agent === aiAgent,
    );
  }

  /**
   * Create a simple handoff with minimal context
   */
  async createSimpleHandoff(
    fromAI: string,
    toAI: string,
    currentTask: string,
    contextMessage: string,
    incompleteItems: string[] = [],
    warnings: string[] = [],
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    return this.createHandoff({
      session_id: sessionId,
      from_ai_agent: fromAI,
      to_ai_agent: toAI,
      handoff_type: "planned_transition",
      context: {
        current_task: currentTask,
        user_request: "Task handoff",
        progress_summary: contextMessage,
        completed_objectives: [],
        incomplete_objectives: incompleteItems,
        blocked_items: [],
        assumptions_made: [],
        constraints_identified: [],
        risks_assessed: [],
        dependencies_discovered: [],
        context_for_next_ai: contextMessage,
      },
      system_state: this.getDefaultSystemState(),
      completion_status: this.getDefaultCompletionStatus(),
      priority_items: incompleteItems.map((item, index) => ({
        id: `priority_${index}`,
        description: item,
        priority: "medium" as const,
        urgency: "today" as const,
        category: "feature" as const,
        estimated_effort: "Unknown",
        dependencies: [],
        context: contextMessage,
      })),
      warnings: warnings.map((w) => ({
        type: "business_logic" as const,
        severity: "medium" as const,
        description: w,
        affected_areas: [],
        mitigation_steps: [],
        monitoring_required: false,
      })),
      recommendations: [],
      technical_debt: [],
      learning_insights: [],
      next_steps: [],
      metadata: {},
    });
  }

  /**
   * Create emergency handoff
   */
  async createEmergencyHandoff(
    fromAI: string,
    criticalIssue: string,
    systemState: Partial<SystemState>,
    urgentActions: string[],
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    return this.createHandoff({
      session_id: sessionId,
      from_ai_agent: fromAI,
      handoff_type: "emergency_handoff",
      context: {
        current_task: "Emergency situation handling",
        user_request: "Emergency handoff",
        progress_summary: `Emergency handoff due to: ${criticalIssue}`,
        completed_objectives: [],
        incomplete_objectives: urgentActions,
        blocked_items: [
          {
            description: criticalIssue,
            blocking_reason: "Critical issue requiring immediate attention",
            potential_solutions: urgentActions,
            escalation_needed: true,
            priority: "critical",
          },
        ],
        assumptions_made: [],
        constraints_identified: [],
        risks_assessed: [
          {
            risk_type: "technical",
            probability: "high",
            impact: "high",
            description: criticalIssue,
            mitigation_strategy: "Immediate action required",
            monitoring_plan: "Continuous monitoring",
          },
        ],
        dependencies_discovered: [],
        context_for_next_ai: `EMERGENCY: ${criticalIssue}. Immediate action required: ${urgentActions.join(", ")}`,
      },
      system_state: { ...this.getDefaultSystemState(), ...systemState },
      completion_status: this.getDefaultCompletionStatus(),
      priority_items: urgentActions.map((action, index) => ({
        id: `emergency_${index}`,
        description: action,
        priority: "critical" as const,
        urgency: "immediate" as const,
        category: "bug" as const,
        estimated_effort: "Unknown",
        dependencies: [],
        context: `Emergency action for: ${criticalIssue}`,
      })),
      warnings: [
        {
          type: "security",
          severity: "critical",
          description: criticalIssue,
          affected_areas: ["system"],
          mitigation_steps: urgentActions,
          monitoring_required: true,
        },
      ],
      recommendations: [],
      technical_debt: [],
      learning_insights: [],
      next_steps: urgentActions.map((action, index) => ({
        step: `emergency_step_${index}`,
        description: action,
        priority: "critical" as const,
        estimated_duration: "ASAP",
        prerequisites: [],
        success_criteria: ["Issue resolved"],
        potential_issues: ["System instability"],
      })),
      metadata: { emergency: true, critical_issue: criticalIssue },
    });
  }

  /**
   * Generate handoff summary report
   */
  generateHandoffSummary(handoffId: string): string {
    const handoff = this.getHandoffById(handoffId);
    if (!handoff) return "Handoff not found";

    return `
# AI Context Handoff Summary
Generated: ${new Date().toISOString()}
Handoff ID: ${handoff.id}
Type: ${handoff.handoff_type}

## Transition Details
- From: ${handoff.from_ai_agent}
- To: ${handoff.to_ai_agent || "Next AI Agent"}
- Session: ${handoff.session_id}
- Timestamp: ${handoff.timestamp}

## Current Task
${handoff.context.current_task}

## Progress Summary
${handoff.context.progress_summary}

## Completed Objectives
${handoff.context.completed_objectives.map((obj) => `- ✅ ${obj}`).join("\n")}

## Incomplete Objectives
${handoff.context.incomplete_objectives.map((obj) => `- ⏳ ${obj}`).join("\n")}

## Priority Items (${handoff.priority_items.length})
${handoff.priority_items.map((item) => `- [${item.priority.toUpperCase()}] ${item.description}`).join("\n")}

## Warnings (${handoff.warnings.length})
${handoff.warnings.map((warning) => `- ⚠️ [${warning.severity.toUpperCase()}] ${warning.description}`).join("\n")}

## Blocked Items (${handoff.context.blocked_items.length})
${handoff.context.blocked_items.map((item) => `- 🚫 ${item.description} (${item.blocking_reason})`).join("\n")}

## Next Steps
${handoff.next_steps.map((step) => `- ${step.description}`).join("\n")}

## Context for Next AI
${handoff.context.context_for_next_ai}

## System State
- Build Status: ${handoff.system_state.build_status.status}
- Test Status: ${handoff.system_state.test_status.unit_tests.passed}/${handoff.system_state.test_status.unit_tests.passed + handoff.system_state.test_status.unit_tests.failed} unit tests passed
- Modified Files: ${handoff.system_state.last_modified_files.length}

## Completion Status
Overall: ${handoff.completion_status.overall_completion}%
Quality Score: ${handoff.completion_status.quality_metrics.code_quality_score}
`;
  }

  /**
   * Export handoffs
   */
  exportHandoffs(format: "json" | "csv" = "json"): string {
    if (format === "json") {
      return JSON.stringify(this.handoffs, null, 2);
    } else {
      // CSV format
      const headers = [
        "timestamp",
        "from_ai",
        "to_ai",
        "handoff_type",
        "current_task",
        "completion_percentage",
        "priority_items_count",
        "warnings_count",
      ];
      const rows = this.handoffs.map((h) => [
        h.timestamp,
        h.from_ai_agent,
        h.to_ai_agent || "Unknown",
        h.handoff_type,
        h.context.current_task,
        h.completion_status.overall_completion,
        h.priority_items.length,
        h.warnings.length,
      ]);

      return [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    }
  }

  /**
   * Private helper methods
   */
  private generateHandoffId(): string {
    return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultSystemState(): SystemState {
    return {
      last_modified_files: [],
      active_branches: ["main"],
      database_changes: [],
      configuration_changes: [],
      dependency_changes: [],
      test_status: {
        unit_tests: { passed: 0, failed: 0, coverage: 0 },
        integration_tests: { passed: 0, failed: 0, coverage: 0 },
        e2e_tests: { passed: 0, failed: 0, coverage: 0 },
        failing_tests: [],
        test_coverage_delta: 0,
      },
      build_status: {
        status: "success",
        build_time: 0,
        warnings: [],
        errors: [],
        artifacts_generated: [],
      },
      deployment_status: {
        environment: "development",
        status: "deployed",
        version: "1.0.0",
        health_check_results: {},
      },
      error_state: {
        critical_errors: [],
        warnings: [],
        unhandled_exceptions: [],
        performance_issues: [],
        security_alerts: [],
      },
      performance_metrics: {
        build_time: 0,
        test_execution_time: 0,
        bundle_size: 0,
        memory_usage: 0,
        cpu_usage: 0,
        api_response_times: {},
      },
    };
  }

  private getDefaultCompletionStatus(): CompletionStatus {
    return {
      overall_completion: 0,
      task_breakdown: [],
      quality_metrics: {
        code_quality_score: 0,
        security_score: 0,
        performance_score: 0,
        maintainability_score: 0,
        documentation_score: 0,
      },
      testing_coverage: {
        unit_test_coverage: 0,
        integration_test_coverage: 0,
        e2e_test_coverage: 0,
        critical_path_coverage: 0,
      },
      documentation_status: {
        api_documentation: "missing",
        code_comments: "missing",
        user_documentation: "missing",
        technical_documentation: "missing",
      },
      code_review_status: {
        peer_review_completed: false,
        automated_review_passed: false,
        security_review_passed: false,
        performance_review_passed: false,
        outstanding_issues: [],
      },
    };
  }

  private async persistHandoff(handoff: AIContextHandoff): Promise<void> {
    try {
      const { error } = await supabase.from("ai_context_handoffs").insert([
        {
          id: handoff.id,
          session_id: handoff.session_id,
          timestamp: handoff.timestamp,
          from_ai_agent: handoff.from_ai_agent,
          to_ai_agent: handoff.to_ai_agent,
          handoff_type: handoff.handoff_type,
          context: handoff.context,
          system_state: handoff.system_state,
          completion_status: handoff.completion_status,
          priority_items: handoff.priority_items,
          warnings: handoff.warnings,
          recommendations: handoff.recommendations,
          technical_debt: handoff.technical_debt,
          learning_insights: handoff.learning_insights,
          next_steps: handoff.next_steps,
          metadata: handoff.metadata,
        },
      ]);

      if (error) {
        throw error;
      }

      logger.info(
        "AI context handoff persisted to database",
        {
          handoff_id: handoff.id,
          session_id: handoff.session_id,
        },
        "AI_CONTEXT_HANDOFF_PERSIST",
      );
    } catch (error) {
      logger.error(
        "Failed to persist AI context handoff",
        error,
        "AI_CONTEXT_HANDOFF_PERSIST",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const aiContextHandoffManager = AIContextHandoffManager.getInstance();

// Convenience functions
export const createHandoff = aiContextHandoffManager.createHandoff.bind(
  aiContextHandoffManager,
);
export const createSimpleHandoff =
  aiContextHandoffManager.createSimpleHandoff.bind(aiContextHandoffManager);
export const createEmergencyHandoff =
  aiContextHandoffManager.createEmergencyHandoff.bind(aiContextHandoffManager);
export const getLatestHandoff = aiContextHandoffManager.getLatestHandoff.bind(
  aiContextHandoffManager,
);
export const getHandoffById = aiContextHandoffManager.getHandoffById.bind(
  aiContextHandoffManager,
);
export const generateHandoffSummary =
  aiContextHandoffManager.generateHandoffSummary.bind(aiContextHandoffManager);
export const exportHandoffs = aiContextHandoffManager.exportHandoffs.bind(
  aiContextHandoffManager,
);
