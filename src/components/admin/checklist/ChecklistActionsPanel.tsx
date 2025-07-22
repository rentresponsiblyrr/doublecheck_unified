import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, ClipboardList, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChecklistFormDialog } from './ChecklistFormDialog';
import { ChecklistFiltersComponent } from './ChecklistFilters';
import { ChecklistItem, ChecklistFilters, SystemHealth } from './types';

interface ChecklistActionsPanelProps {
  systemHealth: SystemHealth;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onItemCreate: (item: ChecklistFormData) => Promise<void>;
  onFiltersChange: (filters: ChecklistFilters) => void;
}

interface ChecklistFormData {
  label: string;
  category: string;
  required: boolean;
  evidence_type: string;
  gpt_prompt?: string;
}

export const ChecklistActionsPanel: React.FC<ChecklistActionsPanelProps> = ({
  systemHealth,
  isLoading,
  error,
  onRefresh,
  onItemCreate,
  onFiltersChange
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateItem = async (formData: ChecklistFormData) => {
    try {
      await onItemCreate(formData);
      setIsDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Checklist item created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create checklist item',
        variant: 'destructive',
      });
    }
  };

  if (!systemHealth.canConnect) {
    return (
      <Alert variant="destructive" id="connection-error-alert">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to connect to the database. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div id="checklist-actions-panel" className="space-y-4">
      {error && (
        <Alert variant="destructive" id="error-alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Checklist Management</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            id="refresh-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={isLoading}
            id="create-item-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <ChecklistFiltersComponent
        onFiltersChange={onFiltersChange}
        disabled={isLoading}
      />

      <ChecklistFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateItem}
        mode="create"
      />
    </div>
  );
};