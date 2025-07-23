/**
 * @fileoverview Smart Reproduction Steps Generator
 * AI-powered system that analyzes error context and user behavior patterns
 * to automatically generate accurate, step-by-step reproduction instructions
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { OpenAI } from "openai";
import {
  ErrorDetails,
  SystemContext,
  UserFrustrationMetrics,
} from "@/types/errorTypes";
import { log } from "@/lib/logging/enterprise-logger";

interface ReproductionSteps {
  id: string;
  errorId: string;
  confidence: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  estimatedTime: string;
  prerequisites: string[];
  steps: ReproductionStep[];
  variations: ReproductionVariation[];
  environmentRequirements: EnvironmentRequirement[];
  troubleshootingTips: TroubleshootingTip[];
  verificationSteps: VerificationStep[];
  relatedIssues: string[];
  createdAt: string;
  lastVerified?: string;
  successRate?: number;
}

interface ReproductionStep {
  stepNumber: number;
  action: string;
  details: string;
  expectedResult: string;
  screenshots?: string[];
  alternativeActions?: string[];
  commonFailures?: CommonFailure[];
  timing?: {
    waitTime?: string;
    timeout?: string;
  };
  validation?: {
    checkFor: string[];
    avoidIf: string[];
  };
}

interface ReproductionVariation {
  name: string;
  description: string;
  differences: string[];
  applicableWhen: string[];
  successRate: number;
}

interface EnvironmentRequirement {
  type: "browser" | "device" | "network" | "account" | "data";
  requirement: string;
  critical: boolean;
  alternatives?: string[];
}

interface TroubleshootingTip {
  condition: string;
  suggestion: string;
  explanation: string;
}

interface VerificationStep {
  step: string;
  expectedOutcome: string;
  debuggingInfo?: string[];
}

interface CommonFailure {
  symptom: string;
  cause: string;
  solution: string;
}

interface UserJourney {
  sessionId: string;
  steps: UserStep[];
  totalDuration: number;
  errorOccurredAt: number;
  recoveryAttempts: number;
}

interface UserStep {
  timestamp: string;
  action:
    | "page_view"
    | "click"
    | "form_submit"
    | "scroll"
    | "type"
    | "wait"
    | "error";
  target?: string;
  value?: string;
  duration: number;
  url: string;
  success: boolean;
}

export class ReproductionStepsGenerator {
  private openai: OpenAI;
  private stepsCache = new Map<string, ReproductionSteps>();

  constructor() {
    // SECURITY: Direct AI integration disabled for security
    log.warn(
      "ReproductionStepsGenerator: Direct AI integration disabled. Use AIProxyService instead.",
      {
        component: "ReproductionStepsGenerator",
        action: "constructor",
        securityMeasure: "AI_INTEGRATION_DISABLED",
      },
      "AI_INTEGRATION_DISABLED",
    );
    this.openai = null as any; // DISABLED
  }

  /**
   * Generate comprehensive reproduction steps for an error
   */
  async generateReproductionSteps(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    userJourney?: UserJourney,
    frustrationMetrics?: UserFrustrationMetrics,
  ): Promise<ReproductionSteps> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(errorDetails, systemContext);
      if (this.stepsCache.has(cacheKey)) {
        return this.stepsCache.get(cacheKey)!;
      }

      // Analyze user behavior patterns
      const behaviorAnalysis = await this.analyzeUserBehavior(
        userJourney,
        frustrationMetrics,
      );

      // Generate context-aware reproduction steps
      const steps = await this.generateAISteps(
        errorDetails,
        systemContext,
        behaviorAnalysis,
        userJourney,
      );

      // Enhance with system-specific knowledge
      const enhancedSteps = await this.enhanceWithSystemKnowledge(
        steps,
        errorDetails,
      );

      // Validate and optimize steps
      const optimizedSteps = await this.optimizeSteps(enhancedSteps);

      // Cache the result
      this.stepsCache.set(cacheKey, optimizedSteps);

      return optimizedSteps;
    } catch (error) {
      log.error(
        "Reproduction steps generation failed",
        error as Error,
        {
          component: "ReproductionStepsGenerator",
          action: "generateReproductionSteps",
          errorId: errorDetails.id,
          hasSystemContext: !!systemContext,
          hasFrustrationMetrics: !!frustrationMetrics,
        },
        "REPRODUCTION_STEPS_GENERATION_FAILED",
      );
      return this.getFallbackSteps(errorDetails, systemContext);
    }
  }

  /**
   * Analyze user behavior patterns to understand the error context
   */
  private async analyzeUserBehavior(
    userJourney?: UserJourney,
    frustrationMetrics?: UserFrustrationMetrics,
  ): Promise<any> {
    if (!userJourney) {
      return { available: false };
    }

    return {
      available: true,
      sessionDuration: userJourney.totalDuration,
      stepsBeforeError: userJourney.errorOccurredAt,
      recoveryAttempts: userJourney.recoveryAttempts,
      commonPatterns: this.identifyCommonPatterns(userJourney.steps),
      userFrustration: frustrationMetrics
        ? {
            level: frustrationMetrics.frustrationLevel,
            rapidClicking: frustrationMetrics.contextualClues.rapidClicking,
            pageRefreshes: frustrationMetrics.contextualClues.pageRefreshes,
            formAbandonment:
              frustrationMetrics.contextualClues.formAbandonmentRate,
          }
        : null,
      criticalSteps: this.identifyCriticalSteps(userJourney.steps),
    };
  }

  /**
   * Identify common patterns in user behavior
   */
  private identifyCommonPatterns(steps: UserStep[]): string[] {
    const patterns: string[] = [];

    // Look for rapid clicking pattern
    const rapidClicks = steps.filter((step, index) => {
      if (step.action !== "click") return false;
      const nextStep = steps[index + 1];
      return (
        nextStep &&
        nextStep.action === "click" &&
        new Date(nextStep.timestamp).getTime() -
          new Date(step.timestamp).getTime() <
          1000
      );
    });

    if (rapidClicks.length > 2) {
      patterns.push("rapid_clicking");
    }

    // Look for form submission retries
    const formSubmissions = steps.filter(
      (step) => step.action === "form_submit",
    );
    if (formSubmissions.length > 1) {
      patterns.push("form_retry_pattern");
    }

    // Look for navigation back-and-forth
    const pageViews = steps.filter((step) => step.action === "page_view");
    const uniquePages = new Set(pageViews.map((step) => step.url));
    if (pageViews.length > uniquePages.size * 1.5) {
      patterns.push("navigation_confusion");
    }

    return patterns;
  }

  /**
   * Identify critical steps that led to the error
   */
  private identifyCriticalSteps(steps: UserStep[]): UserStep[] {
    // Find the last few steps before error occurrence
    const lastSuccessfulSteps = steps.filter((step) => step.success).slice(-5);

    const firstFailedStep = steps.find((step) => !step.success);

    return firstFailedStep
      ? [...lastSuccessfulSteps, firstFailedStep]
      : lastSuccessfulSteps;
  }

  /**
   * Generate AI-powered reproduction steps
   */
  private async generateAISteps(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
    behaviorAnalysis: Record<string, unknown>,
    userJourney?: UserJourney,
  ): Promise<ReproductionSteps> {
    const prompt = `
You are an expert QA engineer creating reproduction steps for a bug in an AI-powered vacation rental inspection platform.

PLATFORM CONTEXT:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS  
- Backend: Supabase (PostgreSQL + Real-time + Auth + Storage)
- AI Services: OpenAI GPT-4V + Custom Learning Models
- Mobile: Progressive Web App with offline capabilities
- Users: Property inspectors using mobile devices for on-site inspections

ERROR DETAILS:
${JSON.stringify(errorDetails, null, 2)}

SYSTEM CONTEXT:
${JSON.stringify(systemContext, null, 2)}

USER BEHAVIOR ANALYSIS:
${JSON.stringify(behaviorAnalysis, null, 2)}

USER JOURNEY (if available):
${userJourney ? JSON.stringify(userJourney.steps.slice(-10), null, 2) : "Not available"}

Create comprehensive reproduction steps that:
1. Are specific to the STR Certified inspection platform
2. Consider mobile-first usage patterns
3. Account for offline/online scenarios
4. Include proper authentication steps
5. Consider property selection and inspection workflows
6. Include AI-specific interactions (photo analysis, checklist generation)

Format as JSON matching the ReproductionSteps interface. Include:
- Clear, numbered steps
- Expected results for each step
- Environment requirements (browser, device, network)
- Prerequisites (user account, test data)
- Troubleshooting tips for common issues
- Verification steps to confirm the bug
- Alternative approaches if primary steps fail

Focus on the specific error: "${errorDetails.message}"
`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert QA engineer specializing in mobile-first web applications and AI-powered platforms. Create detailed, actionable reproduction steps in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2500,
      temperature: 0.1,
    });

    const stepsText = response.choices[0]?.message?.content;
    if (!stepsText) {
      throw new Error("No reproduction steps received from AI");
    }

    try {
      const parsedSteps = JSON.parse(stepsText);
      return {
        ...parsedSteps,
        id: this.generateStepsId(),
        errorId: errorDetails.id || "unknown",
        createdAt: new Date().toISOString(),
      };
    } catch (parseError) {
      log.error(
        "Failed to parse AI reproduction steps",
        parseError as Error,
        {
          component: "ReproductionStepsGenerator",
          action: "parseReproductionSteps",
          rawResponseLength: stepsText?.length || 0,
          hasResponse: !!stepsText,
        },
        "REPRODUCTION_STEPS_PARSE_FAILED",
      );
      throw new Error("Invalid JSON response from AI steps generation");
    }
  }

  /**
   * Enhance steps with system-specific knowledge
   */
  private async enhanceWithSystemKnowledge(
    steps: ReproductionSteps,
    errorDetails: ErrorDetails,
  ): Promise<ReproductionSteps> {
    // Add STR Certified specific enhancements
    const enhancements: Partial<ReproductionSteps> = {};

    // Add inspection-specific environment requirements
    if (errorDetails.message.toLowerCase().includes("inspection")) {
      enhancements.environmentRequirements = [
        ...(steps.environmentRequirements || []),
        {
          type: "account",
          requirement: "Inspector account with active properties",
          critical: true,
        },
        {
          type: "data",
          requirement: "Test property with valid property data",
          critical: true,
        },
        {
          type: "device",
          requirement: "Mobile device or mobile viewport (390x844 or similar)",
          critical: false,
          alternatives: ["Desktop browser with mobile dev tools"],
        },
      ];
    }

    // Add database-specific troubleshooting for constraint errors
    if (errorDetails.code === "23514") {
      enhancements.troubleshootingTips = [
        ...(steps.troubleshootingTips || []),
        {
          condition: "Database constraint violation error",
          suggestion:
            "Check if database schema allows the status value being used",
          explanation:
            "Error 23514 indicates a check constraint violation in PostgreSQL",
        },
        {
          condition: "Inspection creation fails consistently",
          suggestion: "Verify static_safety_items table has required data",
          explanation:
            "Inspection creation depends on static safety items for checklist generation",
        },
      ];
    }

    // Add network-specific requirements for offline scenarios
    if (
      errorDetails.message.toLowerCase().includes("network") ||
      errorDetails.message.toLowerCase().includes("offline")
    ) {
      enhancements.variations = [
        ...(steps.variations || []),
        {
          name: "Offline reproduction",
          description: "Reproduce the error in offline mode",
          differences: [
            "Disconnect network after login",
            "Use cached data for property selection",
            "Test sync behavior when coming back online",
          ],
          applicableWhen: ["Mobile device", "PWA installed"],
          successRate: 0.8,
        },
      ];
    }

    return {
      ...steps,
      ...enhancements,
    };
  }

  /**
   * Optimize reproduction steps for clarity and effectiveness
   */
  private async optimizeSteps(
    steps: ReproductionSteps,
  ): Promise<ReproductionSteps> {
    // Reorder steps by logical dependency
    const optimizedSteps = steps.steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    }));

    // Add timing information where missing
    const stepsWithTiming = optimizedSteps.map((step) => ({
      ...step,
      timing: step.timing || this.inferTiming(step),
    }));

    // Add validation points
    const stepsWithValidation = stepsWithTiming.map((step) => ({
      ...step,
      validation: step.validation || this.addValidation(step),
    }));

    return {
      ...steps,
      steps: stepsWithValidation,
    };
  }

  /**
   * Infer appropriate timing for a step
   */
  private inferTiming(step: ReproductionStep): {
    waitTime?: string;
    timeout?: string;
  } {
    const action = step.action.toLowerCase();

    if (action.includes("load") || action.includes("navigate")) {
      return { waitTime: "2-3 seconds", timeout: "10 seconds" };
    }

    if (action.includes("submit") || action.includes("save")) {
      return { waitTime: "1-2 seconds", timeout: "5 seconds" };
    }

    if (action.includes("ai") || action.includes("analysis")) {
      return { waitTime: "3-5 seconds", timeout: "30 seconds" };
    }

    return { waitTime: "1 second" };
  }

  /**
   * Add validation points to a step
   */
  private addValidation(step: ReproductionStep): {
    checkFor: string[];
    avoidIf: string[];
  } {
    const action = step.action.toLowerCase();

    if (action.includes("login") || action.includes("authenticate")) {
      return {
        checkFor: [
          "User is redirected to dashboard",
          "No error messages displayed",
        ],
        avoidIf: ["Still on login page", "Error message visible"],
      };
    }

    if (action.includes("create") || action.includes("submit")) {
      return {
        checkFor: ["Success message displayed", "Data saved successfully"],
        avoidIf: [
          "Error message appears",
          "Form still shows validation errors",
        ],
      };
    }

    return {
      checkFor: ["Expected UI state achieved"],
      avoidIf: ["Unexpected error occurs"],
    };
  }

  /**
   * Generate fallback reproduction steps
   */
  private getFallbackSteps(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
  ): ReproductionSteps {
    return {
      id: this.generateStepsId(),
      errorId: errorDetails.id || "unknown",
      confidence: 40,
      difficulty: "medium",
      estimatedTime: "15-30 minutes",
      prerequisites: [
        "Access to the application",
        "Valid user account",
        "Modern web browser",
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Navigate to the application URL",
          details: `Open ${systemContext.url} in a web browser`,
          expectedResult: "Application loads successfully",
        },
        {
          stepNumber: 2,
          action: "Attempt to reproduce the reported error",
          details: `Follow the user's reported actions that led to: ${errorDetails.message}`,
          expectedResult: "Error should occur as described",
        },
        {
          stepNumber: 3,
          action: "Document the exact error behavior",
          details: "Take screenshots and note any console errors",
          expectedResult: "Error details are captured for analysis",
        },
      ],
      variations: [],
      environmentRequirements: [
        {
          type: "browser",
          requirement:
            systemContext.browser.name + " " + systemContext.browser.version,
          critical: false,
        },
      ],
      troubleshootingTips: [
        {
          condition: "Error does not reproduce",
          suggestion: "Try different browser or device type",
          explanation: "Some errors are environment-specific",
        },
      ],
      verificationSteps: [
        {
          step: "Confirm error message matches reported issue",
          expectedOutcome: "Error message should be identical or very similar",
        },
      ],
      relatedIssues: [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate unique ID for reproduction steps
   */
  private generateStepsId(): string {
    return `repro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key for steps
   */
  private generateCacheKey(
    errorDetails: ErrorDetails,
    systemContext: SystemContext,
  ): string {
    return `${errorDetails.message}-${errorDetails.type}-${systemContext.browser.name}`.slice(
      0,
      100,
    );
  }

  /**
   * Validate reproduction steps by simulating execution
   */
  async validateSteps(steps: ReproductionSteps): Promise<{
    isValid: boolean;
    confidence: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for missing prerequisites
    if (!steps.prerequisites || steps.prerequisites.length === 0) {
      issues.push("No prerequisites specified");
      suggestions.push(
        "Add prerequisites like account requirements, test data, etc.",
      );
    }

    // Check for missing environment requirements
    if (
      !steps.environmentRequirements ||
      steps.environmentRequirements.length === 0
    ) {
      issues.push("No environment requirements specified");
      suggestions.push("Add browser, device, or network requirements");
    }

    // Check step completeness
    const incompleteSteps = steps.steps.filter(
      (step) => !step.action || !step.details || !step.expectedResult,
    );

    if (incompleteSteps.length > 0) {
      issues.push(`${incompleteSteps.length} incomplete steps found`);
      suggestions.push(
        "Ensure all steps have action, details, and expected result",
      );
    }

    // Check for logical step ordering
    const navigationSteps = steps.steps.filter(
      (step) =>
        step.action.toLowerCase().includes("navigate") ||
        step.action.toLowerCase().includes("login"),
    );

    if (navigationSteps.length > 0 && navigationSteps[0].stepNumber !== 1) {
      issues.push("Navigation/login steps should come first");
      suggestions.push(
        "Reorder steps to start with authentication and navigation",
      );
    }

    const confidence = Math.max(0, 100 - issues.length * 20);

    return {
      isValid: issues.length === 0,
      confidence,
      issues,
      suggestions,
    };
  }
}

export const reproductionStepsGenerator = new ReproductionStepsGenerator();
