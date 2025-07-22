/**
 * Inspection Queue Table - Focused Component
 * 
 * Displays inspection data in a table format with proper accessibility
 */

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, AlertTriangle, Users } from 'lucide-react';
import type { Inspection } from './InspectionQueueManager';

interface InspectionQueueTableProps {
  inspections: Inspection[];
  selectedInspectionId?: string;
  onSelectInspection: (inspection: Inspection) => void;
}

export const InspectionQueueTable: React.FC<InspectionQueueTableProps> = ({
  inspections,
  selectedInspectionId,
  onSelectInspection
}) => {
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

  return (
    <div className="border rounded-lg" id="inspection-queue-table">
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
          {inspections.map((inspection) => (
            <TableRow 
              key={inspection.id}
              className={`cursor-pointer hover:bg-gray-50 ${
                selectedInspectionId === inspection.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelectInspection(inspection)}
              role="button"
              tabIndex={0}
              aria-label={`Select inspection for ${inspection.propertyAddress}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectInspection(inspection);
                }
              }}
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
                    aria-label={`Review inspection for ${inspection.propertyAddress}`}
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
    </div>
  );
};