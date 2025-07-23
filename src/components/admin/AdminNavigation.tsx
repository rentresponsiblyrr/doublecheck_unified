/**
 * Admin Navigation Component - Elite Standards Compliance
 *
 * Refactored to eliminate architectural violations while preserving 100% functionality:
 * ✅ React Router integration (useNavigate, useLocation)
 * ✅ No global history API modifications
 * ✅ Centralized route configuration
 * ✅ Production monitoring integration
 * ✅ Memory leak prevention
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Elite Architecture
 */

import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";
import { ADMIN_ROUTES, AdminRouteUtils } from "./config/adminRoutes";
import type { AdminRoute } from "./config/adminRoutes";

interface AdminNavigationProps {
  isMobile?: boolean;
}

/**
 * Elite Admin Navigation Component
 * - Uses React Router hooks exclusively
 * - No global object modifications
 * - Production monitoring integrated
 * - Type-safe route handling
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Elite navigation handler with production monitoring
   */
  const handleNavigation = useCallback(
    (route: AdminRoute) => {
      const startTime = performance.now();

      try {
        // Log navigation event for production monitoring
        logger.info("Admin navigation initiated", {
          from: location.pathname,
          to: route.path,
          routeId: route.id,
          isMobile,
          component: "AdminNavigation",
        });

        // Use React Router's native navigation
        navigate(route.path);

        // Track navigation performance
        const navigationTime = performance.now() - startTime;
        logger.info("Admin navigation completed", {
          route: route.path,
          duration: `${navigationTime.toFixed(2)}ms`,
          component: "AdminNavigation",
        });
      } catch (error) {
        logger.error("Admin navigation failed", {
          error,
          route: route.path,
          currentPath: location.pathname,
          component: "AdminNavigation",
        });

        // Fallback navigation attempt
        try {
          window.location.href = route.path;
        } catch (fallbackError) {
          logger.error("Fallback navigation failed", {
            error: fallbackError,
            route: route.path,
            component: "AdminNavigation",
          });
        }
      }
    },
    [navigate, location.pathname, isMobile],
  );

  /**
   * Return to inspections handler
   */
  const handleReturnToInspections = useCallback(() => {
    const startTime = performance.now();

    try {
      logger.info("Return to inspections initiated", {
        from: location.pathname,
        component: "AdminNavigation",
      });

      navigate("/");

      const navigationTime = performance.now() - startTime;
      logger.info("Return to inspections completed", {
        duration: `${navigationTime.toFixed(2)}ms`,
        component: "AdminNavigation",
      });
    } catch (error) {
      logger.error("Return to inspections failed", {
        error,
        currentPath: location.pathname,
        component: "AdminNavigation",
      });

      // Fallback
      try {
        window.location.href = "/";
      } catch (fallbackError) {
        logger.error("Fallback return navigation failed", {
          error: fallbackError,
          component: "AdminNavigation",
        });
      }
    }
  }, [navigate, location.pathname]);

  /**
   * Get the currently active route using centralized logic
   */
  const activeRoute = AdminRouteUtils.getActiveRoute(location.pathname);

  if (isMobile) {
    return (
      <div id="admin-navigation-mobile" className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-3">
          {/* Return to Inspection Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToInspections}
            className="flex items-center space-x-1 focus:ring-2 focus:ring-blue-500"
            aria-label="Return to inspection dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Inspections</span>
          </Button>

          {/* Admin Sections Navigation */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {ADMIN_ROUTES.map((route) => {
              const isActive = AdminRouteUtils.isRouteActive(
                route,
                location.pathname,
              );
              return (
                <Button
                  key={route.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(route)}
                  className={cn(
                    "flex items-center space-x-1 whitespace-nowrap transition-all duration-200",
                    isActive && "bg-blue-600 text-white shadow-md",
                  )}
                  aria-label={`Navigate to ${route.label}: ${route.description}`}
                  title={route.description}
                >
                  <route.icon className="h-4 w-4" />
                  <span className="text-xs">{route.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-navigation-desktop" className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Return to Inspection Button */}
          <Button
            variant="outline"
            onClick={handleReturnToInspections}
            className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            aria-label="Return to inspection dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Inspections</span>
          </Button>

          {/* Admin Section Navigation */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-3">Admin Sections:</span>
            {ADMIN_ROUTES.map((route) => {
              const isActive = AdminRouteUtils.isRouteActive(
                route,
                location.pathname,
              );
              return (
                <Button
                  key={route.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(route)}
                  className={cn(
                    "flex items-center space-x-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-gray-50 hover:text-blue-600",
                  )}
                  title={route.description}
                  aria-label={`Navigate to ${route.label}: ${route.description}`}
                >
                  <route.icon className="h-4 w-4" />
                  <span>{route.label}</span>
                  {isActive && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 text-xs"
                      aria-label="Currently active section"
                    >
                      Active
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
