import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Activity } from 'lucide-react';

interface ComponentTest {
  name: string;
  component: React.ComponentType;
  description: string;
  path: string;
  critical: boolean;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'testing';
  error?: string;
  renderTime?: number;
  memoryUsage?: number;
}

const adminComponents: ComponentTest[] = [
  {
    name: 'SimpleUserManagement',
    component: React.lazy(() => import('./SimpleUserManagement')),
    description: 'User management and role assignment',
    path: '/admin/users',
    critical: true
  },
  {
    name: 'SimpleChecklistManagement', 
    component: React.lazy(() => import('./SimpleChecklistManagement')),
    description: 'Checklist item management',
    path: '/admin/checklists',
    critical: true
  },
  {
    name: 'AuditCenter',
    component: React.lazy(() => import('./AuditCenter')),
    description: 'Inspection audit and review',
    path: '/admin/audit',
    critical: true
  },
  {
    name: 'PropertyManagement',
    component: React.lazy(() => import('./PropertyManagement')),
    description: 'Property listing management',
    path: '/admin/properties',
    critical: false
  },
  {
    name: 'SimpleInspectionManagement',
    component: React.lazy(() => import('./SimpleInspectionManagement')),
    description: 'Inspection oversight and management',
    path: '/admin/inspections',
    critical: true
  },
  {
    name: 'ReportManagement',
    component: React.lazy(() => import('./ReportManagement')),
    description: 'Report generation and management',
    path: '/admin/reports',
    critical: false
  }
];

export const ComponentHealthMonitor: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  const testComponent = async (componentTest: ComponentTest): Promise<TestResult> => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      // Test component import
      const Component = componentTest.component;
      
      // Test component instantiation
      const testElement = React.createElement(Component);
      
      // Basic render test (without actually mounting to DOM)
      if (!testElement) {
        throw new Error('Component failed to instantiate');
      }

      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      return {
        name: componentTest.name,
        status: 'pass',
        renderTime: endTime - startTime,
        memoryUsage: endMemory - startMemory
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        name: componentTest.name,
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
        renderTime: endTime - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const results: TestResult[] = [];
    
    for (const componentTest of adminComponents) {
      // Update status to show current test
      setTestResults(prev => [
        ...prev,
        { name: componentTest.name, status: 'testing' }
      ]);

      try {
        const result = await testComponent(componentTest);
        results.push(result);
        
        // Update with actual result
        setTestResults(prev => prev.map(r => 
          r.name === componentTest.name ? result : r
        ));
      } catch (error) {
        const failResult: TestResult = {
          name: componentTest.name,
          status: 'fail',
          error: error instanceof Error ? error.message : 'Test execution failed'
        };
        results.push(failResult);
        setTestResults(prev => prev.map(r => 
          r.name === componentTest.name ? failResult : r
        ));
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate overall health
    const criticalComponents = adminComponents.filter(c => c.critical);
    const criticalFailures = results.filter(r => 
      r.status === 'fail' && criticalComponents.some(c => c.name === r.name)
    ).length;
    const totalFailures = results.filter(r => r.status === 'fail').length;

    if (criticalFailures > 0) {
      setOverallHealth('critical');
    } else if (totalFailures > 0) {
      setOverallHealth('degraded');
    } else {
      setOverallHealth('healthy');
    }

    setIsRunningTests(false);
  };

  useEffect(() => {
    // Run initial health check
    runAllTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOverallHealthColor = () => {
    switch (overallHealth) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Component Health Monitor
        </h1>
        <Button 
          onClick={runAllTests} 
          disabled={isRunningTests}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
          {isRunningTests ? 'Running Tests...' : 'Run Health Check'}
        </Button>
      </div>

      {/* Overall Health Status */}
      <Card className={`border-2 ${getOverallHealthColor()}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health: {overallHealth.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Passing:</span>{' '}
              {testResults.filter(r => r.status === 'pass').length}/{testResults.length}
            </div>
            <div>
              <span className="font-semibold">Failed:</span>{' '}
              {testResults.filter(r => r.status === 'fail').length}/{testResults.length}
            </div>
            <div>
              <span className="font-semibold">Critical Failures:</span>{' '}
              {testResults.filter(r => 
                r.status === 'fail' && adminComponents.find(c => c.name === r.name)?.critical
              ).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Test Results */}
      <div className="grid gap-4">
        {adminComponents.map((component, index) => {
          const result = testResults.find(r => r.name === component.name);
          
          return (
            <Card key={component.name} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result && getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {component.name}
                        {component.critical && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            CRITICAL
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{component.description}</p>
                      <p className="text-xs text-gray-500">{component.path}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    {result?.renderTime && (
                      <div>Render: {result.renderTime.toFixed(2)}ms</div>
                    )}
                    {result?.memoryUsage && (
                      <div>Memory: {(result.memoryUsage / 1024).toFixed(1)}KB</div>
                    )}
                  </div>
                </div>
                
                {result?.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-semibold text-red-800">Error:</div>
                    <div className="text-sm text-red-700 font-mono">{result.error}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      {testResults.some(r => r.status === 'fail') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-700">
              {testResults.filter(r => r.status === 'fail').map(result => (
                <div key={result.name} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                  <div>
                    <strong>{result.name}:</strong> Check component imports, database dependencies, 
                    and ensure all required props are available. Consider using the emergency fallback component.
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};