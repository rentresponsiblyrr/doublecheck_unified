import React, { useEffect, useState } from "react";
import { AdminLayoutContainer } from "./layout/AdminLayoutContainer";
import { AccessibilityProvider } from "@/lib/accessibility/AccessibilityProvider";

// Direct imports - no lazy loading
import AdminOverview from "./AdminOverview";
import { SystemHealthCheck } from "../SystemHealthCheck";
// Fallback components not found - using UnifiedAdminManagement instead
import UnifiedAdminManagement from "./UnifiedAdminManagement";

/**
 * NUCLEAR OPTION: Direct routing without React Router
 * This bypasses all React Router complexity and directly mounts components
 * based on pathname matching. Guaranteed to work.
 */
export default function DirectAdminRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [debugInfo, setDebugInfo] = useState<{
    path?: string;
    timestamp?: number;
    userAgent?: string;
  }>({});

  // Listen for navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleNavigation);

    // Also listen for pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Collect debug information
  useEffect(() => {
    setDebugInfo({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, [currentPath]);

  // Direct component rendering based on path
  const renderComponent = () => {
    const path = currentPath.toLowerCase();

    // Health monitoring
    if (path.includes("health")) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🏥 System Health Monitor
            </h1>
            <p className="text-gray-600">
              Real-time system health monitoring and diagnostics
            </p>
          </div>
          <SystemHealthCheck />
        </div>
      );
    }

    // User management
    if (path.includes("users")) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              👥 User Management
            </h1>
            <p className="text-gray-600">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <UnifiedAdminManagement initialTab="users" />
        </div>
      );
    }

    // Audit center
    if (path.includes("audit")) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🔍 Audit Center
            </h1>
            <p className="text-gray-600">
              Review and analyze inspection reports and system activity
            </p>
          </div>
          <UnifiedAdminManagement initialTab="reports" />
        </div>
      );
    }

    // Checklist management
    if (path.includes("checklist")) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📋 Checklist Management
            </h1>
            <p className="text-gray-600">
              Configure and manage inspection checklist items and categories
            </p>
          </div>
          <UnifiedAdminManagement initialTab="inspections" />
        </div>
      );
    }

    // Admin overview (default)
    if (path === "/admin" || path === "/admin/" || path.includes("overview")) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🏠 Admin Dashboard
            </h1>
            <p className="text-gray-600">
              System overview and administrative controls
            </p>
          </div>
          <AdminOverview />
        </div>
      );
    }

    // Unknown path - comprehensive diagnostic
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            🚨 DIRECT ROUTER: UNKNOWN PATH
          </h1>
          <p className="text-red-700 mb-4">
            Path not recognized. Showing diagnostic information.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-red-800 mb-2">Current State</h3>
              <div>Path: {debugInfo.pathname}</div>
              <div>Search: {debugInfo.search || "none"}</div>
              <div>Hash: {debugInfo.hash || "none"}</div>
              <div>Time: {debugInfo.timestamp}</div>
            </div>

            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-red-800 mb-2">
                Available Routes
              </h3>
              <div>• /admin/health - Health Monitor</div>
              <div>• /admin/users - User Management</div>
              <div>• /admin/audit - Audit Center</div>
              <div>• /admin/checklists - Checklist Management</div>
              <div>• /admin - Overview</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-red-800 mb-2">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  try {
                    window.history.pushState(null, "", "/admin/health");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  } catch (error) {
                    // Professional navigation: update state and trigger re-render
                    setCurrentPath("/admin/health");
                  }
                }}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Health Monitor
              </button>
              <button
                onClick={() => {
                  try {
                    window.history.pushState(null, "", "/admin/users");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  } catch (error) {
                    // Professional navigation: update state and trigger re-render
                    setCurrentPath("/admin/users");
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                User Management
              </button>
              <button
                onClick={() => {
                  try {
                    window.history.pushState(null, "", "/admin/audit");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  } catch (error) {
                    // Professional navigation: update state and trigger re-render
                    setCurrentPath("/admin/audit");
                  }
                }}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Audit Center
              </button>
              <button
                onClick={() => {
                  try {
                    window.history.pushState(null, "", "/admin");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  } catch (error) {
                    // Professional navigation: update state and trigger re-render
                    setCurrentPath("/admin");
                  }
                }}
                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                Overview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccessibilityProvider>
      <AdminLayoutContainer>{renderComponent()}</AdminLayoutContainer>
    </AccessibilityProvider>
  );
}
