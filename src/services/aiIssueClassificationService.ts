/**
 * @fileoverview AI-Powered Issue Classification Service
 * Uses OpenAI to intelligently analyze and classify bug reports
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import { log } from "@/lib/logging/enterprise-logger";
import { enterpriseServiceTracer } from "@/lib/services/enterprise-service-tracer";
import type { BugReportData } from "./userActivityService";
import type { EnhancedErrorContext } from "./enhancedErrorCollectionService";

export interface AIClassificationResult {
  // Primary classification
  issueType:
    | "bug"
    | "feature_request"
    | "improvement"
    | "user_error"
    | "configuration_issue"
    | "documentation_gap";

  // Severity and impact assessment
  severity: "critical" | "high" | "medium" | "low";
  severityScore: number; // 1-10
  businessImpact: "high" | "medium" | "low";
  userImpact:
    | "blocks_workflow"
    | "degrades_experience"
    | "minor_inconvenience"
    | "cosmetic";

  // Complexity and effort estimation
  complexity: "simple" | "moderate" | "complex" | "epic";
  estimatedEffortHours: number; // Developer hours
  requiredSkills: string[]; // e.g., ['frontend', 'database', 'ai']

  // Root cause analysis
  likelyRootCause: string;
  rootCauseCategory:
    | "database"
    | "frontend"
    | "backend"
    | "infrastructure"
    | "user_error"
    | "configuration";
  confidence: number; // 0-1

  // Recommendations
  immediateWorkaround?: string;
  recommendedAssignee?: string;
  relatedIssues: string[]; // Similar issue IDs or descriptions
  suggestedLabels: string[];

  // Developer assistance
  debuggingHints: string[];
  relevantDocumentation: string[];
  testingStrategy: string;

  // AI reasoning
  reasoning: string;
  analysisMetadata: {
    modelUsed: string;
    analysisTime: number;
    tokensUsed: number;
    confidenceFactors: string[];
  };
}

export interface IssueContext {
  bugReport: BugReportData;
  errorContext: EnhancedErrorContext;
  userHistory?: {
    previousIssues: number;
    accountAge: number;
    userRole: string;
    experienceLevel: "novice" | "intermediate" | "expert";
  };
  systemContext?: {
    recentDeployments: boolean;
    knownIssues: string[];
    systemLoad: "high" | "medium" | "low";
  };
}

class AIIssueClassificationService {
  private openAIApiKey: string;
  private model = "gpt-4o-mini"; // Cost-effective model for classification
  private baseUrl = "https://api.openai.com/v1";
  private maxRetries = 3;
  private cache = new Map<string, AIClassificationResult>();

  // Knowledge base for STR Certified specific patterns
  private knownPatterns = {
    compatibilityLayerIssues: [
      "relation does not exist",
      "users view",
      "static_safety_items",
      "properties",
    ],
    authenticationIssues: [
      "auth.uid()",
      "401 unauthorized",
      "session expired",
      "login failed",
    ],
    mobileIssues: [
      "camera access",
      "photo upload",
      "offline sync",
      "touch interface",
    ],
    performanceIssues: [
      "slow loading",
      "memory usage",
      "large bundle",
      "timeout",
    ],
  };

  constructor() {
    this.openAIApiKey = this.getApiKey();
  }

  private getApiKey(): string {
    // SECURITY: Direct AI integration disabled for security
    log.warn(
      "AI classification disabled for security. Use AIProxyService instead.",
      {},
      "AI_CLASSIFICATION",
    );
    return "";
  }

  /**
   * Main method to classify an issue using AI analysis
   */
  async classifyIssue(context: IssueContext): Promise<AIClassificationResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context);
      if (this.cache.has(cacheKey)) {
        log.info(
          "Using cached AI classification",
          { cacheKey },
          "AI_CLASSIFICATION",
        );
        return this.cache.get(cacheKey)!;
      }

      // Pre-analyze with rule-based classification
      const ruleBasedAnalysis = this.performRuleBasedAnalysis(context);

      // If no API key, return rule-based analysis only
      if (!this.openAIApiKey) {
        return this.enhanceWithRuleBasedAnalysis(
          ruleBasedAnalysis,
          context,
          startTime,
        );
      }

      // Prepare prompt for AI analysis
      const prompt = this.buildAnalysisPrompt(context, ruleBasedAnalysis);

      // Call OpenAI API
      const aiResult = await this.callOpenAI(prompt);

      // Parse and validate AI response
      const classification = this.parseAIResponse(aiResult, context, startTime);

      // Cache result
      this.cache.set(cacheKey, classification);

      // Log successful classification
      log.info(
        "AI issue classification completed",
        {
          issueType: classification.issueType,
          severity: classification.severity,
          complexity: classification.complexity,
          analysisTime: Date.now() - startTime,
          component: "aiIssueClassificationService",
        },
        "AI_CLASSIFICATION",
      );

      return classification;
    } catch (error) {
      log.error(
        "AI classification failed, falling back to rule-based analysis",
        error as Error,
        {
          component: "aiIssueClassificationService",
          operation: "classifyIssue",
        },
        "AI_CLASSIFICATION_FAILED",
      );

      // Fallback to rule-based analysis
      const ruleBasedAnalysis = this.performRuleBasedAnalysis(context);
      return this.enhanceWithRuleBasedAnalysis(
        ruleBasedAnalysis,
        context,
        startTime,
      );
    }
  }

  /**
   * Rule-based analysis as fallback and initial assessment
   */
  private performRuleBasedAnalysis(
    context: IssueContext,
  ): Partial<AIClassificationResult> {
    const { bugReport, errorContext } = context;

    // Analyze error patterns
    const hasCompatibilityErrors = errorContext.databaseErrors.some(
      (e) => e.isCompatibilityLayerIssue,
    );
    const hasNetworkErrors = errorContext.networkErrors.length > 0;
    const hasPerformanceIssues = errorContext.performanceMetrics.some(
      (m) =>
        m.metrics.largestContentfulPaint &&
        m.metrics.largestContentfulPaint > 4000,
    );

    // Determine issue type
    let issueType: AIClassificationResult["issueType"] = "bug";
    if (
      bugReport.description.toLowerCase().includes("request") ||
      bugReport.description.toLowerCase().includes("feature")
    ) {
      issueType = "feature_request";
    } else if (
      bugReport.description.toLowerCase().includes("improve") ||
      bugReport.description.toLowerCase().includes("enhance")
    ) {
      issueType = "improvement";
    } else if (hasCompatibilityErrors) {
      issueType = "configuration_issue";
    }

    // Determine severity based on error context
    let severity: AIClassificationResult["severity"] = "medium";
    let severityScore = 5;

    if (errorContext.userFrustrationLevel >= 8 || hasCompatibilityErrors) {
      severity = "critical";
      severityScore = 9;
    } else if (errorContext.userFrustrationLevel >= 6 || hasNetworkErrors) {
      severity = "high";
      severityScore = 7;
    } else if (hasPerformanceIssues) {
      severity = "medium";
      severityScore = 5;
    } else {
      severity = "low";
      severityScore = 3;
    }

    // Determine complexity
    let complexity: AIClassificationResult["complexity"] = "moderate";
    if (hasCompatibilityErrors || errorContext.affectedFeatures.length > 2) {
      complexity = "complex";
    } else if (errorContext.errorFrequency > 10) {
      complexity = "complex";
    } else if (
      errorContext.consoleErrors.length <= 1 &&
      errorContext.networkErrors.length <= 1
    ) {
      complexity = "simple";
    }

    return {
      issueType,
      severity,
      severityScore,
      complexity,
      likelyRootCause: this.identifyRootCause(context),
      rootCauseCategory: this.categorizeRootCause(context),
      confidence: 0.7, // Rule-based has moderate confidence
    };
  }

  /**
   * Build comprehensive prompt for AI analysis
   */
  private buildAnalysisPrompt(
    context: IssueContext,
    ruleBasedAnalysis: Partial<AIClassificationResult>,
  ): string {
    const { bugReport, errorContext } = context;

    return `You are an expert software engineer analyzing a bug report for STR Certified, an AI-powered vacation rental inspection platform. Please provide a comprehensive analysis in JSON format.

## Bug Report Details
**Title**: ${bugReport.title}
**Description**: ${bugReport.description}
**Category**: ${bugReport.category}
**Severity**: ${bugReport.severity}
**Steps to Reproduce**: ${bugReport.steps.join(", ")}
**User Role**: ${bugReport.userInfo.userRole || "unknown"}

## Technical Context
**Console Errors**: ${errorContext.consoleErrors.length} errors (Recent: ${errorContext.consoleErrors
      .slice(-3)
      .map((e) => e.message)
      .join("; ")})
**Network Errors**: ${errorContext.networkErrors.length} errors (Status codes: ${errorContext.networkErrors.map((e) => e.status).join(", ")})
**Database Errors**: ${errorContext.databaseErrors.length} errors (Compatibility issues: ${errorContext.databaseErrors.filter((e) => e.isCompatibilityLayerIssue).length})
**Performance Issues**: LCP: ${errorContext.performanceMetrics[0]?.metrics.largestContentfulPaint || "N/A"}ms, Memory: ${errorContext.performanceMetrics[0]?.metrics.usedJSHeapSize || "N/A"} bytes
**User Frustration Level**: ${errorContext.userFrustrationLevel}/10
**Error Frequency**: ${errorContext.errorFrequency} errors/minute
**Affected Features**: ${errorContext.affectedFeatures.join(", ")}
**Potential Root Causes**: ${errorContext.potentialRootCause.join(", ")}

## System Architecture Context
- React 18 + TypeScript + Vite frontend
- Supabase PostgreSQL database with custom compatibility layer
- Mobile PWA with offline capabilities
- AI-powered inspection workflow
- Database compatibility views: users → profiles, properties → properties, logs → logs

## Rule-Based Analysis (as reference)
- Issue Type: ${ruleBasedAnalysis.issueType}
- Severity: ${ruleBasedAnalysis.severity} (${ruleBasedAnalysis.severityScore}/10)
- Complexity: ${ruleBasedAnalysis.complexity}
- Root Cause: ${ruleBasedAnalysis.likelyRootCause}

Please provide analysis in this exact JSON format:

{
  "issueType": "bug|feature_request|improvement|user_error|configuration_issue|documentation_gap",
  "severity": "critical|high|medium|low",
  "severityScore": 1-10,
  "businessImpact": "high|medium|low",
  "userImpact": "blocks_workflow|degrades_experience|minor_inconvenience|cosmetic",
  "complexity": "simple|moderate|complex|epic",
  "estimatedEffortHours": number,
  "requiredSkills": ["frontend", "backend", "database", "ai", "mobile"],
  "likelyRootCause": "detailed explanation",
  "rootCauseCategory": "database|frontend|backend|infrastructure|user_error|configuration",
  "confidence": 0.0-1.0,
  "immediateWorkaround": "step-by-step workaround or null",
  "recommendedAssignee": "team member type",
  "relatedIssues": ["similar issue descriptions"],
  "suggestedLabels": ["bug", "severity:high", etc.],
  "debuggingHints": ["specific debugging steps"],
  "relevantDocumentation": ["doc references"],
  "testingStrategy": "how to test the fix",
  "reasoning": "your analysis reasoning"
}

Focus on:
1. Database compatibility layer issues (common in this system)
2. Mobile-specific problems (PWA, camera, offline sync)
3. Authentication/permission issues
4. Performance and memory problems
5. AI service integration issues`;
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callOpenAI(prompt: string): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openAIApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content:
                  "You are an expert software engineer specializing in bug analysis and classification. Always respond with valid JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 1500,
            temperature: 0.1, // Low temperature for consistent classification
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          throw new Error(
            `OpenAI API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        lastError = error as Error;
        log.warn(
          `OpenAI API attempt ${attempt} failed`,
          { error, attempt },
          "AI_CLASSIFICATION",
        );

        if (attempt < this.maxRetries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }
    }

    throw lastError || new Error("All OpenAI API attempts failed");
  }

  /**
   * Parse and validate AI response
   */
  private parseAIResponse(
    aiResponse: string,
    context: IssueContext,
    startTime: number,
  ): AIClassificationResult {
    try {
      const parsed = JSON.parse(aiResponse);

      // Validate required fields and provide defaults
      const result: AIClassificationResult = {
        issueType: parsed.issueType || "bug",
        severity: parsed.severity || "medium",
        severityScore: Math.max(1, Math.min(10, parsed.severityScore || 5)),
        businessImpact: parsed.businessImpact || "medium",
        userImpact: parsed.userImpact || "degrades_experience",
        complexity: parsed.complexity || "moderate",
        estimatedEffortHours: Math.max(0.5, parsed.estimatedEffortHours || 4),
        requiredSkills: Array.isArray(parsed.requiredSkills)
          ? parsed.requiredSkills
          : ["frontend"],
        likelyRootCause: parsed.likelyRootCause || "Unknown root cause",
        rootCauseCategory: parsed.rootCauseCategory || "frontend",
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
        immediateWorkaround: parsed.immediateWorkaround || undefined,
        recommendedAssignee:
          parsed.recommendedAssignee || "Full-stack developer",
        relatedIssues: Array.isArray(parsed.relatedIssues)
          ? parsed.relatedIssues
          : [],
        suggestedLabels: Array.isArray(parsed.suggestedLabels)
          ? parsed.suggestedLabels
          : ["bug"],
        debuggingHints: Array.isArray(parsed.debuggingHints)
          ? parsed.debuggingHints
          : [],
        relevantDocumentation: Array.isArray(parsed.relevantDocumentation)
          ? parsed.relevantDocumentation
          : [],
        testingStrategy: parsed.testingStrategy || "Manual testing required",
        reasoning: parsed.reasoning || "AI analysis completed",
        analysisMetadata: {
          modelUsed: this.model,
          analysisTime: Date.now() - startTime,
          tokensUsed: this.estimateTokenUsage(aiResponse),
          confidenceFactors: this.extractConfidenceFactors(context, parsed),
        },
      };

      return result;
    } catch (error) {
      log.error(
        "Failed to parse AI response",
        { error, aiResponse },
        "AI_CLASSIFICATION",
      );
      throw new Error("Invalid AI response format");
    }
  }

  /**
   * Enhance rule-based analysis when AI is not available
   */
  private enhanceWithRuleBasedAnalysis(
    ruleBasedAnalysis: Partial<AIClassificationResult>,
    context: IssueContext,
    startTime: number,
  ): AIClassificationResult {
    const { bugReport, errorContext } = context;

    return {
      issueType: ruleBasedAnalysis.issueType || "bug",
      severity: ruleBasedAnalysis.severity || "medium",
      severityScore: ruleBasedAnalysis.severityScore || 5,
      businessImpact: this.assessBusinessImpact(context),
      userImpact: this.assessUserImpact(context),
      complexity: ruleBasedAnalysis.complexity || "moderate",
      estimatedEffortHours: this.estimateEffort(
        ruleBasedAnalysis.complexity || "moderate",
      ),
      requiredSkills: this.identifyRequiredSkills(context),
      likelyRootCause: ruleBasedAnalysis.likelyRootCause || "Analysis needed",
      rootCauseCategory: ruleBasedAnalysis.rootCauseCategory || "frontend",
      confidence: ruleBasedAnalysis.confidence || 0.6,
      immediateWorkaround: this.suggestWorkaround(context),
      recommendedAssignee: this.recommendAssignee(context),
      relatedIssues: [],
      suggestedLabels: this.generateLabels(context),
      debuggingHints: this.generateDebuggingHints(context),
      relevantDocumentation: this.identifyRelevantDocs(context),
      testingStrategy: "Manual testing and reproduction required",
      reasoning: "Rule-based analysis (AI classification unavailable)",
      analysisMetadata: {
        modelUsed: "rule-based",
        analysisTime: Date.now() - startTime,
        tokensUsed: 0,
        confidenceFactors: ["error patterns", "user actions", "system context"],
      },
    };
  }

  // Helper methods for rule-based analysis
  private identifyRootCause(context: IssueContext): string {
    const { errorContext } = context;

    if (errorContext.databaseErrors.some((e) => e.isCompatibilityLayerIssue)) {
      return "Database compatibility layer configuration issue";
    }
    if (
      errorContext.networkErrors.some(
        (e) => e.isSupabaseCall && e.status >= 500,
      )
    ) {
      return "Supabase service unavailability";
    }
    if (errorContext.consoleErrors.some((e) => e.message.includes("fetch"))) {
      return "Network connectivity or API endpoint issue";
    }
    if (
      errorContext.performanceMetrics.some(
        (m) => m.metrics.usedJSHeapSize && m.metrics.usedJSHeapSize > 100000000,
      )
    ) {
      return "Memory leak or excessive resource usage";
    }

    return "User interface or interaction issue";
  }

  private categorizeRootCause(
    context: IssueContext,
  ): AIClassificationResult["rootCauseCategory"] {
    const { errorContext } = context;

    if (errorContext.databaseErrors.length > 0) return "database";
    if (errorContext.networkErrors.length > 0) return "backend";
    if (
      errorContext.performanceMetrics.some(
        (m) =>
          m.metrics.largestContentfulPaint &&
          m.metrics.largestContentfulPaint > 4000,
      )
    )
      return "frontend";

    return "frontend";
  }

  private assessBusinessImpact(
    context: IssueContext,
  ): AIClassificationResult["businessImpact"] {
    const { errorContext, bugReport } = context;

    if (
      errorContext.userFrustrationLevel >= 8 ||
      errorContext.affectedFeatures.includes("Authentication") ||
      bugReport.userInfo.userRole === "admin"
    ) {
      return "high";
    }

    if (
      errorContext.userFrustrationLevel >= 5 ||
      errorContext.affectedFeatures.length > 1
    ) {
      return "medium";
    }

    return "low";
  }

  private assessUserImpact(
    context: IssueContext,
  ): AIClassificationResult["userImpact"] {
    const { errorContext } = context;

    if (errorContext.userFrustrationLevel >= 8) return "blocks_workflow";
    if (errorContext.userFrustrationLevel >= 6) return "degrades_experience";
    if (errorContext.userFrustrationLevel >= 3) return "minor_inconvenience";
    return "cosmetic";
  }

  private estimateEffort(
    complexity: AIClassificationResult["complexity"],
  ): number {
    const effortMap = {
      simple: 2,
      moderate: 8,
      complex: 24,
      epic: 80,
    };
    return effortMap[complexity];
  }

  private identifyRequiredSkills(context: IssueContext): string[] {
    const skills = new Set<string>();
    const { errorContext } = context;

    if (errorContext.databaseErrors.length > 0) skills.add("database");
    if (errorContext.networkErrors.length > 0) skills.add("backend");
    if (errorContext.consoleErrors.length > 0) skills.add("frontend");
    if (errorContext.affectedFeatures.includes("Media Upload"))
      skills.add("mobile");

    return Array.from(skills);
  }

  private suggestWorkaround(context: IssueContext): string | undefined {
    const { errorContext } = context;

    if (errorContext.databaseErrors.some((e) => e.isCompatibilityLayerIssue)) {
      return "Refresh the page and try again. If issue persists, clear browser cache and cookies.";
    }

    if (errorContext.networkErrors.some((e) => e.errorType === "network")) {
      return "Check internet connection and try again. Consider using mobile data if on WiFi.";
    }

    if (
      errorContext.performanceMetrics.some(
        (m) => m.metrics.usedJSHeapSize && m.metrics.usedJSHeapSize > 100000000,
      )
    ) {
      return "Close other browser tabs and refresh the page to free up memory.";
    }

    return undefined;
  }

  private recommendAssignee(context: IssueContext): string {
    const { errorContext } = context;

    if (errorContext.databaseErrors.length > 0)
      return "Database/Backend Developer";
    if (errorContext.affectedFeatures.includes("Mobile"))
      return "Mobile/Frontend Developer";
    if (errorContext.networkErrors.length > 0) return "Full-stack Developer";

    return "Frontend Developer";
  }

  private generateLabels(context: IssueContext): string[] {
    const labels = ["bug"];
    const { bugReport, errorContext } = context;

    labels.push(`severity:${bugReport.severity}`);
    labels.push(`category:${bugReport.category}`);

    if (errorContext.databaseErrors.some((e) => e.isCompatibilityLayerIssue)) {
      labels.push("compatibility-layer");
    }

    errorContext.affectedFeatures.forEach((feature) => {
      labels.push(`feature:${feature.toLowerCase().replace(/\s+/g, "-")}`);
    });

    return labels;
  }

  private generateDebuggingHints(context: IssueContext): string[] {
    const hints = [];
    const { errorContext } = context;

    if (errorContext.databaseErrors.length > 0) {
      hints.push("Check database compatibility layer views and functions");
      hints.push("Verify Row Level Security policies");
    }

    if (errorContext.networkErrors.length > 0) {
      hints.push("Check browser network tab for failed requests");
      hints.push("Verify Supabase connection and API keys");
    }

    if (errorContext.consoleErrors.length > 0) {
      hints.push("Check browser console for JavaScript errors");
      hints.push("Look for stack traces and error sources");
    }

    return hints;
  }

  private identifyRelevantDocs(context: IssueContext): string[] {
    const docs = [];
    const { errorContext } = context;

    if (errorContext.databaseErrors.some((e) => e.isCompatibilityLayerIssue)) {
      docs.push("/docs/DATABASE_COMPATIBILITY_ARCHITECTURE.md");
      docs.push("/docs/TROUBLESHOOTING_SCHEMA_ISSUES.md");
    }

    if (errorContext.networkErrors.some((e) => e.isSupabaseCall)) {
      docs.push("Supabase Documentation");
      docs.push("/docs/API_SERVICES.md");
    }

    return docs;
  }

  // Utility methods
  private generateCacheKey(context: IssueContext): string {
    const { bugReport, errorContext } = context;

    const keyData = {
      title: bugReport.title,
      description: bugReport.description.substring(0, 100),
      errorCount:
        errorContext.consoleErrors.length + errorContext.networkErrors.length,
      affectedFeatures: errorContext.affectedFeatures.sort().join(","),
    };

    return btoa(JSON.stringify(keyData)).substring(0, 32);
  }

  private estimateTokenUsage(response: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(response.length / 4);
  }

  private extractConfidenceFactors(
    context: IssueContext,
    parsed: Partial<AIClassificationResult>,
  ): string[] {
    const factors = [];

    if (context.errorContext.consoleErrors.length > 0)
      factors.push("console errors available");
    if (context.errorContext.networkErrors.length > 0)
      factors.push("network errors available");
    if (context.errorContext.performanceMetrics.length > 0)
      factors.push("performance data available");
    if (context.bugReport.steps.length > 2)
      factors.push("detailed reproduction steps");
    if (parsed.confidence > 0.8) factors.push("high AI confidence");

    return factors;
  }

  /**
   * Clear classification cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100, // Implement LRU if needed
    };
  }
}

// Export singleton instance
export const aiIssueClassificationService = new AIIssueClassificationService();

export default aiIssueClassificationService;
