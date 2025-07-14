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
  const [componentError, setComponentError] = useState<string | null>(null);

  const checkGitHubStatus = async () => {
    setIsTesting(true);
    const debug: string[] = [];
    
    try {
      debug.push('🔍 Starting GitHub integration check...');
      
      // Check environment variables
      const envVars = {
        owner: import.meta.env.VITE_GITHUB_OWNER,
        repo: import.meta.env.VITE_GITHUB_REPO,
        token: import.meta.env.VITE_GITHUB_TOKEN
      };
      
      debug.push(`📋 Environment variables: owner=${envVars.owner}, repo=${envVars.repo}, token=${envVars.token ? 'SET' : 'NOT SET'}`);
      
      // Check if service is configured
      const configured = githubIssuesService.isConfigured();
      debug.push(`⚙️ Service configured: ${configured}`);
      
      let tokenValid = false;
      let repoAccess = false;
      let error = undefined;

      if (configured) {
        try {
          debug.push('🔐 Testing GitHub API access...');
          
          // Try to fetch issues to test token and repo access
          const issues = await githubIssuesService.getIssuesByLabels(['bug'], 'open');
          tokenValid = true;
          repoAccess = true;
          setRecentIssues(issues.slice(0, 5));
          debug.push(`✅ Successfully fetched ${issues.length} issues`);
        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error';
          debug.push(`❌ GitHub API error: ${error}`);
          
          if (error.includes('401')) {
            tokenValid = false;
            error = 'Invalid GitHub token (401 Unauthorized)';
          } else if (error.includes('404')) {
            tokenValid = true;
            repoAccess = false;
            error = 'Repository not found or no access (404 Not Found)';
          } else if (error.includes('403')) {
            tokenValid = true;
            repoAccess = false;
            error = 'Access forbidden - token may not have required permissions (403 Forbidden)';
          }
        }
      } else {
        debug.push('❌ Service not configured - missing environment variables');
        error = 'GitHub service not configured - check environment variables';
      }

      setStatus({ configured, tokenValid, repoAccess, error });
      setDebugInfo(debug);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      debug.push(`💥 Unexpected error: ${error}`);
      setDebugInfo(debug);
      setStatus({ configured: false, tokenValid: false, repoAccess: false, error });
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
    try {
      checkGitHubStatus();
    } catch (error) {
      setComponentError(error instanceof Error ? error.message : 'Failed to initialize component');
      console.error('GitHubIntegrationTest initialization error:', error);
    }
  }, []);

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  // Component error handling
  if (componentError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">GitHub Integration Test</h1>
          <p className="text-gray-600">Debug and test GitHub bug report integration</p>
        </div>
        
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Component Error:</strong> {componentError}
            <br />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setComponentError(null);
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Step-by-step debugging of GitHub integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-700">
                  {info}
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

      {/* Quick GitHub API Test */}
      <Card>
        <CardHeader>
          <CardTitle>Quick GitHub API Test</CardTitle>
          <CardDescription>
            Test GitHub API directly to identify issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              setIsTesting(true);
              try {
                const response = await fetch('https://api.github.com/repos/rentresponsiblyrr/doublecheck_unified/issues?state=open&labels=bug&per_page=1', {
                  headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                  }
                });
                
                const result = await response.json();
                setTestResult(`API Response: ${response.status} ${response.statusText}\n${JSON.stringify(result, null, 2)}`);
              } catch (error) {
                setTestResult(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setIsTesting(false);
              }
            }}
            disabled={isTesting}
            variant="outline"
          >
            Test GitHub API Directly
          </Button>
          
          {testResult && (
            <div className="mt-3 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}