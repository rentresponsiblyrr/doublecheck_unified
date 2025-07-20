/**
 * Professional User Management Component
 * Orchestrates user CRUD operations with proper separation of concerns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

import { UserSystemDiagnostic } from './UserSystemDiagnostic';
import { UserFiltersComponent } from './UserFilters';
import { UserTable } from './UserTable';
import { UserFormDialog } from './UserFormDialog';
import { 
  User, 
  UserFormData, 
  UserFilters, 
  SystemDiagnostic,
  UserStats 
} from './types';

const UserManagementRedesigned: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: ''
  });
  const [diagnostic, setDiagnostic] = useState<SystemDiagnostic>({
    usersTableExists: false,
    profilesTableExists: false,
    authEnabled: false,
    rlsEnabled: false,
    hasPermissions: false,
    lastChecked: new Date()
  });
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    recentSignIns: 0
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingDiagnostic, setIsRefreshingDiagnostic] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  /**
   * Check system diagnostic and authentication health
   */
  const checkSystemDiagnostic = useCallback(async () => {
    setIsRefreshingDiagnostic(true);
    
    try {
      // Check profiles table existence and permissions
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // Check auth.users access (this might fail due to RLS)
      const { data: authTest, error: authError } = await supabase.auth.getUser();

      setDiagnostic({
        usersTableExists: true, // auth.users always exists in Supabase
        profilesTableExists: !profilesError,
        authEnabled: !authError,
        rlsEnabled: true, // Assume RLS is enabled in production
        hasPermissions: !profilesError,
        errorDetails: profilesError?.message || authError?.message,
        lastChecked: new Date()
      });

    } catch (error) {
      logger.error('System diagnostic check failed:', error);
      setDiagnostic({
        usersTableExists: false,
        profilesTableExists: false,
        authEnabled: false,
        rlsEnabled: false,
        hasPermissions: false,
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      });
    } finally {
      setIsRefreshingDiagnostic(false);
    }
  }, []);

  /**
   * Load users from profiles table
   */
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const typedData: User[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        role: profile.role || 'inspector',
        phone: profile.phone || '',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        email_confirmed_at: profile.email_confirmed_at,
        is_active: profile.is_active ?? true
      }));

      setUsers(typedData);
      updateStats(typedData);
      
      logger.info(`Loaded ${typedData.length} users`);
      
    } catch (error) {
      logger.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please check your permissions.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Update statistics based on current users
   */
  const updateStats = (userList: User[]) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      total: userList.length,
      active: userList.filter(user => user.is_active).length,
      inactive: userList.filter(user => !user.is_active).length,
      byRole: {},
      recentSignIns: userList.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) > sevenDaysAgo
      ).length
    };

    // Calculate role distribution
    userList.forEach(user => {
      if (user.is_active) {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      }
    });

    setStats(stats);
  };

  /**
   * Filter users based on current filter criteria
   */
  const filterUsers = useCallback(() => {
    let filtered = users;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  /**
   * Save user (create or update)
   */
  const saveUser = async (formData: UserFormData) => {
    try {
      setIsSaving(true);

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            role: formData.role,
            phone: formData.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'User account updated successfully.'
        });

        logger.info(`Updated user: ${editingUser.id}`);
      } else {
        // For new users, we would typically integrate with Supabase Auth
        // This is a simplified version - in production, you'd use Supabase's admin API
        toast({
          title: 'Information',
          description: 'User creation requires admin API integration. Please use Supabase dashboard for now.',
          variant: 'destructive'
        });
        
        logger.warn('User creation attempted - requires admin API integration');
        return;
      }

      // Reload users to reflect changes
      await loadUsers();
      
    } catch (error) {
      logger.error('Failed to save user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user. Please try again.',
        variant: 'destructive'
      });
      throw error; // Re-throw to handle in form dialog
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete/deactivate user
   */
  const deleteUser = async (user: User) => {
    try {
      // Soft delete by deactivating user
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User account deactivated successfully.'
      });

      logger.info(`Deactivated user: ${user.id}`);
      await loadUsers();
      
    } catch (error) {
      logger.error('Failed to deactivate user:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate user. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Open edit dialog for user
   */
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  /**
   * Close form dialog and reset state
   */
  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingUser(null);
  };

  // Effects
  useEffect(() => {
    checkSystemDiagnostic();
    loadUsers();
  }, [checkSystemDiagnostic, loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkSystemDiagnostic}
                disabled={isRefreshingDiagnostic}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingDiagnostic ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setIsFormDialogOpen(true);
                }}
                disabled={!diagnostic.authEnabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Diagnostic */}
      <UserSystemDiagnostic
        diagnostic={diagnostic}
        isRefreshing={isRefreshingDiagnostic}
        onRefresh={checkSystemDiagnostic}
      />

      {/* Filters */}
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
      />

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <UserTable
            users={filteredUsers}
            onEdit={openEditDialog}
            onDelete={deleteUser}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <UserFormDialog
        isOpen={isFormDialogOpen}
        onClose={closeFormDialog}
        onSave={saveUser}
        editingUser={editingUser}
        isLoading={isSaving}
      />
    </div>
  );
};

export default UserManagementRedesigned;