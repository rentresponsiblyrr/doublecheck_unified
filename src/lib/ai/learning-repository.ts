// AI Learning Repository for STR Certified
// Accumulates patterns, learnings, and best practices from AI work

import { aiDecisionLogger } from "./decision-logger";
import { aiSessionManager } from "./session-manager";
import { logger } from "../../utils/logger";
import { errorReporter } from "../monitoring/error-reporter";
import { supabase } from "../supabase";

// Learning Types
export interface LearningEntry {
  id: string;
  timestamp: string;
  session_id: string;
  ai_agent: string;
  learning_type: LearningType;
  category: LearningCategory;
  title: string;
  description: string;
  context: LearningContext;
  evidence: Evidence[];
  confidence: number; // 0-100
  validation_status: ValidationStatus;
  applicability: Applicability;
  impact: Impact;
  related_learnings: string[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export type LearningType =
  | "pattern_discovered"
  | "antipattern_identified"
  | "best_practice"
  | "optimization_technique"
  | "common_mistake"
  | "successful_approach"
  | "tool_effectiveness"
  | "process_improvement"
  | "architecture_insight"
  | "performance_finding"
  | "security_lesson"
  | "user_experience_insight"
  | "code_quality_rule"
  | "debugging_technique"
  | "testing_strategy"
  | "deployment_practice"
  | "monitoring_insight"
  | "collaboration_pattern"
  | "decision_framework";

export type LearningCategory =
  | "architecture"
  | "performance"
  | "security"
  | "usability"
  | "maintainability"
  | "scalability"
  | "reliability"
  | "development_process"
  | "testing"
  | "deployment"
  | "monitoring"
  | "collaboration"
  | "tools"
  | "frameworks"
  | "patterns"
  | "business_logic"
  | "data_management"
  | "api_design"
  | "mobile_optimization";

export interface LearningContext {
  problem_domain: string;
  technology_stack: string[];
  team_size: number;
  project_phase:
    | "planning"
    | "development"
    | "testing"
    | "deployment"
    | "maintenance";
  constraints: string[];
  requirements: string[];
  environment: "development" | "staging" | "production";
  user_feedback?: string;
  performance_metrics?: Record<string, number>;
}

export interface Evidence {
  type:
    | "code_example"
    | "performance_data"
    | "user_feedback"
    | "test_results"
    | "metrics"
    | "documentation";
  description: string;
  data: Record<string, unknown>;
  source: string;
  timestamp: string;
  reliability: "high" | "medium" | "low";
}

export type ValidationStatus =
  | "unvalidated"
  | "partially_validated"
  | "validated"
  | "disputed"
  | "outdated";

export interface Applicability {
  project_types: string[];
  technology_stacks: string[];
  team_sizes: string[];
  complexity_levels: string[];
  constraints: string[];
  conditions: string[];
}

export interface Impact {
  performance_impact: "negative" | "neutral" | "positive";
  maintainability_impact: "negative" | "neutral" | "positive";
  security_impact: "negative" | "neutral" | "positive";
  user_experience_impact: "negative" | "neutral" | "positive";
  development_speed_impact: "negative" | "neutral" | "positive";
  cost_impact: "negative" | "neutral" | "positive";
  quantified_metrics?: Record<string, number>;
}

export interface LearningPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  confidence: number;
  related_learnings: string[];
  success_rate: number;
  conditions: string[];
  outcomes: string[];
  recommendations: string[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgeNode {
  id: string;
  type: "learning" | "pattern" | "concept" | "tool" | "practice";
  label: string;
  properties: Record<string, unknown>;
  weight: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship:
    | "relates_to"
    | "depends_on"
    | "contradicts"
    | "enhances"
    | "replaces";
  weight: number;
  properties: Record<string, unknown>;
}

export interface LearningQuery {
  learning_type?: LearningType;
  category?: LearningCategory;
  ai_agent?: string;
  validation_status?: ValidationStatus;
  confidence_threshold?: number;
  technology_stack?: string[];
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;
  limit?: number;
}

export interface LearningStats {
  total_learnings: number;
  learnings_by_type: Record<LearningType, number>;
  learnings_by_category: Record<LearningCategory, number>;
  average_confidence: number;
  validation_rate: number;
  top_contributors: Array<{ ai_agent: string; contributions: number }>;
  trending_patterns: LearningPattern[];
  knowledge_coverage: Record<string, number>;
}

export class AILearningRepository {
  private static instance: AILearningRepository;
  private learnings: LearningEntry[] = [];
  private patterns: LearningPattern[] = [];
  private knowledgeGraph: KnowledgeGraph = { nodes: [], edges: [] };
  private maxLocalLearnings = 1000;
  private patternAnalysisInterval = 300000; // 5 minutes
  private analysisTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPatternAnalysis();
  }

  static getInstance(): AILearningRepository {
    if (!AILearningRepository.instance) {
      AILearningRepository.instance = new AILearningRepository();
    }
    return AILearningRepository.instance;
  }

  /**
   * Add a new learning entry
   */
  async addLearning(
    learning: Omit<LearningEntry, "id" | "timestamp">,
  ): Promise<string> {
    const learningId = this.generateLearningId();

    const fullLearning: LearningEntry = {
      id: learningId,
      timestamp: new Date().toISOString(),
      ...learning,
    };

    this.learnings.push(fullLearning);

    // Maintain local cache size
    if (this.learnings.length > this.maxLocalLearnings) {
      this.learnings = this.learnings.slice(-this.maxLocalLearnings);
    }

    // Log the learning
    await aiDecisionLogger.logSimpleDecision(
      `Added learning: ${learning.title}`,
      "workflow_optimization",
      `New ${learning.learning_type} learning added: ${learning.description.substring(0, 100)}...`,
      [],
      "low",
    );

    logger.info(
      `Learning added: ${learning.title}`,
      {
        learning_id: learningId,
        type: learning.learning_type,
        category: learning.category,
        confidence: learning.confidence,
        ai_agent: learning.ai_agent,
      },
      "AI_LEARNING_ADDED",
    );

    try {
      await this.persistLearning(fullLearning);
      this.updateKnowledgeGraph(fullLearning);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_LEARNING_ADD",
        learning_id: learningId,
        learning_type: learning.learning_type,
      });
    }

    return learningId;
  }

  /**
   * Add a simple learning with minimal context
   */
  async addSimpleLearning(
    title: string,
    description: string,
    learning_type: LearningType,
    category: LearningCategory,
    confidence: number = 80,
  ): Promise<string> {
    const sessionId = this.getCurrentSessionId();

    return this.addLearning({
      session_id: sessionId,
      ai_agent: this.getCurrentAIAgent(),
      learning_type,
      category,
      title,
      description,
      context: {
        problem_domain: "General",
        technology_stack: ["React", "TypeScript", "Supabase"],
        team_size: 1,
        project_phase: "development",
        constraints: [],
        requirements: [],
        environment: "development",
      },
      evidence: [],
      confidence,
      validation_status: "unvalidated",
      applicability: {
        project_types: ["web_application"],
        technology_stacks: ["React", "TypeScript"],
        team_sizes: ["small", "medium"],
        complexity_levels: ["medium", "high"],
        constraints: [],
        conditions: [],
      },
      impact: {
        performance_impact: "neutral",
        maintainability_impact: "positive",
        security_impact: "neutral",
        user_experience_impact: "neutral",
        development_speed_impact: "positive",
        cost_impact: "neutral",
      },
      related_learnings: [],
      tags: [],
      metadata: {},
    });
  }

  /**
   * Validate a learning entry
   */
  async validateLearning(
    learningId: string,
    validation_status: ValidationStatus,
    evidence?: Evidence[],
    notes?: string,
  ): Promise<void> {
    const learning = this.learnings.find((l) => l.id === learningId);
    if (!learning) {
      throw new Error(`Learning not found: ${learningId}`);
    }

    learning.validation_status = validation_status;

    if (evidence) {
      learning.evidence.push(...evidence);
    }

    if (notes) {
      learning.metadata.validation_notes = notes;
    }

    await aiDecisionLogger.logSimpleDecision(
      `Validated learning: ${learning.title}`,
      "workflow_optimization",
      `Learning validation updated to: ${validation_status}`,
      [],
      "low",
    );

    logger.info(
      `Learning validated: ${learning.title}`,
      {
        learning_id: learningId,
        validation_status,
        evidence_count: evidence?.length || 0,
      },
      "AI_LEARNING_VALIDATED",
    );

    try {
      await this.persistLearning(learning);
    } catch (error) {
      errorReporter.reportError(error, {
        context: "AI_LEARNING_VALIDATION",
        learning_id: learningId,
        validation_status,
      });
    }
  }

  /**
   * Query learnings
   */
  queryLearnings(query: LearningQuery): LearningEntry[] {
    let filtered = [...this.learnings];

    if (query.learning_type) {
      filtered = filtered.filter(
        (l) => l.learning_type === query.learning_type,
      );
    }

    if (query.category) {
      filtered = filtered.filter((l) => l.category === query.category);
    }

    if (query.ai_agent) {
      filtered = filtered.filter((l) => l.ai_agent === query.ai_agent);
    }

    if (query.validation_status) {
      filtered = filtered.filter(
        (l) => l.validation_status === query.validation_status,
      );
    }

    if (query.confidence_threshold) {
      filtered = filtered.filter(
        (l) => l.confidence >= query.confidence_threshold,
      );
    }

    if (query.technology_stack && query.technology_stack.length > 0) {
      filtered = filtered.filter((l) =>
        query.technology_stack!.some((tech) =>
          l.context.technology_stack.includes(tech),
        ),
      );
    }

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter((l) =>
        query.tags!.some((tag) => l.tags.includes(tag)),
      );
    }

    if (query.date_range) {
      filtered = filtered.filter((l) => {
        const timestamp = new Date(l.timestamp);
        const start = new Date(query.date_range!.start);
        const end = new Date(query.date_range!.end);
        return timestamp >= start && timestamp <= end;
      });
    }

    if (query.search_term) {
      const searchTerm = query.search_term.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(searchTerm) ||
          l.description.toLowerCase().includes(searchTerm) ||
          l.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );
    }

    // Sort by confidence and timestamp
    filtered.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get learning by ID
   */
  getLearningById(id: string): LearningEntry | null {
    return this.learnings.find((l) => l.id === id) || null;
  }

  /**
   * Get high-confidence learnings
   */
  getHighConfidenceLearnings(threshold: number = 80): LearningEntry[] {
    return this.queryLearnings({ confidence_threshold: threshold });
  }

  /**
   * Get validated learnings
   */
  getValidatedLearnings(): LearningEntry[] {
    return this.queryLearnings({ validation_status: "validated" });
  }

  /**
   * Get learnings by category
   */
  getLearningsByCategory(category: LearningCategory): LearningEntry[] {
    return this.queryLearnings({ category });
  }

  /**
   * Get applicable learnings for current context
   */
  getApplicableLearnings(
    technologyStack: string[],
    projectType: string,
    teamSize: string,
  ): LearningEntry[] {
    return this.learnings.filter((l) => {
      const applicability = l.applicability;

      const techMatch = technologyStack.some((tech) =>
        applicability.technology_stacks.includes(tech),
      );

      const projectMatch =
        applicability.project_types.length === 0 ||
        applicability.project_types.includes(projectType);

      const teamMatch =
        applicability.team_sizes.length === 0 ||
        applicability.team_sizes.includes(teamSize);

      return techMatch && projectMatch && teamMatch;
    });
  }

  /**
   * Discover patterns from learnings
   */
  discoverPatterns(): LearningPattern[] {
    // Group learnings by similarity
    const groupedLearnings = this.groupSimilarLearnings();

    // Generate patterns from groups
    const patterns: LearningPattern[] = [];

    groupedLearnings.forEach((learnings, key) => {
      if (learnings.length >= 3) {
        // Minimum frequency for pattern
        const pattern: LearningPattern = {
          id: this.generatePatternId(),
          name: `Pattern: ${key}`,
          description: this.generatePatternDescription(learnings),
          frequency: learnings.length,
          confidence: this.calculatePatternConfidence(learnings),
          related_learnings: learnings.map((l) => l.id),
          success_rate: this.calculateSuccessRate(learnings),
          conditions: this.extractCommonConditions(learnings),
          outcomes: this.extractCommonOutcomes(learnings),
          recommendations: this.generateRecommendations(learnings),
        };
        patterns.push(pattern);
      }
    });

    this.patterns = patterns;
    return patterns;
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): LearningStats {
    const totalLearnings = this.learnings.length;

    const learningsByType = this.learnings.reduce(
      (acc, l) => {
        acc[l.learning_type] = (acc[l.learning_type] || 0) + 1;
        return acc;
      },
      {} as Record<LearningType, number>,
    );

    const learningsByCategory = this.learnings.reduce(
      (acc, l) => {
        acc[l.category] = (acc[l.category] || 0) + 1;
        return acc;
      },
      {} as Record<LearningCategory, number>,
    );

    const averageConfidence =
      totalLearnings > 0
        ? this.learnings.reduce((sum, l) => sum + l.confidence, 0) /
          totalLearnings
        : 0;

    const validatedCount = this.learnings.filter(
      (l) => l.validation_status === "validated",
    ).length;
    const validationRate =
      totalLearnings > 0 ? (validatedCount / totalLearnings) * 100 : 0;

    const contributorCounts = this.learnings.reduce(
      (acc, l) => {
        acc[l.ai_agent] = (acc[l.ai_agent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topContributors = Object.entries(contributorCounts)
      .map(([ai_agent, contributions]) => ({ ai_agent, contributions }))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 5);

    const knowledgeCoverage = this.calculateKnowledgeCoverage();

    return {
      total_learnings: totalLearnings,
      learnings_by_type: learningsByType,
      learnings_by_category: learningsByCategory,
      average_confidence: averageConfidence,
      validation_rate: validationRate,
      top_contributors: topContributors,
      trending_patterns: this.patterns.slice(0, 10),
      knowledge_coverage: knowledgeCoverage,
    };
  }

  /**
   * Generate learning recommendations
   */
  generateRecommendations(context: LearningContext): LearningEntry[] {
    const applicableLearnings = this.getApplicableLearnings(
      context.technology_stack,
      context.problem_domain,
      context.team_size.toString(),
    );

    // Filter for high-confidence, validated learnings
    const highQualityLearnings = applicableLearnings.filter(
      (l) => l.confidence >= 70 && l.validation_status === "validated",
    );

    // Sort by relevance and impact
    return highQualityLearnings
      .sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, context);
        const bScore = this.calculateRelevanceScore(b, context);
        return bScore - aScore;
      })
      .slice(0, 10);
  }

  /**
   * Export learnings
   */
  exportLearnings(format: "json" | "csv" = "json"): string {
    if (format === "json") {
      return JSON.stringify(this.learnings, null, 2);
    } else {
      const headers = [
        "timestamp",
        "learning_type",
        "category",
        "title",
        "confidence",
        "validation_status",
        "ai_agent",
      ];
      const rows = this.learnings.map((l) => [
        l.timestamp,
        l.learning_type,
        l.category,
        l.title,
        l.confidence,
        l.validation_status,
        l.ai_agent,
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
  private generateLearningId(): string {
    return `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string {
    const session = aiSessionManager.getCurrentSession();
    return session?.id || `session_${Date.now()}`;
  }

  private getCurrentAIAgent(): string {
    return process.env.AI_AGENT || "claude-sonnet-4";
  }

  private groupSimilarLearnings(): Map<string, LearningEntry[]> {
    const groups = new Map<string, LearningEntry[]>();

    this.learnings.forEach((learning) => {
      const key = `${learning.learning_type}_${learning.category}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(learning);
    });

    return groups;
  }

  private generatePatternDescription(learnings: LearningEntry[]): string {
    const commonThemes = this.extractCommonThemes(learnings);
    return `Common pattern found across ${learnings.length} learnings: ${commonThemes.join(", ")}`;
  }

  private calculatePatternConfidence(learnings: LearningEntry[]): number {
    return (
      learnings.reduce((sum, l) => sum + l.confidence, 0) / learnings.length
    );
  }

  private calculateSuccessRate(learnings: LearningEntry[]): number {
    const positiveOutcomes = learnings.filter(
      (l) =>
        l.impact.performance_impact === "positive" ||
        l.impact.maintainability_impact === "positive",
    ).length;

    return learnings.length > 0
      ? (positiveOutcomes / learnings.length) * 100
      : 0;
  }

  private extractCommonConditions(learnings: LearningEntry[]): string[] {
    const conditionCounts = new Map<string, number>();

    learnings.forEach((l) => {
      l.applicability.conditions.forEach((condition) => {
        conditionCounts.set(
          condition,
          (conditionCounts.get(condition) || 0) + 1,
        );
      });
    });

    return Array.from(conditionCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([condition, _]) => condition);
  }

  private extractCommonOutcomes(learnings: LearningEntry[]): string[] {
    const outcomeCounts = new Map<string, number>();

    learnings.forEach((l) => {
      // Extract outcomes from evidence
      l.evidence.forEach((evidence) => {
        if (
          evidence.type === "test_results" ||
          evidence.type === "performance_data"
        ) {
          const outcome = evidence.description;
          outcomeCounts.set(outcome, (outcomeCounts.get(outcome) || 0) + 1);
        }
      });
    });

    return Array.from(outcomeCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([outcome, _]) => outcome);
  }

  private generateRecommendations(learnings: LearningEntry[]): string[] {
    const recommendations = new Set<string>();

    learnings.forEach((l) => {
      if (
        l.learning_type === "best_practice" ||
        l.learning_type === "successful_approach"
      ) {
        recommendations.add(`Apply: ${l.title}`);
      } else if (
        l.learning_type === "antipattern_identified" ||
        l.learning_type === "common_mistake"
      ) {
        recommendations.add(`Avoid: ${l.title}`);
      }
    });

    return Array.from(recommendations);
  }

  private extractCommonThemes(learnings: LearningEntry[]): string[] {
    const themes = new Set<string>();

    learnings.forEach((l) => {
      l.tags.forEach((tag) => themes.add(tag));
      themes.add(l.category);
    });

    return Array.from(themes);
  }

  private calculateRelevanceScore(
    learning: LearningEntry,
    context: LearningContext,
  ): number {
    let score = learning.confidence;

    // Boost score for matching technology stack
    const techMatch = context.technology_stack.some((tech) =>
      learning.context.technology_stack.includes(tech),
    );
    if (techMatch) score += 20;

    // Boost score for matching project phase
    if (learning.context.project_phase === context.project_phase) {
      score += 10;
    }

    // Boost score for validated learnings
    if (learning.validation_status === "validated") {
      score += 15;
    }

    return score;
  }

  private calculateKnowledgeCoverage(): Record<string, number> {
    const coverage: Record<string, number> = {};

    Object.values(LearningCategory).forEach((category) => {
      const count = this.learnings.filter(
        (l) => l.category === category,
      ).length;
      coverage[category] = count;
    });

    return coverage;
  }

  private updateKnowledgeGraph(learning: LearningEntry): void {
    // Add learning as a node
    const node: KnowledgeNode = {
      id: learning.id,
      type: "learning",
      label: learning.title,
      properties: {
        category: learning.category,
        type: learning.learning_type,
        confidence: learning.confidence,
      },
      weight: learning.confidence,
    };

    this.knowledgeGraph.nodes.push(node);

    // Create edges to related learnings
    learning.related_learnings.forEach((relatedId) => {
      const edge: KnowledgeEdge = {
        source: learning.id,
        target: relatedId,
        relationship: "relates_to",
        weight: 1,
        properties: {},
      };
      this.knowledgeGraph.edges.push(edge);
    });
  }

  private startPatternAnalysis(): void {
    if (this.analysisTimer) return;

    this.analysisTimer = setInterval(() => {
      this.discoverPatterns();
    }, this.patternAnalysisInterval);
  }

  private async persistLearning(learning: LearningEntry): Promise<void> {
    try {
      const { error } = await supabase.from("ai_learning_repository").insert([
        {
          id: learning.id,
          timestamp: learning.timestamp,
          session_id: learning.session_id,
          ai_agent: learning.ai_agent,
          learning_type: learning.learning_type,
          category: learning.category,
          title: learning.title,
          description: learning.description,
          context: learning.context,
          evidence: learning.evidence,
          confidence: learning.confidence,
          validation_status: learning.validation_status,
          applicability: learning.applicability,
          impact: learning.impact,
          related_learnings: learning.related_learnings,
          tags: learning.tags,
          metadata: learning.metadata,
        },
      ]);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error(
        "Failed to persist learning to database",
        error,
        "AI_LEARNING_PERSIST",
      );
      throw error;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
  }
}

// Export singleton instance
export const aiLearningRepository = AILearningRepository.getInstance();

// Convenience functions
export const addLearning =
  aiLearningRepository.addLearning.bind(aiLearningRepository);
export const addSimpleLearning =
  aiLearningRepository.addSimpleLearning.bind(aiLearningRepository);
export const validateLearning =
  aiLearningRepository.validateLearning.bind(aiLearningRepository);
export const queryLearnings =
  aiLearningRepository.queryLearnings.bind(aiLearningRepository);
export const getLearningById =
  aiLearningRepository.getLearningById.bind(aiLearningRepository);
export const getHighConfidenceLearnings =
  aiLearningRepository.getHighConfidenceLearnings.bind(aiLearningRepository);
export const getValidatedLearnings =
  aiLearningRepository.getValidatedLearnings.bind(aiLearningRepository);
export const getLearningsByCategory =
  aiLearningRepository.getLearningsByCategory.bind(aiLearningRepository);
export const getApplicableLearnings =
  aiLearningRepository.getApplicableLearnings.bind(aiLearningRepository);
export const discoverPatterns =
  aiLearningRepository.discoverPatterns.bind(aiLearningRepository);
export const getLearningStats =
  aiLearningRepository.getLearningStats.bind(aiLearningRepository);
export const generateRecommendations =
  aiLearningRepository.generateRecommendations.bind(aiLearningRepository);
export const exportLearnings =
  aiLearningRepository.exportLearnings.bind(aiLearningRepository);
