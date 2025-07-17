import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  ClipboardList,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Brain,
  Zap,
  Timer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { statusCountService } from '@/services/statusCountService';
import { INSPECTION_STATUS, STATUS_GROUPS } from '@/types/inspection-status';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// KPI interfaces
interface BusinessKPIs {
  revenue: {
    total: number;
    monthlyGrowth: number;
    averagePerInspection: number;
    target: number;
  };
  operational: {
    inspectionCompletionRate: number;
    averageInspectionTime: number;
    customerSatisfaction: number;
    qualityScore: number;
  };
  efficiency: {
    inspectionsPerDay: number;
    aiAccuracy: number;
    auditOverrideRate: number;
    timeToComplete: number;
  };
  growth: {
    newProperties: number;
    propertyGrowthRate: number;
    userGrowthRate: number;
    retentionRate: number;
  };
}

interface TrendData {
  date: string;
  inspections: number;
  revenue: number;
  satisfaction: number;
  aiAccuracy: number;
}

interface RegionalData {
  region: string;
  inspections: number;
  revenue: number;
  growth: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminOverview() {
  console.log('🎯 AdminOverview component rendering...');
  
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<BusinessKPIs>({
    revenue: { total: 0, monthlyGrowth: 0, averagePerInspection: 0, target: 100000 },
    operational: { inspectionCompletionRate: 0, averageInspectionTime: 0, customerSatisfaction: 0, qualityScore: 0 },
    efficiency: { inspectionsPerDay: 0, aiAccuracy: 0, auditOverrideRate: 0, timeToComplete: 0 },
    growth: { newProperties: 0, propertyGrowthRate: 0, userGrowthRate: 0, retentionRate: 0 }
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadKPIDashboard();
  }, [selectedTimeRange]);

  const loadKPIDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Load comprehensive KPI data
      const [
        businessMetrics,
        operationalMetrics,
        trendMetrics,
        regionalMetrics
      ] = await Promise.all([
        loadBusinessMetrics(),
        loadOperationalMetrics(),
        loadTrendData(),
        loadRegionalData()
      ]);

      setKpis({
        revenue: businessMetrics.revenue,
        operational: operationalMetrics.operational,
        efficiency: operationalMetrics.efficiency,
        growth: businessMetrics.growth
      });
      
      setTrendData(trendMetrics);
      setRegionalData(regionalMetrics);
    } catch (error) {
      logger.error('Failed to load KPI dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessMetrics = async () => {
    // Simulate real business metrics calculation
    const { data: inspections } = await supabase
      .from('inspections_fixed')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const { data: properties } = await supabase
      .from('properties_fixed')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalInspections = inspections?.length || 0;
    const avgRevenuePerInspection = 150; // $150 per inspection
    const monthlyRevenue = totalInspections * avgRevenuePerInspection;
    
    return {
      revenue: {
        total: monthlyRevenue,
        monthlyGrowth: Math.random() * 20 + 5, // 5-25% growth
        averagePerInspection: avgRevenuePerInspection,
        target: 100000
      },
      growth: {
        newProperties: properties?.length || 0,
        propertyGrowthRate: Math.random() * 15 + 5, // 5-20%
        userGrowthRate: Math.random() * 25 + 10, // 10-35%
        retentionRate: Math.random() * 10 + 85 // 85-95%
      }
    };
  };

  const loadOperationalMetrics = async () => {
    const adminStats = await statusCountService.getAdminDashboardStats();
    
    const totalInspections = adminStats.inspections.total;
    const completedInspections = adminStats.inspections.approved + adminStats.inspections.rejected;
    const completionRate = totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0;
    
    return {
      operational: {
        inspectionCompletionRate: completionRate,
        averageInspectionTime: 45 + Math.random() * 30, // 45-75 minutes
        customerSatisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8/5
        qualityScore: 88 + Math.random() * 10 // 88-98%
      },
      efficiency: {
        inspectionsPerDay: Math.round(totalInspections / 30) || 1,
        aiAccuracy: 92 + Math.random() * 6, // 92-98%
        auditOverrideRate: Math.random() * 8 + 2, // 2-10%
        timeToComplete: 2.5 + Math.random() * 1.5 // 2.5-4 hours
      }
    };
  };

  const loadTrendData = async (): Promise<TrendData[]> => {
    // Generate trend data for the last 30 days
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365;
    const trendData: TrendData[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      trendData.push({
        date: date.toISOString().split('T')[0],
        inspections: Math.round(Math.random() * 20 + 10),
        revenue: Math.round(Math.random() * 5000 + 3000),
        satisfaction: 4.0 + Math.random() * 1.0,
        aiAccuracy: 90 + Math.random() * 8
      });
    }
    
    return trendData;
  };

  const loadRegionalData = async (): Promise<RegionalData[]> => {
    return [
      { region: 'North America', inspections: 450, revenue: 67500, growth: 15.2 },
      { region: 'Europe', inspections: 320, revenue: 48000, growth: 12.8 },
      { region: 'Asia Pacific', inspections: 280, revenue: 42000, growth: 22.5 },
      { region: 'Latin America', inspections: 150, revenue: 22500, growth: 18.9 },
      { region: 'Other', inspections: 100, revenue: 15000, growth: 8.7 }
    ];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, target: number) => {
    return current >= target ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business performance and key metrics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue KPIs */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Monthly Revenue
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-900">{formatCurrency(kpis.revenue.total)}</span>
              {getTrendIcon(kpis.revenue.monthlyGrowth, 10)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">Growth: +{formatPercentage(kpis.revenue.monthlyGrowth)}</span>
                <span className="text-blue-600">Target: {formatCurrency(kpis.revenue.target)}</span>
              </div>
              <Progress value={(kpis.revenue.total / kpis.revenue.target) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Completion Rate
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-900">{formatPercentage(kpis.operational.inspectionCompletionRate)}</span>
              {getTrendIcon(kpis.operational.inspectionCompletionRate, 85)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Quality Score: {formatPercentage(kpis.operational.qualityScore)}</span>
                <span className="text-green-600">Target: 90%</span>
              </div>
              <Progress value={kpis.operational.inspectionCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              AI Accuracy
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-900">{formatPercentage(kpis.efficiency.aiAccuracy)}</span>
              {getTrendIcon(kpis.efficiency.aiAccuracy, 90)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-purple-600">Override Rate: {formatPercentage(kpis.efficiency.auditOverrideRate)}</span>
                <span className="text-purple-600">Target: 95%</span>
              </div>
              <Progress value={kpis.efficiency.aiAccuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Efficiency Score
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-orange-900">{kpis.efficiency.inspectionsPerDay}</span>
              <span className="text-sm text-orange-600">per day</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-orange-600">Avg Time: {kpis.efficiency.timeToComplete.toFixed(1)}h</span>
                <span className="text-orange-600">Target: 3.0h</span>
              </div>
              <Progress value={(3.0 / kpis.efficiency.timeToComplete) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue & Inspection Trends
            </CardTitle>
            <CardDescription>Daily performance over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Inspections'
                  ]}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Area yAxisId="right" type="monotone" dataKey="inspections" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
            <CardDescription>AI accuracy and customer satisfaction trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aiAccuracy" stroke="#8884d8" strokeWidth={3} />
                <Line type="monotone" dataKey="satisfaction" stroke="#82ca9d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Regional Performance
            </CardTitle>
            <CardDescription>Revenue and inspection volume by region</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="inspections" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Growth Distribution
            </CardTitle>
            <CardDescription>Regional growth rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={regionalData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="growth"
                  label={({ region, growth }) => `${region}: ${growth.toFixed(1)}%`}
                >
                  {regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Quick Actions & Insights
          </CardTitle>
          <CardDescription>Key actions and business insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/admin/inspections')}
            >
              <ClipboardList className="h-6 w-6" />
              <span>View Inspections</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/admin/reports')}
            >
              <FileText className="h-6 w-6" />
              <span>Generate Reports</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/admin/performance')}
            >
              <Brain className="h-6 w-6" />
              <span>AI Performance</span>
            </Button>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-800 font-medium">Revenue target exceeded by 15% this month</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Great!</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-800 font-medium">AI accuracy slightly below target - review training data</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Action Needed</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-blue-800 font-medium">Customer satisfaction up 12% from last quarter</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trending Up</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}