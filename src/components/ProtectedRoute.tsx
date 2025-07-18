
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { AuthForm } from '@/components/AuthForm';
import { isRoleAllowed } from '@/lib/config/app-type';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, error } = useAuth();

  // Only log in development and throttle to prevent infinite logs
  if (import.meta.env.DEV && Math.random() < 0.05) {
    console.log('📱 ProtectedRoute check:', { hasUser: !!user, loading, error, requiredRole, userRole: user?.role });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating mobile session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (import.meta.env.DEV) {
      console.log('📱 No user, showing auth form');
    }
    return <AuthForm />;
  }

  // Check role-based access - Fix: Check actual user role instead of app type requirement
  if (requiredRole && user.role !== requiredRole) {
    // For admin users, allow access to both admin and inspector routes
    if (user.role === 'admin' && (requiredRole === 'inspector' || requiredRole === 'auditor')) {
      // Admin can access all routes
      return <>{children}</>;
    }
    
    // For auditor users, allow access to inspector routes
    if (user.role === 'auditor' && requiredRole === 'inspector') {
      return <>{children}</>;
    }
    
    // Only log once to prevent infinite logging
    if (import.meta.env.DEV && Math.random() < 0.01) {
      console.log('🚫 User role not allowed:', { requiredRole, userRole: user.role });
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this application.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole} (You have: {user.role})</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
