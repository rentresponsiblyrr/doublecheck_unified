import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger/production-logger';

interface UserProfile {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export const AdminLayoutContainer: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Try to get profile data from profiles table
          const { data: profile } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', user.id)
            .single();

          setUserProfile({
            full_name: profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
            email: profile?.email || user.email,
            avatar_url: user.user_metadata?.avatar_url
          });

          logger.info('User profile loaded in admin', {
            component: 'AdminLayoutContainer',
            userId: user.id,
            action: 'profile_load'
          });
        }
      } catch (error) {
        logger.error('Failed to load user profile', {
          component: 'AdminLayoutContainer',
          error: (error as Error).message,
          action: 'profile_load'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div id="admin-loading" className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div id="admin-layout-container" className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userProfile={userProfile} />
        
        <main id="admin-main-content" className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};