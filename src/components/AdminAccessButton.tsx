import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Shield, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminAccessButtonProps {
  className?: string;
}

export const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  // Check if user has admin role
  const checkAdminAccess = async () => {
    if (!user?.id) return false;

    try {
      setIsChecking(true);
      const { data, error } = await supabase
        .rpc('get_user_role_simple', { _user_id: user.id });
      
      return !error && (data === 'admin' || data === 'super_admin');
    } catch (error) {
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleAdminAccess = async () => {
    const hasAccess = await checkAdminAccess();
    
    if (hasAccess) {
      // Professional navigation - use React Router if available
      if (window.history && window.history.pushState) {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        // Fallback for cross-domain navigation
        // NUCLEAR REMOVED: window.location.replace('/admin');
      }
    } else {
      // Professional user feedback instead of alert()
      const event = new CustomEvent('access-denied', { 
        detail: { message: 'Admin privileges required' }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
          disabled={isChecking}
        >
          <Shield className="h-4 w-4" />
          {isChecking ? 'Checking...' : 'Admin'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleAdminAccess}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Admin Dashboard</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          // Professional navigation
          if (window.history && window.history.pushState) {
            window.history.pushState({}, '', '/admin/users');
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            // NUCLEAR REMOVED: window.location.replace('/admin/users');
          }
        }}>
          <Users className="mr-2 h-4 w-4" />
          <span>User Management</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          // Professional navigation
          if (window.history && window.history.pushState) {
            window.history.pushState({}, '', '/admin/audit');
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            // NUCLEAR REMOVED: window.location.replace('/admin/audit');
          }
        }}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Audit Center</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          // Professional navigation - preserve history and state
          try {
            const url = new URL('/admin/health', window.location.origin);
            window.history.pushState(null, '', url.href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (error) {
            // Graceful fallback
            // NUCLEAR REMOVED: window.location.replace('/admin/health');
          }
        }}>
          <Shield className="mr-2 h-4 w-4" />
          <span>System Health</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};