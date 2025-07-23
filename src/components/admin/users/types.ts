/**
 * User Management Types
 * Shared interfaces and types for user management components
 */

export interface User {
  id: string;
  email: string;
  name: string; // FIXED: Changed from full_name to name to match database schema
  role: "inspector" | "auditor" | "admin";
  phone?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_active: boolean;
}

export interface UserFormData {
  email: string;
  name: string;
  role: "inspector" | "auditor" | "admin";
  phone: string;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  recentSignIns: number;
}

export interface SystemDiagnostic {
  usersTableExists: boolean;
  authEnabled: boolean;
  rlsEnabled: boolean;
  hasPermissions: boolean;
  errorDetails?: string;
  lastChecked: Date;
}

export const USER_ROLES = [
  {
    value: "inspector",
    label: "Inspector",
    description: "Conducts property inspections",
  },
  {
    value: "auditor",
    label: "Auditor",
    description: "Reviews and validates inspections",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Full system access and management",
  },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["value"];
