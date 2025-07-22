/**
 * MONITORING DASHBOARD PAGE
 * 
 * Demonstration page for the comprehensive inspection monitoring system
 * Showcases real-time error tracking, performance metrics, and alerting
 */

import React from 'react';
import { InspectionMonitoringDashboard } from '@/components/monitoring/InspectionMonitoringDashboard';
import { PWAPerformanceDashboard } from '@/components/performance/PWAPerformanceDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, AlertTriangle, Clock, Gauge } from 'lucide-react';

const MonitoringDashboard: React.FC = () => {
  return (
    <div id="monitoring-dashboard-page" className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div id="page-header" className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Inspection Monitoring Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Enterprise-grade monitoring and observability for the inspection creation system.
          Real-time error tracking, performance metrics, and intelligent alerting.
        </p>
        
        {/* Feature Badges */}
        <div id="feature-badges" className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Real-time Metrics
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Intelligent Alerts
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Performance SLA
          </Badge>
          <Badge variant="secondary">Error Categorization</Badge>
          <Badge variant="secondary">Historical Analysis</Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <Card id="system-status-overview">
        <CardHeader>
          <CardTitle>Phase 1 Critical Fix - Monitoring Implementation</CardTitle>
          <CardDescription>
            Comprehensive error monitoring system deployed to eliminate "Unknown error" failures
            and provide enterprise-grade observability for inspection creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="implementation-highlights" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div id="error-elimination" className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">Error Elimination</h3>
              <p className="text-sm text-green-600 mt-1">
                Replaced generic "Unknown error" messages with specific error codes
              </p>
            </div>
            
            <div id="performance-monitoring" className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">Performance Monitoring</h3>
              <p className="text-sm text-blue-600 mt-1">
                Real-time tracking with &lt;100ms processing time SLA
              </p>
            </div>
            
            <div id="intelligent-alerting" className="text-center p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-800">Intelligent Alerting</h3>
              <p className="text-sm text-orange-600 mt-1">
                Automated anomaly detection with severity-based notifications
              </p>
            </div>
            
            <div id="historical-analysis" className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800">Historical Analysis</h3>
              <p className="text-sm text-purple-600 mt-1">
                30-day retention with trending and pattern recognition
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Performance Widget */}
      <Card id="unified-performance-widget">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600" />
            Unified PWA Performance
          </CardTitle>
          <CardDescription>
            Real-time PWA + Core Web Vitals monitoring with construction site optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PWAPerformanceDashboard />
        </CardContent>
      </Card>

      {/* Main Monitoring Dashboard */}
      <InspectionMonitoringDashboard 
        autoRefresh={true}
        refreshInterval={30000}
      />

      {/* Implementation Details */}
      <Card id="implementation-details">
        <CardHeader>
          <CardTitle>Implementation Architecture</CardTitle>
          <CardDescription>
            Technical overview of the monitoring system components and integration points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="architecture-details" className="space-y-4">
            <div id="monitoring-components" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="error-tracking">
                <h4 className="font-semibold mb-2">Error Tracking & Analytics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• InspectionErrorMonitor singleton service</li>
                  <li>• 19 specific error codes with user-friendly messages</li>
                  <li>• Comprehensive error context and stack trace capture</li>
                  <li>• Real-time error rate calculation and trending</li>
                </ul>
              </div>
              
              <div id="performance-metrics">
                <h4 className="font-semibold mb-2">Performance Metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Processing time tracking with percentile analysis</li>
                  <li>• Success rate monitoring with SLA alerting</li>
                  <li>• Validation and database operation timing</li>
                  <li>• Performance trend analysis and forecasting</li>
                </ul>
              </div>
              
              <div id="alerting-system">
                <h4 className="font-semibold mb-2">Alerting & Notifications</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Configurable thresholds for error rates and performance</li>
                  <li>• Severity-based alert escalation (warning → critical)</li>
                  <li>• Integration-ready for Slack, PagerDuty, email</li>
                  <li>• Anomaly detection for proactive issue identification</li>
                </ul>
              </div>
              
              <div id="data-storage">
                <h4 className="font-semibold mb-2">Data Storage & Retention</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Supabase monitoring_events table with RLS</li>
                  <li>• Optimized indexes for high-performance queries</li>
                  <li>• 30-day retention with automated cleanup</li>
                  <li>• Exportable data for external analysis tools</li>
                </ul>
              </div>
            </div>
            
            <div id="integration-points" className="border-t pt-4">
              <h4 className="font-semibold mb-2">Service Integration Points</h4>
              <p className="text-sm text-muted-foreground mb-2">
                The monitoring system has been integrated into all critical inspection creation services:
              </p>
              <div id="integrated-services" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <Badge variant="outline">EnterpriseInspectionCreationService</Badge>
                <Badge variant="outline">InspectionService</Badge>
                <Badge variant="outline">ProductionDatabaseService</Badge>
                <Badge variant="outline">Mobile InspectionCreationService</Badge>
                <Badge variant="outline">InspectionCreationOptimizer</Badge>
                <Badge variant="outline">usePropertyActions Hook</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;