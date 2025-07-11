import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import {
  ClipboardList,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Camera,
  FileText,
  Video,
  Activity,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { sanitizeFormInput } from '@/utils/validation';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  evidence_type: string;
  required: boolean;
  deleted: boolean;
  notes?: string;
  gpt_prompt?: string;
  created_at: string;
  updated_at?: string;
  active_date?: string;
  deleted_date?: string;
}

interface ChecklistFormData {
  label: string;
  category: string;
  evidence_type: string;
  required: boolean;
  notes: string;
  gpt_prompt: string;
}

const defaultFormData: ChecklistFormData = {
  label: '',
  category: 'safety',
  evidence_type: 'photo',
  required: false,
  notes: '',
  gpt_prompt: ''
};

const categories = [
  { value: 'safety', label: 'Safety' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'documentation', label: 'Documentation' }
];

const evidenceTypes = [
  { value: 'photo', label: 'Photo', icon: Camera },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'text', label: 'Text Note', icon: FileText },
  { value: 'photo_video', label: 'Photo or Video', icon: Camera }
];

export default function ChecklistManagement() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ChecklistFormData>(defaultFormData);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      
      const { data: itemsData, error } = await supabase
        .from('static_safety_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedItems: ChecklistItem[] = (itemsData || []).map(item => ({
        ...item,
        deleted: item.deleted || false,
        required: item.required || false
      }));

      setItems(enrichedItems);
      logger.info('Loaded checklist items', { count: enrichedItems.length }, 'CHECKLIST_MANAGEMENT');
    } catch (error) {
      logger.error('Failed to load checklist items', error, 'CHECKLIST_MANAGEMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        item.gpt_prompt?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(item => !item.deleted);
    } else if (statusFilter === 'deleted') {
      filtered = filtered.filter(item => item.deleted);
    }

    setFilteredItems(filtered);
  };

  const handleCreateItem = async () => {
    try {
      setIsSubmitting(true);

      // Validate form data
      const sanitizedData = {
        label: sanitizeFormInput(formData.label),
        category: formData.category,
        evidence_type: formData.evidence_type,
        required: formData.required,
        notes: sanitizeFormInput(formData.notes),
        gpt_prompt: sanitizeFormInput(formData.gpt_prompt)
      };

      if (!sanitizedData.label.trim()) {
        throw new Error('Label is required');
      }

      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('static_safety_items')
        .select('id')
        .eq('label', sanitizedData.label)
        .eq('deleted', false)
        .single();

      if (existingItem) {
        throw new Error('A checklist item with this label already exists');
      }

      // Create item
      const { data, error } = await supabase
        .from('static_safety_items')
        .insert({
          ...sanitizedData,
          deleted: false,
          checklist_id: 1, // Default checklist
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Checklist item created successfully', { itemId: data.id, label: data.label }, 'CHECKLIST_MANAGEMENT');
      await loadItems();
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to create checklist item', error, 'CHECKLIST_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to create checklist item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    try {
      if (!editingItem) return;
      
      setIsSubmitting(true);

      const sanitizedData = {
        label: sanitizeFormInput(formData.label),
        category: formData.category,
        evidence_type: formData.evidence_type,
        required: formData.required,
        notes: sanitizeFormInput(formData.notes),
        gpt_prompt: sanitizeFormInput(formData.gpt_prompt),
        updated_at: new Date().toISOString()
      };

      if (!sanitizedData.label.trim()) {
        throw new Error('Label is required');
      }

      const { error } = await supabase
        .from('static_safety_items')
        .update(sanitizedData)
        .eq('id', editingItem.id);

      if (error) throw error;

      logger.info('Checklist item updated successfully', { itemId: editingItem.id }, 'CHECKLIST_MANAGEMENT');
      await loadItems();
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to update checklist item', error, 'CHECKLIST_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to update checklist item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: ChecklistItem) => {
    if (!confirm(`Are you sure you want to delete "${item.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('static_safety_items')
        .update({
          deleted: true,
          deleted_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      logger.info('Checklist item deleted successfully', { itemId: item.id }, 'CHECKLIST_MANAGEMENT');
      await loadItems();
    } catch (error) {
      logger.error('Failed to delete checklist item', error, 'CHECKLIST_MANAGEMENT');
      alert('Failed to delete checklist item. It may be in use by active inspections.');
    }
  };

  const handleRestoreItem = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('static_safety_items')
        .update({
          deleted: false,
          deleted_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      logger.info('Checklist item restored successfully', { itemId: item.id }, 'CHECKLIST_MANAGEMENT');
      await loadItems();
    } catch (error) {
      logger.error('Failed to restore checklist item', error, 'CHECKLIST_MANAGEMENT');
      alert('Failed to restore checklist item.');
    }
  };

  const openEditDialog = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      category: item.category,
      evidence_type: item.evidence_type,
      required: item.required,
      notes: item.notes || '',
      gpt_prompt: item.gpt_prompt || ''
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      safety: { class: 'bg-red-100 text-red-800', icon: Shield },
      amenities: { class: 'bg-blue-100 text-blue-800', icon: Activity },
      cleanliness: { class: 'bg-green-100 text-green-800', icon: Check },
      maintenance: { class: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      compliance: { class: 'bg-purple-100 text-purple-800', icon: FileText },
      documentation: { class: 'bg-gray-100 text-gray-800', icon: FileText }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.documentation;
    const Icon = config.icon;
    
    return (
      <Badge variant="default" className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getEvidenceBadge = (evidenceType: string) => {
    const config = evidenceTypes.find(t => t.value === evidenceType) || evidenceTypes[0];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (item: ChecklistItem) => {
    if (item.deleted) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Checklist Management</h1>
          <p className="text-gray-600">
            Manage inspection checklist templates and requirements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Checklist Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Checklist Item</DialogTitle>
              <DialogDescription>
                Create a new checklist item template for inspections.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Item Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Check smoke detector functionality"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="evidence_type">Evidence Type</Label>
                  <Select 
                    value={formData.evidence_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, evidence_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="required">Required for inspection completion</Label>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional instructions or context for inspectors"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="gpt_prompt">AI Prompt (Optional)</Label>
                <Textarea
                  id="gpt_prompt"
                  placeholder="Custom AI analysis prompt for this checklist item"
                  value={formData.gpt_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, gpt_prompt: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{items.filter(i => !i.deleted).length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {items.filter(i => i.category === 'safety' && !i.deleted).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Required Items</p>
                <p className="text-2xl font-bold text-orange-600">
                  {items.filter(i => i.required && !i.deleted).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(items.filter(i => !i.deleted).map(i => i.category)).size}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
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
                  placeholder="Search checklist items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Items</SelectItem>
                <SelectItem value="deleted">Deleted Items</SelectItem>
                <SelectItem value="all">All Items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.notes && (
                        <div className="text-sm text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(item.category)}</TableCell>
                  <TableCell>{getEvidenceBadge(item.evidence_type)}</TableCell>
                  <TableCell>
                    {item.required ? (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.deleted ? (
                          <DropdownMenuItem 
                            onClick={() => handleRestoreItem(item)}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No checklist items found</p>
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'active' ? (
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first checklist item
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
            <DialogDescription>
              Update checklist item information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_label">Item Label</Label>
              <Input
                id="edit_label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_evidence_type">Evidence Type</Label>
                <Select 
                  value={formData.evidence_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, evidence_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {evidenceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
              />
              <Label htmlFor="edit_required">Required for inspection completion</Label>
            </div>
            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit_gpt_prompt">AI Prompt</Label>
              <Textarea
                id="edit_gpt_prompt"
                value={formData.gpt_prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, gpt_prompt: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}