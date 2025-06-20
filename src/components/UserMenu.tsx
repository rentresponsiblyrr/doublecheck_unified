
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/FastAuthProvider';
import { LogOut, User, Shield, CheckCircle, RefreshCw } from 'lucide-react';

export const UserMenu = () => {
  const { user, userRole, signOut, loadUserRole } = useAuth();

  if (!user) return null;

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3 text-red-600" />;
      case 'inspector':
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'inspector':
        return 'Inspector';
      default:
        return 'User';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">
            {user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {getRoleIcon(userRole)}
              <span className="text-sm font-medium">{getRoleLabel(userRole)}</span>
            </div>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={loadUserRole}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Role
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
