// AI Code Review Trail for STR Certified
// Tracks what AI reviewed and approved with decision justification

import { aiDecisionLogger } from './decision-logger';
import { aiSessionManager } from './session-manager';
import { aiLearningRepository } from './learning-repository';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';
import { supabase } from '../supabase';

// Code Review Types
export interface CodeReviewEntry {
  id: string;
  timestamp: string;
  session_id: string;
  ai_agent: string;
  review_type: ReviewType;
  scope: ReviewScope;
  files_reviewed: FileReview[];
  overall_assessment: OverallAssessment;
  findings: ReviewFinding[];
  recommendations: ReviewRecommendation[];
  approvals: CodeApproval[];
  security_assessment: SecurityAssessment;
  performance_assessment: PerformanceAssessment;
  quality_metrics: QualityMetrics;
  decision_justification: string;
  confidence: number; // 0-100
  review_duration_minutes: number;
  follow_up_required: boolean;
  follow_up_items: string[];
  metadata: Record<string, any>;
}

export type ReviewType = 
  | 'pre_commit'
  | 'post_commit'
  | 'pull_request'
  | 'architecture_review'
  | 'security_review'
  | 'performance_review'
  | 'code_quality'
  | 'bug_fix_review'
  | 'feature_review'
  | 'refactoring_review'
  | 'documentation_review'
  | 'test_review'
  | 'deployment_review'
  | 'emergency_review'
  | 'compliance_review';

export interface ReviewScope {
  files_count: number;
  lines_of_code: number;
  complexity_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  change_type: 'addition' | 'modification' | 'deletion' | 'refactoring' | 'migration';
  impact_areas: string[];
  dependencies_affected: string[];
  testing_scope: string[];
}

export interface FileReview {
  file_path: string;
  file_type: string;
  lines_reviewed: number;
  complexity_score: number;
  change_summary: string;
  review_status: 'approved' | 'approved_with_comments' | 'needs_changes' | 'rejected';
  findings: ReviewFinding[];
  time_spent_minutes: number;
  ai_confidence: number;
  review_notes: string;
}

export interface OverallAssessment {
  status: 'approved' | 'approved_with_comments' | 'needs_changes' | 'rejected';
  risk_score: number; // 0-100
  quality_score: number; // 0-100
  maintainability_score: number; // 0-100
  readability_score: number; // 0-100
  test_coverage_score: number; // 0-100
  security_score: number; // 0-100
  performance_score: number; // 0-100
  overall_confidence: number; // 0-100
}

export interface ReviewFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: FindingCategory;
  title: string;
  description: string;
  file_path: string;
  line_number?: number;
  code_snippet?: string;
  suggested_fix?: string;
  rationale: string;
  impact: string;
  effort_to_fix: 'low' | 'medium' | 'high';
  blocking: boolean;
  references: string[];
  tags: string[];
}

export type FindingCategory = 
  | 'security_vulnerability'
  | 'performance_issue'
  | 'code_quality'
  | 'maintainability'
  | 'readability'
  | 'naming_convention'
  | 'architecture_violation'
  | 'best_practice'
  | 'testing_issue'
  | 'documentation'
  | 'accessibility'
  | 'error_handling'
  | 'resource_management'
  | 'api_design'
  | 'data_validation'
  | 'business_logic'
  | 'user_experience'
  | 'compliance'
  | 'technical_debt'
  | 'code_duplication';

export interface ReviewRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'improvement' | 'optimization' | 'security' | 'performance' | 'maintainability';
  title: string;
  description: string;
  implementation_steps: string[];
  expected_impact: string;
  effort_estimation: string;
  dependencies: string[];
  timeline: string;
  risk_mitigation: string;
}

export interface CodeApproval {
  file_path: string;
  approval_type: 'full' | 'conditional' | 'partial';
  conditions: string[];
  approved_sections: CodeSection[];
  restrictions: string[];
  monitoring_requirements: string[];
  rollback_plan?: string;
  expiry_date?: string;
  approver_notes: string;
}

export interface CodeSection {
  start_line: number;
  end_line: number;
  description: string;
  justification: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface SecurityAssessment {
  overall_security_score: number; // 0-100
  vulnerabilities_found: number;
  critical_vulnerabilities: number;
  security_best_practices_score: number;
  data_protection_score: number;
  authentication_score: number;
  authorization_score: number;
  input_validation_score: number;
  output_sanitization_score: number;
  security_recommendations: string[];
  compliance_status: Record<string, boolean>;
}

export interface PerformanceAssessment {
  overall_performance_score: number; // 0-100
  performance_issues_found: number;
  critical_performance_issues: number;
  memory_usage_score: number;
  cpu_usage_score: number;
  network_efficiency_score: number;
  database_optimization_score: number;
  caching_strategy_score: number;
  scalability_score: number;
  performance_recommendations: string[];
  benchmark_results?: Record<string, number>;
}

export interface QualityMetrics {
  cyclomatic_complexity: number;
  maintainability_index: number;
  code_duplication_percentage: number;
  test_coverage_percentage: number;
  documentation_coverage: number;
  naming_consistency_score: number;
  error_handling_score: number;
  logging_adequacy_score: number;
  dependency_health_score: number;
  architecture_compliance_score: number;
}

export interface ReviewQuery {
  ai_agent?: string;
  review_type?: ReviewType;
  status?: OverallAssessment['status'];
  risk_level?: ReviewScope['risk_level'];
  date_range?: {
    start: string;
    end: string;
  };
  files?: string[];
  severity?: ReviewFinding['severity'];
  category?: FindingCategory;
  approved_only?: boolean;
  limit?: number;
}

export interface ReviewSummary {
  total_reviews: number;
  reviews_by_type: Record<ReviewType, number>;
  average_quality_score: number;
  average_security_score: number;
  average_performance_score: number;
  approval_rate: number;
  findings_by_severity: Record<string, number>;
  common_issues: Array<{ issue: string; frequency: number }>;
  review_efficiency: {
    average_duration: number;
    files_per_hour: number;
    lines_per_hour: number;
  };
}

export class AICodeReviewTrail {
  private static instance: AICodeReviewTrail;
  private reviews: CodeReviewEntry[] = [];
  private maxLocalReviews = 500;
  private activeReview: CodeReviewEntry | null = null;
  private reviewStartTime: Date | null = null;

  private constructor() {}

  static getInstance(): AICodeReviewTrail {
    if (!AICodeReviewTrail.instance) {
      AICodeReviewTrail.instance = new AICodeReviewTrail();
    }
    return AICodeReviewTrail.instance;
  }

  /**
   * Start a new code review
   */
  async startReview(
    review_type: ReviewType,
    scope: ReviewScope,
    files: string[]
  ): Promise<string> {
    const reviewId = this.generateReviewId();
    const sessionId = this.getCurrentSessionId();
    
    this.reviewStartTime = new Date();
    
    const review: CodeReviewEntry = {
      id: reviewId,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      ai_agent: this.getCurrentAIAgent(),
      review_type,
      scope,
      files_reviewed: files.map(file => ({
        file_path: file,
        file_type: this.getFileType(file),
        lines_reviewed: 0,
        complexity_score: 0,
        change_summary: '',
        review_status: 'approved',
        findings: [],
        time_spent_minutes: 0,
        ai_confidence: 0,
        review_notes: ''
      })),
      overall_assessment: {
        status: 'approved',
        risk_score: 0,
        quality_score: 0,
        maintainability_score: 0,
        readability_score: 0,
        test_coverage_score: 0,
        security_score: 0,
        performance_score: 0,
        overall_confidence: 0
      },
      findings: [],
      recommendations: [],
      approvals: [],
      security_assessment: this.getDefaultSecurityAssessment(),
      performance_assessment: this.getDefaultPerformanceAssessment(),
      quality_metrics: this.getDefaultQualityMetrics(),
      decision_justification: '',
      confidence: 0,
      review_duration_minutes: 0,
      follow_up_required: false,
      follow_up_items: [],
      metadata: {}
    };

    this.activeReview = review;
    
    // Log review start
    await aiDecisionLogger.logSimpleDecision(
      `Started code review: ${review_type}`,
      'code_creation',
      `Code review started for ${files.length} files`,
      files,
      'medium'
    );

    logger.info(`Code review started: ${review_type}`, {
      review_id: reviewId,
      files_count: files.length,
      scope: scope,
      ai_agent: this.getCurrentAIAgent()
    }, 'AI_CODE_REVIEW_START');

    return reviewId;
  }

  /**
   * Add a finding to the current review
   */
  async addFinding(finding: Omit<ReviewFinding, 'id'>): Promise<string> {
    if (!this.activeReview) {
      throw new Error('No active review. Start a review first.');
    }

    const findingId = this.generateFindingId();
    const fullFinding: ReviewFinding = {
      id: findingId,
      ...finding
    };

    this.activeReview.findings.push(fullFinding);

    // Add to file-specific findings
    const fileReview = this.activeReview.files_reviewed.find(f => f.file_path === finding.file_path);
    if (fileReview) {
      fileReview.findings.push(fullFinding);
    }

    // Update overall assessment based on finding severity
    this.updateOverallAssessment();

    logger.info(`Finding added to review: ${finding.title}`, {
      finding_id: findingId,
      severity: finding.severity,
      category: finding.category,
      file_path: finding.file_path,
      review_id: this.activeReview.id
    }, 'AI_CODE_REVIEW_FINDING');

    return findingId;
  }

  /**
   * Add a recommendation to the current review
   */
  async addRecommendation(recommendation: Omit<ReviewRecommendation, 'id'>): Promise<string> {
    if (!this.activeReview) {
      throw new Error('No active review. Start a review first.');
    }

    const recommendationId = this.generateRecommendationId();
    const fullRecommendation: ReviewRecommendation = {
      id: recommendationId,
      ...recommendation
    };

    this.activeReview.recommendations.push(fullRecommendation);

    logger.info(`Recommendation added to review: ${recommendation.title}`, {
      recommendation_id: recommendationId,
      priority: recommendation.priority,
      category: recommendation.category,
      review_id: this.activeReview.id
    }, 'AI_CODE_REVIEW_RECOMMENDATION');

    return recommendationId;
  }

  /**
   * Approve code sections
   */
  async approveCode(
    file_path: string,
    approval_type: CodeApproval['approval_type'],
    sections: CodeSection[],
    justification: string,
    conditions: string[] = []
  ): Promise<void> {
    if (!this.activeReview) {
      throw new Error('No active review. Start a review first.');
    }

    const approval: CodeApproval = {
      file_path,
      approval_type,
      conditions,
      approved_sections: sections,
      restrictions: [],
      monitoring_requirements: [],
      approver_notes: justification
    };

    this.activeReview.approvals.push(approval);

    // Log approval
    await aiDecisionLogger.logSimpleDecision(
      `Approved code: ${file_path}`,
      'code_creation',
      `Code approval (${approval_type}): ${justification}`,
      [file_path],
      'medium'
    );

    logger.info(`Code approved: ${file_path}`, {
      approval_type,
      sections_count: sections.length,
      conditions_count: conditions.length,
      review_id: this.activeReview.id
    }, 'AI_CODE_REVIEW_APPROVAL');
  }

  /**
   * Complete the current review
   */
  async completeReview(
    decision_justification: string,
    overall_status: OverallAssessment['status'],
    confidence: number
  ): Promise<void> {
    if (!this.activeReview) {
      throw new Error('No active review. Start a review first.');
    }

    const reviewDuration = this.reviewStartTime 
      ? Math.round((Date.now() - this.reviewStartTime.getTime()) / (1000 * 60))
      : 0;

    // Update final assessment
    this.activeReview.overall_assessment.status = overall_status;
    this.activeReview.overall_assessment.overall_confidence = confidence;
    this.activeReview.decision_justification = decision_justification;
    this.activeReview.confidence = confidence;
    this.activeReview.review_duration_minutes = reviewDuration;
    this.activeReview.follow_up_required = this.activeReview.findings.some(f => f.blocking);
    this.activeReview.follow_up_items = this.activeReview.findings
      .filter(f => f.blocking)
      .map(f => f.title);

    // Calculate final metrics
    this.calculateFinalMetrics();

    // Add to reviews list
    this.reviews.push(this.activeReview);

    // Maintain local cache size
    if (this.reviews.length > this.maxLocalReviews) {
      this.reviews = this.reviews.slice(-this.maxLocalReviews);
    }

    // Log completion
    await aiDecisionLogger.logSimpleDecision(
      `Completed code review: ${this.activeReview.review_type}`,
      'code_creation',
      `Review completed with ${overall_status} status: ${decision_justification}`,
      this.activeReview.files_reviewed.map(f => f.file_path),
      'medium'
    );

    // Add learning if there are significant findings
    if (this.activeReview.findings.length > 0) {
      await aiLearningRepository.addSimpleLearning(
        `Code review pattern: ${this.activeReview.review_type}`,
        `Found ${this.activeReview.findings.length} issues during code review`,
        'pattern_discovered',
        'code_quality',
        confidence
      );
    }

    logger.info(`Code review completed: ${this.activeReview.review_type}`, {
      review_id: this.activeReview.id,
      status: overall_status,
      findings_count: this.activeReview.findings.length,
      recommendations_count: this.activeReview.recommendations.length,
      duration_minutes: reviewDuration,
      confidence
    }, 'AI_CODE_REVIEW_COMPLETE');

    try {
      await this.persistReview(this.activeReview);
    } catch (error) {
      errorReporter.reportError(error, {
        context: 'AI_CODE_REVIEW_PERSIST',
        review_id: this.activeReview.id,
        review_type: this.activeReview.review_type
      });
    }

    // Clear active review
    this.activeReview = null;
    this.reviewStartTime = null;
  }

  /**
   * Quick review for simple changes
   */
  async quickReview(
    files: string[],
    change_description: string,
    justification: string,
    confidence: number = 85
  ): Promise<string> {
    const reviewId = await this.startReview('pre_commit', {
      files_count: files.length,
      lines_of_code: 100, // Estimated
      complexity_score: 3, // Low complexity
      risk_level: 'low',
      change_type: 'modification',
      impact_areas: ['functionality'],
      dependencies_affected: [],
      testing_scope: ['unit_tests']
    }, files);

    // Quick assessment
    if (this.activeReview) {
      this.activeReview.overall_assessment = {
        status: 'approved',
        risk_score: 20,
        quality_score: 85,
        maintainability_score: 85,
        readability_score: 85,
        test_coverage_score: 80,
        security_score: 90,
        performance_score: 85,
        overall_confidence: confidence
      };

      // Auto-approve all files
      for (const file of files) {
        await this.approveCode(file, 'full', [{
          start_line: 1,
          end_line: 1000,
          description: change_description,
          justification,
          risk_level: 'low'
        }], justification);
      }
    }

    await this.completeReview(justification, 'approved', confidence);

    return reviewId;
  }

  /**
   * Query reviews
   */
  queryReviews(query: ReviewQuery): CodeReviewEntry[] {
    let filtered = [...this.reviews];

    if (query.ai_agent) {
      filtered = filtered.filter(r => r.ai_agent === query.ai_agent);
    }

    if (query.review_type) {
      filtered = filtered.filter(r => r.review_type === query.review_type);
    }

    if (query.status) {
      filtered = filtered.filter(r => r.overall_assessment.status === query.status);
    }

    if (query.risk_level) {
      filtered = filtered.filter(r => r.scope.risk_level === query.risk_level);
    }

    if (query.date_range) {
      filtered = filtered.filter(r => {
        const timestamp = new Date(r.timestamp);
        const start = new Date(query.date_range!.start);
        const end = new Date(query.date_range!.end);
        return timestamp >= start && timestamp <= end;
      });
    }

    if (query.files && query.files.length > 0) {
      filtered = filtered.filter(r => 
        r.files_reviewed.some(f => 
          query.files!.some(qf => f.file_path.includes(qf))
        )
      );
    }

    if (query.severity) {
      filtered = filtered.filter(r => 
        r.findings.some(f => f.severity === query.severity)
      );
    }

    if (query.category) {
      filtered = filtered.filter(r => 
        r.findings.some(f => f.category === query.category)
      );
    }

    if (query.approved_only) {
      filtered = filtered.filter(r => r.overall_assessment.status === 'approved');
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get review by ID
   */
  getReviewById(reviewId: string): CodeReviewEntry | null {
    return this.reviews.find(r => r.id === reviewId) || null;
  }

  /**
   * Get review summary
   */
  getReviewSummary(): ReviewSummary {
    const totalReviews = this.reviews.length;
    
    const reviewsByType = this.reviews.reduce((acc, r) => {
      acc[r.review_type] = (acc[r.review_type] || 0) + 1;
      return acc;
    }, {} as Record<ReviewType, number>);

    const averageQualityScore = totalReviews > 0 
      ? this.reviews.reduce((sum, r) => sum + r.overall_assessment.quality_score, 0) / totalReviews 
      : 0;

    const averageSecurityScore = totalReviews > 0 
      ? this.reviews.reduce((sum, r) => sum + r.overall_assessment.security_score, 0) / totalReviews 
      : 0;

    const averagePerformanceScore = totalReviews > 0 
      ? this.reviews.reduce((sum, r) => sum + r.overall_assessment.performance_score, 0) / totalReviews 
      : 0;

    const approvedReviews = this.reviews.filter(r => r.overall_assessment.status === 'approved').length;
    const approvalRate = totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0;

    const allFindings = this.reviews.flatMap(r => r.findings);
    const findingsBySeverity = allFindings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issueCounts = allFindings.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(issueCounts)
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const totalDuration = this.reviews.reduce((sum, r) => sum + r.review_duration_minutes, 0);
    const totalFiles = this.reviews.reduce((sum, r) => sum + r.files_reviewed.length, 0);
    const totalLines = this.reviews.reduce((sum, r) => sum + r.scope.lines_of_code, 0);

    const reviewEfficiency = {
      average_duration: totalReviews > 0 ? totalDuration / totalReviews : 0,
      files_per_hour: totalDuration > 0 ? (totalFiles / totalDuration) * 60 : 0,
      lines_per_hour: totalDuration > 0 ? (totalLines / totalDuration) * 60 : 0
    };

    return {
      total_reviews: totalReviews,
      reviews_by_type: reviewsByType,
      average_quality_score: averageQualityScore,
      average_security_score: averageSecurityScore,
      average_performance_score: averagePerformanceScore,
      approval_rate: approvalRate,
      findings_by_severity: findingsBySeverity,
      common_issues: commonIssues,
      review_efficiency: reviewEfficiency
    };
  }

  /**
   * Export reviews
   */
  exportReviews(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.reviews, null, 2);
    } else {
      const headers = ['timestamp', 'review_type', 'status', 'files_count', 'findings_count', 'quality_score', 'security_score', 'ai_agent'];
      const rows = this.reviews.map(r => [
        r.timestamp,
        r.review_type,
        r.overall_assessment.status,
        r.files_reviewed.length,
        r.findings.length,
        r.overall_assessment.quality_score,
        r.overall_assessment.security_score,
        r.ai_agent
      ]);
      
      return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    }
  }

  /**
   * Private helper methods
   */
  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFindingId(): string {
    return `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string {
    const session = aiSessionManager.getCurrentSession();
    return session?.id || `session_${Date.now()}`;
  }

  private getCurrentAIAgent(): string {
    return process.env.AI_AGENT || 'claude-sonnet-4';
  }

  private getFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private updateOverallAssessment(): void {
    if (!this.activeReview) return;

    const criticalFindings = this.activeReview.findings.filter(f => f.severity === 'critical').length;
    const highFindings = this.activeReview.findings.filter(f => f.severity === 'high').length;
    const blockingFindings = this.activeReview.findings.filter(f => f.blocking).length;

    // Update status based on findings
    if (criticalFindings > 0 || blockingFindings > 0) {
      this.activeReview.overall_assessment.status = 'rejected';
    } else if (highFindings > 0) {
      this.activeReview.overall_assessment.status = 'needs_changes';
    } else if (this.activeReview.findings.length > 0) {
      this.activeReview.overall_assessment.status = 'approved_with_comments';
    } else {
      this.activeReview.overall_assessment.status = 'approved';
    }

    // Update risk score
    this.activeReview.overall_assessment.risk_score = Math.min(100, 
      (criticalFindings * 30) + (highFindings * 15) + (this.activeReview.findings.length * 5)
    );
  }

  private calculateFinalMetrics(): void {
    if (!this.activeReview) return;

    // Calculate average confidence from file reviews
    const avgConfidence = this.activeReview.files_reviewed.length > 0
      ? this.activeReview.files_reviewed.reduce((sum, f) => sum + f.ai_confidence, 0) / this.activeReview.files_reviewed.length
      : 0;

    this.activeReview.overall_assessment.overall_confidence = avgConfidence;

    // Update quality metrics based on findings
    const qualityIssues = this.activeReview.findings.filter(f => f.category === 'code_quality').length;
    this.activeReview.overall_assessment.quality_score = Math.max(0, 100 - (qualityIssues * 10));

    const securityIssues = this.activeReview.findings.filter(f => f.category === 'security_vulnerability').length;
    this.activeReview.overall_assessment.security_score = Math.max(0, 100 - (securityIssues * 20));

    const performanceIssues = this.activeReview.findings.filter(f => f.category === 'performance_issue').length;
    this.activeReview.overall_assessment.performance_score = Math.max(0, 100 - (performanceIssues * 15));
  }

  private getDefaultSecurityAssessment(): SecurityAssessment {
    return {
      overall_security_score: 85,
      vulnerabilities_found: 0,
      critical_vulnerabilities: 0,
      security_best_practices_score: 85,
      data_protection_score: 85,
      authentication_score: 85,
      authorization_score: 85,
      input_validation_score: 85,
      output_sanitization_score: 85,
      security_recommendations: [],
      compliance_status: {}
    };
  }

  private getDefaultPerformanceAssessment(): PerformanceAssessment {
    return {
      overall_performance_score: 85,
      performance_issues_found: 0,
      critical_performance_issues: 0,
      memory_usage_score: 85,
      cpu_usage_score: 85,
      network_efficiency_score: 85,
      database_optimization_score: 85,
      caching_strategy_score: 85,
      scalability_score: 85,
      performance_recommendations: []
    };
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      cyclomatic_complexity: 5,
      maintainability_index: 85,
      code_duplication_percentage: 5,
      test_coverage_percentage: 80,
      documentation_coverage: 75,
      naming_consistency_score: 85,
      error_handling_score: 85,
      logging_adequacy_score: 80,
      dependency_health_score: 85,
      architecture_compliance_score: 85
    };
  }

  private async persistReview(review: CodeReviewEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_code_reviews')
        .insert([{
          id: review.id,
          timestamp: review.timestamp,
          session_id: review.session_id,
          ai_agent: review.ai_agent,
          review_type: review.review_type,
          scope: review.scope,
          files_reviewed: review.files_reviewed,
          overall_assessment: review.overall_assessment,
          findings: review.findings,
          recommendations: review.recommendations,
          approvals: review.approvals,
          security_assessment: review.security_assessment,
          performance_assessment: review.performance_assessment,
          quality_metrics: review.quality_metrics,
          decision_justification: review.decision_justification,
          confidence: review.confidence,
          review_duration_minutes: review.review_duration_minutes,
          follow_up_required: review.follow_up_required,
          follow_up_items: review.follow_up_items,
          metadata: review.metadata
        }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to persist code review to database', error, 'AI_CODE_REVIEW_PERSIST');
      throw error;
    }
  }
}

// Export singleton instance
export const aiCodeReviewTrail = AICodeReviewTrail.getInstance();

// Convenience functions
export const startReview = aiCodeReviewTrail.startReview.bind(aiCodeReviewTrail);
export const addFinding = aiCodeReviewTrail.addFinding.bind(aiCodeReviewTrail);
export const addRecommendation = aiCodeReviewTrail.addRecommendation.bind(aiCodeReviewTrail);
export const approveCode = aiCodeReviewTrail.approveCode.bind(aiCodeReviewTrail);
export const completeReview = aiCodeReviewTrail.completeReview.bind(aiCodeReviewTrail);
export const quickReview = aiCodeReviewTrail.quickReview.bind(aiCodeReviewTrail);
export const queryReviews = aiCodeReviewTrail.queryReviews.bind(aiCodeReviewTrail);
export const getReviewById = aiCodeReviewTrail.getReviewById.bind(aiCodeReviewTrail);
export const getReviewSummary = aiCodeReviewTrail.getReviewSummary.bind(aiCodeReviewTrail);
export const exportReviews = aiCodeReviewTrail.exportReviews.bind(aiCodeReviewTrail);