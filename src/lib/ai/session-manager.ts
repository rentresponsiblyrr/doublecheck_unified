// AI Session Manager for STR Certified
// Coordinates AI collaboration systems and manages session lifecycle

import { aiDecisionLogger, AIDecision } from "./decision-logger";
import { aiContextHandoffManager, AIContextHandoff } from "./context-handoff";
import { adrManager, ADRRecord } from "./adr-manager";
import { logger } from "../../utils/logger";
import { errorReporter } from "../monitoring/error-reporter";
import { supabase } from "../supabase";

// Session Types
export interface AISession {
  id: string;
  ai_agent: string;
  start_time: string;
  end_time?: string;
  status: SessionStatus;
  objectives: SessionObjective[];
  context: SessionContext;
  decisions: string[]; // Decision IDs
  handoffs: string[]; // Handoff IDs
  adrs: string[]; // ADR IDs
  metrics: SessionMetrics;
  outcomes: SessionOutcome[];
  parent_session_id?: string;
  child_session_ids: string[];
  metadata: Record<string, any>;
}

export type SessionStatus =
  | "active"
  | "completed"
  | "paused"
  | "aborted"
  | "handoff_pending";

export interface SessionObjective {
  id: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  progress: number; // 0-100
  estimated_completion: string;
  actual_completion?: string;
  dependencies: string[];
  deliverables: string[];
  success_criteria: string[];
  notes: string;
}

export interface SessionContext {
  user_request: string;
  initial_system_state: string;
  constraints: string[];
  assumptions: string[];
  available_resources: string[];
  previous_session_context?: string;
  handoff_received?: boolean;
  handoff_id?: string;
}

export interface SessionMetrics {
  decisions_made: number;
  files_modified: number;
  files_created: number;
  lines_of_code_changed: number;
  build_time: number;
  test_coverage_change: number;
  bugs_fixed: number;
  features_implemented: number;
  time_spent_minutes: number;
  ai_confidence_average: number;
  quality_score: number;
}

export interface SessionOutcome {
  timestamp: string;
  outcome_type: "success" | "partial_success" | "failure" | "handoff";
  description: string;
  deliverables_completed: string[];
  issues_encountered: string[];
  lessons_learned: string[];
  recommendations: string[];
  next_steps: string[];
}

export interface SessionQuery {
  ai_agent?: string;
  status?: SessionStatus;
  date_range?: {
    start: string;
    end: string;
  };
  has_handoffs?: boolean;
  has_adrs?: boolean;
  objectives_status?: SessionObjective["status"];
  limit?: number;
}

export interface SessionSummary {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_decisions: number;
  total_handoffs: number;
  total_adrs: number;
  average_session_duration: number;
  top_ai_agents: Array<{ agent: string; sessions: number }>;
  success_rate: number;
  common_objectives: Array<{ objective: string; frequency: number }>;
}

export class AISessionManager {
  private static instance: AISessionManager;
  private sessions: AISession[] = [];
  private currentSession: AISession | null = null;
  private maxLocalSessions = 200;
  private sessionTimer: NodeJS.Timeout | null = null;
  private autoSaveInterval = 60000; // 1 minute

  private constructor() {
    this.startAutoSave();
  }

  static getInstance(): AISessionManager {
    if (!AISessionManager.instance) {
      AISessionManager.instance = new AISessionManager();
    }
    return AISessionManager.instance;
  }

  /**
   * Start a new AI session
   */
  async startSession(
    ai_agent: string,
    objectives: Omit<SessionObjective, "id">[],
    context: SessionContext,
    parent_session_id?: string,
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    const session: AISession = {
      id: sessionId,
      ai_agent,
      start_time: new Date().toISOString(),
      status: "active",
      objectives: objectives.map((obj, index) => ({
        id: `obj_${index}`,
        ...obj,
      })),
      context,
      decisions: [],
      handoffs: [],
      adrs: [],
      metrics: this.getDefaultMetrics(),
      outcomes: [],
      parent_session_id,
      child_session_ids: [],
      metadata: {},
    };

    // If there's a parent session, add this as a child
    if (parent_session_id) {
      const parentSession = this.sessions.find(
        (s) => s.id === parent_session_id,
      );
      if (parentSession) {
        parentSession.child_session_ids.push(sessionId);
      }
    }

    // Handle handoff context if present
    if (context.handoff_received && context.handoff_id) {
      const handoff = aiContextHandoffManager.getHandoffById(
        context.handoff_id,
      );
      if (handoff) {
        session.handoffs.push(context.handoff_id);
        // Convert handoff priority items to objectives
        const handoffObjectives = handoff.priority_items.map((item, index) => ({
          id: `handoff_obj_${index}`,
          description: item.description,
          priority: item.priority,
          status: "pending" as const,
          progress: 0,
          estimated_completion: item.estimated_effort,
          dependencies: item.dependencies,
          deliverables: [],
          success_criteria: [],
          notes: item.context,
        }));
        session.objectives.push(...handoffObjectives);
      }
    }

    this.sessions.push(session);
    this.currentSession = session;

    // Maintain local cache size
    if (this.sessions.length > this.maxLocalSessions) {
      this.sessions = this.sessions.slice(-this.maxLocalSessions);
    }

    // Log session start
    await aiDecisionLogger.logSimpleDecision(
      `Started AI session: ${ai_agent}`,
      "workflow_optimization",
      `New AI session started with ${objectives.length} objectives`,
      [],
      "medium",
    );

    logger.info(
      `AI session started: ${ai_agent}`,
      {
        session_id: sessionId,
        objectives_count: objectives.length,
        parent_session: parent_session_id,
        handoff_received: context.handoff_received,
      },
      "AI_SESSION_START",
    );

    try {
      await this.persistSession(session);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_SESSION_START",
        session_id: sessionId,
        ai_agent,
      });
    }

    return sessionId;
  }

  /**
   * End the current session
   */
  async endSession(
    sessionId: string,
    outcome: Omit<SessionOutcome, "timestamp">,
    create_handoff: boolean = false,
    handoff_context?: string,
  ): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.end_time = new Date().toISOString();
    session.status = "completed";
    session.outcomes.push({
      ...outcome,
      timestamp: new Date().toISOString(),
    });

    // Calculate final metrics
    session.metrics.time_spent_minutes = this.calculateSessionDuration(session);
    session.metrics.decisions_made = session.decisions.length;

    // Create handoff if requested
    if (create_handoff && handoff_context) {
      const handoffId = await aiContextHandoffManager.createSimpleHandoff(
        session.ai_agent,
        "next_ai_agent",
        "Session handoff",
        handoff_context,
        session.objectives
          .filter((obj) => obj.status !== "completed")
          .map((obj) => obj.description),
        session.outcomes
          .filter((o) => o.outcome_type === "failure")
          .map((o) => o.description),
      );
      session.handoffs.push(handoffId);
    }

    // Log session end
    await aiDecisionLogger.logSimpleDecision(
      `Ended AI session: ${session.ai_agent}`,
      "workflow_optimization",
      `Session completed with ${outcome.outcome_type} outcome`,
      [],
      "medium",
    );

    logger.info(
      `AI session ended: ${session.ai_agent}`,
      {
        session_id: sessionId,
        duration_minutes: session.metrics.time_spent_minutes,
        outcome_type: outcome.outcome_type,
        decisions_made: session.metrics.decisions_made,
        handoff_created: create_handoff,
      },
      "AI_SESSION_END",
    );

    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }

    try {
      await this.persistSession(session);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_SESSION_END",
        session_id: sessionId,
        outcome_type: outcome.outcome_type,
      });
    }
  }

  /**
   * Get current active session
   */
  getCurrentSession(): AISession | null {
    return this.currentSession;
  }

  /**
   * Update session objective
   */
  async updateObjective(
    sessionId: string,
    objectiveId: string,
    updates: Partial<SessionObjective>,
  ): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const objective = session.objectives.find((obj) => obj.id === objectiveId);
    if (!objective) {
      throw new Error(`Objective not found: ${objectiveId}`);
    }

    Object.assign(objective, updates);

    // Log objective update
    await aiDecisionLogger.logSimpleDecision(
      `Updated session objective: ${objective.description}`,
      "workflow_optimization",
      `Objective status: ${objective.status}, progress: ${objective.progress}%`,
      [],
      "low",
    );

    logger.info(
      `Session objective updated`,
      {
        session_id: sessionId,
        objective_id: objectiveId,
        status: objective.status,
        progress: objective.progress,
      },
      "AI_SESSION_OBJECTIVE_UPDATE",
    );

    try {
      await this.persistSession(session);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_SESSION_OBJECTIVE_UPDATE",
        session_id: sessionId,
        objective_id: objectiveId,
      });
    }
  }

  /**
   * Add decision to session
   */
  async addDecisionToSession(
    sessionId: string,
    decisionId: string,
  ): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.decisions.push(decisionId);
      session.metrics.decisions_made = session.decisions.length;
      await this.persistSession(session);
    }
  }

  /**
   * Add ADR to session
   */
  async addADRToSession(sessionId: string, adrId: string): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.adrs.push(adrId);
      await this.persistSession(session);
    }
  }

  /**
   * Add handoff to session
   */
  async addHandoffToSession(
    sessionId: string,
    handoffId: string,
  ): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.handoffs.push(handoffId);
      await this.persistSession(session);
    }
  }

  /**
   * Query sessions
   */
  querySessions(query: SessionQuery): AISession[] {
    let filtered = [...this.sessions];

    if (query.ai_agent) {
      filtered = filtered.filter((s) => s.ai_agent === query.ai_agent);
    }

    if (query.status) {
      filtered = filtered.filter((s) => s.status === query.status);
    }

    if (query.date_range) {
      filtered = filtered.filter((s) => {
        const start = new Date(s.start_time);
        const queryStart = new Date(query.date_range!.start);
        const queryEnd = new Date(query.date_range!.end);
        return start >= queryStart && start <= queryEnd;
      });
    }

    if (query.has_handoffs) {
      filtered = filtered.filter((s) => s.handoffs.length > 0);
    }

    if (query.has_adrs) {
      filtered = filtered.filter((s) => s.adrs.length > 0);
    }

    if (query.objectives_status) {
      filtered = filtered.filter((s) =>
        s.objectives.some((obj) => obj.status === query.objectives_status),
      );
    }

    // Sort by start time (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get session by ID
   */
  getSessionById(sessionId: string): AISession | null {
    return this.sessions.find((s) => s.id === sessionId) || null;
  }

  /**
   * Get session summary
   */
  getSessionSummary(): SessionSummary {
    const totalSessions = this.sessions.length;
    const activeSessions = this.sessions.filter(
      (s) => s.status === "active",
    ).length;
    const completedSessions = this.sessions.filter(
      (s) => s.status === "completed",
    ).length;
    const totalDecisions = this.sessions.reduce(
      (sum, s) => sum + s.decisions.length,
      0,
    );
    const totalHandoffs = this.sessions.reduce(
      (sum, s) => sum + s.handoffs.length,
      0,
    );
    const totalAdrs = this.sessions.reduce((sum, s) => sum + s.adrs.length, 0);

    const durations = this.sessions
      .filter((s) => s.end_time)
      .map((s) => this.calculateSessionDuration(s));
    const averageSessionDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const agentCounts = this.sessions.reduce(
      (acc, s) => {
        acc[s.ai_agent] = (acc[s.ai_agent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topAiAgents = Object.entries(agentCounts)
      .map(([agent, sessions]) => ({ agent, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    const successfulSessions = this.sessions.filter((s) =>
      s.outcomes.some((o) => o.outcome_type === "success"),
    ).length;
    const successRate =
      totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

    const objectiveCounts = this.sessions
      .flatMap((s) => s.objectives)
      .reduce(
        (acc, obj) => {
          acc[obj.description] = (acc[obj.description] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const commonObjectives = Object.entries(objectiveCounts)
      .map(([objective, frequency]) => ({ objective, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      total_sessions: totalSessions,
      active_sessions: activeSessions,
      completed_sessions: completedSessions,
      total_decisions: totalDecisions,
      total_handoffs: totalHandoffs,
      total_adrs: totalAdrs,
      average_session_duration: averageSessionDuration,
      top_ai_agents: topAiAgents,
      success_rate: successRate,
      common_objectives: commonObjectives,
    };
  }

  /**
   * Generate session report
   */
  generateSessionReport(sessionId: string): string {
    const session = this.getSessionById(sessionId);
    if (!session) return "Session not found";

    const duration = this.calculateSessionDuration(session);
    const completedObjectives = session.objectives.filter(
      (obj) => obj.status === "completed",
    );
    const pendingObjectives = session.objectives.filter(
      (obj) => obj.status !== "completed",
    );

    return `
# AI Session Report
Generated: ${new Date().toISOString()}
Session ID: ${session.id}
AI Agent: ${session.ai_agent}

## Session Overview
- **Status**: ${session.status}
- **Duration**: ${duration} minutes
- **Started**: ${session.start_time}
- **Ended**: ${session.end_time || "In progress"}

## Objectives
### Completed (${completedObjectives.length}/${session.objectives.length})
${completedObjectives.map((obj) => `- ✅ ${obj.description} (${obj.progress}%)`).join("\n")}

### Pending (${pendingObjectives.length}/${session.objectives.length})
${pendingObjectives.map((obj) => `- ⏳ ${obj.description} (${obj.progress}%)`).join("\n")}

## Metrics
- **Decisions Made**: ${session.metrics.decisions_made}
- **Files Modified**: ${session.metrics.files_modified}
- **Files Created**: ${session.metrics.files_created}
- **Lines Changed**: ${session.metrics.lines_of_code_changed}
- **Average AI Confidence**: ${session.metrics.ai_confidence_average}%
- **Quality Score**: ${session.metrics.quality_score}

## Artifacts Created
- **Decisions**: ${session.decisions.length}
- **Handoffs**: ${session.handoffs.length}
- **ADRs**: ${session.adrs.length}

## Outcomes
${session.outcomes
  .map(
    (outcome) => `
### ${outcome.outcome_type.toUpperCase()} (${outcome.timestamp})
${outcome.description}

**Deliverables**: ${outcome.deliverables_completed.join(", ")}
**Issues**: ${outcome.issues_encountered.join(", ")}
**Lessons**: ${outcome.lessons_learned.join(", ")}
`,
  )
  .join("\n")}

## Context
**User Request**: ${session.context.user_request}
**Constraints**: ${session.context.constraints.join(", ")}
**Assumptions**: ${session.context.assumptions.join(", ")}
`;
  }

  /**
   * Export sessions
   */
  exportSessions(format: "json" | "csv" = "json"): string {
    if (format === "json") {
      return JSON.stringify(this.sessions, null, 2);
    } else {
      const headers = [
        "id",
        "ai_agent",
        "status",
        "start_time",
        "end_time",
        "objectives_count",
        "decisions_count",
        "duration_minutes",
      ];
      const rows = this.sessions.map((s) => [
        s.id,
        s.ai_agent,
        s.status,
        s.start_time,
        s.end_time || "N/A",
        s.objectives.length,
        s.decisions.length,
        s.end_time ? this.calculateSessionDuration(s) : "N/A",
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
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultMetrics(): SessionMetrics {
    return {
      decisions_made: 0,
      files_modified: 0,
      files_created: 0,
      lines_of_code_changed: 0,
      build_time: 0,
      test_coverage_change: 0,
      bugs_fixed: 0,
      features_implemented: 0,
      time_spent_minutes: 0,
      ai_confidence_average: 0,
      quality_score: 0,
    };
  }

  private calculateSessionDuration(session: AISession): number {
    if (!session.end_time) return 0;

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private startAutoSave(): void {
    if (this.sessionTimer) return;

    this.sessionTimer = setInterval(() => {
      if (this.currentSession) {
        this.persistSession(this.currentSession);
      }
    }, this.autoSaveInterval);
  }

  private async persistSession(session: AISession): Promise<void> {
    try {
      const { error } = await supabase.from("ai_sessions").upsert([
        {
          id: session.id,
          ai_agent: session.ai_agent,
          start_time: session.start_time,
          end_time: session.end_time,
          status: session.status,
          objectives: session.objectives,
          context: session.context,
          decisions: session.decisions,
          handoffs: session.handoffs,
          adrs: session.adrs,
          metrics: session.metrics,
          outcomes: session.outcomes,
          parent_session_id: session.parent_session_id,
          child_session_ids: session.child_session_ids,
          metadata: session.metadata,
        },
      ]);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error("Failed to persist AI session", error, "AI_SESSION_PERSIST");
      throw error;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }

    // End current session if active
    if (this.currentSession?.status === "active") {
      this.endSession(this.currentSession.id, {
        outcome_type: "handoff",
        description: "Session ended due to system shutdown",
        deliverables_completed: [],
        issues_encountered: ["System shutdown"],
        lessons_learned: [],
        recommendations: [],
        next_steps: [],
      });
    }
  }
}

// Export singleton instance
export const aiSessionManager = AISessionManager.getInstance();

// Convenience functions
export const startSession =
  aiSessionManager.startSession.bind(aiSessionManager);
export const endSession = aiSessionManager.endSession.bind(aiSessionManager);
export const getCurrentSession =
  aiSessionManager.getCurrentSession.bind(aiSessionManager);
export const updateObjective =
  aiSessionManager.updateObjective.bind(aiSessionManager);
export const addDecisionToSession =
  aiSessionManager.addDecisionToSession.bind(aiSessionManager);
export const addADRToSession =
  aiSessionManager.addADRToSession.bind(aiSessionManager);
export const addHandoffToSession =
  aiSessionManager.addHandoffToSession.bind(aiSessionManager);
export const querySessions =
  aiSessionManager.querySessions.bind(aiSessionManager);
export const getSessionById =
  aiSessionManager.getSessionById.bind(aiSessionManager);
export const getSessionSummary =
  aiSessionManager.getSessionSummary.bind(aiSessionManager);
export const generateSessionReport =
  aiSessionManager.generateSessionReport.bind(aiSessionManager);
export const exportSessions =
  aiSessionManager.exportSessions.bind(aiSessionManager);
