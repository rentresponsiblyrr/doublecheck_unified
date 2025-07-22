import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger/production-logger';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export const AdminLayoutContainer: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mobile-first responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px) and (min-width: 769px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (
        isMobile &&
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);
  
  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile, sidebarOpen]);

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
    <div id="admin-layout-container" className="relative flex h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          id="mobile-sidebar-overlay"
          className="fixed inset-0 z-40 bg-gray-900/50 transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isMobile ? "w-full" : 
        isTablet ? "ml-16" : 
        "ml-64"
      )}>
        {/* Header with Mobile Menu */}
        <AdminHeader 
          userProfile={userProfile}
          onMobileMenuClick={() => setSidebarOpen(true)}
          isMobile={isMobile}
        />
        
        {/* Main Content */}
        <main id="admin-main-content" className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          // Responsive padding
          isMobile ? "p-3" : 
          isTablet ? "p-4" : 
          "p-6"
        )}>
          <div className={cn(
            "mx-auto w-full",
            // Responsive max widths
            isMobile ? "max-w-full" : 
            isTablet ? "max-w-4xl" : 
            "max-w-7xl"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};