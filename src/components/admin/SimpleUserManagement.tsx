import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Plus, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export default function SimpleUserManagement() {
  console.log('🔍 SimpleUserManagement component rendering...');
  
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔍 SimpleUserManagement loadUsers starting...');
      setIsLoading(true);
      setError(null);

      // Check authentication status first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('🔐 Auth session:', session ? 'Authenticated' : 'Not authenticated');
      console.log('🔐 Auth error:', authError);

      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!session) {
        console.warn('No active session found');
        throw new Error('Please log in to access admin features');
      }

      console.log('🔍 Querying users table...');
      
      // Query users table (compatibility view)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, status, last_login_at, created_at, updated_at')
        .order('created_at', { ascending: false });

      console.log('📊 Users query result:', { data: usersData, error: usersError });

      if (usersError) {
        console.error('Failed to load users from users table:', usersError);
        throw new Error(`Database error: ${usersError.message}`);
      }

      if (!usersData || usersData.length === 0) {
        console.warn('No users found in database');
        setUsers([]);
        return;
      }

      // Transform database users to component format
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_login_at,
        user_metadata: {
          name: user.full_name || user.email.split('@')[0],
          role: user.role || 'inspector'
        }
      }));

      console.log('✅ Successfully loaded users:', transformedUsers.length);
      setUsers(transformedUsers);

    } catch (err) {
      console.error('Failed to load users:', err);
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserRole = (user: SimpleUser) => {
    return user.user_metadata?.role || 'inspector';
  };

  const getUserName = (user: SimpleUser) => {
    return user.user_metadata?.name || user.email.split('@')[0];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Badge variant="default" className="bg-red-100 text-red-800">Admin</Badge>;
      case 'auditor':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Auditor</Badge>;
      case 'inspector':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Inspector</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Loading user data...</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto"
              onClick={loadUsers}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {!error && users.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully loaded {users.length} users. System is operational.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            System Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {getUserName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getUserName(user)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(getUserRole(user))}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first user.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-blue-600">Total Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => getUserRole(u) === 'inspector').length}
              </div>
              <div className="text-sm text-green-600">Inspectors</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => getUserRole(u) === 'auditor').length}
              </div>
              <div className="text-sm text-purple-600">Auditors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}