'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/inspector',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/inspector/active',
    label: 'Active',
    icon: ClipboardList,
  },
  {
    href: '/inspector/capture',
    label: 'Capture',
    icon: Camera,
  },
  {
    href: '/inspector/profile',
    label: 'Profile',
    icon: User,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16 mobile-safe-area">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full touch-manipulation',
                'transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}