/**
 * Checklist Header Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, RefreshCw, Plus } from "lucide-react";

interface ChecklistHeaderProps {
  itemCount: number;
  loading: boolean;
  onRefresh: () => void;
  onCreateItem: () => void;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
  itemCount,
  loading,
  onRefresh,
  onCreateItem,
}) => {
  return (
    <div id="checklist-header" className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <CheckSquare className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Checklist Management</h2>
        <Badge variant="outline">{itemCount} items</Badge>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={onCreateItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>
  );
};
