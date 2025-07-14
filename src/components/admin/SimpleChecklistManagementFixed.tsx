import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Plus, Search, Edit, Trash2, CheckCircle, Camera, FileText } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  evidence_type: 'photo' | 'video' | 'note' | 'document';
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

const mockChecklistItems: ChecklistItem[] = [
  {
    id: '1',
    title: 'Kitchen Cleanliness',
    description: 'Verify kitchen surfaces, appliances, and sink are clean and sanitized',
    category: 'Cleanliness',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Bathroom Amenities',
    description: 'Check that towels, toiletries, and toilet paper are provided',
    category: 'Amenities',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: '3',
    title: 'Safety Equipment',
    description: 'Ensure smoke detectors, fire extinguisher, and first aid kit are present',
    category: 'Safety',
    evidence_type: 'photo',
    is_required: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '4',
    title: 'WiFi Information',
    description: 'Verify WiFi credentials are provided and connection works',
    category: 'Technology',
    evidence_type: 'note',
    is_required: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 129600000).toISOString()
  },
  {
    id: '5',
    title: 'Property Walkthrough Video',
    description: 'Record a comprehensive walkthrough of all rooms and amenities',
    category: 'Documentation',
    evidence_type: 'video',
    is_required: true,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export default function SimpleChecklistManagementFixed() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setItems(mockChecklistItems);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Cleanliness':
        return <Badge className="bg-green-100 text-green-800">Cleanliness</Badge>;
      case 'Safety':
        return <Badge className="bg-red-100 text-red-800">Safety</Badge>;
      case 'Amenities':
        return <Badge className="bg-blue-100 text-blue-800">Amenities</Badge>;
      case 'Technology':
        return <Badge className="bg-purple-100 text-purple-800">Technology</Badge>;
      case 'Documentation':
        return <Badge className="bg-yellow-100 text-yellow-800">Documentation</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Camera className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const categories = [...new Set(items.map(item => item.category))];

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Required Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {items.filter(i => i.is_required).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Photo Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {items.filter(i => i.evidence_type === 'photo').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {categories.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>Checklist Items</span>
          </CardTitle>
          <CardDescription>
            Manage inspection checklist items and evidence requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search checklist items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Evidence Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500 truncate">{item.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(item.category)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getEvidenceIcon(item.evidence_type)}
                        <span className="capitalize">{item.evidence_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.is_required ? (
                        <Badge className="bg-red-100 text-red-800">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(item.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
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
              <p className="text-gray-600">No checklist items found matching your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Component Working!</strong> Checklist management is now displaying correctly with mock data.
        </AlertDescription>
      </Alert>
    </div>
  );
}