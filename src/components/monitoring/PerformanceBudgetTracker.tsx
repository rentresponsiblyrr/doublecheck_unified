/**
 * Performance Budget Tracker Component
 * Performance budget monitoring and user journey analysis
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceBudget {
  metric: string;
  budget: number;
  current: number;
  utilization: number;
  status: 'within-budget' | 'approaching-limit' | 'over-budget';
  trend: 'improving' | 'stable' | 'degrading';
}

interface UserJourneys {
  totalJourneys: number;
  completionRate: number;
  averageDuration: number;
  abandonmentPoints: string[];
}

interface PerformanceBudgetTrackerProps {
  performanceBudgets: PerformanceBudget[];
  userJourneys: UserJourneys;
  isLoading?: boolean;
}

export const PerformanceBudgetTracker: React.FC<PerformanceBudgetTrackerProps> = ({
  performanceBudgets,
  userJourneys,
  isLoading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'within-budget':
        return 'text-green-600 bg-green-100';
      case 'approaching-limit':
        return 'text-yellow-600 bg-yellow-100';
      case 'over-budget':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'within-budget':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'approaching-limit':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'over-budget':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const overBudgetMetrics = performanceBudgets.filter(budget => budget.status === 'over-budget');
  const approachingLimitMetrics = performanceBudgets.filter(budget => budget.status === 'approaching-limit');

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {overBudgetMetrics.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{overBudgetMetrics.length} metric(s)</strong> are over budget: {' '}
            {overBudgetMetrics.map(m => m.metric).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {approachingLimitMetrics.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{approachingLimitMetrics.length} metric(s)</strong> approaching budget limits: {' '}
            {approachingLimitMetrics.map(m => m.metric).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Budgets Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Budgets
          </CardTitle>
          <CardDescription>
            Real-time budget utilization and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceBudgets.map((budget) => (
              <div key={budget.metric} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(budget.status)}
                    <div>
                      <h4 className="font-medium">{budget.metric}</h4>
                      <p className="text-sm text-muted-foreground">
                        {budget.current.toFixed(1)} / {budget.budget.toFixed(1)} budget
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(budget.status)}>
                      {budget.status.replace('-', ' ')}
                    </Badge>
                    {getTrendIcon(budget.trend)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization:</span>
                    <span className={budget.utilization > 90 ? 'text-red-600 font-medium' : ''}>
                      {budget.utilization.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={budget.utilization} 
                    className={`h-3 ${
                      budget.utilization > 100 ? '[&>div]:bg-red-500' :
                      budget.utilization > 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {budget.current.toFixed(1)}</span>
                    <span>Budget: {budget.budget.toFixed(1)}</span>
                  </div>
                </div>

                {budget.utilization > 100 && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ Over budget by {(budget.utilization - 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Journey Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              User Journey Performance
            </CardTitle>
            <CardDescription>
              Journey completion and timing analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {userJourneys.totalJourneys.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Total Journeys</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userJourneys.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Completion Rate</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-center">
                  {(userJourneys.averageDuration / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-center text-muted-foreground">
                  Average Journey Duration
                </div>
                <Progress 
                  value={Math.min(100, (30000 - userJourneys.averageDuration) / 300)} 
                  className="mt-2 h-2" 
                />
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Target: &lt; 30s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journey Abandonment Analysis</CardTitle>
            <CardDescription>
              Common exit points affecting completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userJourneys.abandonmentPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>No significant abandonment points detected</p>
                <p className="text-sm">Journey completion is performing well</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userJourneys.abandonmentPoints.map((point, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">{point}</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1 ml-6">
                      High abandonment rate detected at this step
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
          <CardDescription>
            Overall performance budget health overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {performanceBudgets.filter(b => b.status === 'within-budget').length}
              </div>
              <div className="text-sm text-green-700">Within Budget</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {approachingLimitMetrics.length}
              </div>
              <div className="text-sm text-yellow-700">Approaching Limit</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {overBudgetMetrics.length}
              </div>
              <div className="text-sm text-red-700">Over Budget</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};