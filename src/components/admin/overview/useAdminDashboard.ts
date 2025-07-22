import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessKPIs, TrendData, RegionalData, TimeRange, DashboardData } from './types';

export const useAdminDashboard = (timeRange: TimeRange = '30d') => {
  const [data, setData] = useState<DashboardData>({
    kpis: {
      totalProperties: 0,
      totalInspections: 0,
      activeInspectors: 0,
      completionRate: 0,
      avgInspectionTime: 0,
      customerSatisfaction: 0,
      monthlyRevenue: 0,
      growthRate: 0,
      pendingAudits: 0,
      flaggedInspections: 0,
      avgPhotosPerInspection: 0,
      aiAccuracy: 0
    },
    trends: [],
    regions: [],
    isLoading: true
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));

      const [kpis, trends, regions] = await Promise.all([
        loadBusinessMetrics(),
        loadTrendData(),
        loadRegionalData()
      ]);

      setData({
        kpis,
        trends,
        regions,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [timeRange, loadBusinessMetrics, loadTrendData, loadRegionalData]);

  const loadBusinessMetrics = useCallback(async (): Promise<BusinessKPIs> => {
    const { data: inspections } = await supabase
      .from('inspections')
      .select('*')
      .gte('created_at', getDateRange(timeRange));

    const { data: properties } = await supabase
      .from('properties')
      .select('*');

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'inspector');

    const totalInspections = inspections?.length || 0;
    const totalProperties = properties?.length || 0;
    const activeInspectors = users?.length || 0;
    
    const avgRevenuePerInspection = 150; // $150 per inspection
    const monthlyRevenue = totalInspections * avgRevenuePerInspection;
    
    const completedInspections = inspections?.filter(i => i.status === 'completed').length || 0;
    const completionRate = totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0;

    return {
      totalProperties,
      totalInspections,
      activeInspectors,
      completionRate,
      avgInspectionTime: 45, // Mock data - 45 minutes average
      customerSatisfaction: 4.6, // Mock data - 4.6/5 rating
      monthlyRevenue,
      growthRate: 12.5, // Mock data - 12.5% growth
      pendingAudits: inspections?.filter(i => i.status === 'in_progress').length || 0,
      flaggedInspections: 2, // Mock data
      avgPhotosPerInspection: 25, // Mock data
      aiAccuracy: 92.3 // Mock data - 92.3% AI accuracy
    };
  }, [timeRange]);

  const loadTrendData = useCallback(async (): Promise<TrendData[]> => {
    // Mock trend data - in real app, would fetch from database
    return [
      { name: 'Jan', inspections: 65, revenue: 9750, satisfaction: 4.5 },
      { name: 'Feb', inspections: 78, revenue: 11700, satisfaction: 4.6 },
      { name: 'Mar', inspections: 85, revenue: 12750, satisfaction: 4.7 },
      { name: 'Apr', inspections: 72, revenue: 10800, satisfaction: 4.5 },
      { name: 'May', inspections: 95, revenue: 14250, satisfaction: 4.8 },
      { name: 'Jun', inspections: 88, revenue: 13200, satisfaction: 4.6 }
    ];
  }, []);

  const loadRegionalData = useCallback(async (): Promise<RegionalData[]> => {
    // Mock regional data - in real app, would analyze inspections by region
    return [
      { region: 'North California', inspections: 150, revenue: 22500, growth: 15.2 },
      { region: 'South California', inspections: 125, revenue: 18750, growth: 8.7 },
      { region: 'Nevada', inspections: 89, revenue: 13350, growth: 22.1 },
      { region: 'Arizona', inspections: 67, revenue: 10050, growth: 5.3 },
      { region: 'Oregon', inspections: 52, revenue: 7800, growth: 18.9 }
    ];
  }, []);

  const getDateRange = (range: TimeRange): string => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[range];

    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date.toISOString();
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, timeRange]);

  return {
    ...data,
    reload: loadDashboardData
  };
};