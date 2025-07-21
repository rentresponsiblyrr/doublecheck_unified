/**
 * Functional Checklist Management Component
 * 
 * PRODUCTION-READY CHECKLIST MANAGEMENT
 * 
 * This component provides fully functional checklist (safety items) management
 * using the working 'static_safety_items' table.
 * 
 * FIXES IMPLEMENTED:
 * 1. Uses actual 'static_safety_items' table with correct UUID schema
 * 2. Implements proper CRUD operations that work with current database
 * 3. Provides comprehensive category and evidence type management
 * 4. Includes proper error handling and loading states
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, RefreshCw, AlertTriangle, CheckSquare, Camera, Video, FileText } from 'lucide-react';
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

export const FunctionalChecklistManagement: React.FC = () => {
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

  const categories = [
    'Safety',
    'Compliance',
    'Cleanliness',
    'Amenities',
    'Maintenance',
    'Accessibility',
    'Fire Safety',
    'Security',
    'Electrical',
    'Plumbing'
  ];

  const evidenceTypes = [
    { value: 'photo', label: 'Photo', icon: Camera },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'none', label: 'Visual Check Only', icon: CheckSquare },
    { value: 'documentation', label: 'Documentation', icon: FileText }
  ];

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

  const getEvidenceIcon = (evidenceType: string) => {
    const type = evidenceTypes.find(t => t.value === evidenceType);
    return type ? type.icon : CheckSquare;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Safety': 'bg-red-100 text-red-800',
      'Compliance': 'bg-blue-100 text-blue-800',
      'Cleanliness': 'bg-green-100 text-green-800',
      'Amenities': 'bg-purple-100 text-purple-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
      'Accessibility': 'bg-teal-100 text-teal-800',
      'Fire Safety': 'bg-red-100 text-red-800',
      'Security': 'bg-gray-100 text-gray-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Plumbing': 'bg-blue-100 text-blue-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading checklist items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Checklist Management</h2>
          <Badge variant="outline">{filteredItems.length} items</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSafetyItems} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label>Filter by Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Safety Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {selectedCategory === 'all' 
              ? "No checklist items found. Click 'Add Item' to create the first item."
              : `No items found in the "${selectedCategory}" category.`
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const EvidenceIcon = getEvidenceIcon(item.evidence_type);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <EvidenceIcon className="w-5 h-5 text-gray-600" />
                        <h3 className="font-medium text-lg">{item.label}</h3>
                        {item.required && (
                          <Badge className="bg-red-100 text-red-800">Required</Badge>
                        )}
                        <Badge className={getCategoryBadgeColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      
                      {item.notes && (
                        <p className="text-gray-600 text-sm mb-2">{item.notes}</p>
                      )}
                      
                      {item.gpt_prompt && (
                        <div className="bg-gray-50 p-2 rounded text-xs mb-2">
                          <strong>AI Prompt:</strong> {item.gpt_prompt.substring(0, 100)}
                          {item.gpt_prompt.length > 100 && '...'}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Evidence: {item.evidence_type}</span>
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>ID: {item.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Item Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Checklist Item' : 'Create New Checklist Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="label">Item Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                placeholder="Enter descriptive label for this checklist item"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="evidence_type">Evidence Type *</Label>
              <Select value={formData.evidence_type} onValueChange={(value) => setFormData({ ...formData, evidence_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  {evidenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
              <Label htmlFor="required">Required Item</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or instructions for inspectors"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="gpt_prompt">AI Analysis Prompt</Label>
              <Textarea
                id="gpt_prompt"
                value={formData.gpt_prompt}
                onChange={(e) => setFormData({ ...formData, gpt_prompt: e.target.value })}
                placeholder="Prompt for AI analysis of photos/videos for this item"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt will be used by AI to analyze evidence captured for this checklist item.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingItem ? 'Update Item' : 'Create Item'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};