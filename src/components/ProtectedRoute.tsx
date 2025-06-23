
import React from 'react';
import { useAuth } from '@/components/MobileFastAuthProvider';
import { AuthForm } from '@/components/AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, error } = useAuth();

  console.log('📱 ProtectedRoute check:', { hasUser: !!user, loading, error });

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
    console.log('📱 No user, showing auth form');
    return <AuthForm />;
  }

  return <>{children}</>;
};
