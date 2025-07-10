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
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { sanitizeFormInput, validateURL } from '@/utils/validation';

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  added_by: string;
  inspections?: Array<{
    id: string;
    status: string;
    created_at: string;
  }>;
  users?: {
    name: string;
    email: string;
  };
}

interface PropertyFormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
  status: 'active' | 'inactive' | 'pending';
}

const defaultFormData: PropertyFormData = {
  name: '',
  address: '',
  vrbo_url: '',
  airbnb_url: '',
  status: 'active'
};

export default function PropertyManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>(defaultFormData);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery, statusFilter]);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          vrbo_url,
          airbnb_url,
          status,
          created_at,
          updated_at,
          added_by,
          users!properties_added_by_fkey(name, email),
          inspections(id, status, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProperties(data || []);
      logger.info('Loaded properties', { count: data?.length }, 'PROPERTY_MANAGEMENT');
    } catch (error) {
      logger.error('Failed to load properties', error, 'PROPERTY_MANAGEMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.vrbo_url?.toLowerCase().includes(query) ||
        property.airbnb_url?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const handleCreateProperty = async () => {
    try {
      setIsSubmitting(true);

      // Validate form data
      const sanitizedData = {
        name: sanitizeFormInput(formData.name),
        address: sanitizeFormInput(formData.address),
        vrbo_url: formData.vrbo_url.trim() || null,
        airbnb_url: formData.airbnb_url.trim() || null,
        status: formData.status
      };

      if (!sanitizedData.name || !sanitizedData.address) {
        throw new Error('Name and address are required');
      }

      if (sanitizedData.vrbo_url && !validateURL(sanitizedData.vrbo_url)) {
        throw new Error('Please enter a valid VRBO URL');
      }

      if (sanitizedData.airbnb_url && !validateURL(sanitizedData.airbnb_url)) {
        throw new Error('Please enter a valid Airbnb URL');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...sanitizedData,
          added_by: user.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Property created successfully', { propertyId: data.id }, 'PROPERTY_MANAGEMENT');
      await loadProperties();
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to create property', error, 'PROPERTY_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProperty = async () => {
    try {
      if (!editingProperty) return;
      
      setIsSubmitting(true);

      const sanitizedData = {
        name: sanitizeFormInput(formData.name),
        address: sanitizeFormInput(formData.address),
        vrbo_url: formData.vrbo_url.trim() || null,
        airbnb_url: formData.airbnb_url.trim() || null,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      if (!sanitizedData.name || !sanitizedData.address) {
        throw new Error('Name and address are required');
      }

      const { error } = await supabase
        .from('properties')
        .update(sanitizedData)
        .eq('id', editingProperty.id);

      if (error) throw error;

      logger.info('Property updated successfully', { propertyId: editingProperty.id }, 'PROPERTY_MANAGEMENT');
      await loadProperties();
      setIsEditDialogOpen(false);
      setEditingProperty(null);
      setFormData(defaultFormData);
    } catch (error) {
      logger.error('Failed to update property', error, 'PROPERTY_MANAGEMENT');
      alert(error instanceof Error ? error.message : 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    if (!confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;

      logger.info('Property deleted successfully', { propertyId: property.id }, 'PROPERTY_MANAGEMENT');
      await loadProperties();
    } catch (error) {
      logger.error('Failed to delete property', error, 'PROPERTY_MANAGEMENT');
      alert('Failed to delete property. It may have associated inspections.');
    }
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      vrbo_url: property.vrbo_url || '',
      airbnb_url: property.airbnb_url || '',
      status: property.status as any
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInspectionStatus = (inspections?: Array<{status: string}>) => {
    if (!inspections || inspections.length === 0) {
      return { icon: <XCircle className="h-4 w-4 text-gray-400" />, text: 'No inspections', color: 'text-gray-500' };
    }

    const latest = inspections[0];
    switch (latest.status) {
      case 'completed':
      case 'approved':
        return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Completed', color: 'text-green-600' };
      case 'in_progress':
        return { icon: <Clock className="h-4 w-4 text-blue-500" />, text: 'In Progress', color: 'text-blue-600' };
      case 'pending_review':
        return { icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, text: 'Pending Review', color: 'text-yellow-600' };
      default:
        return { icon: <Clock className="h-4 w-4 text-gray-400" />, text: latest.status, color: 'text-gray-600' };
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600">
            Manage vacation rental properties and track their inspection status
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Create a new property listing for inspection management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  placeholder="Beautiful Mountain Cabin"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Mountain View Drive, Aspen, CO 81611"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="vrbo_url">VRBO URL (Optional)</Label>
                <Input
                  id="vrbo_url"
                  placeholder="https://www.vrbo.com/123456"
                  value={formData.vrbo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, vrbo_url: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="airbnb_url">Airbnb URL (Optional)</Label>
                <Input
                  id="airbnb_url"
                  placeholder="https://www.airbnb.com/rooms/123456"
                  value={formData.airbnb_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, airbnb_url: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProperty} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Property'}
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
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Inspections</p>
                <p className="text-2xl font-bold text-blue-600">
                  {properties.filter(p => p.inspections && p.inspections.length > 0).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => 
                    p.inspections?.some(i => i.status === 'pending_review')
                  ).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
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
                  placeholder="Search properties by name, address, or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspection Status</TableHead>
                <TableHead>Listings</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => {
                const inspectionStatus = getInspectionStatus(property.inspections);
                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {property.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center space-x-2 ${inspectionStatus.color}`}>
                        {inspectionStatus.icon}
                        <span className="text-sm">{inspectionStatus.text}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {property.vrbo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(property.vrbo_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            VRBO
                          </Button>
                        )}
                        {property.airbnb_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(property.airbnb_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Airbnb
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{property.users?.name || 'Unknown'}</div>
                        <div className="text-gray-500">{property.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(property.created_at).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => openEditDialog(property)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProperty(property)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredProperties.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No properties found</p>
              {searchQuery || statusFilter !== 'all' ? (
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first property
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Property Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_vrbo_url">VRBO URL</Label>
              <Input
                id="edit_vrbo_url"
                value={formData.vrbo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, vrbo_url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_airbnb_url">Airbnb URL</Label>
              <Input
                id="edit_airbnb_url"
                value={formData.airbnb_url}
                onChange={(e) => setFormData(prev => ({ ...prev, airbnb_url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProperty} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}