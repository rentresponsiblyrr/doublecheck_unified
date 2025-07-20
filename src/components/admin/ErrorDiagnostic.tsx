import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  component?: string;
}

export default function ErrorDiagnostic() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Capture global errors and log them
  useEffect(() => {
    setIsCapturing(true);
    
    const originalConsoleError = console.error;
    const capturedErrors: ErrorLog[] = [];
    
    // Override console.error to capture React errors
    console.error = (...args: any[]) => {
      originalConsoleError(...args);
      
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Error caught by ErrorBoundary:') || 
          errorMessage.includes('🚨 VERBOSE ERROR BOUNDARY') ||
          errorMessage.includes('React') || 
          errorMessage.includes('Component')) {
        capturedErrors.push({
          timestamp: new Date().toISOString(),
          error: errorMessage,
          stack: args.find(arg => typeof arg === 'object' && arg?.stack)?.stack
        });
        setErrors([...capturedErrors]);
      }
    };
    
    // Listen for custom admin component error events
    const handleAdminError = (event: CustomEvent) => {
      capturedErrors.push({
        timestamp: event.detail.timestamp,
        error: `Component ${event.detail.component}: ${event.detail.error}`,
        stack: event.detail.stack,
        component: event.detail.component
      });
      setErrors([...capturedErrors]);
    };
    
    window.addEventListener('adminComponentError', handleAdminError as EventListener);
    
    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      capturedErrors.push({
        timestamp: new Date().toISOString(),
        error: `Unhandled Promise Rejection: ${event.reason}`
      });
      setErrors([...capturedErrors]);
    };
    
    // Capture global errors
    const handleError = (event: ErrorEvent) => {
      capturedErrors.push({
        timestamp: new Date().toISOString(),
        error: `Global Error: ${event.message}`,
        stack: event.error?.stack
      });
      setErrors([...capturedErrors]);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('adminComponentError', handleAdminError as EventListener);
      setIsCapturing(false);
    };
  }, []);

  const testComponents = [
    { name: 'SimpleUserManagement', path: '/admin/users' },
    { name: 'SimpleChecklistManagement', path: '/admin/checklists' },
    { name: 'PropertyManagement', path: '/admin/properties' },
    { name: 'AuditCenter', path: '/admin/audit' }
  ];

  const testComponent = async (componentName: string, path: string) => {
    try {
      // REMOVED: console.log(`🧪 Testing component: ${componentName}`);
      
      // Try to dynamically import the component
      switch (componentName) {
        case 'SimpleUserManagement':
          await import('./SimpleUserManagement');
          break;
        case 'SimpleChecklistManagement':
          await import('./SimpleChecklistManagement');
          break;
        case 'PropertyManagement':
          await import('./PropertyManagement');
          break;
        case 'AuditCenter':
          await import('./AuditCenter');
          break;
      }
      
      // REMOVED: console.log(`✅ Component ${componentName} imported successfully`);
      
      // Try to navigate to the component
      window.history.pushState({}, '', path);
      
    } catch (error) {
      // REMOVED: console.error(`❌ Component ${componentName} failed:`, error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Error Diagnostic Tool</h1>
        <p className="text-gray-600 mt-1">Capture and analyze JavaScript errors causing blank screens</p>
      </div>

      {/* Error Capture Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isCapturing ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            Error Capture Status
          </CardTitle>
          <CardDescription>
            {isCapturing ? 'Actively monitoring for JavaScript errors' : 'Error monitoring inactive'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Captured Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Captured Errors ({errors.length})</CardTitle>
          <CardDescription>
            Real-time JavaScript errors that may be causing blank screens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No errors captured yet. Try navigating to different admin sections to trigger errors.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        {new Date(error.timestamp).toLocaleTimeString()}: {error.error}
                      </div>
                      {error.stack && (
                        <details className="text-xs">
                          <summary className="cursor-pointer">Stack Trace</summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Component Import Testing</CardTitle>
          <CardDescription>
            Test individual admin components to identify which ones are failing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {testComponents.map((component) => (
              <Button
                key={component.name}
                variant="outline"
                onClick={() => testComponent(component.name, component.path)}
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-medium">{component.name}</div>
                <div className="text-sm text-gray-500">{component.path}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setErrors([])}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Errors
            </Button>
            <Button 
              onClick={() => window.location.assign(window.location.href)}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debugging Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. This tool captures JavaScript errors in real-time</p>
            <p>2. Navigate to failing admin sections (Users, Checklists, etc.)</p>
            <p>3. Watch for errors to appear in the "Captured Errors" section</p>
            <p>4. Test individual components using the buttons above</p>
            <p>5. Copy error messages and stack traces to identify the root cause</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}