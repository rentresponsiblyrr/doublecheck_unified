import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SystemStatusPanel } from '../SystemStatusPanel';

interface AdminHeaderProps {
  userProfile: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  className?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  userProfile, 
  className = '' 
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header id="admin-header" className={`bg-white shadow-sm border-b ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Manage properties, users, and system configuration
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <SystemStatusPanel />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" id="user-menu-button">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Admin'} />
                  <AvatarFallback>
                    {getInitials(userProfile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" id="user-menu-content">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.full_name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email || 'admin@strbook.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem id="profile-menu-item">
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
                id="signout-menu-item"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};