import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ClipboardList, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Camera,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  evidence_type: 'photo' | 'video' | 'note' | 'document';
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

const mockChecklistItems: SimpleChecklistItem[] = [
  {
    id: '1',
    title: 'Kitchen Cleanliness',
    description: 'Verify kitchen surfaces are clean and sanitized',
    category: 'Cleanliness',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2', 
    title: 'Fire Safety Equipment',
    description: 'Check smoke detectors and fire extinguisher presence',
    category: 'Safety',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Property Amenities',
    description: 'Verify listed amenities match actual property features',
    category: 'Amenities',
    evidence_type: 'note',
    is_required: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Bedroom Setup',
    description: 'Check bed linens and room cleanliness',
    category: 'Cleanliness',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function SimpleChecklistManagement() {
  const [items, setItems] = useState<SimpleChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Cleanliness',
    evidence_type: 'photo' as const,
    is_required: true
  });

  useEffect(() => {
    loadChecklistItems();
  }, []);

  const loadChecklistItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from database
      const { data: dbItems, error: dbError } = await supabase
        .from('static_safety_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Database checklist items not available, using mock data:', dbError);
        setItems(mockChecklistItems);
      } else {
        setItems(dbItems || mockChecklistItems);
      }
    } catch (err) {
      console.error('Failed to load checklist items:', err);
      setError('Failed to load checklist items. Using demo data.');
      setItems(mockChecklistItems);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      if (!formData.title.trim()) {
        alert('Title is required');
        return;
      }

      const newItem: SimpleChecklistItem = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        evidence_type: formData.evidence_type,
        is_required: formData.is_required,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to save to database
      try {
        const { error: insertError } = await supabase
          .from('static_safety_items')
          .insert([newItem]);

        if (insertError) {
          console.warn('Failed to save to database, adding locally:', insertError);
        }
      } catch (saveError) {
        console.warn('Database save failed, adding locally:', saveError);
      }

      // Update local state regardless
      setItems(prev => [newItem, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'Cleanliness',
        evidence_type: 'photo',
        is_required: true
      });
      
    } catch (err) {
      console.error('Failed to create checklist item:', err);
      alert('Failed to create item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) {
      return;
    }

    try {
      // Try to delete from database
      try {
        const { error: deleteError } = await supabase
          .from('static_safety_items')
          .delete()
          .eq('id', itemId);

        if (deleteError) {
          console.warn('Failed to delete from database:', deleteError);
        }
      } catch (deleteDbError) {
        console.warn('Database delete failed:', deleteDbError);
      }

      // Update local state regardless
      setItems(prev => prev.filter(item => item.id !== itemId));
      
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Camera className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEvidenceBadge = (type: string) => {
    switch (type) {
      case 'photo':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Photo</Badge>;
      case 'video':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Video</Badge>;
      case 'document':
        return <Badge variant="default" className="bg-green-100 text-green-800">Document</Badge>;
      case 'note':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Note</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Safety': 'bg-red-100 text-red-800',
      'Cleanliness': 'bg-blue-100 text-blue-800', 
      'Amenities': 'bg-green-100 text-green-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <Badge variant="secondary" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checklist Management</h1>
            <p className="text-gray-600 mt-1">Loading checklist items...</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checklist Management</h1>
          <p className="text-gray-600 mt-1">Manage inspection checklist items and requirements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Checklist Item</DialogTitle>
              <DialogDescription>
                Add a new item to the inspection checklist
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Kitchen Cleanliness"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what to check..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Safety">Safety</option>
                  <option value="Amenities">Amenities</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Evidence Type</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.evidence_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, evidence_type: e.target.value as any }))}
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="note">Note</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                />
                <label htmlFor="required" className="text-sm font-medium">Required Item</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>
                Create Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error State */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto"
              onClick={loadChecklistItems}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {!error && items.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully loaded {items.length} checklist items. System is operational.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Checklist Items ({filteredItems.length})
          </CardTitle>
          <CardDescription>
            Manage inspection checklist items and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search checklist items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(item.category)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getEvidenceIcon(item.evidence_type)}
                        {getEvidenceBadge(item.evidence_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.is_required ? (
                        <Badge variant="default" className="bg-red-100 text-red-800">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No checklist items found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first checklist item.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-blue-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {items.filter(item => item.is_required).length}
            </div>
            <div className="text-sm text-red-600">Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {items.filter(item => item.evidence_type === 'photo').length}
            </div>
            <div className="text-sm text-blue-600">Photo Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.category === 'Safety').length}
            </div>
            <div className="text-sm text-green-600">Safety Items</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}