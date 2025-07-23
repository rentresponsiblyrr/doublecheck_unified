import React, { useEffect, useState } from "react";
import { AdminLayoutContainer } from "./layout/AdminLayoutContainer";
import { AccessibilityProvider } from "@/lib/accessibility/AccessibilityProvider";
import { ADMIN_ROUTES, AdminRouteUtils } from "./config/adminRoutes";
import { logger } from "@/utils/logger";

// Direct imports - no lazy loading
import AdminOverview from "./AdminOverview";
import { SystemHealthCheck } from "../SystemHealthCheck";
import UserManagementRedesigned from "./users/UserManagementRedesigned";
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

  // Direct component rendering based on path using centralized route configuration
  const renderComponent = () => {
    const currentRoute = AdminRouteUtils.getActiveRoute(currentPath);

    // Log route access for production monitoring
    logger.info("Admin route accessed", {
      path: currentPath,
      routeId: currentRoute?.id || "unknown",
      timestamp: new Date().toISOString(),
      component: "DirectAdminRouter",
    });

    // Route-specific component rendering using centralized configuration
    if (currentRoute) {
      switch (currentRoute.id) {
        case "health":
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🏥 System Health Monitor
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <SystemHealthCheck />
            </div>
          );

        case "users":
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  👥 User Management
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <UserManagementRedesigned />
            </div>
          );

        case "audit":
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🔍 Audit Center
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <UnifiedAdminManagement initialTab="reports" />
            </div>
          );

        case "checklist":
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 Checklist Management
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <UnifiedAdminManagement initialTab="inspections" />
            </div>
          );

        case "reports":
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  📊 Reports & Analytics
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <UnifiedAdminManagement initialTab="reports" />
            </div>
          );

        case "overview":
        default:
          return (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🏠 Admin Dashboard
                </h1>
                <p className="text-gray-600">{currentRoute.description}</p>
              </div>
              <AdminOverview />
            </div>
          );
      }
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
              {ADMIN_ROUTES.map((route) => (
                <div key={route.id}>
                  • {route.path} - {route.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-red-800 mb-2">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {ADMIN_ROUTES.map((route, index) => {
                const colors = [
                  "bg-green-600 hover:bg-green-700",
                  "bg-blue-600 hover:bg-blue-700",
                  "bg-purple-600 hover:bg-purple-700",
                  "bg-orange-600 hover:bg-orange-700",
                  "bg-yellow-600 hover:bg-yellow-700",
                  "bg-indigo-600 hover:bg-indigo-700",
                ];
                return (
                  <button
                    key={route.id}
                    onClick={() => {
                      try {
                        window.history.pushState(null, "", route.path);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      } catch (error) {
                        // Professional navigation: update state and trigger re-render
                        setCurrentPath(route.path);
                      }
                    }}
                    className={`px-3 py-2 text-white rounded text-sm ${colors[index % colors.length]}`}
                    title={route.description}
                  >
                    {route.label}
                  </button>
                );
              })}
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
