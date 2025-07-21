/**
 * @fileoverview Inspection Queue Manager Component
 * Handles the inspection queue, filtering, and list management
 * ENTERPRISE GRADE: Single responsibility for queue operations
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  BarChart3,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { logger } from '@/utils/logger';

interface Inspection {
  id: string;
  propertyId: string;
  propertyAddress: string;
  inspectorId: string;
  inspectorName: string;
  status: 'pending_review' | 'in_review' | 'completed' | 'approved' | 'rejected';
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  aiScore: number;
  photoCount: number;
  videoCount: number;
  issuesFound: number;
  estimatedReviewTime: number;
}

interface InspectionQueueManagerProps {
  inspections: Inspection[];
  isLoading: boolean;
  onSelectInspection: (inspection: Inspection) => void;
  selectedInspectionId?: string;
}

export const InspectionQueueManager: React.FC<InspectionQueueManagerProps> = ({
  inspections,
  isLoading,
  onSelectInspection,
  selectedInspectionId
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'priority' | 'aiScore'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort inspections
  const filteredInspections = inspections
    .filter(inspection => {
      if (filterStatus !== 'all' && inspection.status !== filterStatus) return false;
      if (filterPriority !== 'all' && inspection.priority !== filterPriority) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          inspection.propertyAddress.toLowerCase().includes(query) ||
          inspection.inspectorName.toLowerCase().includes(query) ||
          inspection.id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'submittedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[aValue as keyof typeof priorityOrder];
        bValue = priorityOrder[bValue as keyof typeof priorityOrder];
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'in_review':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Review</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAIScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Queue</CardTitle>
          <CardDescription>Loading inspections...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Inspection Queue ({filteredInspections.length})</span>
        </CardTitle>
        <CardDescription>
          Inspections waiting for auditor review and approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by property, inspector, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submittedAt">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="aiScore">AI Score</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Inspections Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property & Inspector</TableHead>
                <TableHead>Status & Priority</TableHead>
                <TableHead>AI Analysis</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => (
                <TableRow 
                  key={inspection.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedInspectionId === inspection.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => onSelectInspection(inspection)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{inspection.propertyAddress}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {inspection.inspectorName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getStatusBadge(inspection.status)}
                      {getPriorityBadge(inspection.priority)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className={`font-medium ${getAIScoreColor(inspection.aiScore)}`}>
                        {inspection.aiScore}% AI Score
                      </div>
                      <div className="text-sm text-gray-500">
                        {inspection.photoCount} photos • {inspection.videoCount} videos
                      </div>
                      {inspection.issuesFound > 0 && (
                        <div className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {inspection.issuesFound} issues
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatTimeAgo(inspection.submittedAt)}</div>
                      <div className="text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        ~{inspection.estimatedReviewTime}min review
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInspection(inspection);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInspections.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inspections found</p>
              {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all') && (
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};