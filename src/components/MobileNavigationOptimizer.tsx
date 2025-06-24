
import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useToast } from '@/hooks/use-toast';

interface MobileNavigationOptimizerProps {
  children: React.ReactNode;
}

export const MobileNavigationOptimizer: React.FC<MobileNavigationOptimizerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useMobileAuth();
  const { toast } = useToast();

  // Mobile-specific navigation guards
  const checkNavigationPermissions = useCallback((path: string) => {
    if (!isAuthenticated && path !== '/' && path !== '/auth') {
      console.log('📱 Unauthorized navigation blocked:', path);
      navigate('/', { replace: true });
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this page.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [isAuthenticated, navigate, toast]);

  // Optimize for mobile browsers
  useEffect(() => {
    // Prevent zoom on input focus (mobile)
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }

    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-optimized');
    
    // Optimize touch events
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.classList.remove('mobile-optimized');
      document.body.style.overscrollBehavior = 'auto';
    };
  }, []);

  // Handle navigation errors
  useEffect(() => {
    const handleNavigationError = (event: ErrorEvent) => {
      if (event.message?.includes('Navigation')) {
        console.error('📱 Navigation error:', event);
        toast({
          title: "Navigation Error",
          description: "Failed to navigate. Returning to home.",
          variant: "destructive",
        });
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('error', handleNavigationError);
    return () => window.removeEventListener('error', handleNavigationError);
  }, [navigate, toast]);

  // Pre-validate navigation
  useEffect(() => {
    if (!checkNavigationPermissions(location.pathname)) {
      return;
    }
  }, [location.pathname, checkNavigationPermissions]);

  return (
    <>
      {children}
      <style>{`
        .mobile-optimized {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* Improve mobile scrolling */
        .mobile-optimized * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Optimize button taps */
        .mobile-optimized button,
        .mobile-optimized [role="button"] {
          touch-action: manipulation;
        }
      `}</style>
    </>
  );
};
