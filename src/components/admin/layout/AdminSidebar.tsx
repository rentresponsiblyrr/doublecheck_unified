import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  Home,
  Brain,
  Activity,
  Calendar,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Bug,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { KeyboardNavigation, useRovingTabindex } from '@/lib/accessibility/KeyboardNavigation';
import { useAccessibility } from '@/lib/accessibility/AccessibilityProvider';

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
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    current: false,
    badge: 'pro'
  },
  {
    name: 'Inspections',
    href: '/admin/inspections',
    icon: ClipboardList,
    current: false,
  },
  {
    name: 'Checklist Management',
    href: '/admin/checklist',
    icon: FileText,
    current: false,
  },
  {
    name: 'Performance',
    href: '/admin/performance',
    icon: BarChart3,
    current: false,
    badge: 'pro'
  },
  {
    name: 'AI Learning',
    href: '/admin/ai-learning',
    icon: Brain,
    current: false,
  },
  {
    name: 'System Status',
    href: '/admin/system-status',
    icon: Activity,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    current: false,
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: AlertCircle,
    current: false,
  },
  {
    name: 'Scheduler',
    href: '/admin/scheduler',
    icon: Calendar,
    current: false,
    badge: 'beta'
  },
  {
    name: 'Debug',
    href: '/admin/debug',
    icon: Bug,
    current: false,
    badge: 'dev'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    current: false,
  },
];

interface AdminSidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  className = '',
  isOpen = false,
  onClose,
  isMobile = false,
  isTablet = false
}) => {
  const location = useLocation();
  const { announce } = useAccessibility();
  
  // Determine sidebar state and styling
  const isCollapsed = isTablet && !isOpen;
  const showLabels = !isCollapsed;
  const showCloseButton = isMobile && isOpen;
  
  const classNames = (...classes: (string | boolean)[]) => {
    return classes.filter(Boolean).join(' ');
  };
  
  // Enable roving tabindex for navigation items
  useRovingTabindex('admin-navigation', 'vertical');
  
  // Announce sidebar state changes
  useEffect(() => {
    if (isMobile && isOpen) {
      announce('Navigation sidebar opened', 'polite');
    }
  }, [isOpen, isMobile, announce]);
  
  const handleNavClick = (itemName: string) => {
    // Announce navigation for screen readers
    announce(`Navigating to ${itemName}`, 'polite');
    
    // Close sidebar on mobile after navigation
    if (isMobile && onClose) {
      onClose();
    }
  };
  
  const handleCloseClick = () => {
    announce('Navigation sidebar closed', 'polite');
    onClose?.();
  };

  return (
    <>
      {/* Sidebar Container */}
      <div 
        id="admin-sidebar" 
        className={cn(
          "bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col",
          // Mobile: Fixed overlay sidebar
          isMobile && [
            "fixed inset-y-0 left-0 z-50 transform",
            isOpen ? "translate-x-0" : "-translate-x-full",
            "w-64"
          ],
          // Tablet: Collapsible sidebar
          isTablet && [
            "fixed inset-y-0 left-0 z-30",
            isCollapsed ? "w-16" : "w-64"
          ],
          // Desktop: Static sidebar
          !isMobile && !isTablet && "w-64 min-h-screen",
          className
        )}
      >
        {/* Header Section */}
        <div className={cn(
          "flex items-center border-b border-slate-700 transition-all duration-300",
          isCollapsed ? "px-3 py-4 justify-center" : "px-6 py-4"
        )}>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseClick}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              id="sidebar-close-button"
              aria-label="Close navigation sidebar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          )}
          
          <Logo className={cn(
            "flex-shrink-0 transition-all duration-300",
            isCollapsed ? "h-6 w-6" : "h-8 w-auto"
          )} />
          
          {showLabels && (
            <div className="ml-3 overflow-hidden">
              <h1 className={cn(
                "font-semibold transition-all duration-300",
                isCollapsed ? "text-sm" : "text-lg"
              )}>STR Admin</h1>
              {!isCollapsed && (
                <p className="text-xs text-slate-400">Management Console</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <KeyboardNavigation
          id="admin-navigation"
          role="navigation"
          ariaLabel="Admin dashboard navigation"
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            isCollapsed ? "mt-4 px-2" : "mt-6 px-3"
          )}
          arrowKeys={true}
          announceNavigation={true}
        >
          <div className="space-y-1" role="list">
            {navigation.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => handleNavClick(item.name)}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                    'group flex items-center rounded-md transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                    isCollapsed ? 'px-2 py-3 justify-center' : 'px-2 py-2'
                  )
                }
                id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                role="listitem"
                aria-label={`Navigate to ${item.name}${item.badge ? ` (${item.badge})` : ''}`}
                title={isCollapsed ? item.name : undefined}
                data-roving-tabindex
                tabIndex={index === 0 ? 0 : -1}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={classNames(
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                        'flex-shrink-0 transition-colors duration-200',
                        isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'
                      )}
                      aria-hidden="true"
                    />
                    
                    {showLabels && (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge
                            variant={
                              item.badge === 'pro' ? 'default' :
                              item.badge === 'beta' ? 'secondary' :
                              item.badge === 'dev' ? 'destructive' :
                              'outline'
                            }
                            className="ml-2 text-xs flex-shrink-0"
                            aria-label={`${item.badge} feature`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                    
                    {/* Collapsed state tooltip indicator */}
                    {isCollapsed && item.badge && (
                      <div className="absolute -top-1 -right-1" aria-hidden="true">
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full",
                            item.badge === 'pro' ? 'bg-blue-500' :
                            item.badge === 'beta' ? 'bg-orange-500' :
                            item.badge === 'dev' ? 'bg-red-500' :
                            'bg-gray-500'
                          )}
                          title={`${item.badge} feature indicator`}
                        />
                      </div>
                    )}
                    
                    {/* Screen reader current page indicator */}
                    {isActive && (
                      <span className="sr-only">(current page)</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </KeyboardNavigation>

        {/* Footer Section */}
        <div className={cn(
          "border-t border-slate-700 transition-all duration-300",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {showLabels ? (
            <div className="text-xs text-slate-400">
              <p className="font-medium">Version 2.0.0</p>
              <p className="mt-1">Build {import.meta.env.VITE_BUILD_VERSION || 'dev'}</p>
            </div>
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" title="System Online" />
          )}
        </div>
      </div>
    </>
  );
};