import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface Inspection {
  id: string;
  property_id: string;
  inspector_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  created_at: string;
  properties: {
    id: string;
    name: string;
    address: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
  };
  checklist_items: Array<{
    id: string;
    status: string;
    ai_status: string;
  }>;
}

interface InspectionStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  averageCompletionTime: number;
  completionRate: number;
}

export default function InspectionManagement() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<InspectionStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
    needsRevision: 0,
    averageCompletionTime: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    filterInspections();
    calculateStats();
  }, [inspections, searchQuery, statusFilter, dateFilter]);

  const loadInspections = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          id,
          property_id,
          inspector_id,
          status,
          start_time,
          end_time,
          created_at,
          properties!inner (
            id,
            name,
            address
          ),
          users!inner (
            id,
            name,
            email
          ),
          checklist_items (
            id,
            status,
            ai_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setInspections(data || []);
      logger.info('Loaded inspections', { count: data?.length }, 'INSPECTION_MANAGEMENT');
    } catch (error) {
      logger.error('Failed to load inspections', error, 'INSPECTION_MANAGEMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInspections = () => {
    let filtered = inspections;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inspection => 
        inspection.properties.name.toLowerCase().includes(query) ||
        inspection.properties.address.toLowerCase().includes(query) ||
        inspection.users.name.toLowerCase().includes(query) ||
        inspection.users.email.toLowerCase().includes(query) ||
        inspection.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inspection => inspection.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(inspection => 
        new Date(inspection.created_at) >= startDate
      );
    }

    setFilteredInspections(filtered);
  };

  const calculateStats = () => {
    if (inspections.length === 0) return;

    const total = inspections.length;
    const pending = inspections.filter(i => i.status === 'pending_review' || i.status === 'draft').length;
    const inProgress = inspections.filter(i => i.status === 'in_progress').length;
    const completed = inspections.filter(i => ['completed', 'approved', 'rejected'].includes(i.status)).length;
    const approved = inspections.filter(i => i.status === 'approved').length;
    const rejected = inspections.filter(i => i.status === 'rejected').length;
    const needsRevision = inspections.filter(i => i.status === 'needs_revision').length;

    // Calculate average completion time for completed inspections
    const completedInspections = inspections.filter(i => i.end_time && i.start_time);
    const averageCompletionTime = completedInspections.length > 0 ?
      completedInspections.reduce((sum, inspection) => {
        const startTime = new Date(inspection.start_time).getTime();
        const endTime = new Date(inspection.end_time!).getTime();
        return sum + (endTime - startTime);
      }, 0) / completedInspections.length / (1000 * 60 * 60) : 0; // Convert to hours

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    setStats({
      total,
      pending,
      inProgress,
      completed,
      approved,
      rejected,
      needsRevision,
      averageCompletionTime,
      completionRate
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'needs_revision':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending_review':
      case 'needs_revision':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getInspectionProgress = (inspection: Inspection) => {
    if (!inspection.checklist_items || inspection.checklist_items.length === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    const total = inspection.checklist_items.length;
    const completed = inspection.checklist_items.filter(item => 
      item.status === 'completed' || item.ai_status === 'pass'
    ).length;
    const percentage = (completed / total) * 100;

    return { percentage, completed, total };
  };

  const handleViewInspection = (inspectionId: string) => {
    // Navigate to inspection detail view (would need to be implemented)
    navigate(`/admin/inspections/${inspectionId}`);
  };

  const handleDeleteInspection = async (inspection: Inspection) => {
    if (!confirm(`Are you sure you want to delete this inspection? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspection.id);

      if (error) throw error;

      logger.info('Inspection deleted successfully', { inspectionId: inspection.id }, 'INSPECTION_MANAGEMENT');
      await loadInspections();
    } catch (error) {
      logger.error('Failed to delete inspection', error, 'INSPECTION_MANAGEMENT');
      alert('Failed to delete inspection.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Management</h1>
          <p className="text-gray-600">
            Monitor and manage all property inspections across the system
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={() => navigate('/admin/analytics')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {stats.completionRate.toFixed(1)}% completion rate
                </div>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Active inspections
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <AlertCircle className="h-3 w-3 mr-1 text-yellow-500" />
                  Awaiting audit
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Quality assured
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inspection Pipeline</CardTitle>
            <CardDescription>Visual overview of inspection workflow stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Draft → In Progress</span>
                <span className="text-sm text-gray-600">{stats.inProgress} active</span>
              </div>
              <Progress value={(stats.inProgress / Math.max(stats.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Progress → Completed</span>
                <span className="text-sm text-gray-600">{stats.completed} completed</span>
              </div>
              <Progress value={(stats.completed / Math.max(stats.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Review → Approved</span>
                <span className="text-sm text-gray-600">{stats.approved} approved</span>
              </div>
              <Progress value={(stats.approved / Math.max(stats.total, 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Completion Time</span>
                <span className="text-sm font-medium">
                  {stats.averageCompletionTime.toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rejection Rate</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revision Rate</span>
                <span className="text-sm font-medium text-orange-600">
                  {stats.total > 0 ? ((stats.needsRevision / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by property, inspector, or inspection ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inspections ({filteredInspections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => {
                const progress = getInspectionProgress(inspection);
                const duration = inspection.end_time ? 
                  Math.round((new Date(inspection.end_time).getTime() - new Date(inspection.start_time).getTime()) / (1000 * 60 * 60 * 24)) :
                  Math.round((Date.now() - new Date(inspection.start_time).getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {inspection.properties.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inspection.properties.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{inspection.users.name}</div>
                          <div className="text-sm text-gray-500">{inspection.users.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(inspection.status)}
                        {getStatusBadge(inspection.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{progress.completed}/{progress.total} items</span>
                          <span>{progress.percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(inspection.start_time).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {new Date(inspection.start_time).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {duration > 0 ? `${duration}d` : 'Same day'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewInspection(inspection.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteInspection(inspection)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredInspections.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inspections found</p>
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? (
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              ) : (
                <p className="text-sm text-gray-400">Inspections will appear here as they are created</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}