/**
 * User Filters Component
 * Handles search, role, and status filtering for users
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { UserFilters, UserStats, USER_ROLES } from './types';

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  stats: UserStats;
}

export const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  stats
}) => {
  const updateFilter = <K extends keyof UserFilters>(
    key: K, 
    value: UserFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="user-search">Search Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="user-search"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={filters.role}
            onValueChange={(value) => updateFilter('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All roles ({stats.total})</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label} ({stats.byRole[role.value] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All users ({stats.total})</SelectItem>
              <SelectItem value="active">Active ({stats.active})</SelectItem>
              <SelectItem value="inactive">Inactive ({stats.inactive})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total Users:</span>
          <span className="text-sm font-medium">{stats.total}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active:</span>
          <span className="text-sm font-medium text-green-600">{stats.active}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Recent Sign-ins:</span>
          <span className="text-sm font-medium text-blue-600">{stats.recentSignIns}</span>
        </div>

        {Object.entries(stats.byRole).map(([role, count]) => (
          <div key={role} className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 capitalize">{role}s:</span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>

      {/* Filter Summary */}
      {(filters.search || filters.role || filters.status) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Search: "{filters.search}"
            </span>
          )}
          
          {filters.role && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              Role: {USER_ROLES.find(r => r.value === filters.role)?.label}
            </span>
          )}
          
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              Status: {filters.status}
            </span>
          )}
          
          <button
            onClick={() => onFiltersChange({ search: '', role: '', status: '' })}
            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};