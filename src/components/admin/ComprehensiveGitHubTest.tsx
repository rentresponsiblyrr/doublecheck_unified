import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Github, Bug, Settings, BarChart3 } from 'lucide-react';
import { githubIssuesService } from '@/services/githubIssuesService';
import type { BugReportData } from '@/services/userActivityService';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function ComprehensiveGitHubTest() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [configStatus, setConfigStatus] = useState<{
    owner: string;
    repo: string;
    token: string;
    isConfigured: boolean;
  }>({
    owner: '',
    repo: '',
    token: '',
    isConfigured: false
  });

  // Mock bug report form data
  const [mockBugReport, setMockBugReport] = useState({
    title: 'Test Bug Report from Admin Panel',
    description: 'This is a test bug report created from the admin panel to verify GitHub integration is working properly.',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'ui',
    steps: [
      'Navigate to admin panel',
      'Click on GitHub Integration Test',
      'Fill out test bug report form',
      'Submit test report'
    ]
  });

  // Check configuration on component mount
  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const owner = import.meta.env.VITE_GITHUB_OWNER || '';
    const repo = import.meta.env.VITE_GITHUB_REPO || '';
    const token = import.meta.env.VITE_GITHUB_TOKEN || '';
    const isConfigured = githubIssuesService.isConfigured();

    setConfigStatus({ owner, repo, token, isConfigured });

    console.log('🔍 GitHub Configuration Check:', {
      owner,
      repo,
      token: token ? `${token.substring(0, 10)}...` : 'NOT SET',
      isConfigured,
      environment: import.meta.env.MODE
    });
  };

  const runTest = async (testName: string, testFunction: () => Promise<TestResult>) => {
    setIsLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  // Test 1: Environment Variables
  const testEnvironmentVariables = async (): Promise<TestResult> => {
    const owner = import.meta.env.VITE_GITHUB_OWNER;
    const repo = import.meta.env.VITE_GITHUB_REPO;
    const token = import.meta.env.VITE_GITHUB_TOKEN;

    const missing = [];
    if (!owner) missing.push('VITE_GITHUB_OWNER');
    if (!repo) missing.push('VITE_GITHUB_REPO');
    if (!token) missing.push('VITE_GITHUB_TOKEN');

    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing environment variables: ${missing.join(', ')}`,
        details: { owner, repo, token: token ? 'SET' : 'NOT SET' }
      };
    }

    return {
      success: true,
      message: 'All environment variables are properly set',
      details: { 
        owner, 
        repo, 
        token: `${token.substring(0, 10)}...`,
        expected: {
          owner: 'rentresponsiblyrr',
          repo: 'doublecheck_unified'
        }
      }
    };
  };

  // Test 2: Service Configuration
  const testServiceConfiguration = async (): Promise<TestResult> => {
    const isConfigured = githubIssuesService.isConfigured();
    
    return {
      success: isConfigured,
      message: isConfigured 
        ? 'GitHub service is properly configured' 
        : 'GitHub service is not configured',
      details: { isConfigured }
    };
  };

  // Test 3: GitHub API Authentication
  const testGitHubAuthentication = async (): Promise<TestResult> => {
    if (!configStatus.isConfigured) {
      return {
        success: false,
        message: 'Service not configured - cannot test authentication'
      };
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${configStatus.owner}/${configStatus.repo}`, {
        headers: {
          'Authorization': `Bearer ${configStatus.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repoData = await response.json();
        return {
          success: true,
          message: 'GitHub authentication successful',
          details: {
            repository: repoData.full_name,
            private: repoData.private,
            permissions: repoData.permissions
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Authentication failed: ${response.status} ${response.statusText}`,
          details: errorData
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  };

  // Test 4: Issue Creation Permissions
  const testIssuePermissions = async (): Promise<TestResult> => {
    if (!configStatus.isConfigured) {
      return {
        success: false,
        message: 'Service not configured - cannot test permissions'
      };
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${configStatus.owner}/${configStatus.repo}/issues`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${configStatus.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const issues = await response.json();
        return {
          success: true,
          message: 'Issue access permissions verified',
          details: {
            issueCount: issues.length,
            canCreateIssues: true
          }
        };
      } else {
        return {
          success: false,
          message: `Issue access failed: ${response.status} ${response.statusText}`,
          details: { status: response.status }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Permission test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  };

  // Test 5: Create Test Issue
  const testCreateIssue = async (): Promise<TestResult> => {
    if (!configStatus.isConfigured) {
      return {
        success: false,
        message: 'Service not configured - cannot create test issue'
      };
    }

    try {
      const testIssue = {
        title: '[TEST] GitHub Integration Test - Please Close',
        body: `# GitHub Integration Test

This is a test issue created by the admin panel to verify GitHub integration is working properly.

**Test Details:**
- Created at: ${new Date().toISOString()}
- Environment: ${import.meta.env.MODE}
- User Agent: ${navigator.userAgent}

**Please close this issue after verification.**`,
        labels: ['test', 'admin-generated', 'integration-test']
      };

      const issue = await githubIssuesService.createIssue(testIssue);
      
      return {
        success: true,
        message: 'Test issue created successfully',
        details: {
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          title: issue.title
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create test issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  };

  // Test 6: Bug Report Format
  const testBugReportFormat = async (): Promise<TestResult> => {
    try {
      // Create mock bug report data
      const mockBugReportData: BugReportData = {
        title: mockBugReport.title,
        description: mockBugReport.description,
        severity: mockBugReport.severity,
        category: mockBugReport.category,
        steps: mockBugReport.steps,
        userActions: [
          {
            type: 'click',
            element: 'button',
            timestamp: Date.now(),
            sessionId: 'test-session-123',
            details: {
              elementText: 'Test Button',
              url: window.location.href
            }
          }
        ],
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          url: window.location.href,
          timestamp: new Date().toISOString()
        },
        userInfo: {
          userId: 'test-user',
          userRole: 'admin',
          email: 'test@example.com'
        }
      };

      if (!configStatus.isConfigured) {
        return {
          success: false,
          message: 'Service not configured - cannot test bug report creation'
        };
      }

      const issue = await githubIssuesService.createBugReportIssue(mockBugReportData);
      
      return {
        success: true,
        message: 'Bug report issue created successfully',
        details: {
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          title: issue.title,
          labels: issue.labels
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Bug report test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  };

  // Test 7: Repository Statistics
  const testRepositoryStats = async (): Promise<TestResult> => {
    try {
      const stats = await githubIssuesService.getRepositoryStats();
      
      return {
        success: true,
        message: 'Repository statistics retrieved successfully',
        details: stats
      };
    } catch (error) {
      return {
        success: false,
        message: `Stats test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  };

  const runAllTests = async () => {
    const tests = [
      { name: 'environmentVariables', fn: testEnvironmentVariables },
      { name: 'serviceConfiguration', fn: testServiceConfiguration },
      { name: 'githubAuthentication', fn: testGitHubAuthentication },
      { name: 'issuePermissions', fn: testIssuePermissions },
      { name: 'repositoryStats', fn: testRepositoryStats }
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    return result.success 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Github className="h-6 w-6" />
          Comprehensive GitHub Integration Test
        </h1>
        <p className="text-gray-600">
          Complete diagnostic suite for GitHub bug reporting integration
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Owner:</strong> {configStatus.owner || 'NOT SET'}
            </div>
            <div>
              <strong>Repository:</strong> {configStatus.repo || 'NOT SET'}
            </div>
            <div>
              <strong>Token:</strong> {configStatus.token ? 'SET' : 'NOT SET'}
            </div>
            <div>
              <strong>Service Status:</strong> 
              <span className={`ml-2 ${configStatus.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                {configStatus.isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runAllTests} disabled={Object.values(isLoading).some(Boolean)}>
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTest('environmentVariables', testEnvironmentVariables)}
              disabled={isLoading.environmentVariables}
            >
              Test Environment Variables
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTest('githubAuthentication', testGitHubAuthentication)}
              disabled={isLoading.githubAuthentication}
            >
              Test Authentication
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTest('createIssue', testCreateIssue)}
              disabled={isLoading.createIssue}
            >
              Create Test Issue
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTest('bugReportFormat', testBugReportFormat)}
              disabled={isLoading.bugReportFormat}
            >
              Test Bug Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'environmentVariables', title: 'Environment Variables', icon: Settings },
          { key: 'serviceConfiguration', title: 'Service Configuration', icon: Settings },
          { key: 'githubAuthentication', title: 'GitHub Authentication', icon: Github },
          { key: 'issuePermissions', title: 'Issue Permissions', icon: CheckCircle },
          { key: 'createIssue', title: 'Create Test Issue', icon: Bug },
          { key: 'bugReportFormat', title: 'Bug Report Format', icon: Bug },
          { key: 'repositoryStats', title: 'Repository Statistics', icon: BarChart3 }
        ].map(({ key, title, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {title}
                {getStatusIcon(testResults[key])}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading[key] ? (
                <div className="text-sm text-gray-500">Testing...</div>
              ) : testResults[key] ? (
                <div className="space-y-2">
                  <div className={`text-sm ${testResults[key].success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults[key].message}
                  </div>
                  {testResults[key].details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Details</summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(testResults[key].details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Not tested yet</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mock Bug Report Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Bug Report Test</CardTitle>
          <CardDescription>
            Customize the test bug report data before creating a GitHub issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={mockBugReport.title}
              onChange={(e) => setMockBugReport(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={mockBugReport.description}
              onChange={(e) => setMockBugReport(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <Select
                value={mockBugReport.severity}
                onValueChange={(value: any) => setMockBugReport(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={mockBugReport.category}
                onChange={(e) => setMockBugReport(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Environment Variables Not Set:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Check that VITE_GITHUB_* variables are set in production environment</li>
                <li>Verify variables are available during build time (not just runtime)</li>
                <li>Ensure variables don't contain placeholder values</li>
              </ul>
            </div>
            <div>
              <strong>Authentication Failures:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Regenerate GitHub Personal Access Token with 'repo' scope</li>
                <li>Verify token hasn't expired</li>
                <li>Check that repository exists and is accessible</li>
              </ul>
            </div>
            <div>
              <strong>Permission Issues:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Token must have 'repo' scope for private repositories</li>
                <li>Token must have 'public_repo' scope for public repositories</li>
                <li>Verify user has write access to the repository</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}