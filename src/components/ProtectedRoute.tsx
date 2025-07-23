
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, error } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleChecking, setRoleChecking] = useState(false);

  // Check user role using RPC function (same as AdminAccessButton)
  useEffect(() => {
    if (user?.id && requiredRole && !userRole) {
      setRoleChecking(true);
      supabase
        .rpc('get_user_role_simple', { _user_id: user.id })
        .then(({ data, error }) => {
          if (!error && data) {
            setUserRole(data);
          } else {
            setUserRole('inspector'); // Default fallback
          }
        })
        .catch(() => {
          setUserRole('inspector'); // Error fallback
        })
        .finally(() => {
          setRoleChecking(false);
        });
    }
  }, [user?.id, requiredRole, userRole]);

  if (loading || roleChecking) {
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
    return <AuthForm />;
  }

  // Check role-based access using RPC-verified role
  if (requiredRole && userRole && userRole !== requiredRole && 
      userRole !== 'super_admin' && userRole !== 'admin') {
    // REMOVED: Role denial logging to prevent infinite render loops
    
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
