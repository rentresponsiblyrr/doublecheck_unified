// AI Module Exports for STR Certified

// Core AI Services
export { STRCertifiedAIService, createAIService, DEFAULT_AI_CONFIG } from './openai-service';

// AI Collaboration Systems
export { 
  aiDecisionLogger, 
  logAIDecision, 
  logSimpleAIDecision, 
  updateDecisionOutcome,
  queryAIDecisions,
  exportAIDecisions,
  generateDecisionSummary
} from './decision-logger';

export { 
  aiContextHandoffManager, 
  createHandoff, 
  createSimpleHandoff, 
  createEmergencyHandoff,
  getLatestHandoff,
  getHandoffById,
  generateHandoffSummary,
  exportHandoffs
} from './context-handoff';

export { 
  adrManager, 
  createADR, 
  createSimpleADR, 
  updateADRStatus,
  supersedeADR,
  queryADRs,
  getADRById,
  getADRByNumber,
  getAllADRs,
  getActiveADRs,
  generateADRIndex,
  exportADRs
} from './adr-manager';

export { 
  aiSessionManager, 
  startSession, 
  endSession, 
  getCurrentSession,
  updateObjective,
  addDecisionToSession,
  addADRToSession,
  addHandoffToSession,
  querySessions,
  getSessionById,
  getSessionSummary,
  generateSessionReport,
  exportSessions
} from './session-manager';

export { 
  aiLearningRepository, 
  addLearning, 
  addSimpleLearning, 
  validateLearning,
  queryLearnings,
  getLearningById,
  getHighConfidenceLearnings,
  getValidatedLearnings,
  getLearningsByCategory,
  getApplicableLearnings,
  discoverPatterns,
  getLearningStats,
  generateRecommendations,
  exportLearnings
} from './learning-repository';

// Core AI Types
export type {
  AIAnalysisResult,
  PhotoComparisonResult,
  DynamicChecklistItem,
  PropertyData,
  AIServiceConfig,
  AIAnalysisOptions,
  AIError,
  AIAnalysisStatus,
  AIAnalysisState
} from './types';

// AI Collaboration Types
export type {
  AIDecision,
  AIDecisionType,
  AIDecisionContext,
  AIDecisionOutcome,
  AIHandoffContext,
  AIDecisionQuery
} from './decision-logger';

export type {
  AIContextHandoff,
  HandoffType,
  HandoffContext,
  SystemState,
  CompletionStatus,
  PriorityItem,
  Warning,
  Recommendation,
  TechnicalDebt,
  LearningInsight,
  NextStep
} from './context-handoff';

export type {
  ADRRecord,
  ADRStatus,
  ADRConsequences,
  AIAgentInfo,
  ADRQuery,
  ADRTemplate
} from './adr-manager';

export type {
  AISession,
  SessionStatus,
  SessionObjective,
  SessionContext,
  SessionMetrics,
  SessionOutcome,
  SessionQuery,
  SessionSummary
} from './session-manager';

export type {
  LearningEntry,
  LearningType,
  LearningCategory,
  LearningContext,
  Evidence,
  ValidationStatus,
  Applicability,
  Impact,
  LearningPattern,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  LearningQuery,
  LearningStats
} from './learning-repository';

// Constants
export const AI_MODELS = {
  VISION: 'gpt-4-vision-preview',
  TEXT: 'gpt-4-turbo-preview',
  FAST: 'gpt-3.5-turbo',
} as const;

export const AI_ANALYSIS_DEFAULTS = {
  CONFIDENCE_THRESHOLD: 70,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
} as const;

// AI Collaboration Constants
export const AI_COLLABORATION_DEFAULTS = {
  MAX_DECISIONS_LOCAL: 500,
  MAX_HANDOFFS_LOCAL: 100,
  MAX_SESSIONS_LOCAL: 200,
  MAX_LEARNINGS_LOCAL: 1000,
  AUTO_SAVE_INTERVAL: 60000, // 1 minute
  FLUSH_INTERVAL: 30000, // 30 seconds
  PATTERN_ANALYSIS_INTERVAL: 300000, // 5 minutes
  HIGH_CONFIDENCE_THRESHOLD: 80,
  VALIDATION_THRESHOLD: 70,
} as const;