// AI Performance Dashboard Component for STR Certified
// Real-time monitoring of AI metrics, costs, and optimization suggestions

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  BarChart3,
  Cpu,
  Database,
  Gauge,
  Info,
  Target,
  Timer,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAIMetricsCollector } from '@/lib/monitoring/ai-metrics';
import { useQuery } from '@tanstack/react-query';

interface AIPerformanceDashboardProps {
  className?: string;
}

export const AIPerformanceDashboard: React.FC<AIPerformanceDashboardProps> = ({
  className
}) => {
  // State
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'all' | string>('all');

  // Initialize metrics collector
  const metricsCollector = React.useMemo(() => createAIMetricsCollector(), []);

  // Fetch real-time metrics with optimized intervals
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['ai-performance-metrics', timeRange],
    queryFn: async () => {
      return metricsCollector.getRealTimeMetrics();
    },
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider stale after 2 minutes
  });

  // Fetch performance report
  const { data: report } = useQuery({
    queryKey: ['ai-performance-report', timeRange],
    queryFn: async () => {
      const end = new Date();
      const start = new Date();
      
      switch (timeRange) {
        case '1h':
          start.setHours(start.getHours() - 1);
          break;
        case '24h':
          start.setDate(start.getDate() - 1);
          break;
        case '7d':
          start.setDate(start.getDate() - 7);
          break;
        case '30d':
          start.setDate(start.getDate() - 30);
          break;
      }

      return metricsCollector.generatePerformanceReport(start, end);
    },
    refetchInterval: autoRefresh ? 10 * 60 * 1000 : false, // Refresh every 10 minutes
    staleTime: 5 * 60 * 1000 // Consider stale after 5 minutes
  });

  // Mock data for charts (in production, would come from metrics)
  const accuracyTrendData = [
    { time: '00:00', accuracy: 82 },
    { time: '04:00', accuracy: 84 },
    { time: '08:00', accuracy: 86 },
    { time: '12:00', accuracy: 85 },
    { time: '16:00', accuracy: 87 },
    { time: '20:00', accuracy: 88 },
    { time: 'Now', accuracy: 89 }
  ];

  const responseTimeData = [
    { operation: 'Image Analysis', avg: 1250, p95: 2100, p99: 3500 },
    { operation: 'Text Generation', avg: 800, p95: 1400, p99: 2200 },
    { operation: 'Object Detection', avg: 1800, p95: 3200, p99: 4800 },
    { operation: 'Classification', avg: 450, p95: 780, p99: 1200 }
  ];

  const costBreakdownData = [
    { name: 'GPT-4 Vision', value: 45, cost: '$450' },
    { name: 'GPT-3.5 Turbo', value: 25, cost: '$250' },
    { name: 'Embeddings', value: 15, cost: '$150' },
    { name: 'Other', value: 15, cost: '$150' }
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  // Handle export
  const handleExport = async () => {
    if (!report) return;

    const data = {
      metrics,
      report,
      exported: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate metrics change
  const calculateChange = (current: number, previous: number): number => {
    return ((current - previous) / previous) * 100;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-600 bg-green-50';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'down':
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor AI system performance, accuracy, and costs in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Network Status Indicator */}
      <OfflineIndicator className="mb-6" />

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.accuracy.current ? `${(metrics.accuracy.current * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics?.accuracy.trend && getTrendIcon(metrics.accuracy.trend)}
              <span className="ml-1">
                {metrics?.accuracy.trend === 'improving' ? '+2.3%' : 
                 metrics?.accuracy.trend === 'declining' ? '-1.5%' : '0%'} from last period
              </span>
            </div>
            <Progress value={metrics?.accuracy.current ? metrics.accuracy.current * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.performance.avgResponseTime ? `${metrics.performance.avgResponseTime.toFixed(0)}ms` : 'N/A'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>P95: {metrics?.performance.p95ResponseTime?.toFixed(0) || 'N/A'}ms</span>
            </div>
            <Progress 
              value={metrics?.performance.avgResponseTime ? 
                Math.min(100, (metrics.performance.avgResponseTime / 3000) * 100) : 0
              } 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Cost Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.usage.costPerHour?.toFixed(2) || '0.00'}/hr
            </div>
            <div className="text-xs text-muted-foreground">
              Projected monthly: ${((metrics?.usage.costPerHour || 0) * 24 * 30).toFixed(0)}
            </div>
            <Progress 
              value={metrics?.usage.costPerHour ? 
                Math.min(100, (metrics.usage.costPerHour / 10) * 100) : 0
              } 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={cn('text-xs', getStatusColor(metrics?.health.status || 'unknown'))}>
                {metrics?.health.status || 'Unknown'}
              </Badge>
              <span className="text-2xl font-bold">
                {metrics?.performance.errorRate ? 
                  `${(100 - metrics.performance.errorRate * 100).toFixed(1)}%` : 'N/A'
                }
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Uptime | {metrics?.alerts.length || 0} active alerts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Alerts</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {metrics.alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{alert.type.replace(/_/g, ' ')}</span>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              {metrics.alerts.length > 3 && (
                <p className="text-xs mt-1">And {metrics.alerts.length - 3} more...</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="accuracy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        {/* Accuracy Tab */}
        <TabsContent value="accuracy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Trends</CardTitle>
              <CardDescription>
                AI prediction accuracy over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accuracyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.accuracy.byCategory || {}).map(([category, accuracy]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={accuracy * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report?.benchmarks.map((benchmark) => (
                    <div key={benchmark.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          benchmark.status === 'pass' ? 'bg-green-600' : 'bg-red-600'
                        )} />
                        <span className="text-sm font-medium">{benchmark.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">
                          {benchmark.displayValue}{benchmark.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Target: {benchmark.target}{benchmark.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Times by Operation</CardTitle>
              <CardDescription>
                Average, P95, and P99 response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operation" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#8b5cf6" name="Average" />
                  <Bar dataKey="p95" fill="#3b82f6" name="P95" />
                  <Bar dataKey="p99" fill="#ef4444" name="P99" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.usage.requestsPerMinute || 0}
                </div>
                <p className="text-xs text-muted-foreground">requests/minute</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Token Rate</span>
                    <span className="font-mono">{metrics?.usage.tokensPerMinute || 0}/min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span className="font-mono">
                      {((metrics?.performance.errorRate || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.performance.slowOperations.slice(0, 5).map((op, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate">{op}</span>
                      <Badge variant="outline" className="text-xs">Slow</Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No slow operations</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate</span>
                      <span className="font-mono">78.5%</span>
                    </div>
                    <Progress value={78.5} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Saved API Calls</span>
                      <span className="font-mono">1,234</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated savings: $45.67
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, cost }) => `${name}: ${cost}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold">$127.45</p>
                      <p className="text-xs text-green-600">-12% from yesterday</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">$2,845.67</p>
                      <p className="text-xs text-red-600">+8% from last month</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Projected Costs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>End of Month</span>
                        <span className="font-mono">$3,127.89</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Month (est.)</span>
                        <span className="font-mono">$3,456.78</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>Potential Savings: $456/month</AlertTitle>
                  <AlertDescription>
                    Based on current usage patterns and optimization opportunities
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Enable Aggressive Caching</h4>
                      <p className="text-xs text-muted-foreground">
                        Could save ~$234/month by caching repeated image analyses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Use GPT-3.5 for Simple Tasks</h4>
                      <p className="text-xs text-muted-foreground">
                        Could save ~$156/month by routing simple classifications to cheaper models
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Cpu className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Batch Similar Requests</h4>
                      <p className="text-xs text-muted-foreground">
                        Could save ~$66/month by batching similar analysis requests
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve performance and reduce costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.description}
                    </p>
                    <div className="space-y-1">
                      {rec.actions.map((action, i) => (
                        <div key={i} className="flex items-center text-sm">
                          <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Image Compression</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Progressive Loading</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offline Mode</span>
                    <Badge variant="outline">Partial</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Mobile Metrics</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Avg Load Time</span>
                        <span className="font-mono">2.3s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Usage</span>
                        <span className="font-mono">1.2MB/session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.health.endpoints || {}).map(([endpoint, status]) => (
                    <div key={endpoint} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{endpoint}</span>
                        <Badge className={cn('text-xs', getStatusColor(status.status))}>
                          {status.status}
                        </Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        750/1000 requests remaining
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(metrics?.health.endpoints || {}).map(([endpoint, status]) => (
              <Card key={endpoint}>
                <CardHeader>
                  <CardTitle className="capitalize">{endpoint} API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge className={cn('text-xs', getStatusColor(status.status))}>
                        {status.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency</span>
                      <span className="text-sm font-mono">{status.latency.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Check</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(status.lastChecked).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Queue Size</p>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-green-600">Normal</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cache Size</p>
                  <p className="text-2xl font-bold">1.2GB</p>
                  <p className="text-xs text-yellow-600">78% full</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">456MB</p>
                  <p className="text-xs text-green-600">Healthy</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Workers</p>
                  <p className="text-2xl font-bold">8/10</p>
                  <p className="text-xs text-green-600">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ChevronRight icon component (since it wasn't imported)
const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);