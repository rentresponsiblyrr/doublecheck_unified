import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Brain,
  Activity,
  Calendar,
  UserCheck,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { SystemStatusPanel } from './SystemStatusPanel';

const navigation = [
  {
    name: 'Overview',
    href: '/admin',
    icon: Home,
    current: false,
  },
  {
    name: 'Properties',
    href: '/admin/properties',
    icon: Building2,
    current: false,
    badge: 'enhanced'
  },
  {
    name: 'Inspections',
    href: '/admin/inspections',
    icon: ClipboardList,
    current: false,
  },
  {
    name: 'Audit Center',
    href: '/admin/audit',
    icon: UserCheck,
    current: false,
    badge: 'new'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    current: false,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
    current: false,
  },
  {
    name: 'Checklist Management',
    href: '/admin/checklists',
    icon: Calendar,
    current: false,
  },
  {
    name: 'AI Performance',
    href: '/admin/performance',
    icon: Brain,
    current: false,
  },
  {
    name: 'AI Learning',
    href: '/admin/ai-learning',
    icon: TrendingUp,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    current: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuthState();
  
  // Get display name with better fallback logic
  const getDisplayName = () => {
    if (!user) return 'Admin User';
    
    // Try user metadata name first
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.display_name) return user.user_metadata.display_name;
    
    // Try email-based name
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Format email username nicely
      return emailName.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    
    return 'Admin User';
  };
  const [showSystemStatus, setShowSystemStatus] = React.useState(false);

  // Update current navigation item based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href || 
             (location.pathname.startsWith(item.href + '/') && item.href !== '/')
  }));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <Logo 
            size="lg" 
            theme="dark" 
            variant="horizontal"
            showText={false}
            imageUrl="/lovable-uploads/ea9dd662-995b-4cd0-95d4-9f31b2aa8d3b.png"
          />
          <div className="ml-3 flex flex-col">
            <span className="text-lg font-bold text-white">DoubleCheck</span>
            <span className="text-xs text-blue-200">Admin Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {updatedNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  classNames(
                    isActive || item.current
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md transition-colors duration-200'
                  )
                }
              >
                <Icon
                  className={classNames(
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src="" alt="" />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole || 'admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              {/* Breadcrumb could go here */}
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Dashboard
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <SystemStatusPanel 
                isExpanded={showSystemStatus}
                onToggle={() => setShowSystemStatus(!showSystemStatus)}
              />
            </div>
          </div>
        </header>

        {/* System Status Panel */}
        {showSystemStatus && (
          <SystemStatusPanel 
            isExpanded={true}
            onToggle={() => setShowSystemStatus(false)}
            className="border-b border-gray-200"
          />
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}