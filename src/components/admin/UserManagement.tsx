import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  Activity,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { sanitizeFormInput, validateEmail } from '@/utils/validation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'inspector' | 'auditor' | 'admin' | 'super_admin';
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
  inspection_count?: number;
  audit_count?: number;
}

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

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get users with their activity counts
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get inspection counts for inspectors
      const { data: inspectionCounts, error: inspectionError } = await supabase
        .from('inspections')
        .select('inspector_id')
        .not('inspector_id', 'is', null);

      if (inspectionError) {
        logger.warn('Failed to load inspection counts', inspectionError, 'USER_MANAGEMENT');
      }

      // Get audit feedback counts for auditors
      const { data: auditCounts, error: auditError } = await supabase
        .from('audit_feedback')
        .select('created_by')
        .not('created_by', 'is', null);

      if (auditError) {
        logger.warn('Failed to load audit counts', auditError, 'USER_MANAGEMENT');
      }

      // Process user data with activity counts
      const enrichedUsers: User[] = (usersData || []).map(user => {
        const inspectionCount = inspectionCounts?.filter(i => i.inspector_id === user.id).length || 0;
        const auditCount = auditCounts?.filter(a => a.created_by === user.id).length || 0;
        
        return {
          ...user,
          inspection_count: inspectionCount,
          audit_count: auditCount,
          is_active: user.last_sign_in_at ? 
            (new Date(user.last_sign_in_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) : false
        };
      });

      setUsers(enrichedUsers);
      logger.info('Loaded users', { count: enrichedUsers.length }, 'USER_MANAGEMENT');
    } catch (error) {
      logger.error('Failed to load users', error, 'USER_MANAGEMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      setIsSubmitting(true);

      // Validate form data
      const sanitizedData = {
        email: sanitizeFormInput(formData.email).toLowerCase(),
        name: sanitizeFormInput(formData.name),
        role: formData.role,
        phone: sanitizeFormInput(formData.phone)
      };

      if (!sanitizedData.email || !sanitizedData.name) {
        throw new Error('Email and name are required');
      }

      if (!validateEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', sanitizedData.email)
        .single();

      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Create user record
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...sanitizedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('User created successfully', { userId: data.id, role: data.role }, 'USER_MANAGEMENT');
      await loadUsers();
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to create user', error, 'USER_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    try {
      if (!editingUser) return;
      
      setIsSubmitting(true);

      const sanitizedData = {
        email: sanitizeFormInput(formData.email).toLowerCase(),
        name: sanitizeFormInput(formData.name),
        role: formData.role,
        phone: sanitizeFormInput(formData.phone),
        updated_at: new Date().toISOString()
      };

      if (!sanitizedData.email || !sanitizedData.name) {
        throw new Error('Email and name are required');
      }

      if (!validateEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase
        .from('users')
        .update(sanitizedData)
        .eq('id', editingUser.id);

      if (error) throw error;

      logger.info('User updated successfully', { userId: editingUser.id }, 'USER_MANAGEMENT');
      await loadUsers();
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to update user', error, 'USER_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      logger.info('User deleted successfully', { userId: user.id }, 'USER_MANAGEMENT');
      await loadUsers();
    } catch (error) {
      logger.error('Failed to delete user', error, 'USER_MANAGEMENT');
      alert('Failed to delete user. They may have associated data.');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone || ''
    });
    setIsEditDialogOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
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
                      {user.last_sign_in_at ? (
                        <div>
                          <div>{new Date(user.last_sign_in_at).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(user.last_sign_in_at).toLocaleTimeString()}
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