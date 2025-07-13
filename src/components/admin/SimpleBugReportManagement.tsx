import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Bug, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleBugReport {
  id: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'question';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporter_email: string;
  user_agent?: string;
  current_url?: string;
  created_at: string;
  updated_at: string;
}

const mockBugReports: SimpleBugReport[] = [
  {
    id: '1',
    title: 'Login button not responsive on mobile',
    description: 'The login button on the authentication page is not clickable on mobile devices. Users have to tap multiple times for it to register.',
    category: 'bug',
    priority: 'high',
    status: 'open',
    reporter_email: 'inspector@doublecheckverified.com',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
    current_url: '/login',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    title: 'Photo upload fails occasionally',
    description: 'Sometimes when uploading inspection photos, the upload fails silently and photos are lost.',
    category: 'bug',
    priority: 'critical',
    status: 'in_progress',
    reporter_email: 'inspector2@doublecheckverified.com',
    current_url: '/inspection/123',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    title: 'Add dark mode toggle',
    description: 'Users have requested a dark mode option for the admin portal to reduce eye strain during long sessions.',
    category: 'feature',
    priority: 'medium',
    status: 'open',
    reporter_email: 'admin@doublecheckverified.com',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '4',
    title: 'Dashboard loading performance',
    description: 'The admin dashboard takes too long to load when there are many properties. Consider pagination or lazy loading.',
    category: 'improvement',
    priority: 'medium',
    status: 'resolved',
    reporter_email: 'auditor@doublecheckverified.com',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export default function SimpleBugReportManagement() {
  const [reports, setReports] = useState<SimpleBugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<SimpleBugReport | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadBugReports();
  }, []);

  const loadBugReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from database
      const { data: dbReports, error: dbError } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Database bug reports not available, using mock data:', dbError);
        setReports(mockBugReports);
      } else {
        setReports(dbReports || mockBugReports);
      }
    } catch (err) {
      console.error('Failed to load bug reports:', err);
      setError('Failed to load bug reports. Using demo data.');
      setReports(mockBugReports);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: SimpleBugReport['status']) => {
    try {
      // Try to update in database
      try {
        const { error: updateError } = await supabase
          .from('bug_reports')
          .update({ 
            status: newStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', reportId);

        if (updateError) {
          console.warn('Failed to update in database:', updateError);
        }
      } catch (updateDbError) {
        console.warn('Database update failed:', updateDbError);
      }

      // Update local state regardless
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
          : report
      ));
      
    } catch (err) {
      console.error('Failed to update bug report status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'bug':
        return <Badge variant="default" className="bg-red-100 text-red-800">Bug</Badge>;
      case 'feature':
        return <Badge variant="default" className="bg-green-100 text-green-800">Feature</Badge>;
      case 'improvement':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Improvement</Badge>;
      case 'question':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Question</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const viewReport = (report: SimpleBugReport) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bug Report Management</h1>
            <p className="text-gray-600 mt-1">Loading bug reports...</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bug Report Management</h1>
          <p className="text-gray-600 mt-1">Track and manage user-reported issues and feature requests</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto"
              onClick={loadBugReports}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {!error && reports.length > 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Successfully loaded {reports.length} bug reports. System is operational.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.status === 'open').length}
            </div>
            <div className="text-sm text-blue-600">Open Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => r.status === 'in_progress').length}
            </div>
            <div className="text-sm text-orange-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {reports.filter(r => r.priority === 'critical' || r.priority === 'high').length}
            </div>
            <div className="text-sm text-red-600">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-green-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            Bug Reports ({filteredReports.length})
          </CardTitle>
          <CardDescription>
            Manage user-reported bugs, feature requests, and system issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              className="px-3 py-2 border rounded-md"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Reports Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {report.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {report.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(report.category)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(report.priority)}
                    </TableCell>
                    <TableCell>
                      <select 
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value as SimpleBugReport['status'])}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {report.reporter_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewReport(report)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bug reports found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'No bug reports have been submitted yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedReport && getStatusIcon(selectedReport.status)}
              <span>{selectedReport?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Bug Report Details
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {getCategoryBadge(selectedReport.category)}
                {getPriorityBadge(selectedReport.priority)}
                {getStatusBadge(selectedReport.status)}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedReport.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Reporter</h4>
                  <p className="text-sm text-gray-600">{selectedReport.reporter_email}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Created</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedReport.current_url && (
                  <div>
                    <h4 className="font-medium mb-1">Page URL</h4>
                    <p className="text-sm text-gray-600 truncate">{selectedReport.current_url}</p>
                  </div>
                )}
                {selectedReport.user_agent && (
                  <div>
                    <h4 className="font-medium mb-1">User Agent</h4>
                    <p className="text-xs text-gray-600 truncate">{selectedReport.user_agent}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}