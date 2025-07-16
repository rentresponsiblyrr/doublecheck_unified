/**
 * @fileoverview Intelligent Bug Report Service
 * Orchestrates the enhanced bug reporting system with AI analysis and smart context
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import { logger } from '@/utils/logger';
import { userActivityService, type BugReportData } from './userActivityService';
import { enhancedErrorCollectionService } from './enhancedErrorCollectionService';
import { aiIssueClassificationService } from './aiIssueClassificationService';
import { githubIssuesService } from './githubIssuesService';

export interface IntelligentBugReport extends BugReportData {
  // Enhanced fields added by AI analysis
  enhancedContext: {
    errorSnapshot: string; // JSON snapshot of current error state
    userFrustrationMetrics: {
      level: number; // 1-10
      consecutiveErrors: number;
      timeToReportBug: number; // milliseconds from first error to bug report
      userExperienceLevel: 'novice' | 'intermediate' | 'expert';
    };
    technicalComplexity: {
      affectedSystems: string[];
      requiredSkills: string[];
      estimatedEffort: number; // hours
      priority: 'low' | 'medium' | 'high' | 'critical';
    };
    aiInsights: {
      likelyRootCause: string;
      confidence: number;
      suggestedWorkarounds: string[];
      relatedIssues: string[];
      debuggingStrategy: string;
    };
  };
}

export interface BugReportAnalytics {
  reportId: string;
  timestamp: string;
  processingTime: number;
  aiAnalysisSuccess: boolean;
  githubIssueCreated: boolean;
  userSatisfactionPrediction: number; // 1-10
  resolutionTimeEstimate: number; // hours
  businessImpactScore: number; // 1-10
}

class IntelligentBugReportService {
  private reportingInProgress = false;
  private recentReports = new Map<string, IntelligentBugReport>();
  private analytics: BugReportAnalytics[] = [];

  /**
   * Main entry point for intelligent bug reporting
   */
  async createIntelligentBugReport(
    basicBugReport: BugReportData,
    options: {
      autoSubmitToGitHub?: boolean;
      skipAIAnalysis?: boolean;
      includeScreenshot?: boolean;
    } = {}
  ): Promise<{
    report: IntelligentBugReport;
    analytics: BugReportAnalytics;
    githubIssue?: any;
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    const reportId = this.generateReportId();

    logger.info('Starting intelligent bug report creation', {
      reportId,
      title: basicBugReport.title,
      category: basicBugReport.category,
      options
    }, 'INTELLIGENT_BUG_REPORT');

    try {
      // Prevent duplicate reports
      if (this.reportingInProgress) {
        throw new Error('Bug report already in progress. Please wait.');
      }

      this.reportingInProgress = true;

      // Step 1: Enhance the basic bug report with intelligent analysis
      const enhancedReport = await this.enhanceBugReport(basicBugReport, options);

      // Step 2: Create analytics tracking
      const analytics = this.createAnalytics(reportId, startTime, enhancedReport);

      // Step 3: Auto-submit to GitHub if requested
      let githubIssue;
      if (options.autoSubmitToGitHub !== false) { // Default to true
        try {
          githubIssue = await githubIssuesService.createEnhancedBugReportIssue(basicBugReport);
          analytics.githubIssueCreated = true;
          logger.info('GitHub issue created successfully', { 
            reportId, 
            issueNumber: githubIssue.number 
          }, 'INTELLIGENT_BUG_REPORT');
        } catch (error) {
          logger.warn('Failed to create GitHub issue, continuing without it', error, 'INTELLIGENT_BUG_REPORT');
          analytics.githubIssueCreated = false;
        }
      }

      // Step 4: Store report for future reference and learning
      this.storeReport(enhancedReport, analytics);

      // Step 5: Track user activity for this bug report
      userActivityService.trackCustomAction('intelligent_bug_report_created', {
        reportId,
        category: basicBugReport.category,
        severity: basicBugReport.severity,
        aiAnalysisSuccess: analytics.aiAnalysisSuccess,
        githubIssueCreated: analytics.githubIssueCreated
      });

      const processingTime = Date.now() - startTime;
      analytics.processingTime = processingTime;

      logger.info('Intelligent bug report created successfully', {
        reportId,
        processingTime,
        aiAnalysisSuccess: analytics.aiAnalysisSuccess,
        githubIssueCreated: analytics.githubIssueCreated
      }, 'INTELLIGENT_BUG_REPORT');

      return {
        report: enhancedReport,
        analytics,
        githubIssue,
        success: true
      };

    } catch (error) {
      logger.error('Failed to create intelligent bug report', error, 'INTELLIGENT_BUG_REPORT');
      
      // Create minimal analytics for failed report
      const analytics = this.createFailureAnalytics(reportId, startTime, error as Error);
      
      return {
        report: this.createFallbackReport(basicBugReport),
        analytics,
        success: false,
        error: (error as Error).message
      };

    } finally {
      this.reportingInProgress = false;
    }
  }

  /**
   * Enhance basic bug report with AI analysis and context
   */
  private async enhanceBugReport(
    basicBugReport: BugReportData,
    options: { skipAIAnalysis?: boolean; includeScreenshot?: boolean }
  ): Promise<IntelligentBugReport> {
    logger.info('Enhancing bug report with AI analysis', {
      title: basicBugReport.title,
      skipAI: options.skipAIAnalysis
    }, 'INTELLIGENT_BUG_REPORT');

    // Get comprehensive error context
    const errorContext = enhancedErrorCollectionService.getErrorContext();

    // Calculate user frustration metrics
    const userFrustrationMetrics = this.calculateUserFrustrationMetrics(basicBugReport, errorContext);

    // Determine technical complexity
    const technicalComplexity = this.assessTechnicalComplexity(basicBugReport, errorContext);

    // Get AI insights (unless skipped)
    let aiInsights;
    let aiAnalysisSuccess = true;

    if (!options.skipAIAnalysis) {
      try {
        const aiClassification = await aiIssueClassificationService.classifyIssue({
          bugReport: basicBugReport,
          errorContext,
          userHistory: {
            previousIssues: this.getUserPreviousIssueCount(basicBugReport.userInfo.userId),
            accountAge: 30, // Could be enhanced with real user data
            userRole: basicBugReport.userInfo.userRole || 'user',
            experienceLevel: userFrustrationMetrics.userExperienceLevel
          }
        });

        aiInsights = {
          likelyRootCause: aiClassification.likelyRootCause,
          confidence: aiClassification.confidence,
          suggestedWorkarounds: aiClassification.immediateWorkaround ? [aiClassification.immediateWorkaround] : [],
          relatedIssues: aiClassification.relatedIssues,
          debuggingStrategy: aiClassification.testingStrategy
        };

        // Update technical complexity with AI insights
        technicalComplexity.requiredSkills = aiClassification.requiredSkills;
        technicalComplexity.estimatedEffort = aiClassification.estimatedEffortHours;
        technicalComplexity.priority = this.mapSeverityToPriority(aiClassification.severity);

      } catch (error) {
        logger.warn('AI analysis failed, using fallback insights', error, 'INTELLIGENT_BUG_REPORT');
        aiAnalysisSuccess = false;
        aiInsights = this.createFallbackAIInsights(basicBugReport, errorContext);
      }
    } else {
      aiInsights = this.createFallbackAIInsights(basicBugReport, errorContext);
      aiAnalysisSuccess = false;
    }

    // Create enhanced bug report
    const enhancedReport: IntelligentBugReport = {
      ...basicBugReport,
      enhancedContext: {
        errorSnapshot: JSON.stringify({
          consoleErrors: errorContext.consoleErrors.slice(-5),
          networkErrors: errorContext.networkErrors.slice(-5),
          databaseErrors: errorContext.databaseErrors.slice(-3),
          performanceMetrics: errorContext.performanceMetrics.slice(-1),
          userFrustrationLevel: errorContext.userFrustrationLevel,
          errorFrequency: errorContext.errorFrequency,
          affectedFeatures: errorContext.affectedFeatures,
          potentialRootCause: errorContext.potentialRootCause
        }, null, 2),
        userFrustrationMetrics,
        technicalComplexity,
        aiInsights
      }
    };

    logger.info('Bug report enhancement completed', {
      aiAnalysisSuccess,
      frustrationLevel: userFrustrationMetrics.level,
      technicalPriority: technicalComplexity.priority,
      aiConfidence: aiInsights.confidence
    }, 'INTELLIGENT_BUG_REPORT');

    return enhancedReport;
  }

  /**
   * Calculate user frustration metrics based on error patterns and behavior
   */
  private calculateUserFrustrationMetrics(
    bugReport: BugReportData,
    errorContext: any
  ): IntelligentBugReport['enhancedContext']['userFrustrationMetrics'] {
    // Calculate time from first error to bug report
    const firstErrorTime = errorContext.consoleErrors.length > 0 
      ? new Date(errorContext.consoleErrors[0].timestamp).getTime()
      : Date.now();
    const reportTime = new Date(bugReport.systemInfo.timestamp).getTime();
    const timeToReportBug = reportTime - firstErrorTime;

    // Count consecutive errors in a short time frame
    let consecutiveErrors = 0;
    const errorTimes = [
      ...errorContext.consoleErrors,
      ...errorContext.networkErrors,
      ...errorContext.databaseErrors
    ].map(e => new Date(e.timestamp).getTime()).sort();

    for (let i = 1; i < errorTimes.length; i++) {
      if (errorTimes[i] - errorTimes[i-1] < 30000) { // Within 30 seconds
        consecutiveErrors++;
      }
    }

    // Assess user experience level based on bug report quality
    let experienceLevel: 'novice' | 'intermediate' | 'expert' = 'novice';
    let experienceScore = 0;

    if (bugReport.steps.length >= 3) experienceScore += 1;
    if (bugReport.description.length > 100) experienceScore += 1;
    if (bugReport.category !== 'other') experienceScore += 1;
    if (bugReport.userActions.length > 10) experienceScore += 1;

    if (experienceScore >= 3) experienceLevel = 'expert';
    else if (experienceScore >= 2) experienceLevel = 'intermediate';

    return {
      level: errorContext.userFrustrationLevel,
      consecutiveErrors,
      timeToReportBug,
      userExperienceLevel: experienceLevel
    };
  }

  /**
   * Assess technical complexity of the reported issue
   */
  private assessTechnicalComplexity(
    bugReport: BugReportData,
    errorContext: any
  ): IntelligentBugReport['enhancedContext']['technicalComplexity'] {
    const affectedSystems = new Set<string>();

    // Identify affected systems based on errors
    if (errorContext.databaseErrors.length > 0) affectedSystems.add('Database');
    if (errorContext.networkErrors.length > 0) affectedSystems.add('API/Network');
    if (errorContext.consoleErrors.length > 0) affectedSystems.add('Frontend');
    if (errorContext.performanceMetrics.some((m: any) => 
      m.metrics.largestContentfulPaint > 4000 || m.metrics.usedJSHeapSize > 100000000
    )) affectedSystems.add('Performance');

    // Add systems based on affected features
    errorContext.affectedFeatures.forEach((feature: string) => {
      switch (feature) {
        case 'Authentication':
          affectedSystems.add('Auth System');
          break;
        case 'Media Upload':
          affectedSystems.add('File Storage');
          break;
        case 'Inspection System':
          affectedSystems.add('Core Business Logic');
          break;
      }
    });

    // Determine required skills
    const requiredSkills = [];
    if (affectedSystems.has('Database')) requiredSkills.push('database');
    if (affectedSystems.has('Frontend')) requiredSkills.push('frontend');
    if (affectedSystems.has('API/Network')) requiredSkills.push('backend');
    if (affectedSystems.has('Performance')) requiredSkills.push('performance');

    // Estimate effort based on complexity indicators
    let estimatedEffort = 4; // Base 4 hours
    if (affectedSystems.size > 2) estimatedEffort += 8;
    if (errorContext.databaseErrors.some((e: any) => e.isCompatibilityLayerIssue)) estimatedEffort += 4;
    if (errorContext.userFrustrationLevel >= 8) estimatedEffort += 2;

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (errorContext.userFrustrationLevel >= 9 || affectedSystems.has('Auth System')) {
      priority = 'critical';
    } else if (errorContext.userFrustrationLevel >= 7 || affectedSystems.size > 2) {
      priority = 'high';
    } else if (errorContext.userFrustrationLevel <= 3) {
      priority = 'low';
    }

    return {
      affectedSystems: Array.from(affectedSystems),
      requiredSkills,
      estimatedEffort,
      priority
    };
  }

  /**
   * Create fallback AI insights when AI analysis fails
   */
  private createFallbackAIInsights(
    bugReport: BugReportData,
    errorContext: any
  ): IntelligentBugReport['enhancedContext']['aiInsights'] {
    let likelyRootCause = 'Technical issue requiring investigation';
    
    if (errorContext.databaseErrors.some((e: any) => e.isCompatibilityLayerIssue)) {
      likelyRootCause = 'Database compatibility layer configuration issue';
    } else if (errorContext.networkErrors.length > errorContext.consoleErrors.length) {
      likelyRootCause = 'Network connectivity or API service issue';
    } else if (errorContext.consoleErrors.length > 0) {
      likelyRootCause = 'Frontend JavaScript execution error';
    }

    const suggestedWorkarounds = [];
    if (errorContext.databaseErrors.length > 0) {
      suggestedWorkarounds.push('Clear browser cache and refresh the page');
    }
    if (errorContext.networkErrors.length > 0) {
      suggestedWorkarounds.push('Check internet connection and try again');
    }

    return {
      likelyRootCause,
      confidence: 0.6, // Moderate confidence for rule-based analysis
      suggestedWorkarounds,
      relatedIssues: [],
      debuggingStrategy: 'Reproduce the issue and check browser console for detailed error messages'
    };
  }

  /**
   * Create analytics tracking for the bug report
   */
  private createAnalytics(
    reportId: string,
    startTime: number,
    enhancedReport: IntelligentBugReport
  ): BugReportAnalytics {
    return {
      reportId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      aiAnalysisSuccess: enhancedReport.enhancedContext.aiInsights.confidence > 0.7,
      githubIssueCreated: false, // Will be updated later
      userSatisfactionPrediction: this.predictUserSatisfaction(enhancedReport),
      resolutionTimeEstimate: enhancedReport.enhancedContext.technicalComplexity.estimatedEffort,
      businessImpactScore: this.calculateBusinessImpactScore(enhancedReport)
    };
  }

  /**
   * Create analytics for failed bug report
   */
  private createFailureAnalytics(
    reportId: string,
    startTime: number,
    error: Error
  ): BugReportAnalytics {
    return {
      reportId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      aiAnalysisSuccess: false,
      githubIssueCreated: false,
      userSatisfactionPrediction: 3, // Low satisfaction due to failure
      resolutionTimeEstimate: 8, // Default estimate
      businessImpactScore: 5 // Medium impact
    };
  }

  /**
   * Create fallback report when enhancement fails
   */
  private createFallbackReport(basicBugReport: BugReportData): IntelligentBugReport {
    return {
      ...basicBugReport,
      enhancedContext: {
        errorSnapshot: '{}',
        userFrustrationMetrics: {
          level: 5,
          consecutiveErrors: 0,
          timeToReportBug: 0,
          userExperienceLevel: 'intermediate'
        },
        technicalComplexity: {
          affectedSystems: ['Unknown'],
          requiredSkills: ['frontend'],
          estimatedEffort: 4,
          priority: 'medium'
        },
        aiInsights: {
          likelyRootCause: 'Issue requires manual investigation',
          confidence: 0.5,
          suggestedWorkarounds: [],
          relatedIssues: [],
          debuggingStrategy: 'Manual debugging required'
        }
      }
    };
  }

  /**
   * Predict user satisfaction based on report quality and processing
   */
  private predictUserSatisfaction(report: IntelligentBugReport): number {
    let satisfaction = 7; // Base satisfaction

    // Adjust based on AI analysis quality
    if (report.enhancedContext.aiInsights.confidence > 0.8) satisfaction += 1;
    if (report.enhancedContext.aiInsights.suggestedWorkarounds.length > 0) satisfaction += 1;

    // Adjust based on response time and complexity
    if (report.enhancedContext.technicalComplexity.priority === 'critical') satisfaction -= 1;
    if (report.enhancedContext.userFrustrationMetrics.level >= 8) satisfaction -= 1;

    // Adjust based on user experience level
    if (report.enhancedContext.userFrustrationMetrics.userExperienceLevel === 'expert') satisfaction += 1;

    return Math.max(1, Math.min(10, satisfaction));
  }

  /**
   * Calculate business impact score
   */
  private calculateBusinessImpactScore(report: IntelligentBugReport): number {
    let impact = 5; // Base impact

    // High impact factors
    if (report.enhancedContext.technicalComplexity.affectedSystems.includes('Auth System')) impact += 3;
    if (report.enhancedContext.technicalComplexity.affectedSystems.includes('Core Business Logic')) impact += 2;
    if (report.enhancedContext.userFrustrationMetrics.level >= 8) impact += 2;

    // User role impact
    if (report.userInfo.userRole === 'admin') impact += 2;
    if (report.userInfo.userRole === 'auditor') impact += 1;

    return Math.max(1, Math.min(10, impact));
  }

  /**
   * Store report for learning and analytics
   */
  private storeReport(report: IntelligentBugReport, analytics: BugReportAnalytics) {
    this.recentReports.set(analytics.reportId, report);
    this.analytics.push(analytics);

    // Keep only recent reports (last 50)
    if (this.recentReports.size > 50) {
      const oldestKey = this.recentReports.keys().next().value;
      this.recentReports.delete(oldestKey);
    }

    // Keep only recent analytics (last 100)
    if (this.analytics.length > 100) {
      this.analytics.splice(0, this.analytics.length - 100);
    }
  }

  /**
   * Get user's previous issue count (placeholder for future enhancement)
   */
  private getUserPreviousIssueCount(userId?: string): number {
    if (!userId) return 0;
    
    // Count previous reports by this user
    return Array.from(this.recentReports.values())
      .filter(report => report.userInfo.userId === userId).length;
  }

  /**
   * Map AI severity to priority
   */
  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `IBR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analytics for admin dashboard
   */
  getAnalytics(): {
    totalReports: number;
    successRate: number;
    averageProcessingTime: number;
    averageUserSatisfaction: number;
    recentReports: BugReportAnalytics[];
  } {
    const total = this.analytics.length;
    const successful = this.analytics.filter(a => a.aiAnalysisSuccess).length;
    const avgProcessingTime = total > 0 
      ? this.analytics.reduce((sum, a) => sum + a.processingTime, 0) / total 
      : 0;
    const avgSatisfaction = total > 0
      ? this.analytics.reduce((sum, a) => sum + a.userSatisfactionPrediction, 0) / total
      : 0;

    return {
      totalReports: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageProcessingTime: Math.round(avgProcessingTime),
      averageUserSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      recentReports: this.analytics.slice(-10)
    };
  }

  /**
   * Clear stored data (for testing)
   */
  clearData() {
    this.recentReports.clear();
    this.analytics.length = 0;
  }
}

// Export singleton instance
export const intelligentBugReportService = new IntelligentBugReportService();

export default intelligentBugReportService;