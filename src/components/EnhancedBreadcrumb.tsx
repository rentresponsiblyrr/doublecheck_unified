
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Building2, ClipboardList, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  isClickable?: boolean;
}

export const EnhancedBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbConfig = (): BreadcrumbConfig[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const configs: BreadcrumbConfig[] = [
      { path: '/', label: 'Home', icon: Home, isClickable: true }
    ];

    if (pathSegments.includes('properties')) {
      configs.push({
        path: '/properties',
        label: 'Properties',
        icon: Building2,
        isClickable: true
      });
    }

    if (pathSegments.includes('add-property')) {
      configs.push({
        path: '/add-property',
        label: 'Add Property',
        icon: Building2,
        isClickable: false
      });
    }

    if (pathSegments.includes('inspection')) {
      const inspectionId = pathSegments[pathSegments.indexOf('inspection') + 1];
      configs.push({
        path: `/inspection/${inspectionId}`,
        label: 'Inspection',
        icon: ClipboardList,
        isClickable: false
      });

      if (pathSegments.includes('complete')) {
        configs.push({
          path: `/inspection/${inspectionId}/complete`,
          label: 'Complete',
          icon: CheckCircle,
          isClickable: false
        });
      }
    }

    return configs;
  };

  const breadcrumbConfigs = getBreadcrumbConfig();
  const currentPath = location.pathname;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <Breadcrumb>
        <BreadcrumbList className="text-sm">
          {breadcrumbConfigs.map((config, index) => {
            const isLast = index === breadcrumbConfigs.length - 1;
            const Icon = config.icon;

            return (
              <React.Fragment key={config.path}>
                <BreadcrumbItem className="flex items-center gap-1">
                  {config.isClickable && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(config.path)}
                        className="flex items-center gap-1 h-auto p-1 text-gray-600 hover:text-blue-600"
                      >
                        <Icon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </Button>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-1 text-gray-900 font-medium">
                      <Icon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="w-3 h-3" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
