import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Activity,
  Mail,
  Phone,
  AlertCircle,
  RefreshCw,
  Database,
  Lock,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react';
import { useUserManagement, User } from '@/hooks/useUserManagement';
import { logger } from '@/utils/logger';
import { sanitizeFormInput, validateEmail } from '@/utils/validation';

interface UserFormData {
  email: string;
  name: string;
  role: 'inspector' | 'auditor' | 'admin';
  phone: string;
}

const defaultFormData: UserFormData = {
  email: '',
  name: '',
  role: 'inspector',
  phone: ''
};

const DiagnosticPanel: React.FC<{ diagnostic: any; onRetry: () => void }> = ({ diagnostic, onRetry }) => {
  if (!diagnostic) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Database className="h-4 w-4 mr-2" />
          System Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Users Table:</span>
          <div className="flex items-center space-x-2">
            {diagnostic.usersTableExists ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs">
              {diagnostic.usersTableExists ? 'Available' : 'Missing'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">User Access:</span>
          <div className="flex items-center space-x-2">
            {diagnostic.currentUserHasAccess ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs">
              {diagnostic.currentUserRole || 'Unknown Role'}
            </span>
          </div>
        </div>

        {diagnostic.fallbackToProfiles && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Fallback Mode:</span>
            <Badge variant="outline" className="text-yellow-600">
              Using Profiles Table
            </Badge>
          </div>
        )}

        {diagnostic.errorDetails && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {diagnostic.errorDetails}
            </AlertDescription>
          </Alert>
        )}

        <Button variant="outline" size="sm" onClick={onRetry} className="w-full mt-3">
          <RefreshCw className="h-3 w-3 mr-2" />
          Retry Diagnostic
        </Button>
      </CardContent>
    </Card>
  );
};

const ErrorState: React.FC<{ error: string; onRetry: () => void; diagnostic?: any }> = ({ 
  error, 
  onRetry, 
  diagnostic 
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-red-600">System Error - Cannot Load Users</p>
      </div>
    </div>

    {diagnostic && <DiagnosticPanel diagnostic={diagnostic} onRetry={onRetry} />}

    <Card>
      <CardContent className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management Unavailable</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>Common solutions:</strong></p>
            <ul className="text-left space-y-1">
              <li>• Ensure you have admin permissions</li>
              <li>• Check that the database migration has been applied</li>
              <li>• Verify your authentication status</li>
              <li>• Contact your system administrator</li>
            </ul>
          </div>
          
          <div className="space-x-2">
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
    <div className="text-center text-gray-500 text-sm">
      Initializing user management system...
    </div>
  </div>
);

export default function UserManagementRobust() {
  const {
    users,
    filteredUsers,
    isLoading,
    error,
    hasPermission,
    tableExists,
    diagnostic,
    actions
  } = useUserManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users when search/filter criteria change
  React.useEffect(() => {
    actions.filterUsers(searchQuery, roleFilter, statusFilter);
  }, [searchQuery, roleFilter, statusFilter, users, actions]);

  const handleCreateUser = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const sanitizedData = {
        email: sanitizeFormInput(formData.email).toLowerCase(),
        name: sanitizeFormInput(formData.name),
        role: formData.role,
        phone: sanitizeFormInput(formData.phone),
        status: 'active' as const,
      };

      if (!sanitizedData.email || !sanitizedData.name) {
        throw new Error('Email and name are required');
      }

      if (!validateEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      await actions.createUser(sanitizedData);
      await actions.initialize(); // Reload data
      
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
      
      logger.info('User created successfully', { email: sanitizedData.email }, 'USER_MANAGEMENT_UI');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      logger.error('Failed to create user in UI', error, 'USER_MANAGEMENT_UI');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, actions]);

  const handleEditUser = useCallback(async () => {
    try {
      if (!editingUser) return;
      
      setIsSubmitting(true);

      const sanitizedData = {
        email: sanitizeFormInput(formData.email).toLowerCase(),
        name: sanitizeFormInput(formData.name),
        role: formData.role,
        phone: sanitizeFormInput(formData.phone),
      };

      if (!sanitizedData.email || !sanitizedData.name) {
        throw new Error('Email and name are required');
      }

      if (!validateEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      await actions.updateUser(editingUser.id, sanitizedData);
      await actions.initialize(); // Reload data
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData(defaultFormData);
      
      logger.info('User updated successfully', { userId: editingUser.id }, 'USER_MANAGEMENT_UI');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      logger.error('Failed to update user in UI', error, 'USER_MANAGEMENT_UI');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, formData, actions]);

  const handleDeleteUser = useCallback(async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await actions.deleteUser(user.id);
      await actions.initialize(); // Reload data
      
      logger.info('User deleted successfully', { userId: user.id }, 'USER_MANAGEMENT_UI');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      logger.error('Failed to delete user in UI', error, 'USER_MANAGEMENT_UI');
      alert(errorMessage);
    }
  }, [actions]);

  const openEditDialog = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone || ''
    });
    setIsEditDialogOpen(true);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'inspector':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Inspector</Badge>;
      case 'auditor':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Auditor</Badge>;
      case 'admin':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Admin</Badge>;
      case 'super_admin':
        return <Badge variant="default" className="bg-red-100 text-red-800">Super Admin</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  // Handle loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Handle error states
  if (error || !hasPermission || !tableExists) {
    return (
      <ErrorState 
        error={error || 'Access denied or system not configured'} 
        onRetry={actions.initialize}
        diagnostic={diagnostic}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage inspectors, auditors, and admin users
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={actions.initialize}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspector">Inspector</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Show diagnostic panel for admins */}
      {diagnostic && (
        <DiagnosticPanel diagnostic={diagnostic} onRetry={actions.runDiagnostic} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inspectors</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'inspector').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auditors</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'auditor').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="inspector">Inspectors</SelectItem>
                <SelectItem value="auditor">Auditors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.role === 'inspector' && (
                        <div>{user.inspection_count || 0} inspections</div>
                      )}
                      {user.role === 'auditor' && (
                        <div>{user.audit_count || 0} audits</div>
                      )}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <div className="text-gray-500">Admin user</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.last_login_at ? (
                        <div>
                          <div>{new Date(user.last_login_at).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(user.last_login_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? (
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first user
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_email">Email Address</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspector">Inspector</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone Number</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}