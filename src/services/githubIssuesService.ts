/**
 * @fileoverview GitHub Issues Service
 * Handles creating and managing GitHub issues for bug reports
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { logger } from '@/utils/logger';
import type { BugReportData } from './userActivityService';
import { enhancedErrorCollectionService, type EnhancedErrorContext } from './enhancedErrorCollectionService';
import { aiIssueClassificationService, type AIClassificationResult, type IssueContext } from './aiIssueClassificationService';

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface CreateIssueRequest {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export interface EnhancedBugReportIssue extends CreateIssueRequest {
  aiClassification: AIClassificationResult;
  errorContext: EnhancedErrorContext;
  enhancedAnalysis: {
    reproductionSteps: string[];
    rootCauseAnalysis: string;
    debuggingInstructions: string[];
    workaroundSuggestions: string[];
    relatedFiles: string[];
    testingChecklist: string[];
  };
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

class GitHubIssuesService {
  private config: GitHubConfig | null = null;
  private baseUrl = 'https://api.github.com';

  /**
   * Initialize with GitHub configuration
   */
  configure(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config?.owner && this.config?.repo && this.config?.token);
  }

  /**
   * Create an enhanced GitHub issue from bug report data with AI analysis
   */
  async createEnhancedBugReportIssue(bugReport: BugReportData): Promise<GitHubIssue> {
    if (!this.isConfigured()) {
      throw new Error('GitHub service not configured');
    }

    logger.info('Starting enhanced bug report creation with AI analysis', {
      title: bugReport.title,
      category: bugReport.category
    }, 'GITHUB_ISSUES');

    try {
      // Step 1: Collect enhanced error context
      const errorContext = enhancedErrorCollectionService.getErrorContext();
      
      // Step 2: Prepare context for AI analysis
      const issueContext: IssueContext = {
        bugReport,
        errorContext,
        userHistory: {
          previousIssues: 0, // Could be enhanced with user history lookup
          accountAge: 30, // Days since account creation
          userRole: bugReport.userInfo.userRole || 'user',
          experienceLevel: this.assessUserExperienceLevel(bugReport)
        },
        systemContext: {
          recentDeployments: false, // Could be enhanced with deployment tracking
          knownIssues: [], // Could be enhanced with known issues database
          systemLoad: 'medium' // Could be enhanced with real system monitoring
        }
      };

      // Step 3: Get AI classification and analysis
      const aiClassification = await aiIssueClassificationService.classifyIssue(issueContext);
      
      // Step 4: Generate enhanced analysis
      const enhancedAnalysis = this.generateEnhancedAnalysis(bugReport, errorContext, aiClassification);
      
      // Step 5: Create enhanced GitHub issue
      const enhancedIssue: EnhancedBugReportIssue = {
        title: this.generateEnhancedTitle(bugReport, aiClassification),
        body: this.formatEnhancedBugReportBody(bugReport, errorContext, aiClassification, enhancedAnalysis),
        labels: this.generateEnhancedLabels(bugReport, aiClassification),
        assignees: this.suggestAssignees(aiClassification),
        aiClassification,
        errorContext,
        enhancedAnalysis
      };

      // Step 6: Create the GitHub issue
      const createdIssue = await this.createIssue(enhancedIssue);
      
      logger.info('Enhanced bug report issue created successfully', {
        issueNumber: createdIssue.number,
        aiClassification: aiClassification.issueType,
        severity: aiClassification.severity,
        complexity: aiClassification.complexity
      }, 'GITHUB_ISSUES');

      return createdIssue;

    } catch (error) {
      logger.error('Failed to create enhanced bug report, falling back to basic issue', error, 'GITHUB_ISSUES');
      
      // Fallback to basic bug report creation
      return this.createBasicBugReportIssue(bugReport);
    }
  }

  /**
   * Create a basic GitHub issue from bug report data (fallback method)
   */
  async createBasicBugReportIssue(bugReport: BugReportData): Promise<GitHubIssue> {
    const issueBody = this.formatBugReportBody(bugReport);
    const labels = this.generateLabels(bugReport);

    const issueRequest: CreateIssueRequest = {
      title: `[Bug Report] ${bugReport.title}`,
      body: issueBody,
      labels,
      assignees: []
    };

    return this.createIssue(issueRequest);
  }

  /**
   * Legacy method - now calls enhanced version
   */
  async createBugReportIssue(bugReport: BugReportData): Promise<GitHubIssue> {
    return this.createEnhancedBugReportIssue(bugReport);
  }

  /**
   * Create a GitHub issue
   */
  async createIssue(issueRequest: CreateIssueRequest): Promise<GitHubIssue> {
    if (!this.config) {
      throw new Error('GitHub service not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(issueRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const issue = await response.json();
      
      logger.info('GitHub issue created successfully', {
        issueNumber: issue.number,
        title: issue.title,
        url: issue.html_url
      }, 'GITHUB_ISSUES');

      return issue;

    } catch (error) {
      logger.error('Failed to create GitHub issue', error, 'GITHUB_ISSUES');
      throw error;
    }
  }

  /**
   * Upload screenshot as GitHub issue attachment (using GitHub's API)
   */
  async uploadScreenshot(screenshot: Blob, filename: string): Promise<string> {
    if (!this.config) {
      throw new Error('GitHub service not configured');
    }

    try {
      // Convert blob to base64
      const base64 = await this.blobToBase64(screenshot);
      const content = base64.split(',')[1]; // Remove data:image/... prefix

      // Create a temporary file in the repo (could be in a screenshots folder)
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/screenshots/${filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add screenshot for bug report: ${filename}`,
          content: content,
          branch: 'main' // or 'master' depending on your default branch
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload screenshot: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.content.download_url;

    } catch (error) {
      logger.error('Failed to upload screenshot to GitHub', error, 'GITHUB_ISSUES');
      // Return a fallback message instead of throwing
      return '[Screenshot upload failed - please attach manually if needed]';
    }
  }

  /**
   * List issues with specific labels
   */
  async getIssuesByLabels(labels: string[], state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    if (!this.config) {
      throw new Error('GitHub service not configured');
    }

    try {
      const labelQuery = labels.join(',');
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues?labels=${encodeURIComponent(labelQuery)}&state=${state}&sort=created&direction=desc`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      logger.error('Failed to fetch GitHub issues', error, 'GITHUB_ISSUES');
      throw error;
    }
  }

  /**
   * Generate enhanced title with AI classification insights
   */
  private generateEnhancedTitle(bugReport: BugReportData, aiClassification: AIClassificationResult): string {
    const typePrefix = {
      bug: '🐛 [Bug]',
      feature_request: '✨ [Feature Request]', 
      improvement: '🔧 [Improvement]',
      user_error: '❓ [User Error]',
      configuration_issue: '⚙️ [Config Issue]',
      documentation_gap: '📚 [Docs]'
    }[aiClassification.issueType];

    const severityEmoji = {
      critical: '🚨',
      high: '⚠️', 
      medium: '🔸',
      low: '🔹'
    }[aiClassification.severity];

    return `${typePrefix} ${severityEmoji} ${bugReport.title} (${aiClassification.complexity})`;
  }

  /**
   * Generate enhanced labels based on AI classification
   */
  private generateEnhancedLabels(bugReport: BugReportData, aiClassification: AIClassificationResult): string[] {
    const labels = [
      aiClassification.issueType,
      `severity:${aiClassification.severity}`,
      `complexity:${aiClassification.complexity}`,
      `impact:${aiClassification.userImpact}`,
      `business-impact:${aiClassification.businessImpact}`
    ];

    // Add skill-based labels
    aiClassification.requiredSkills.forEach(skill => {
      labels.push(`skill:${skill}`);
    });

    // Add AI-suggested labels
    labels.push(...aiClassification.suggestedLabels);

    // Add effort estimation label
    if (aiClassification.estimatedEffortHours <= 4) {
      labels.push('effort:quick-fix');
    } else if (aiClassification.estimatedEffortHours <= 16) {
      labels.push('effort:moderate');
    } else {
      labels.push('effort:major');
    }

    return [...new Set(labels)]; // Remove duplicates
  }

  /**
   * Suggest assignees based on AI classification
   */
  private suggestAssignees(aiClassification: AIClassificationResult): string[] {
    // This could be enhanced with actual team member GitHub usernames
    // For now, return empty array - can be manually assigned
    return [];
  }

  /**
   * Assess user experience level based on bug report quality
   */
  private assessUserExperienceLevel(bugReport: BugReportData): 'novice' | 'intermediate' | 'expert' {
    let score = 0;
    
    // Quality indicators
    if (bugReport.steps.length >= 3) score += 1;
    if (bugReport.description.length > 100) score += 1;
    if (bugReport.systemInfo.userAgent) score += 1;
    if (bugReport.userActions.length > 5) score += 1;
    
    if (score >= 3) return 'expert';
    if (score >= 2) return 'intermediate';
    return 'novice';
  }

  /**
   * Generate enhanced analysis combining AI insights with system data
   */
  private generateEnhancedAnalysis(
    bugReport: BugReportData,
    errorContext: EnhancedErrorContext,
    aiClassification: AIClassificationResult
  ): EnhancedBugReportIssue['enhancedAnalysis'] {
    return {
      reproductionSteps: this.generateReproductionSteps(bugReport, errorContext),
      rootCauseAnalysis: this.generateRootCauseAnalysis(errorContext, aiClassification),
      debuggingInstructions: this.generateDebuggingInstructions(errorContext, aiClassification),
      workaroundSuggestions: this.generateWorkaroundSuggestions(aiClassification, errorContext),
      relatedFiles: this.identifyRelatedFiles(errorContext, aiClassification),
      testingChecklist: this.generateTestingChecklist(aiClassification)
    };
  }

  /**
   * Generate smart reproduction steps from user actions and AI analysis
   */
  private generateReproductionSteps(bugReport: BugReportData, errorContext: EnhancedErrorContext): string[] {
    const steps = [...bugReport.steps];
    
    // Add steps based on user actions leading to errors
    const relevantActions = errorContext.consoleErrors.slice(-3).map(error => 
      `Error occurred: ${error.message.substring(0, 100)}`
    );
    
    steps.push(...relevantActions);
    
    // Add system context steps
    if (errorContext.networkErrors.some(e => e.isSupabaseCall)) {
      steps.push('Check network connection and Supabase service status');
    }
    
    return steps;
  }

  /**
   * Generate comprehensive root cause analysis
   */
  private generateRootCauseAnalysis(errorContext: EnhancedErrorContext, aiClassification: AIClassificationResult): string {
    let analysis = `**AI Analysis**: ${aiClassification.likelyRootCause}\n\n`;
    
    analysis += `**Error Pattern Analysis**:\n`;
    if (errorContext.consoleErrors.length > 0) {
      analysis += `- ${errorContext.consoleErrors.length} JavaScript errors detected\n`;
    }
    if (errorContext.networkErrors.length > 0) {
      analysis += `- ${errorContext.networkErrors.length} network requests failed\n`;
    }
    if (errorContext.databaseErrors.length > 0) {
      analysis += `- ${errorContext.databaseErrors.length} database errors (${errorContext.databaseErrors.filter(e => e.isCompatibilityLayerIssue).length} compatibility layer issues)\n`;
    }
    
    analysis += `\n**User Frustration Level**: ${errorContext.userFrustrationLevel}/10\n`;
    analysis += `**Error Frequency**: ${errorContext.errorFrequency} errors/minute\n`;
    
    if (errorContext.potentialRootCause.length > 0) {
      analysis += `\n**Potential Root Causes**:\n${errorContext.potentialRootCause.map(cause => `- ${cause}`).join('\n')}`;
    }
    
    return analysis;
  }

  /**
   * Generate specific debugging instructions
   */
  private generateDebuggingInstructions(errorContext: EnhancedErrorContext, aiClassification: AIClassificationResult): string[] {
    const instructions = [...aiClassification.debuggingHints];
    
    // Add context-specific instructions
    if (errorContext.databaseErrors.some(e => e.isCompatibilityLayerIssue)) {
      instructions.push('Run compatibility layer verification: SELECT * FROM information_schema.views WHERE table_name IN (\'users\', \'properties_fixed\');');
    }
    
    if (errorContext.networkErrors.some(e => e.status >= 500)) {
      instructions.push('Check Supabase service status at https://status.supabase.com/');
    }
    
    if (errorContext.performanceMetrics.some(m => m.metrics.usedJSHeapSize && m.metrics.usedJSHeapSize > 100000000)) {
      instructions.push('Monitor memory usage: Check for memory leaks in React components');
    }
    
    return instructions;
  }

  /**
   * Generate workaround suggestions
   */
  private generateWorkaroundSuggestions(aiClassification: AIClassificationResult, errorContext: EnhancedErrorContext): string[] {
    const suggestions = [];
    
    if (aiClassification.immediateWorkaround) {
      suggestions.push(aiClassification.immediateWorkaround);
    }
    
    // Add context-specific workarounds
    if (errorContext.databaseErrors.some(e => e.isCompatibilityLayerIssue)) {
      suggestions.push('Clear browser cache and cookies, then refresh the page');
      suggestions.push('Try accessing the feature through a different route or menu option');
    }
    
    if (errorContext.networkErrors.some(e => e.errorType === 'timeout')) {
      suggestions.push('Reduce network load by closing other applications');
      suggestions.push('Try using a different network connection');
    }
    
    return suggestions;
  }

  /**
   * Identify files likely related to the issue
   */
  private identifyRelatedFiles(errorContext: EnhancedErrorContext, aiClassification: AIClassificationResult): string[] {
    const files = new Set<string>();
    
    // Database-related files
    if (errorContext.databaseErrors.length > 0) {
      files.add('src/services/inspectionService.ts');
      files.add('database_compatibility_migration.sql');
      files.add('src/integrations/supabase/types.ts');
    }
    
    // Feature-specific files
    errorContext.affectedFeatures.forEach(feature => {
      switch (feature) {
        case 'Property Management':
          files.add('src/pages/PropertySelection.tsx');
          files.add('src/services/propertyService.ts');
          break;
        case 'Inspection System':
          files.add('src/pages/InspectionPage.tsx');
          files.add('src/services/inspectionService.ts');
          break;
        case 'Authentication':
          files.add('src/components/AuthProvider.tsx');
          files.add('src/hooks/useAuthState.ts');
          break;
        case 'Media Upload':
          files.add('src/services/mediaService.ts');
          files.add('src/components/MediaUploader.tsx');
          break;
      }
    });
    
    return Array.from(files);
  }

  /**
   * Generate testing checklist
   */
  private generateTestingChecklist(aiClassification: AIClassificationResult): string[] {
    const checklist = [
      'Reproduce the issue following the documented steps',
      'Verify the fix resolves the reported problem',
      'Test edge cases and error scenarios',
      'Check that the fix doesn\'t break existing functionality'
    ];
    
    // Add skill-specific tests
    if (aiClassification.requiredSkills.includes('database')) {
      checklist.push('Test database queries and compatibility layer functions');
      checklist.push('Verify Row Level Security policies work correctly');
    }
    
    if (aiClassification.requiredSkills.includes('mobile')) {
      checklist.push('Test on mobile devices (iOS and Android)');
      checklist.push('Verify offline functionality if applicable');
    }
    
    if (aiClassification.requiredSkills.includes('frontend')) {
      checklist.push('Test across different browsers');
      checklist.push('Verify responsive design on various screen sizes');
    }
    
    return checklist;
  }

  /**
   * Format enhanced bug report into comprehensive GitHub issue body
   */
  private formatEnhancedBugReportBody(
    bugReport: BugReportData,
    errorContext: EnhancedErrorContext,
    aiClassification: AIClassificationResult,
    enhancedAnalysis: EnhancedBugReportIssue['enhancedAnalysis']
  ): string {
    return `# 🤖 AI-Enhanced Bug Report

## 📋 Issue Summary
${bugReport.description}

## 🎯 AI Classification
- **Type**: ${aiClassification.issueType.replace('_', ' ').toUpperCase()}
- **Severity**: ${aiClassification.severity.toUpperCase()} (${aiClassification.severityScore}/10)
- **Complexity**: ${aiClassification.complexity.toUpperCase()}
- **Business Impact**: ${aiClassification.businessImpact.toUpperCase()}
- **User Impact**: ${aiClassification.userImpact.replace('_', ' ').toUpperCase()}
- **Estimated Effort**: ${aiClassification.estimatedEffortHours} hours
- **Required Skills**: ${aiClassification.requiredSkills.join(', ')}
- **AI Confidence**: ${Math.round(aiClassification.confidence * 100)}%

## 🔍 Root Cause Analysis
${enhancedAnalysis.rootCauseAnalysis}

## 🔧 Debugging Instructions
${enhancedAnalysis.debuggingInstructions.map((instruction, i) => `${i + 1}. ${instruction}`).join('\n')}

## 🚀 Immediate Workarounds
${enhancedAnalysis.workaroundSuggestions.length > 0 
  ? enhancedAnalysis.workaroundSuggestions.map(suggestion => `- ${suggestion}`).join('\n')
  : '_No immediate workarounds available_'
}

## 📝 Reproduction Steps
${enhancedAnalysis.reproductionSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 💻 Technical Details

### Error Context
- **Console Errors**: ${errorContext.consoleErrors.length}
- **Network Errors**: ${errorContext.networkErrors.length}
- **Database Errors**: ${errorContext.databaseErrors.length}
- **Performance Issues**: ${errorContext.performanceMetrics.length > 0 ? 'Detected' : 'None'}
- **User Frustration Level**: ${errorContext.userFrustrationLevel}/10
- **Error Frequency**: ${errorContext.errorFrequency} errors/minute

### Recent Console Errors
${errorContext.consoleErrors.slice(-3).map(error => 
  `- **${error.level.toUpperCase()}**: ${error.message.substring(0, 150)}${error.message.length > 150 ? '...' : ''}`
).join('\n') || '_No recent console errors_'}

### Recent Network Errors
${errorContext.networkErrors.slice(-3).map(error => 
  `- **${error.method} ${error.url}**: ${error.status} ${error.statusText} (${error.duration.toFixed(2)}ms)`
).join('\n') || '_No recent network errors_'}

### Database Issues
${errorContext.databaseErrors.slice(-3).map(error => 
  `- **${error.operation} on ${error.table}**: ${error.error}${error.isCompatibilityLayerIssue ? ' (COMPATIBILITY LAYER ISSUE)' : ''}`
).join('\n') || '_No database errors_'}

## 🎯 Testing Checklist
${enhancedAnalysis.testingChecklist.map(item => `- [ ] ${item}`).join('\n')}

## 📁 Related Files
${enhancedAnalysis.relatedFiles.length > 0 
  ? enhancedAnalysis.relatedFiles.map(file => `- \`${file}\``).join('\n')
  : '_Files will be identified during investigation_'
}

## 👤 User Information
- **User ID**: ${bugReport.userInfo.userId || 'Not available'}
- **Role**: ${bugReport.userInfo.userRole || 'Not available'}
- **Email**: ${bugReport.userInfo.email || 'Not available'}

## 🌐 System Information
- **Browser**: ${bugReport.systemInfo.userAgent}
- **Platform**: ${bugReport.systemInfo.platform}
- **Language**: ${bugReport.systemInfo.language}
- **Screen Resolution**: ${bugReport.systemInfo.screenResolution}
- **URL**: ${bugReport.systemInfo.url}
- **Timestamp**: ${bugReport.systemInfo.timestamp}

## 🤖 AI Analysis Details
**Model**: ${aiClassification.analysisMetadata.modelUsed}
**Analysis Time**: ${aiClassification.analysisMetadata.analysisTime}ms
**Confidence Factors**: ${aiClassification.analysisMetadata.confidenceFactors.join(', ')}

**AI Reasoning**: ${aiClassification.reasoning}

---
*This enhanced issue was automatically generated by STR Certified's AI-powered bug reporting system*`;
  }

  /**
   * Format bug report data into GitHub issue body (legacy method)
   */
  private formatBugReportBody(bugReport: BugReportData): string {
    const formatUserActions = (actions: typeof bugReport.userActions) => {
      return actions.map((action, index) => {
        const time = new Date(action.timestamp).toLocaleTimeString();
        return `${index + 1}. **${time}** - ${action.type.toUpperCase()}: ${action.element}${action.details.elementText ? ` ("${action.details.elementText}")` : ''}`;
      }).join('\n');
    };

    return `## Bug Report

### Description
${bugReport.description}

### Severity
**${bugReport.severity.toUpperCase()}**

### Category
${bugReport.category}

### Steps to Reproduce
${bugReport.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

### User Actions (Last 20 interactions)
${formatUserActions(bugReport.userActions)}

### System Information
- **Browser**: ${bugReport.systemInfo.userAgent}
- **Platform**: ${bugReport.systemInfo.platform}
- **Language**: ${bugReport.systemInfo.language}
- **Screen Resolution**: ${bugReport.systemInfo.screenResolution}
- **URL**: ${bugReport.systemInfo.url}
- **Timestamp**: ${bugReport.systemInfo.timestamp}

### User Information
- **User ID**: ${bugReport.userInfo.userId || 'Not available'}
- **Role**: ${bugReport.userInfo.userRole || 'Not available'}
- **Email**: ${bugReport.userInfo.email || 'Not available'}

### Session Information
- **Session ID**: ${bugReport.userActions[0]?.sessionId || 'Not available'}

---
*This issue was automatically generated from the DoubleCheck app's bug reporting system.*`;
  }

  /**
   * Generate appropriate labels for the bug report
   */
  private generateLabels(bugReport: BugReportData): string[] {
    const labels = ['bug', 'user-reported'];

    // Add severity label
    labels.push(`severity:${bugReport.severity}`);

    // Add category label
    labels.push(`category:${bugReport.category}`);

    // Add platform label
    if (bugReport.systemInfo.platform.toLowerCase().includes('win')) {
      labels.push('platform:windows');
    } else if (bugReport.systemInfo.platform.toLowerCase().includes('mac')) {
      labels.push('platform:mac');
    } else if (bugReport.systemInfo.platform.toLowerCase().includes('linux')) {
      labels.push('platform:linux');
    }

    // Add browser label
    const userAgent = bugReport.systemInfo.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      labels.push('browser:chrome');
    } else if (userAgent.includes('firefox')) {
      labels.push('browser:firefox');
    } else if (userAgent.includes('safari')) {
      labels.push('browser:safari');
    } else if (userAgent.includes('edge')) {
      labels.push('browser:edge');
    }

    return labels;
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get repository statistics for admin dashboard
   */
  async getRepositoryStats(): Promise<{
    openBugReports: number;
    closedBugReports: number;
    totalBugReports: number;
    recentIssues: GitHubIssue[];
  }> {
    if (!this.isConfigured()) {
      return {
        openBugReports: 0,
        closedBugReports: 0,
        totalBugReports: 0,
        recentIssues: []
      };
    }

    try {
      const [openIssues, closedIssues] = await Promise.all([
        this.getIssuesByLabels(['bug', 'user-reported'], 'open'),
        this.getIssuesByLabels(['bug', 'user-reported'], 'closed')
      ]);

      const recentIssues = [...openIssues, ...closedIssues]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return {
        openBugReports: openIssues.length,
        closedBugReports: closedIssues.length,
        totalBugReports: openIssues.length + closedIssues.length,
        recentIssues
      };

    } catch (error) {
      logger.error('Failed to get repository stats', error, 'GITHUB_ISSUES');
      return {
        openBugReports: 0,
        closedBugReports: 0,
        totalBugReports: 0,
        recentIssues: []
      };
    }
  }
}

// Create singleton instance
export const githubIssuesService = new GitHubIssuesService();

// Initialize with environment variables if available
if (typeof window !== 'undefined') {
  // Get environment variables using the correct method for Vite
  const owner = import.meta.env.VITE_GITHUB_OWNER || 
                import.meta.env.REACT_APP_GITHUB_OWNER || 
                'rentresponsiblyrr';
  const repo = import.meta.env.VITE_GITHUB_REPO || 
               import.meta.env.REACT_APP_GITHUB_REPO || 
               'doublecheck_unified';
  const token = import.meta.env.VITE_GITHUB_TOKEN || 
                import.meta.env.REACT_APP_GITHUB_TOKEN || 
                '';

  console.log('🐛 GitHub Service Configuration:', {
    owner,
    repo,
    token: token ? `${token.substring(0, 10)}...` : 'NOT SET',
    environment: import.meta.env.MODE
  });

  if (owner && repo && token && token !== 'your-github-token-here') {
    githubIssuesService.configure({ owner, repo, token });
    console.log('✅ GitHub service configured successfully');
  } else {
    console.warn('⚠️ GitHub service not configured - missing credentials');
  }
}