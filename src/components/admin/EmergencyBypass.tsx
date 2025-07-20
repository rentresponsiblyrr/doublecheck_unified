import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Users, CheckSquare, Building } from 'lucide-react';

// Emergency bypass component that loads WITHOUT any authentication
export default function EmergencyBypass() {
  const navigateToComponent = (path: string) => {
    window.history.pushState({}, '', path);
    window.location.assign(window.location.href);
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>EMERGENCY BYPASS MODE</strong> - This component bypasses all authentication to access diagnostic tools when the admin portal is stuck on loading.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Emergency Admin Access
            </CardTitle>
            <CardDescription>
              Direct access to admin components without authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigateToComponent('/admin/direct-error-logger')}
                variant="destructive"
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-medium">Direct Error Logger</div>
                <div className="text-sm">Bypass React boundaries to see real errors</div>
              </Button>
              
              <Button
                onClick={() => navigateToComponent('/admin/component-import-test')}
                variant="destructive"
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-medium">Component Import Test</div>
                <div className="text-sm">Test individual component imports</div>
              </Button>

              <Button
                onClick={() => navigateToComponent('/admin/users')}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                <Users className="h-5 w-5 mb-2" />
                <div className="font-medium">Users Management</div>
                <div className="text-sm">Test the users component directly</div>
              </Button>

              <Button
                onClick={() => navigateToComponent('/admin/checklists')}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                <CheckSquare className="h-5 w-5 mb-2" />
                <div className="font-medium">Checklist Management</div>
                <div className="text-sm">Test the checklists component directly</div>
              </Button>

              <Button
                onClick={() => navigateToComponent('/admin/properties')}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                <Building className="h-5 w-5 mb-2" />
                <div className="font-medium">Property Management</div>
                <div className="text-sm">Test the properties component directly</div>
              </Button>

              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-medium">Return to Admin</div>
                <div className="text-sm">Go back to normal admin portal</div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>Purpose:</strong> Emergency access when authentication hangs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Console Debug Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono bg-gray-100 p-4 rounded">
              <p>// Check for hanging promises:</p>
              <p>window.performance.getEntriesByType('navigation')</p>
              <p></p>
              <p>// Check Supabase client status:</p>
              <p>window.supabase = (await import('@/integrations/supabase/client')).supabase</p>
              <p>await window.supabase.auth.getSession()</p>
              <p></p>
              <p>// Force reload without cache:</p>
              <p>window.location.assign(window.location.href)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}