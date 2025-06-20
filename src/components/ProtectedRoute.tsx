
import React from 'react';
import { useAuth } from '@/components/FastAuthProvider';
import { AuthForm } from '@/components/AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  return <>{children}</>;
};
