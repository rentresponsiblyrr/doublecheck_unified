/**
 * Admin Routes Configuration - Single Source of Truth
 *
 * Centralized route definitions ensuring perfect synchronization between
 * navigation components and routing logic. Eliminates route mismatch risks
 * and provides type-safe route management.
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Elite Standards Compliance
 */

import {
  Users,
  BarChart3,
  Settings,
  FileText,
  Shield,
  Home,
  CheckSquare,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AdminRoute {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
  exactMatch?: boolean;
}

/**
 * Centralized admin route definitions
 * Used by both AdminNavigation and DirectAdminRouter for perfect synchronization
 */
export const ADMIN_ROUTES: AdminRoute[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Home,
    path: "/admin",
    description: "Dashboard & system overview",
    exactMatch: true, // Only match exact path for overview
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    path: "/admin/users",
    description: "Manage user accounts & roles",
  },
  {
    id: "audit",
    label: "Audit",
    icon: Shield,
    path: "/admin/audit",
    description: "Review inspections & reports",
  },
  {
    id: "checklist",
    label: "Checklists",
    icon: CheckSquare,
    path: "/admin/checklist",
    description: "Manage inspection templates",
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    path: "/admin/reports",
    description: "Analytics & reporting",
  },
  {
    id: "health",
    label: "System",
    icon: Activity,
    path: "/admin/health",
    description: "System health & diagnostics",
  },
] as const;

/**
 * Route matching utilities
 */
export const AdminRouteUtils = {
  /**
   * Get the active route based on current pathname
   */
  getActiveRoute: (pathname: string): AdminRoute | null => {
    // First check for exact matches (like overview)
    const exactMatch = ADMIN_ROUTES.find(
      (route) => route.exactMatch && route.path === pathname,
    );
    if (exactMatch) return exactMatch;

    // Then check for partial matches (for nested routes)
    const partialMatch = ADMIN_ROUTES.find(
      (route) => !route.exactMatch && pathname.startsWith(route.path),
    );
    return partialMatch || null;
  },

  /**
   * Check if a route is currently active
   */
  isRouteActive: (route: AdminRoute, pathname: string): boolean => {
    if (route.exactMatch) {
      return pathname === route.path;
    }
    return pathname.startsWith(route.path);
  },

  /**
   * Get route by ID
   */
  getRouteById: (id: string): AdminRoute | null => {
    return ADMIN_ROUTES.find((route) => route.id === id) || null;
  },

  /**
   * Get all route paths
   */
  getAllPaths: (): string[] => {
    return ADMIN_ROUTES.map((route) => route.path);
  },

  /**
   * Validate if a path is a valid admin route
   */
  isValidAdminPath: (pathname: string): boolean => {
    return ADMIN_ROUTES.some((route) =>
      route.exactMatch
        ? pathname === route.path
        : pathname.startsWith(route.path),
    );
  },
} as const;

/**
 * Type exports for type safety
 */
export type AdminRouteId = (typeof ADMIN_ROUTES)[number]["id"];
export type AdminRoutePath = (typeof ADMIN_ROUTES)[number]["path"];
