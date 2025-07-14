import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { githubIssuesService } from '@/services/githubIssuesService';

export default function GitHubIntegrationTest() {
  const [testResult, setTestResult] = useState<string>('Click "Test GitHub Integration" to diagnose issues');
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult('Testing GitHub integration...');
    
    try {
      let result = '🔍 GitHub Integration Test Results:\n\n';
      
      // 1. Check environment variables
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      const repo = import.meta.env.VITE_GITHUB_REPO;
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      
      result += `📋 Environment Variables:\n`;
      result += `  VITE_GITHUB_OWNER: ${owner || '❌ NOT SET'}\n`;
      result += `  VITE_GITHUB_REPO: ${repo || '❌ NOT SET'}\n`;
      result += `  VITE_GITHUB_TOKEN: ${token ? '✅ SET' : '❌ NOT SET'}\n\n`;
      
      // 2. Check service configuration
      const isConfigured = githubIssuesService.isConfigured();
      result += `⚙️ Service Configuration: ${isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}\n\n`;
      
      if (!isConfigured) {
        result += `❌ ISSUE FOUND: GitHub service is not properly configured.\n\n`;
        result += `🔧 SOLUTION:\n`;
        result += `1. Ensure environment variables are set in your deployment\n`;
        result += `2. Check that VITE_GITHUB_TOKEN has 'repo' permissions\n`;
        result += `3. Verify repository exists: ${owner}/${repo}\n`;
        setTestResult(result);
        return;
      }
      
      // 3. Test API access
      result += `🔐 Testing GitHub API access...\n`;
      
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const repoData = await response.json();
          result += `✅ Repository access: SUCCESS\n`;
          result += `  Repository: ${repoData.full_name}\n`;
          result += `  Private: ${repoData.private}\n`;
          
          // 4. Test issue creation permissions
          try {
            const issuesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            
            if (issuesResponse.ok) {
              result += `✅ Issue access: SUCCESS\n`;
              result += `🎉 GitHub integration is working correctly!\n\n`;
              result += `✅ Bug reports should create GitHub issues automatically.`;
            } else {
              result += `❌ Issue access: FAILED (${issuesResponse.status})\n`;
              result += `🔧 Check token permissions - needs 'repo' scope.`;
            }
          } catch (issueError) {
            result += `❌ Issue test failed: ${issueError}\n`;
          }
          
        } else {
          const errorData = await response.json().catch(() => ({}));
          result += `❌ Repository access: FAILED (${response.status})\n`;
          result += `Error: ${JSON.stringify(errorData, null, 2)}\n\n`;
          
          if (response.status === 401) {
            result += `🔧 SOLUTION: Invalid token - regenerate GitHub token with 'repo' permissions`;
          } else if (response.status === 404) {
            result += `🔧 SOLUTION: Repository not found - check owner/repo names`;
          } else if (response.status === 403) {
            result += `🔧 SOLUTION: Access forbidden - token needs more permissions`;
          }
        }
      } catch (apiError) {
        result += `❌ API Error: ${apiError}\n`;
        result += `🔧 Check network connectivity and GitHub API status`;
      }
      
      setTestResult(result);
      
    } catch (error) {
      setTestResult(`💥 Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GitHub Integration Test</h1>
        <p className="text-gray-600">
          Diagnose why bug reports are only saving locally instead of creating GitHub issues
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Issue:</strong> Bug reports show "Report logged locally. Configure GitHub integration to create issues automatically."
          <br />
          <strong>Expected:</strong> Bug reports should create GitHub issues automatically.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Test</CardTitle>
          <CardDescription>
            Test GitHub API connectivity and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test GitHub Integration'}
            </Button>
            
            <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {testResult}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Fix Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>1. Environment Variables:</strong> Ensure VITE_GITHUB_* variables are set in production</div>
            <div><strong>2. GitHub Token:</strong> Must have 'repo' scope permissions</div>
            <div><strong>3. Repository:</strong> Verify rentresponsiblyrr/doublecheck_unified exists and is accessible</div>
            <div><strong>4. Deployment:</strong> Environment variables must be available in build environment</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}