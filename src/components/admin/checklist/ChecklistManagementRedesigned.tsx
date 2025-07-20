/**
 * Professional Checklist Management Component
 * Orchestrates checklist CRUD operations with proper separation of concerns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

import { ChecklistSystemHealth } from './ChecklistSystemHealth';
import { ChecklistFiltersComponent } from './ChecklistFilters';
import { ChecklistTable } from './ChecklistTable';
import { ChecklistFormDialog } from './ChecklistFormDialog';
import { 
  ChecklistItem, 
  ChecklistFormData, 
  ChecklistFilters, 
  SystemHealth,
  ChecklistStats 
} from './types';

const ChecklistManagementRedesigned: React.FC = () => {
  // State management
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ChecklistItem[]>([]);
  const [filters, setFilters] = useState<ChecklistFilters>({
    search: '',
    category: '',
    evidenceType: '',
    status: ''
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    tableExists: false,
    hasData: false,
    hasPermissions: false,
    canConnect: false,
    lastChecked: new Date()
  });
  const [stats, setStats] = useState<ChecklistStats>({
    total: 0,
    active: 0,
    deleted: 0,
    required: 0,
    byCategory: {},
    byEvidenceType: {}
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  /**
   * Check system health and database connectivity
   */
  const checkSystemHealth = useCallback(async () => {
    setIsRefreshingHealth(true);
    
    try {
      // Test database connection
      const { data: testConnection, error: connectionError } = await supabase
        .from('static_safety_items')
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        setSystemHealth({
          tableExists: false,
          hasData: false,
          hasPermissions: false,
          canConnect: false,
          errorDetails: connectionError.message,
          lastChecked: new Date()
        });
        return;
      }

      // Test table existence and permissions
      const { data: itemsTest, error: permissionError } = await supabase
        .from('static_safety_items')
        .select('id')
        .limit(1);

      const hasData = (testConnection as any)?.count > 0;
      const hasPermissions = !permissionError;

      setSystemHealth({
        tableExists: true,
        hasData,
        hasPermissions,
        canConnect: true,
        errorDetails: permissionError?.message,
        lastChecked: new Date()
      });

    } catch (error) {
      logger.error('System health check failed:', error);
      setSystemHealth({
        tableExists: false,
        hasData: false,
        hasPermissions: false,
        canConnect: false,
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      });
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  /**
   * Load checklist items from database
   */
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('static_safety_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const typedData: ChecklistItem[] = (data || []).map(item => ({
        id: item.id,
        label: item.label || '',
        category: item.category || 'General',
        evidence_type: item.evidence_type || 'photo',
        required: item.required || false,
        deleted: item.deleted || false,
        notes: item.notes || '',
        gpt_prompt: item.gpt_prompt || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        active_date: item.active_date,
        deleted_date: item.deleted_date
      }));

      setItems(typedData);
      updateStats(typedData);
      
      logger.info(`Loaded ${typedData.length} checklist items`);
      
    } catch (error) {
      logger.error('Failed to load checklist items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load checklist items. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Update statistics based on current items
   */
  const updateStats = (itemList: ChecklistItem[]) => {
    const stats: ChecklistStats = {
      total: itemList.length,
      active: itemList.filter(item => !item.deleted).length,
      deleted: itemList.filter(item => item.deleted).length,
      required: itemList.filter(item => item.required && !item.deleted).length,
      byCategory: {},
      byEvidenceType: {}
    };

    // Calculate category distribution
    itemList.forEach(item => {
      if (!item.deleted) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
        stats.byEvidenceType[item.evidence_type] = (stats.byEvidenceType[item.evidence_type] || 0) + 1;
      }
    });

    setStats(stats);
  };

  /**
   * Filter items based on current filter criteria
   */
  const filterItems = useCallback(() => {
    let filtered = items;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.label.toLowerCase().includes(searchLower) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Evidence type filter
    if (filters.evidenceType) {
      filtered = filtered.filter(item => item.evidence_type === filters.evidenceType);
    }

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(item => !item.deleted);
    } else if (filters.status === 'deleted') {
      filtered = filtered.filter(item => item.deleted);
    }

    setFilteredItems(filtered);
  }, [items, filters]);

  /**
   * Save checklist item (create or update)
   */
  const saveItem = async (formData: ChecklistFormData) => {
    try {
      setIsSaving(true);

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('static_safety_items')
          .update({
            label: formData.label,
            category: formData.category,
            evidence_type: formData.evidence_type,
            required: formData.required,
            notes: formData.notes,
            gpt_prompt: formData.gpt_prompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Checklist item updated successfully.'
        });

        logger.info(`Updated checklist item: ${editingItem.id}`);
      } else {
        // Create new item
        const { error } = await supabase
          .from('static_safety_items')
          .insert({
            label: formData.label,
            category: formData.category,
            evidence_type: formData.evidence_type,
            required: formData.required,
            notes: formData.notes,
            gpt_prompt: formData.gpt_prompt,
            deleted: false,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'New checklist item created successfully.'
        });

        logger.info('Created new checklist item');
      }

      // Reload items to reflect changes
      await loadItems();
      
    } catch (error) {
      logger.error('Failed to save checklist item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save checklist item. Please try again.',
        variant: 'destructive'
      });
      throw error; // Re-throw to handle in form dialog
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete checklist item (soft delete)
   */
  const deleteItem = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('static_safety_items')
        .update({
          deleted: true,
          deleted_date: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Checklist item deleted successfully.'
      });

      logger.info(`Deleted checklist item: ${item.id}`);
      await loadItems();
      
    } catch (error) {
      logger.error('Failed to delete checklist item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete checklist item. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Open edit dialog for item
   */
  const openEditDialog = (item: ChecklistItem) => {
    setEditingItem(item);
    setIsFormDialogOpen(true);
  };

  /**
   * Close form dialog and reset state
   */
  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingItem(null);
  };

  // Effects
  useEffect(() => {
    checkSystemHealth();
    loadItems();
  }, [checkSystemHealth, loadItems]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Checklist Management</CardTitle>
                <CardDescription>
                  Manage inspection checklist items and categories
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkSystemHealth}
                disabled={isRefreshingHealth}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setIsFormDialogOpen(true);
                }}
                disabled={!systemHealth.canConnect}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Health */}
      <ChecklistSystemHealth
        health={systemHealth}
        isRefreshing={isRefreshingHealth}
        onRefresh={checkSystemHealth}
      />

      {/* Filters */}
      <ChecklistFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        itemCounts={stats}
      />

      {/* Items Table */}
      <Card>
        <CardContent className="pt-6">
          <ChecklistTable
            items={filteredItems}
            onEdit={openEditDialog}
            onDelete={deleteItem}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ChecklistFormDialog
        isOpen={isFormDialogOpen}
        onClose={closeFormDialog}
        onSave={saveItem}
        editingItem={editingItem}
        isLoading={isSaving}
      />
    </div>
  );
};

export default ChecklistManagementRedesigned;