/**
 * User Filter Service - Enterprise Grade
 * 
 * Handles user filtering, searching, and sorting logic
 */

import { User, UserFilters } from '../types';

export class UserFilterService {
  /**
   * Filter users based on search criteria
   */
  filterUsers(users: User[], filters: UserFilters): User[] {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!user.name.toLowerCase().includes(searchTerm) && 
            !user.email.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Role filter
      if (filters.role && user.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status && user.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  /**
   * Search users with advanced criteria
   */
  searchUsers(users: User[], searchTerm: string): User[] {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase().trim();
    
    return users.filter(user => {
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.status.toLowerCase().includes(term) ||
        (user.phone && user.phone.includes(term))
      );
    });
  }

  /**
   * Sort users by various criteria
   */
  sortUsers(users: User[], sortBy: 'name' | 'email' | 'role' | 'status' | 'created_at', order: 'asc' | 'desc' = 'asc'): User[] {
    const sorted = [...users].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return order === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return sorted;
  }

  /**
   * Get available filter options from user data
   */
  getFilterOptions(users: User[]): {
    roles: string[];
    statuses: string[];
  } {
    const roles = [...new Set(users.map(user => user.role))].sort();
    const statuses = [...new Set(users.map(user => user.status))].sort();

    return { roles, statuses };
  }
}