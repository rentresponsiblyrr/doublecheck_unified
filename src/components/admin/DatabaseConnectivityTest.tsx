import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function DatabaseConnectivityTest() {
  console.log('🔍 DatabaseConnectivityTest component rendering...');
  const [testResults, setTestResults] = useState<string>('Click "Test Database Connection" to run connectivity tests');
  const [isLoading, setIsLoading] = useState(false);

  const runConnectivityTest = async () => {
    setIsLoading(true);
    setTestResults('Testing database connectivity...');
    
    try {
      let result = '🔍 Database Connectivity Test Results:\n\n';
      
      // 1. Test basic Supabase client setup
      result += '📋 Supabase Client Configuration:\n';
      result += `  URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ NOT SET'}\n`;
      result += `  ANON KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'}\n\n`;
      
      // 2. Test authentication status
      result += '🔐 Authentication Status:\n';
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          result += `  Auth Error: ❌ ${authError.message}\n`;
        } else if (session) {
          result += `  Session: ✅ AUTHENTICATED\n`;
          result += `  User ID: ${session.user.id}\n`;
          result += `  Email: ${session.user.email || 'No email'}\n`;
        } else {
          result += `  Session: ⚠️ NOT AUTHENTICATED\n`;
        }
      } catch (authErr) {
        result += `  Auth Exception: ❌ ${authErr}\n`;
      }
      result += '\n';
      
      // 3. Test basic table access (simplest possible queries)
      const tables = ['users', 'properties', 'inspections', 'checklist_items'];
      result += '📊 Table Access Tests:\n';
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (error) {
            result += `  ${table}: ❌ ${error.message}\n`;
          } else {
            result += `  ${table}: ✅ ACCESSIBLE (${(data?.length || 0)} records)\n`;
          }
        } catch (tableErr) {
          result += `  ${table}: ❌ EXCEPTION: ${tableErr}\n`;
        }
      }
      
      result += '\n';
      
      // 4. Test users table specifically with details
      result += '👥 Users Table Detailed Test:\n';
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, name, role, status, created_at')
          .limit(5);
        
        if (usersError) {
          result += `  Query Error: ❌ ${usersError.message}\n`;
          result += `  Error Code: ${usersError.code}\n`;
          result += `  Error Details: ${usersError.details}\n`;
          result += `  Error Hint: ${usersError.hint}\n`;
        } else if (users && users.length > 0) {
          result += `  Records Found: ✅ ${users.length} users\n`;
          users.forEach((user, index) => {
            result += `    ${index + 1}. ${user.email} (${user.role || 'no role'}) - ${user.status || 'no status'}\n`;
          });
        } else {
          result += `  Records Found: ⚠️ 0 users (table is empty)\n`;
        }
      } catch (usersErr) {
        result += `  Users Exception: ❌ ${usersErr}\n`;
      }
      
      result += '\n';
      
      // 5. Test RLS policies
      result += '🔒 Row Level Security Test:\n';
      try {
        // Try to get current user's role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (userError) {
            result += `  RLS Check: ❌ Cannot access own user record: ${userError.message}\n`;
          } else if (userRecord) {
            result += `  RLS Check: ✅ Current user role: ${userRecord.role}\n`;
          } else {
            result += `  RLS Check: ⚠️ User record not found in users table\n`;
          }
        } else {
          result += `  RLS Check: ⚠️ No authenticated user found\n`;
        }
      } catch (rlsErr) {
        result += `  RLS Exception: ❌ ${rlsErr}\n`;
      }
      
      setTestResults(result);
      
    } catch (error) {
      setTestResults(`💥 Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Database Connectivity Test</h1>
        <p className="text-gray-600">
          Diagnose database connection and authentication issues for the admin portal
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Issue:</strong> Admin portal showing empty data or error states.
          <br />
          <strong>Expected:</strong> Admin portal should display real database users and inspections.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Connectivity Diagnostic
          </CardTitle>
          <CardDescription>
            Test Supabase connection, authentication, and table access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runConnectivityTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Database Connection'}
            </Button>
            
            <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {testResults}
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
            <div><strong>1. Environment Variables:</strong> Ensure VITE_SUPABASE_* variables are set</div>
            <div><strong>2. Authentication:</strong> User must be logged in to access admin features</div>
            <div><strong>3. RLS Policies:</strong> User must have admin role and proper RLS permissions</div>
            <div><strong>4. Database Schema:</strong> Tables must exist and be accessible</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}