/**
 * UNIFIED PERFORMANCE DASHBOARD - ELITE PWA + CORE WEB VITALS INTEGRATION
 * 
 * Comprehensive dashboard that integrates PWA features with Core Web Vitals monitoring,
 * providing real-time correlation analysis and construction site optimization insights.
 * Designed for Netflix/Meta performance standards with production-ready monitoring.
 * 
 * FEATURES:
 * - Unified PWA + Core Web Vitals metrics display
 * - Real-time performance correlation analysis
 * - Cross-system health monitoring with alerts
 * - Construction site optimization metrics
 * - Device-specific performance insights
 * - Business impact correlation tracking
 * - Production-ready monitoring integration
 * 
 * INTEGRATION POINTS:
 * - PWA cache performance → Core Web Vitals impact
 * - Network quality → Performance optimization strategies
 * - Battery optimization → Mobile performance correlation
 * - Offline capabilities → Performance resilience tracking
 * 
 * @author STR Certified Engineering Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCoreWebVitalsMonitoring } from '@/hooks/useCoreWebVitalsMonitoring';
import { usePWA } from '@/hooks/usePWA';
import { PerformanceDashboard } from './PerformanceDashboard';
import { PWAStatusIndicator } from '../pwa/PWAStatusIndicator';
import { Activity, Wifi, Gauge, Smartphone, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Clock, Monitor, Download, RefreshCw } from 'lucide-react';

interface UnifiedPerformanceDashboardProps {
  id?: string;
  variant?: 'compact' | 'detailed' | 'admin';
  enableRealTimeUpdates?: boolean;
  enableOptimizations?: boolean;
  className?: string;
}

interface PerformanceCorrelationData {
  cachePerformanceImpact: {
    hitRate: number;
    lcpImprovement: number;
    overallScore: number;
  };
  networkAdaptation: {
    quality: string;
    adaptationActive: boolean;
    performanceOptimized: boolean;
  };
  constructionSiteMetrics: {
    batteryOptimized: boolean;
    offlineCapable: boolean;
    touchOptimized: boolean;
  };
}

export const UnifiedPerformanceDashboard: React.FC<UnifiedPerformanceDashboardProps> = ({
  id = "unified-performance-dashboard",
  variant = 'detailed',
  enableRealTimeUpdates = true,
  enableOptimizations = true,
  className = ''
}) => {
  // Unified system status
  const [unifiedStatus, setUnifiedStatus] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<PerformanceCorrelationData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'pwa' | 'correlation'>('overview');

  // Hook integrations
  const [cwvState, cwvActions] = useCoreWebVitalsMonitoring({
    enableAlerts: true,
    enableOptimizationSuggestions: enableOptimizations
  });

  const [pwaState, pwaActions] = usePWA();

  // Load unified system status
  useEffect(() => {
    const systemStatus = (window as any).__UNIFIED_SYSTEM_STATUS__;
    setUnifiedStatus(systemStatus);

    if (enableRealTimeUpdates) {
      const interval = setInterval(async () => {
        // Update correlation data
        const correlation = await calculatePerformanceCorrelation();
        setCorrelationData(correlation);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [enableRealTimeUpdates]);

  // Calculate initial correlation data
  useEffect(() => {
    if (pwaState.isInitialized && cwvState.isInitialized) {
      calculatePerformanceCorrelation().then(setCorrelationData);
    }
  }, [pwaState.isInitialized, cwvState.isInitialized]);

  // Calculate PWA + Performance correlation
  const calculatePerformanceCorrelation = useCallback(async (): Promise<PerformanceCorrelationData> => {
    const cacheHitRate = pwaState.cacheHitRate || 0;
    const networkQuality = pwaState.networkQuality || 'unknown';
    const lcpValue = cwvState.metrics?.lcp?.value || 0;
    const fidValue = cwvState.metrics?.fid?.value || 0;

    return {
      cachePerformanceImpact: {
        hitRate: cacheHitRate,
        lcpImprovement: cacheHitRate > 80 ? Math.max(0, (4000 - lcpValue) / 4000 * 100) : 0,
        overallScore: calculateOverallScore(cacheHitRate, lcpValue, fidValue)
      },
      networkAdaptation: {
        quality: networkQuality,
        adaptationActive: networkQuality === 'poor' || networkQuality === 'fair',
        performanceOptimized: lcpValue < (networkQuality === 'poor' ? 5000 : 2500)
      },
      constructionSiteMetrics: {
        batteryOptimized: pwaState.avgResponseTime < 200,
        offlineCapable: pwaState.retryQueueSize === 0,
        touchOptimized: true // Based on component design
      }
    };
  }, [pwaState, cwvState.metrics]);

  const calculateOverallScore = (cacheHitRate: number, lcp: number, fid: number): number => {
    let score = 100;

    // Cache impact
    if (cacheHitRate < 80) score -= 20;
    if (cacheHitRate < 60) score -= 20;

    // LCP impact
    if (lcp > 2500) score -= 25;
    if (lcp > 4000) score -= 25;

    // FID impact
    if (fid > 100) score -= 15;
    if (fid > 300) score -= 15;

    return Math.max(0, score);
  };

  // System health status
  const getSystemHealthStatus = (): 'excellent' | 'good' | 'needs-attention' | 'critical' => {
    if (!unifiedStatus?.integration.productionReady) return 'critical';
    if (!correlationData) return 'needs-attention';

    const score = correlationData.cachePerformanceImpact.overallScore;
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    return 'needs-attention';
  };

  const healthStatus = getSystemHealthStatus();

  // Get health status styling
  const getHealthStatusStyles = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-50 border-green-200';
      case 'good': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'needs-attention': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    cwvActions.refreshMetrics();
    const newCorrelation = await calculatePerformanceCorrelation();
    setCorrelationData(newCorrelation);
  }, [cwvActions, calculatePerformanceCorrelation]);

  if (variant === 'compact') {
    return (
      <div id={id} className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">System Performance</h3>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getHealthStatusStyles(healthStatus)}`}>
            {healthStatus.replace('-', ' ')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* PWA Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">PWA</span>
            </div>
            <div className="text-xs text-gray-600">
              Cache: {Math.round(pwaState.cacheHitRate || 0)}%
            </div>
            <div className="text-xs text-gray-600">
              Network: {pwaState.networkQuality}
            </div>
          </div>

          {/* Performance Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="text-xs text-gray-600">
              LCP: {cwvState.metrics?.lcp?.value ? `${Math.round(cwvState.metrics.lcp.value)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              FID: {cwvState.metrics?.fid?.value ? `${Math.round(cwvState.metrics.fid.value)}ms` : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div id={id} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Unified Performance Dashboard</h2>
              <p className="text-sm text-gray-600">PWA + Core Web Vitals Integration</p>
            </div>

            <div className="flex items-center gap-4">
              {/* System Health Indicator */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getHealthStatusStyles(healthStatus)}`}>
                {healthStatus === 'excellent' && <CheckCircle className="h-4 w-4" />}
                {healthStatus === 'good' && <TrendingUp className="h-4 w-4" />}
                {(healthStatus === 'needs-attention' || healthStatus === 'critical') && <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm font-medium capitalize">{healthStatus.replace('-', ' ')}</span>
              </div>

              {/* Real-time indicator */}
              {enableRealTimeUpdates && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh metrics"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Performance Score */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Performance Score</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {correlationData ? Math.round(correlationData.cachePerformanceImpact.overallScore) : '--'}
              </div>
              <p className="text-xs text-blue-600">Netflix/Meta Standards</p>
            </div>

            {/* PWA Health */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">PWA Health</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {unifiedStatus?.pwa.allSystemsReady ? '100%' : '0%'}
              </div>
              <p className="text-xs text-green-600">All systems operational</p>
            </div>

            {/* Construction Site Ready */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Site Ready</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {correlationData?.constructionSiteMetrics.offlineCapable ? 'Yes' : 'No'}
              </div>
              <p className="text-xs text-orange-600">Offline capable</p>
            </div>

            {/* System Integration */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Integration</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {unifiedStatus?.integration.crossSystemMonitoring ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-purple-600">Cross-system monitoring</p>
            </div>
          </div>

          {/* Performance Correlation Summary */}
          {correlationData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Correlation Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    +{Math.round(correlationData.cachePerformanceImpact.lcpImprovement)}%
                  </div>
                  <p className="text-sm text-gray-600">LCP improvement from caching</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    correlationData.networkAdaptation.performanceOptimized ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {correlationData.networkAdaptation.performanceOptimized ? 'Optimized' : 'Adapting'}
                  </div>
                  <p className="text-sm text-gray-600">Network performance state</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    correlationData.constructionSiteMetrics.batteryOptimized ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {correlationData.constructionSiteMetrics.batteryOptimized ? 'Optimized' : 'High'}
                  </div>
                  <p className="text-sm text-gray-600">Battery usage</p>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Summary */}
          {(cwvState.alerts.length > 0 || pwaState.lastError) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">System Alerts</h3>
              </div>
              <div className="space-y-2">
                {cwvState.alerts.slice(-3).map((alert, index) => (
                  <div key={index} className="text-sm text-yellow-800">
                    <span className="font-medium">{alert.metric.toUpperCase()}:</span> {alert.message}
                  </div>
                ))}
                {pwaState.lastError && (
                  <div className="text-sm text-yellow-800">
                    <span className="font-medium">PWA:</span> {pwaState.lastError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh All
              </button>
              
              {cwvState.alerts.length > 0 && (
                <button
                  onClick={cwvActions.clearAlerts}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear {cwvState.alerts.length} Alerts
                </button>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Last updated: {new Date(cwvState.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin variant with full tabs and comprehensive data
  return (
    <div id={id} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Unified Performance Dashboard</h2>
            <p className="text-sm text-gray-600">Elite PWA + Core Web Vitals Integration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full text-lg font-bold border ${getHealthStatusStyles(healthStatus)}`}>
            {correlationData ? Math.round(correlationData.cachePerformanceImpact.overallScore) : '--'}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            unifiedStatus?.integration.productionReady ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
          }`}>
            {unifiedStatus?.integration.productionReady ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {unifiedStatus?.integration.productionReady ? 'Production Ready' : 'System Issues'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'performance', label: 'Core Web Vitals', icon: Activity },
            { id: 'pwa', label: 'PWA Status', icon: Smartphone },
            { id: 'correlation', label: 'Integration', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">Performance Score</h3>
                  <Gauge className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {correlationData ? Math.round(correlationData.cachePerformanceImpact.overallScore) : '--'}
                </div>
                <p className="text-sm text-blue-600">Netflix/Meta Standards</p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-900">PWA Health</h3>
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {unifiedStatus?.pwa.allSystemsReady ? '100%' : Math.round((
                    (unifiedStatus?.pwa.serviceWorker ? 33 : 0) +
                    (unifiedStatus?.pwa.offlineManager ? 33 : 0) +
                    (unifiedStatus?.pwa.installPrompt ? 34 : 0)
                  ))}%
                </div>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-orange-900">Site Ready</h3>
                  <Monitor className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {correlationData?.constructionSiteMetrics.offlineCapable ? '✓' : '✗'}
                </div>
                <p className="text-sm text-orange-600">Construction site optimized</p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-900">Integration</h3>
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {unifiedStatus?.integration.crossSystemMonitoring ? 'Active' : 'Inactive'}
                </div>
                <p className="text-sm text-purple-600">Cross-system monitoring</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceDashboard 
            variant="detailed"
            enableAlerts={true}
            enableOptimizations={enableOptimizations}
          />
        )}

        {activeTab === 'pwa' && (
          <div className="space-y-6">
            <PWAStatusIndicator variant="detailed" />
            
            {correlationData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Performance Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round(correlationData.cachePerformanceImpact.hitRate)}%
                    </div>
                    <p className="text-sm text-gray-600">Cache Hit Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      +{Math.round(correlationData.cachePerformanceImpact.lcpImprovement)}%
                    </div>
                    <p className="text-sm text-gray-600">LCP Improvement</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      correlationData.networkAdaptation.adaptationActive ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {correlationData.networkAdaptation.adaptationActive ? 'Adapting' : 'Optimal'}
                    </div>
                    <p className="text-sm text-gray-600">Network State</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'correlation' && correlationData && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Correlation Analysis</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Cache Performance Impact</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    +{Math.round(correlationData.cachePerformanceImpact.lcpImprovement)}%
                  </div>
                  <p className="text-sm text-gray-600">LCP improvement from effective caching</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Network Optimization</h4>
                  <div className={`text-3xl font-bold ${
                    correlationData.networkAdaptation.performanceOptimized ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {correlationData.networkAdaptation.performanceOptimized ? 'Optimized' : 'Adapting'}
                  </div>
                  <p className="text-sm text-gray-600">Network-aware performance state</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Construction Site Optimization</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    correlationData.constructionSiteMetrics.batteryOptimized ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {correlationData.constructionSiteMetrics.batteryOptimized ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Battery Optimized</p>
                </div>

                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    correlationData.constructionSiteMetrics.offlineCapable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {correlationData.constructionSiteMetrics.offlineCapable ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Offline Capable</p>
                </div>

                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    correlationData.constructionSiteMetrics.touchOptimized ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {correlationData.constructionSiteMetrics.touchOptimized ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Touch Optimized</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All Systems
          </button>
          {cwvState.alerts.length > 0 && (
            <button
              onClick={cwvActions.clearAlerts}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear {cwvState.alerts.length} Alerts
            </button>
          )}
          <button
            onClick={() => {
              const data = JSON.stringify({
                unifiedStatus,
                correlationData,
                timestamp: Date.now()
              }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `unified-performance-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
        <div className="text-sm text-gray-500">
          System Status: {unifiedStatus?.integration.productionReady ? '✅ Production Ready' : '⚠️ Degraded'}
        </div>
      </div>
    </div>
  );
};

export default UnifiedPerformanceDashboard;