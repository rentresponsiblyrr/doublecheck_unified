import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SimpleGitHubTest() {
  const [result, setResult] = React.useState<string>('Click button to test');
  const [loading, setLoading] = React.useState(false);

  const testGitHub = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test environment variables
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      const repo = import.meta.env.VITE_GITHUB_REPO;
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      
      if (!owner || !repo || !token) {
        setResult(`❌ Missing environment variables:
Owner: ${owner || 'NOT SET'}
Repo: ${repo || 'NOT SET'}
Token: ${token ? 'SET' : 'NOT SET'}`);
        return;
      }
      
      // Test API call
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ GitHub API working!
Repository: ${data.full_name}
Private: ${data.private}
Access: ${data.permissions ? 'Full access' : 'Read access'}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setResult(`❌ GitHub API error: ${response.status} ${response.statusText}
${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      setResult(`💥 Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Simple GitHub Test</h1>
        <p className="text-gray-600">Basic GitHub API connectivity test</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GitHub API Test</CardTitle>
          <CardDescription>Test basic GitHub API connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={testGitHub} disabled={loading}>
              {loading ? 'Testing...' : 'Test GitHub API'}
            </Button>
            
            <div className="p-3 bg-gray-100 rounded font-mono text-sm whitespace-pre-wrap">
              {result}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Check</CardTitle>
          <CardDescription>Current environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>VITE_GITHUB_OWNER: {import.meta.env.VITE_GITHUB_OWNER || 'NOT SET'}</div>
            <div>VITE_GITHUB_REPO: {import.meta.env.VITE_GITHUB_REPO || 'NOT SET'}</div>
            <div>VITE_GITHUB_TOKEN: {import.meta.env.VITE_GITHUB_TOKEN ? `${import.meta.env.VITE_GITHUB_TOKEN.substring(0, 10)}...` : 'NOT SET'}</div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>How to fix GitHub integration:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Ensure all environment variables are set correctly</li>
            <li>Check that the GitHub token has 'repo' permissions</li>
            <li>Verify the repository exists and you have access</li>
            <li>Test the API connection above</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}