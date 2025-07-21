/**
 * Functional Checklist Management Business Logic Hook
 * Extracted from FunctionalChecklistManagement.tsx for surgical refactoring
 */

import { useState, useEffect } from 'react';
import { productionDb, ProductionSafetyItem } from '@/services/productionDatabaseService';
import { logger as log } from '@/lib/utils/logger';

interface SafetyItemFormData {
  label: string;
  category: string;
  evidence_type: string;
  gpt_prompt: string;
  notes: string;
  required: boolean;
}

export const useFunctionalChecklistManagement = () => {
  const [safetyItems, setSafetyItems] = useState<ProductionSafetyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionSafetyItem | null>(null);
  const [formData, setFormData] = useState<SafetyItemFormData>({
    label: '',
    category: '',
    evidence_type: 'photo',
    gpt_prompt: '',
    notes: '',
    required: false
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadSafetyItems();
  }, []);

  const loadSafetyItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const items = await productionDb.getAllSafetyItems();
      setSafetyItems(items);
      
      log.info('Safety items loaded successfully', {
        component: 'FunctionalChecklistManagement',
        action: 'loadSafetyItems',
        itemCount: items.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load safety items';
      setError(errorMessage);
      
      log.error('Failed to load safety items', err as Error, {
        component: 'FunctionalChecklistManagement',
        action: 'loadSafetyItems'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setFormData({
      label: '',
      category: '',
      evidence_type: 'photo',
      gpt_prompt: '',
      notes: '',
      required: false
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: ProductionSafetyItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      category: item.category,
      evidence_type: item.evidence_type,
      gpt_prompt: item.gpt_prompt,
      notes: item.notes,
      required: item.required
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      if (editingItem) {
        // Update existing item
        const updatedItem = await productionDb.updateSafetyItem(editingItem.id, formData);
        setSafetyItems(safetyItems.map(item => 
          item.id === editingItem.id ? updatedItem : item
        ));
        
        log.info('Safety item updated successfully', {
          component: 'FunctionalChecklistManagement',
          action: 'updateSafetyItem',
          itemId: editingItem.id
        });
      } else {
        // Create new item
        const newItem = await productionDb.createSafetyItem(formData);
        setSafetyItems([newItem, ...safetyItems]);
        
        log.info('Safety item created successfully', {
          component: 'FunctionalChecklistManagement',
          action: 'createSafetyItem',
          itemId: newItem.id
        });
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save safety item';
      setError(errorMessage);
      
      log.error('Failed to save safety item', err as Error, {
        component: 'FunctionalChecklistManagement',
        action: 'submitSafetyItem',
        isEditing: !!editingItem
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteItem = async (item: ProductionSafetyItem) => {
    if (!confirm(`Are you sure you want to delete the safety item "${item.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await productionDb.deleteSafetyItem(item.id);
      setSafetyItems(safetyItems.filter(i => i.id !== item.id));
      
      log.info('Safety item deleted successfully', {
        component: 'FunctionalChecklistManagement',
        action: 'deleteSafetyItem',
        itemId: item.id
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete safety item';
      setError(errorMessage);
      
      log.error('Failed to delete safety item', err as Error, {
        component: 'FunctionalChecklistManagement',
        action: 'deleteSafetyItem',
        itemId: item.id
      });
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? safetyItems 
    : safetyItems.filter(item => item.category === selectedCategory);

  return {
    safetyItems,
    filteredItems,
    loading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    editingItem,
    formData,
    setFormData,
    submitLoading,
    selectedCategory,
    setSelectedCategory,
    loadSafetyItems,
    handleCreateItem,
    handleEditItem,
    handleSubmit,
    handleDeleteItem
  };
};

export type { SafetyItemFormData };