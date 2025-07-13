/**
 * @fileoverview Bug Report Management Component
 * Admin interface for viewing and managing user-submitted bug reports from GitHub
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bug,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Tag,
  Activity,
  RefreshCw,
  Settings
} from 'lucide-react';
import { githubIssuesService, type GitHubIssue } from '@/services/githubIssuesService';
import { logger } from '@/utils/logger';

interface BugReportStats {
  total: number;
  open: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  thisWeek: number;
  lastWeek: number;
}

export default function BugReportManagement() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<GitHubIssue[]>([]);
  const [stats, setStats] = useState<BugReportStats>({
    total: 0,
    open: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    thisWeek: 0,
    lastWeek: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
    loadBugReports();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchQuery, statusFilter, severityFilter]);

  const checkConfiguration = () => {
    const configured = githubIssuesService.isConfigured();
    setIsConfigured(configured);
    
    if (!configured) {
      logger.warn('GitHub Issues service not configured - check environment variables', {}, 'BUG_REPORT_MANAGEMENT');
    }
  };

  const loadBugReports = async () => {
    if (!githubIssuesService.isConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const repoStats = await githubIssuesService.getRepositoryStats();
      setIssues(repoStats.recentIssues);
      
      // Calculate stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const thisWeekIssues = repoStats.recentIssues.filter(
        issue => new Date(issue.created_at) > oneWeekAgo
      );
      
      const lastWeekIssues = repoStats.recentIssues.filter(
        issue => {
          const created = new Date(issue.created_at);
          return created > twoWeeksAgo && created <= oneWeekAgo;
        }
      );

      // Count severity levels from labels
      const severityCounts = repoStats.recentIssues.reduce((acc, issue) => {
        const severityLabel = issue.labels.find(label => 
          typeof label === 'string' && label.startsWith('severity:')
        );
        if (severityLabel) {
          const severity = severityLabel.split(':')[1] as keyof typeof acc;
          if (severity in acc) {
            acc[severity]++;
          }
        }
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0 });

      setStats({
        total: repoStats.totalBugReports,
        open: repoStats.openBugReports,
        closed: repoStats.closedBugReports,
        ...severityCounts,
        thisWeek: thisWeekIssues.length,
        lastWeek: lastWeekIssues.length
      });

    } catch (error) {
      logger.error('Failed to load bug reports', error, 'BUG_REPORT_MANAGEMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(query) ||
        issue.body.toLowerCase().includes(query) ||
        issue.user.login.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.state === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue =>
        issue.labels.some(label => 
          typeof label === 'string' && label === `severity:${severityFilter}`
        )
      );
    }

    setFilteredIssues(filtered);
  };

  const getSeverityFromLabels = (labels: string[]): string => {
    const severityLabel = labels.find(label => 
      typeof label === 'string' && label.startsWith('severity:')
    );
    return severityLabel ? severityLabel.split(':')[1] : 'unknown';
  };

  const getCategoryFromLabels = (labels: string[]): string => {
    const categoryLabel = labels.find(label => 
      typeof label === 'string' && label.startsWith('category:')
    );
    return categoryLabel ? categoryLabel.split(':')[1] : 'other';
  };

  const getSeverityBadge = (severity: string) => {
    const severityColors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      unknown: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <Badge className={severityColors[severity as keyof typeof severityColors] || severityColors.unknown}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (state: string) => {
    return state === 'open' ? (
      <Badge variant="destructive">Open</Badge>
    ) : (
      <Badge variant="default" className="bg-green-100 text-green-800">Closed</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bug Report Management</h1>
            <p className="text-gray-600">Manage user-submitted bug reports from GitHub Issues</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">GitHub Integration Not Configured</h3>
            <p className="text-gray-500 mb-4">
              To use bug report management, configure the GitHub integration with your repository details.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Required Environment Variables</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• REACT_APP_GITHUB_OWNER</p>
                <p>• REACT_APP_GITHUB_REPO</p>
                <p>• REACT_APP_GITHUB_TOKEN</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Bug Report Management</h1>
          <p className="text-gray-600">Manage user-submitted bug reports from GitHub Issues</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadBugReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.open('https://github.com/settings/tokens', '_blank')}>
            <Settings className="h-4 w-4 mr-2" />
            GitHub Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  {getTrendIcon(stats.thisWeek, stats.lastWeek)}
                  <span className="ml-1">
                    {stats.thisWeek > stats.lastWeek ? '+' : ''}
                    {stats.thisWeek - stats.lastWeek} this week
                  </span>
                </div>
              </div>
              <Bug className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  Needs attention
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Fixed and closed
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1 text-red-500" />
                  High priority
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
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
                  placeholder="Search issues by title, description, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports ({filteredIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => {
                  const severity = getSeverityFromLabels(issue.labels);
                  const category = getCategoryFromLabels(issue.labels);
                  
                  return (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            <Bug className="h-4 w-4 mr-2 text-gray-400" />
                            #{issue.number}
                          </div>
                          <div className="text-sm text-gray-900 mt-1 max-w-md truncate">
                            {issue.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(issue.state)}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(severity)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <img 
                            src={issue.user.avatar_url} 
                            alt={issue.user.login}
                            className="h-6 w-6 rounded-full"
                          />
                          <span className="text-sm">{issue.user.login}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(issue.created_at)}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </div>
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
                            <DropdownMenuItem onClick={() => setSelectedIssue(issue)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(issue.html_url, '_blank')}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in GitHub
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add Comment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Bug className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bug Reports Found</h3>
              {searchQuery || statusFilter !== 'all' || severityFilter !== 'all' ? (
                <div>
                  <p className="text-gray-500 mb-2">No reports match your current filters</p>
                  <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">
                    Bug reports will appear here when users submit them through the app
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">How It Works</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Users click the bug report button</p>
                      <p>• Fill out issue details with screenshots</p>
                      <p>• Reports are created as GitHub Issues</p>
                      <p>• Manage and track here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Dialog */}
      {selectedIssue && (
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Bug className="h-5 w-5" />
                <span>Issue #{selectedIssue.number}</span>
                {getStatusBadge(selectedIssue.state)}
                {getSeverityBadge(getSeverityFromLabels(selectedIssue.labels))}
              </DialogTitle>
              <DialogDescription>
                Created by {selectedIssue.user.login} on {new Date(selectedIssue.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedIssue.title}</h4>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {selectedIssue.body}
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedIssue.labels.map((label, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>
              <Button onClick={() => window.open(selectedIssue.html_url, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View in GitHub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}