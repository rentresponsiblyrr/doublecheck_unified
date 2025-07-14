import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Bug } from 'lucide-react';
import { githubIssuesService } from '@/services/githubIssuesService';
import { userActivityService } from '@/services/userActivityService';

interface GitHubStatus {
  configured: boolean;
  tokenValid: boolean;
  repoAccess: boolean;
  error?: string;
}

export default function GitHubIntegrationTest() {
  const [status, setStatus] = useState<GitHubStatus>({
    configured: false,
    tokenValid: false,
    repoAccess: false
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const checkGitHubStatus = async () => {
    setIsTesting(true);
    try {
      // Check if service is configured
      const configured = githubIssuesService.isConfigured();
      let tokenValid = false;
      let repoAccess = false;
      let error = undefined;

      if (configured) {
        try {
          // Try to fetch issues to test token and repo access
          const issues = await githubIssuesService.getIssuesByLabels(['bug'], 'open');
          tokenValid = true;
          repoAccess = true;
          setRecentIssues(issues.slice(0, 5));
        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error';
          if (error.includes('401')) {
            tokenValid = false;
            error = 'Invalid GitHub token';
          } else if (error.includes('404')) {
            tokenValid = true;
            repoAccess = false;
            error = 'Repository not found or no access';
          }
        }
      }

      setStatus({ configured, tokenValid, repoAccess, error });
    } finally {
      setIsTesting(false);
    }
  };

  const createTestIssue = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const testBugReport = {
        title: 'Test Bug Report',
        description: 'This is a test bug report created from the admin panel',
        severity: 'low' as const,
        category: 'other' as const,
        steps: ['1. Open admin panel', '2. Navigate to GitHub integration test', '3. Click "Create Test Issue"'],
        userActions: userActivityService.getRecentActions(5),
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

      const issue = await githubIssuesService.createBugReportIssue(testBugReport);
      setTestResult(`✅ Test issue created successfully! Issue #${issue.number}: ${issue.html_url}`);
    } catch (error) {
      setTestResult(`❌ Failed to create test issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GitHub Integration Test</h1>
        <p className="text-gray-600">Debug and test GitHub bug report integration</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            GitHub Service Status
          </CardTitle>
          <CardDescription>
            Check if GitHub integration is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Service Configured</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.configured)}
                <Badge variant={status.configured ? "default" : "destructive"}>
                  {status.configured ? "YES" : "NO"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Token Valid</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.tokenValid)}
                <Badge variant={status.tokenValid ? "default" : "destructive"}>
                  {status.tokenValid ? "YES" : "NO"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Repository Access</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.repoAccess)}
                <Badge variant={status.repoAccess ? "default" : "destructive"}>
                  {status.repoAccess ? "YES" : "NO"}
                </Badge>
              </div>
            </div>
          </div>

          {status.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                <strong>Error:</strong> {status.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={checkGitHubStatus} disabled={isTesting}>
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recheck Status
                </>
              )}
            </Button>
            
            <Button 
              onClick={createTestIssue} 
              disabled={isTesting || !status.configured || !status.tokenValid || !status.repoAccess}
              variant="outline"
            >
              Create Test Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-gray-100 p-3 rounded">
              {testResult}
            </div>
            {testResult.includes('http') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open(testResult.split(': ')[1], '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Issue
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bug Reports</CardTitle>
            <CardDescription>
              Latest issues from the repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">#{issue.number}: {issue.title}</div>
                    <div className="text-sm text-gray-600">
                      {issue.state} • {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(issue.html_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Check GitHub configuration from environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>VITE_GITHUB_OWNER:</strong> {import.meta.env.VITE_GITHUB_OWNER || 'NOT SET'}
            </div>
            <div>
              <strong>VITE_GITHUB_REPO:</strong> {import.meta.env.VITE_GITHUB_REPO || 'NOT SET'}
            </div>
            <div>
              <strong>VITE_GITHUB_TOKEN:</strong> {import.meta.env.VITE_GITHUB_TOKEN ? 
                `${import.meta.env.VITE_GITHUB_TOKEN.substring(0, 10)}...` : 'NOT SET'}
            </div>
            <div>
              <strong>NODE_ENV:</strong> {import.meta.env.MODE}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}