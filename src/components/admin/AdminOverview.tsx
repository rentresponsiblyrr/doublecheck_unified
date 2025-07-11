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
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AdminStats {
  properties: {
    total: number;
    active: number;
    pending: number;
  };
  inspections: {
    total: number;
    pending: number;
    completed: number;
    inProgress: number;
  };
  users: {
    total: number;
    inspectors: number;
    auditors: number;
    admins: number;
  };
  reports: {
    generated: number;
    pending: number;
    delivered: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'inspection' | 'property' | 'user' | 'report';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    properties: { total: 0, active: 0, pending: 0 },
    inspections: { total: 0, pending: 0, completed: 0, inProgress: 0 },
    users: { total: 0, inspectors: 0, auditors: 0, admins: 0 },
    reports: { generated: 0, pending: 0, delivered: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
    loadRecentActivity();
  }, []);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);
      
      // Get properties stats
      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('id, status');

      if (propsError) throw propsError;

      // Get inspections stats
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('id, status');

      if (inspError) throw inspError;

      // Get users stats
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, role');

      if (usersError) throw usersError;

      // Calculate property stats
      const propertyStats = {
        total: properties?.length || 0,
        active: properties?.filter(p => p.status === 'active').length || 0,
        pending: properties?.filter(p => p.status === 'pending').length || 0
      };

      // Calculate inspection stats
      const inspectionStats = {
        total: inspections?.length || 0,
        pending: inspections?.filter(i => i.status === 'pending_review' || i.status === 'in_review').length || 0,
        completed: inspections?.filter(i => i.status === 'approved' || i.status === 'completed').length || 0,
        inProgress: inspections?.filter(i => i.status === 'in_progress').length || 0
      };

      // Calculate user stats
      const userStats = {
        total: users?.length || 0,
        inspectors: users?.filter(u => u.role === 'inspector').length || 0,
        auditors: users?.filter(u => u.role === 'auditor').length || 0,
        admins: users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0
      };

      setStats({
        properties: propertyStats,
        inspections: inspectionStats,
        users: userStats,
        reports: { 
          generated: inspectionStats.completed, // Use completed inspections as generated reports
          pending: inspectionStats.pending, // Use pending inspections as pending reports
          delivered: inspectionStats.approved // Use approved inspections as delivered reports
        }
      });

    } catch (error) {
      logger.error('Failed to load admin stats', error, 'ADMIN_OVERVIEW');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent inspections for activity feed
      const { data: recentInspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          status,
          created_at,
          properties(name),
          users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const activities: RecentActivity[] = recentInspections?.map(inspection => ({
        id: inspection.id,
        type: 'inspection' as const,
        description: `Inspection ${inspection.status} for ${inspection.properties?.name || 'property'}`,
        timestamp: inspection.created_at,
        status: inspection.status === 'completed' ? 'success' : 
                inspection.status === 'in_progress' ? 'info' : 'warning'
      })) || [];

      setRecentActivity(activities);

    } catch (error) {
      logger.error('Failed to load recent activity', error, 'ADMIN_OVERVIEW');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inspection': return <ClipboardList className="h-4 w-4" />;
      case 'property': return <Building2 className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome to the STR Certified admin portal. Monitor system performance and manage operations.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/settings')}>
            <Target className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Properties Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/properties')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-blue-600">{stats.properties.total}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  {stats.properties.active} active
                </div>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Inspections Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/inspections')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inspections</p>
                <p className="text-2xl font-bold text-green-600">{stats.inspections.total}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                  {stats.inspections.pending} pending
                </div>
              </div>
              <ClipboardList className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.users.total}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.users.inspectors} inspectors
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Reports Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="text-2xl font-bold text-orange-600">{stats.reports.generated}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {stats.reports.delivered} delivered
                </div>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inspection Processing</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <Progress value={98} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Analysis Engine</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <Progress value={95} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Report Generation</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>
              </div>
              <Progress value={78} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Performance</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/admin/properties')}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Properties</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-6 w-6" />
              <span>User Management</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/admin/inspections')}
            >
              <ClipboardList className="h-6 w-6" />
              <span>View Inspections</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/admin/reports')}
            >
              <FileText className="h-6 w-6" />
              <span>Generate Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}