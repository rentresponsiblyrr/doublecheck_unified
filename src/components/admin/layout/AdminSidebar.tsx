import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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
  Bug
} from 'lucide-react';
import { Logo } from '@/components/Logo';

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
    badge: 'beta'
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
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const classNames = (...classes: (string | boolean)[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div id="admin-sidebar" className={`bg-slate-900 text-white w-64 min-h-screen ${className}`}>
      <div className="flex items-center px-6 py-4 border-b border-slate-700">
        <Logo className="h-8 w-auto" />
        <div className="ml-3">
          <h1 className="text-lg font-semibold">STR Admin</h1>
          <p className="text-xs text-slate-400">Management Console</p>
        </div>
      </div>

      <nav id="admin-navigation" className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )
              }
              id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={classNames(
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant={
                        item.badge === 'pro' ? 'default' :
                        item.badge === 'beta' ? 'secondary' :
                        item.badge === 'dev' ? 'destructive' :
                        'outline'
                      }
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-4 left-3 right-3">
        <div className="text-xs text-slate-400 px-2">
          <p>Version 2.0.0</p>
          <p>Build {import.meta.env.VITE_BUILD_VERSION || 'dev'}</p>
        </div>
      </div>
    </div>
  );
};