
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

  // REMOVED: ProtectedRoute logging to prevent infinite render loops
  // console.log('📱 ProtectedRoute check:', { hasUser: !!user, loading, error, requiredRole, userRole: user?.role });

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
    // REMOVED: No user logging to prevent infinite render loops
    // console.log('📱 No user, showing auth form');
    return <AuthForm />;
  }

  // Check role-based access - Use original app-type logic
  if (requiredRole && !isRoleAllowed(requiredRole)) {
    // REMOVED: Role denial logging to prevent infinite render loops
    // console.log('🚫 User role not allowed for this app type:', { requiredRole, userRole: user.role });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this application.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
