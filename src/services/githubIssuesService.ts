/**
 * @fileoverview GitHub Issues Service
 * Handles creating and managing GitHub issues for bug reports
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { logger } from '@/utils/logger';
import type { BugReportData } from './userActivityService';

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
   * Create a GitHub issue from bug report data
   */
  async createBugReportIssue(bugReport: BugReportData): Promise<GitHubIssue> {
    if (!this.isConfigured()) {
      throw new Error('GitHub service not configured');
    }

    const issueBody = this.formatBugReportBody(bugReport);
    const labels = this.generateLabels(bugReport);

    const issueRequest: CreateIssueRequest = {
      title: `[Bug Report] ${bugReport.title}`,
      body: issueBody,
      labels,
      assignees: [] // Can be configured per repo
    };

    return this.createIssue(issueRequest);
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
   * Format bug report data into GitHub issue body
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