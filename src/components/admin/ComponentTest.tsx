import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/lib/error/error-boundary';

// Lazy load components for testing
const SimpleUserManagement = React.lazy(() => import('./SimpleUserManagement'));
const SimpleChecklistManagement = React.lazy(() => import('./SimpleChecklistManagement'));
const AuditCenter = React.lazy(() => import('./AuditCenter'));

interface ComponentTestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
}

const ComponentTestWrapper: React.FC<{ 
  children: React.ReactNode; 
  componentName: string;
  onResult: (result: ComponentTestResult) => void;
}> = ({ children, componentName, onResult }) => {
  React.useEffect(() => {
    onResult({ name: componentName, status: 'loading' });
  }, [componentName, onResult]);

  return (
    <ErrorBoundary
      level="component"
      fallback={({ error }) => {
        React.useEffect(() => {
          onResult({ 
            name: componentName, 
            status: 'error', 
            error: error?.message || 'Unknown error' 
          });
        }, [error]);
        
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{componentName} failed to load:</strong> {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        );
      }}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading {componentName}...</span>
        </div>
      }>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default function ComponentTest() {
  const [results, setResults] = useState<ComponentTestResult[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('users');

  const updateResult = (result: ComponentTestResult) => {
    setResults(prev => {
      const filtered = prev.filter(r => r.name !== result.name);
      return [...filtered, result];
    });
  };

  const handleComponentLoad = (componentName: string) => {
    updateResult({ name: componentName, status: 'success' });
  };

  const getStatusIcon = (status: ComponentTestResult['status']) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Component Test Center</h1>
        <p className="text-gray-600">Test individual admin components in isolation</p>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Component Load Status</CardTitle>
          <CardDescription>Real-time component loading results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded border">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.name}</span>
                <span className="text-sm text-gray-600 capitalize">{result.status}</span>
                {result.error && (
                  <span className="text-sm text-red-600 ml-auto font-mono">
                    {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Testing Tabs */}
      <Tabs value={selectedComponent} onValueChange={setSelectedComponent}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="checklists">Checklist Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Center</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SimpleUserManagement Test</CardTitle>
              <CardDescription>Testing user management component</CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentTestWrapper 
                componentName="SimpleUserManagement" 
                onResult={updateResult}
              >
                <div onLoad={() => handleComponentLoad('SimpleUserManagement')}>
                  <SimpleUserManagement />
                </div>
              </ComponentTestWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SimpleChecklistManagement Test</CardTitle>
              <CardDescription>Testing checklist management component</CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentTestWrapper 
                componentName="SimpleChecklistManagement" 
                onResult={updateResult}
              >
                <div onLoad={() => handleComponentLoad('SimpleChecklistManagement')}>
                  <SimpleChecklistManagement />
                </div>
              </ComponentTestWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AuditCenter Test</CardTitle>
              <CardDescription>Testing audit center component</CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentTestWrapper 
                componentName="AuditCenter" 
                onResult={updateResult}
              >
                <div onLoad={() => handleComponentLoad('AuditCenter')}>
                  <AuditCenter />
                </div>
              </ComponentTestWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/users'}
            >
              Test Users Route
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/checklists'}
            >
              Test Checklists Route
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/audit'}
            >
              Test Audit Route
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}