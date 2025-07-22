import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Gauge, Wifi, Battery } from 'lucide-react';
import { pwaPerformanceMonitor } from '@/lib/performance/PWAPerformanceMonitor';
import { networkAdaptationEngine } from '@/lib/performance/NetworkAdaptationEngine';
import { batteryOptimizationManager } from '@/lib/performance/BatteryOptimizationManager';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  showPerformanceStatus?: boolean;
}

interface PWAStatus {
  score: number;
  networkMode: string;
  batteryMode: string;
  isOnline: boolean;
}

/**
 * MobileOptimizedLayout component for mobile-friendly page layouts
 * 
 * @param {MobileOptimizedLayoutProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} [props.title] - Optional title for the layout
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} The MobileOptimizedLayout component
 */
export const MobileOptimizedLayout = ({ 
  children, 
  title, 
  className = "",
  showPerformanceStatus = true
}: MobileOptimizedLayoutProps) => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);

  const fetchPWAStatus = async () => {
    try {
      // Get PWA performance score
      const metrics = await pwaPerformanceMonitor.getCurrentMetrics();
      const pwaScore = Math.min(100, Math.max(0, 
        100 - (metrics.coreWebVitals.lcp - 2500) / 100 
          - (metrics.coreWebVitals.fid - 100) / 10
          - (metrics.coreWebVitals.cls - 0.1) * 1000
      ));

      // Get network adaptation status
      const adaptationState = networkAdaptationEngine.getCurrentAdaptationState();
      const networkMode = adaptationState?.currentStrategy?.level || 'optimal';

      // Get battery optimization status
      const batteryState = batteryOptimizationManager.getCurrentBatteryState();
      const batteryMode = batteryState?.powerTier || 'optimal';

      setPwaStatus({
        score: Math.round(pwaScore),
        networkMode,
        batteryMode,
        isOnline: navigator.onLine
      });
    } catch (error) {
      // Fallback status
      setPwaStatus({
        score: 85,
        networkMode: 'optimal',
        batteryMode: 'optimal',
        isOnline: navigator.onLine
      });
    }
  };

  useEffect(() => {
    if (showPerformanceStatus) {
      fetchPWAStatus();
      
      // Update every 30 seconds
      const interval = setInterval(fetchPWAStatus, 30000);
      
      // Listen for online/offline events
      const handleOnlineStatus = () => fetchPWAStatus();
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
      };
    }
  }, [showPerformanceStatus]);

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getNetworkColor = (mode: string) => {
    switch (mode) {
      case 'minimal': return 'text-green-600';
      case 'moderate': return 'text-blue-600';
      case 'aggressive': return 'text-yellow-600';
      case 'emergency': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  const getBatteryColor = (mode: string) => {
    switch (mode) {
      case 'green': case 'optimal': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div 
      id="mobile-optimized-layout-container" 
      className={`min-h-screen bg-gray-50 ${className}`}
    >
      {title && (
        <div id="mobile-layout-header" className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                {title}
              </h1>
              
              {showPerformanceStatus && pwaStatus && (
                <div id="mobile-pwa-status" className="flex items-center gap-2">
                  <Badge className={`text-xs ${getPerformanceColor(pwaStatus.score)}`}>
                    <Gauge className="h-3 w-3 mr-1" />
                    {pwaStatus.score}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Wifi className={`h-4 w-4 ${getNetworkColor(pwaStatus.networkMode)}`} />
                    <Battery className={`h-4 w-4 ${getBatteryColor(pwaStatus.batteryMode)}`} />
                    {!pwaStatus.isOnline && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Offline" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div id="mobile-layout-content" className="relative">
        {children}
      </div>
    </div>
  );
};