import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ErrorCapture {
  timestamp: string;
  message: string;
  stack?: string;
  source: string;
}

export default function DirectErrorLogger() {
  const [errors, setErrors] = useState<ErrorCapture[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const capturedErrors: ErrorCapture[] = [];
    setIsCapturing(true);

    // Override console.error globally
    const originalError = console.error;
    console.error = (...args: any[]) => {
      originalError(...args);
      
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      capturedErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        message: errorMessage,
        stack: args.find(arg => arg?.stack)?.stack,
        source: 'console.error'
      });
      
      setErrors([...capturedErrors]);
    };

    // Capture unhandled rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      capturedErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `Promise Rejection: ${event.reason}`,
        source: 'unhandledrejection'
      });
      setErrors([...capturedErrors]);
    };

    // Capture global errors
    const handleError = (event: ErrorEvent) => {
      capturedErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `Global Error: ${event.message} at ${event.filename}:${event.lineno}`,
        stack: event.error?.stack,
        source: 'window.error'
      });
      setErrors([...capturedErrors]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      setIsCapturing(false);
    };
  }, []);

  const testComponentImport = async (componentName: string) => {
    try {
      // REMOVED: console.log(`🧪 Testing import of ${componentName}...`);
      
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
        default:
          throw new Error(`Unknown component: ${componentName}`);
      }
      
      // REMOVED: console.log(`✅ ${componentName} imported successfully`);
      
    } catch (error) {
      // REMOVED: console.error(`❌ ${componentName} import failed:`, error);
    }
  };

  const renderComponent = (componentName: string) => {
    try {
      // REMOVED: console.log(`🎭 Attempting to render ${componentName}...`);
      
      switch (componentName) {
        case 'SimpleUserManagement': {
          const Component = React.lazy(() => import('./SimpleUserManagement'));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <Component />
            </React.Suspense>
          );
        }
        case 'SimpleChecklistManagement': {
          const Component = React.lazy(() => import('./SimpleChecklistManagement'));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <Component />
            </React.Suspense>
          );
        }
        default:
          return <div>Component {componentName} not configured for direct render</div>;
      }
    } catch (error) {
      // REMOVED: console.error(`❌ ${componentName} render failed:`, error);
      return <div className="text-red-600">Failed to render {componentName}: {String(error)}</div>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Direct Error Logger</h1>
        <p className="text-gray-600 mt-1">Bypass React Error Boundaries to capture real errors</p>
      </div>

      {/* Capture Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isCapturing ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            Direct Error Capture: {isCapturing ? 'Active' : 'Inactive'}
          </CardTitle>
          <CardDescription>
            Capturing all console.error, unhandled promises, and global errors
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Captured Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Captured Errors ({errors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No errors captured yet. Try testing components below.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        [{error.timestamp}] {error.source}: {error.message}
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

      {/* Component Import Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Component Import Tests</CardTitle>
          <CardDescription>Test importing components to identify failures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {['SimpleUserManagement', 'SimpleChecklistManagement', 'PropertyManagement', 'AuditCenter'].map(component => (
              <Button
                key={component}
                onClick={() => testComponentImport(component)}
                variant="outline"
                className="h-auto p-3"
              >
                Import {component}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Direct Component Render Test */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Component Render Tests</CardTitle>
          <CardDescription>Attempt to render components directly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">SimpleUserManagement:</h4>
              <div className="border p-4 rounded">
                {renderComponent('SimpleUserManagement')}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">SimpleChecklistManagement:</h4>
              <div className="border p-4 rounded">
                {renderComponent('SimpleChecklistManagement')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button onClick={() => setErrors([])}>Clear Errors</Button>
            <Button onClick={() => window.location.assign(window.location.href)} variant="outline">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}