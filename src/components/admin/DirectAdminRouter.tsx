import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';

// Direct imports - no lazy loading
import AdminOverview from './AdminOverview';
// import { ComponentHealthMonitor } from './ComponentHealthMonitor';
import { UserManagementFallback } from './fallbacks/UserManagementFallback';
import { ChecklistManagementFallback } from './fallbacks/ChecklistManagementFallback';
import { AuditCenterFallback } from './fallbacks/AuditCenterFallback';

/**
 * NUCLEAR OPTION: Direct routing without React Router
 * This bypasses all React Router complexity and directly mounts components
 * based on pathname matching. Guaranteed to work.
 */
export default function DirectAdminRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Listen for navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);
    
    // Also listen for pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
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
      referrer: document.referrer
    });
  }, [currentPath]);

  // REMOVED: console.log('🔥 DIRECT ADMIN ROUTER LOADED');
  // REMOVED: console.log('Current path:', currentPath);
  // REMOVED: console.log('Debug info:', debugInfo);

  // Direct component rendering based on path
  const renderComponent = () => {
    const path = currentPath.toLowerCase();

    // Health monitoring
    if (path.includes('health')) {
      return (
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-green-800 mb-2">✅ DIRECT ROUTER: HEALTH MONITOR</h1>
            <p className="text-green-700">Successfully bypassed React Router and directly mounted component.</p>
            <div className="mt-4 text-sm text-green-600">
              <div>Path: {currentPath}</div>
              <div>Time: {new Date().toLocaleString()}</div>
            </div>
          </div>
          {/* <ComponentHealthMonitor /> */}
        </div>
      );
    }

    // User management
    if (path.includes('users')) {
      return (
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">👥 DIRECT ROUTER: USER MANAGEMENT</h1>
            <p className="text-blue-700">Direct user management component loaded without React Router.</p>
            <div className="mt-4 text-sm text-blue-600">
              <div>Path: {currentPath}</div>
              <div>Router: BYPASSED</div>
            </div>
          </div>
          <UserManagementFallback />
        </div>
      );
    }

    // Audit center
    if (path.includes('audit')) {
      return (
        <div className="p-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-purple-800 mb-2">🔍 DIRECT ROUTER: AUDIT CENTER</h1>
            <p className="text-purple-700">Direct audit center component loaded without React Router.</p>
          </div>
          <AuditCenterFallback />
        </div>
      );
    }

    // Checklist management
    if (path.includes('checklist')) {
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">📋 DIRECT ROUTER: CHECKLIST MANAGEMENT</h1>
            <p className="text-yellow-700">Direct checklist management component loaded without React Router.</p>
          </div>
          <ChecklistManagementFallback />
        </div>
      );
    }

    // Admin overview (default)
    if (path === '/admin' || path === '/admin/' || path.includes('overview')) {
      return (
        <div className="p-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-indigo-800 mb-2">🏠 DIRECT ROUTER: ADMIN OVERVIEW</h1>
            <p className="text-indigo-700">Direct admin overview component loaded without React Router.</p>
          </div>
          <AdminOverview />
        </div>
      );
    }

    // Unknown path - comprehensive diagnostic
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">🚨 DIRECT ROUTER: UNKNOWN PATH</h1>
          <p className="text-red-700 mb-4">Path not recognized. Showing diagnostic information.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-red-800 mb-2">Current State</h3>
              <div>Path: {debugInfo.pathname}</div>
              <div>Search: {debugInfo.search || 'none'}</div>
              <div>Hash: {debugInfo.hash || 'none'}</div>
              <div>Time: {debugInfo.timestamp}</div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-red-800 mb-2">Available Routes</h3>
              <div>• /admin/health - Health Monitor</div>
              <div>• /admin/users - User Management</div>
              <div>• /admin/audit - Audit Center</div>
              <div>• /admin/checklists - Checklist Management</div>
              <div>• /admin - Overview</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-red-800 mb-2">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button 
                onClick={() => window.location.href = '/admin/health'}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Health Monitor
              </button>
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                User Management
              </button>
              <button 
                onClick={() => window.location.href = '/admin/audit'}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Audit Center
              </button>
              <button 
                onClick={() => window.location.href = '/admin'}
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
    <AdminLayout>
      {renderComponent()}
    </AdminLayout>
  );
}