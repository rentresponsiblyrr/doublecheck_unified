/**
 * Core Web Vitals Monitor Component
 * Detailed Core Web Vitals tracking and thresholds analysis
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, Clock, Zap, Eye, Activity } from 'lucide-react';

interface CoreWebVitals {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  status: 'good' | 'needs-improvement' | 'poor';
}

interface GeographicPerformance {
  region: string;
  averageLoadTime: number;
  userCount: number;
  performanceScore: number;
}

interface CoreWebVitalsMonitorProps {
  coreWebVitals: CoreWebVitals;
  geographicPerformance: GeographicPerformance[];
  isLoading?: boolean;
}

export const CoreWebVitalsMonitor: React.FC<CoreWebVitalsMonitorProps> = ({
  coreWebVitals,
  geographicPerformance,
  isLoading = false
}) => {
  const getVitalStatus = (value: number, metric: string) => {
    switch (metric) {
      case 'fcp':
        if (value <= 1800) return 'good';
        if (value <= 3000) return 'needs-improvement';
        return 'poor';
      case 'lcp':
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';
      case 'cls':
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';
      case 'fid':
        if (value <= 100) return 'good';
        if (value <= 300) return 'needs-improvement';
        return 'poor';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressValue = (value: number, metric: string) => {
    switch (metric) {
      case 'fcp':
        return Math.max(0, Math.min(100, (3000 - value) / 30));
      case 'lcp':
        return Math.max(0, Math.min(100, (4000 - value) / 40));
      case 'cls':
        return Math.max(0, Math.min(100, (0.25 - value) * 400));
      case 'fid':
        return Math.max(0, Math.min(100, (300 - value) / 3));
      default:
        return 50;
    }
  };

  const formatVitalValue = (value: number, metric: string) => {
    switch (metric) {
      case 'cls':
        return value.toFixed(3);
      case 'fcp':
      case 'lcp':
      case 'fid':
        return `${value.toFixed(0)}ms`;
      default:
        return value.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const vitals = [
    {
      name: 'First Contentful Paint',
      key: 'fcp',
      value: coreWebVitals.fcp,
      icon: Eye,
      description: 'Time until first content renders',
      threshold: '< 1.8s good, < 3s needs improvement'
    },
    {
      name: 'Largest Contentful Paint',
      key: 'lcp',
      value: coreWebVitals.lcp,
      icon: Gauge,
      description: 'Time until largest content renders',
      threshold: '< 2.5s good, < 4s needs improvement'
    },
    {
      name: 'Cumulative Layout Shift',
      key: 'cls',
      value: coreWebVitals.cls,
      icon: Activity,
      description: 'Visual stability measurement',
      threshold: '< 0.1 good, < 0.25 needs improvement'
    },
    {
      name: 'First Input Delay',
      key: 'fid',
      value: coreWebVitals.fid,
      icon: Zap,
      description: 'Interactivity responsiveness',
      threshold: '< 100ms good, < 300ms needs improvement'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Core Web Vitals Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {vitals.map((vital) => {
          const status = getVitalStatus(vital.value, vital.key);
          const IconComponent = vital.icon;
          
          return (
            <Card key={vital.key}>
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{vital.name}</CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {formatVitalValue(vital.value, vital.key)}
                </div>
                <Badge className={getStatusColor(status)}>
                  {status.replace('-', ' ')}
                </Badge>
                <Progress 
                  value={getProgressValue(vital.value, vital.key)} 
                  className="mt-3 h-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {vital.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vital.threshold}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Geographic Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gauge className="w-5 h-5 mr-2" />
            Geographic Performance Analysis
          </CardTitle>
          <CardDescription>
            Performance metrics by geographic region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {geographicPerformance.map((region) => (
              <div key={region.region} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{region.region}</h4>
                    <p className="text-sm text-muted-foreground">
                      {region.userCount.toLocaleString()} users
                    </p>
                  </div>
                  <Badge 
                    className={getStatusColor(
                      region.performanceScore >= 90 ? 'good' :
                      region.performanceScore >= 70 ? 'needs-improvement' : 'poor'
                    )}
                  >
                    {region.performanceScore}/100
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Load Time:</span>
                    <div className="font-medium">
                      {region.averageLoadTime.toFixed(0)}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Performance Score:</span>
                    <div className="font-medium">
                      {region.performanceScore}/100
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={region.performanceScore} 
                  className="mt-3 h-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals Thresholds Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Thresholds Reference</CardTitle>
          <CardDescription>
            Google's Core Web Vitals scoring thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Loading Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>FCP - First Contentful Paint:</span>
                  <span className="text-green-600">≤ 1.8s</span>
                </div>
                <div className="flex justify-between">
                  <span>LCP - Largest Contentful Paint:</span>
                  <span className="text-green-600">≤ 2.5s</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Interactivity & Stability</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>FID - First Input Delay:</span>
                  <span className="text-green-600">≤ 100ms</span>
                </div>
                <div className="flex justify-between">
                  <span>CLS - Cumulative Layout Shift:</span>
                  <span className="text-green-600">≤ 0.1</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};