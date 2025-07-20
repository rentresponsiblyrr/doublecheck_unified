/**
 * Checklist Table Component
 * Displays checklist items in a sortable, filterable table
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
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
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Camera,
  FileText,
  Video,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { ChecklistItem } from './types';

interface ChecklistTableProps {
  items: ChecklistItem[];
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  isLoading?: boolean;
}

export const ChecklistTable: React.FC<ChecklistTableProps> = ({
  items,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const getCategoryBadge = (category: string) => {
    const colorMap: Record<string, string> = {
      'Safety': 'bg-red-100 text-red-800',
      'Cleanliness': 'bg-blue-100 text-blue-800',
      'Amenities': 'bg-green-100 text-green-800',
      'Structure': 'bg-purple-100 text-purple-800',
      'Compliance': 'bg-orange-100 text-orange-800',
      'Accessibility': 'bg-pink-100 text-pink-800',
      'Technology': 'bg-indigo-100 text-indigo-800',
      'Emergency': 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={`${colorMap[category] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {category}
      </Badge>
    );
  };

  const getEvidenceBadge = (evidenceType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'photo': <Camera className="h-3 w-3" />,
      'video': <Video className="h-3 w-3" />,
      'inspection': <Shield className="h-3 w-3" />,
      'documentation': <FileText className="h-3 w-3" />,
    };

    return (
      <Badge variant="outline" className="text-xs">
        {iconMap[evidenceType]}
        <span className="ml-1 capitalize">{evidenceType}</span>
      </Badge>
    );
  };

  const getStatusBadge = (item: ChecklistItem) => {
    if (item.deleted) {
      return (
        <Badge variant="destructive" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          Deleted
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="text-xs">
        <Check className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getRequiredBadge = (required: boolean) => {
    if (required) {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Required
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading checklist items...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No checklist items found</h3>
          <p className="text-gray-600">Try adjusting your filters or create a new checklist item.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Label</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Evidence Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className={item.deleted ? 'opacity-60' : ''}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.notes && (
                    <div className="text-sm text-gray-600 mt-1 truncate max-w-xs">
                      {item.notes}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {getCategoryBadge(item.category)}
              </TableCell>
              
              <TableCell>
                {getEvidenceBadge(item.evidence_type)}
              </TableCell>
              
              <TableCell>
                {getStatusBadge(item)}
              </TableCell>
              
              <TableCell>
                {getRequiredBadge(item.required)}
              </TableCell>
              
              <TableCell className="text-sm text-gray-600">
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEdit(item)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {item.deleted ? 'Permanently Delete' : 'Delete Item'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};