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
  ClipboardList,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Link as LinkIcon,
  Download,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { deletePropertyData } from '@/utils/propertyDeletion';
import { toast } from 'sonner';

// Enhanced interface for comprehensive property data
interface PropertyWithStatus {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  vrbo_url?: string;
  airbnb_url?: string;
  created_at: string;
  updated_at: string;
  // Inspection data
  inspection?: {
    id: string;
    status: 'draft' | 'in_progress' | 'completed' | 'pending_review' | 'in_review' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    inspector_id?: string;
    inspector_name?: string;
  };
  // Audit data
  audit?: {
    id: string;
    status: 'pending' | 'in_review' | 'completed';
    auditor_id?: string;
    auditor_name?: string;
    decision?: 'approved' | 'rejected' | 'needs_revision';
    completed_at?: string;
  };
  // Report data
  report?: {
    id: string;
    generated_at: string;
    status: 'generated' | 'delivered' | 'failed';
    file_path?: string;
    download_count: number;
  };
  // Certification status
  certification: {
    status: 'pass' | 'fail' | 'na';
    date?: string;
    expires_at?: string;
  };
}

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  vrbo_url: string;
  airbnb_url: string;
  description: string;
}

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function PropertyManagement() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyWithStatus[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [certificationFilter, setCertificationFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithStatus | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    vrbo_url: '',
    airbnb_url: '',
    description: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, certificationFilter]);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      
      // Load properties with all related data
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          inspections (
            id,
            status,
            created_at,
            updated_at,
            inspector_id,
            profiles!inspections_inspector_id_fkey (
              email,
              name:user_metadata->name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        throw propertiesError;
      }

      // Transform data to include comprehensive status information
      const enrichedProperties: PropertyWithStatus[] = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const latestInspection = property.inspections?.[0];
          
          // Get audit information if inspection exists
          let auditData = null;
          if (latestInspection) {
            const { data: auditInfo } = await supabase
              .from('audit_feedback')
              .select(`
                *,
                profiles!audit_feedback_auditor_id_fkey (
                  email,
                  name:user_metadata->name
                )
              `)
              .eq('inspection_id', latestInspection.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (auditInfo) {
              auditData = {
                id: auditInfo.id,
                status: auditInfo.auditor_decision ? 'completed' : 'pending',
                auditor_id: auditInfo.auditor_id,
                auditor_name: auditInfo.profiles?.name || auditInfo.profiles?.email,
                decision: auditInfo.auditor_decision,
                completed_at: auditInfo.created_at
              };
            }
          }

          // Get report information
          let reportData = null;
          if (latestInspection) {
            const { data: reportInfo } = await supabase
              .from('inspection_reports')
              .select('*')
              .eq('inspection_id', latestInspection.id)
              .order('generated_at', { ascending: false })
              .limit(1)
              .single();

            if (reportInfo) {
              reportData = {
                id: reportInfo.id,
                generated_at: reportInfo.generated_at,
                status: reportInfo.file_path ? 'generated' : 'failed',
                file_path: reportInfo.file_path,
                download_count: reportInfo.download_count || 0
              };
            }
          }

          // Determine certification status
          const certificationStatus = determineCertificationStatus(
            latestInspection?.status,
            auditData?.decision
          );

          return {
            id: property.id,
            name: property.name,
            address: property.address,
            city: property.city,
            state: property.state,
            zip_code: property.zip_code,
            vrbo_url: property.vrbo_url,
            airbnb_url: property.airbnb_url,
            created_at: property.created_at,
            updated_at: property.updated_at,
            inspection: latestInspection ? {
              id: latestInspection.id,
              status: latestInspection.status,
              created_at: latestInspection.created_at,
              updated_at: latestInspection.updated_at,
              inspector_id: latestInspection.inspector_id,
              inspector_name: latestInspection.profiles?.name || latestInspection.profiles?.email
            } : undefined,
            audit: auditData,
            report: reportData,
            certification: certificationStatus
          };
        })
      );

      setProperties(enrichedProperties);
    } catch (error) {
      logger.error('Failed to load properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const determineCertificationStatus = (
    inspectionStatus?: string,
    auditDecision?: string
  ): { status: 'pass' | 'fail' | 'na'; date?: string; expires_at?: string } => {
    if (auditDecision === 'approved') {
      const passDate = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
      return { status: 'pass', date: passDate, expires_at: expiresAt };
    } else if (auditDecision === 'rejected') {
      return { status: 'fail', date: new Date().toISOString() };
    } else {
      return { status: 'na' };
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => {
        if (statusFilter === 'no_inspection') return !property.inspection;
        if (statusFilter === 'in_progress') return property.inspection?.status === 'in_progress';
        if (statusFilter === 'completed') return property.inspection?.status === 'completed';
        if (statusFilter === 'approved') return property.inspection?.status === 'approved';
        if (statusFilter === 'rejected') return property.inspection?.status === 'rejected';
        return true;
      });
    }

    // Certification filter
    if (certificationFilter !== 'all') {
      filtered = filtered.filter(property => property.certification.status === certificationFilter);
    }

    setFilteredProperties(filtered);
  };

  const handleCreateProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Property created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadProperties();
    } catch (error) {
      logger.error('Failed to create property:', error);
      toast.error('Failed to create property');
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update(formData)
        .eq('id', editingProperty.id);

      if (error) throw error;

      toast.success('Property updated successfully');
      setEditingProperty(null);
      resetForm();
      loadProperties();
    } catch (error) {
      logger.error('Failed to update property:', error);
      toast.error('Failed to update property');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      setIsDeleting(propertyId);
      await deletePropertyData(propertyId);
      toast.success('Property deleted successfully');
      loadProperties();
    } catch (error) {
      logger.error('Failed to delete property:', error);
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      vrbo_url: '',
      airbnb_url: '',
      description: ''
    });
  };

  const openEditDialog = (property: PropertyWithStatus) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      vrbo_url: property.vrbo_url || '',
      airbnb_url: property.airbnb_url || '',
      description: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'pending_review': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      'in_review': { color: 'bg-orange-100 text-orange-800', label: 'In Review' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCertificationBadge = (certification: { status: 'pass' | 'fail' | 'na'; date?: string }) => {
    const statusConfig = {
      'pass': { color: 'bg-green-100 text-green-800', label: 'Certified', icon: CheckCircle },
      'fail': { color: 'bg-red-100 text-red-800', label: 'Failed', icon: XCircle },
      'na': { color: 'bg-gray-100 text-gray-800', label: 'N/A', icon: AlertCircle }
    };

    const config = statusConfig[certification.status];
    const Icon = config.icon;

    return (
      <div className="flex items-center space-x-1">
        <Badge className={config.color}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        {certification.date && (
          <span className="text-xs text-gray-500 ml-2">
            {new Date(certification.date).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive property lifecycle management with inspection, audit, and certification tracking
          </p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={loadProperties} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>Create a new property for inspection management</DialogDescription>
              </DialogHeader>
              <PropertyForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateProperty}
                onCancel={() => setIsCreateDialogOpen(false)}
                isEdit={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certified Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {properties.filter(p => p.certification.status === 'pass').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {properties.filter(p => p.inspection?.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {properties.filter(p => p.inspection?.status === 'completed' && !p.audit).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Properties</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, address, or city..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Inspection Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="no_inspection">No Inspection</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Certification Status</Label>
              <Select value={certificationFilter} onValueChange={setCertificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certifications</SelectItem>
                  <SelectItem value="pass">Certified</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                  <SelectItem value="na">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties ({filteredProperties.length})</CardTitle>
          <CardDescription>
            Complete property lifecycle with inspection, audit, and certification tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Inspection Status</TableHead>
                  <TableHead>Audit Status</TableHead>
                  <TableHead>Report Status</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    {/* Property Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-gray-500">
                          {property.address}, {property.city}, {property.state} {property.zip_code}
                        </div>
                        <div className="flex space-x-2">
                          {property.vrbo_url && (
                            <a
                              href={property.vrbo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              VRBO
                            </a>
                          )}
                          {property.airbnb_url && (
                            <a
                              href={property.airbnb_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Airbnb
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Inspection Status */}
                    <TableCell>
                      {property.inspection ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(property.inspection.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/inspections?id=${property.inspection?.id}`)}
                            >
                              <ClipboardList className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.inspection.inspector_name && (
                              <div>Inspector: {property.inspection.inspector_name}</div>
                            )}
                            <div>Updated: {formatDate(property.inspection.updated_at)}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-gray-100 text-gray-800">No Inspection</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/inspections/create?property=${property.id}`)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    {/* Audit Status */}
                    <TableCell>
                      {property.audit ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(property.audit.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/audit?inspection=${property.inspection?.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.audit.auditor_name && (
                              <div>Auditor: {property.audit.auditor_name}</div>
                            )}
                            {property.audit.completed_at && (
                              <div>Completed: {formatDate(property.audit.completed_at)}</div>
                            )}
                          </div>
                        </div>
                      ) : property.inspection?.status === 'completed' ? (
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending Audit</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/audit?inspection=${property.inspection?.id}`)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
                      )}
                    </TableCell>

                    {/* Report Status */}
                    <TableCell>
                      {property.report ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(property.report.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/reports?inspection=${property.inspection?.id}`)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            <div>Generated: {formatDate(property.report.generated_at)}</div>
                            <div>Downloads: {property.report.download_count}</div>
                          </div>
                        </div>
                      ) : property.audit?.status === 'completed' ? (
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">Ready to Generate</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/reports/generate?inspection=${property.inspection?.id}`)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Generate
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
                      )}
                    </TableCell>

                    {/* Certification Status */}
                    <TableCell>
                      {getCertificationBadge(property.certification)}
                    </TableCell>

                    {/* Actions */}
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
                            Edit Property
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={isDeleting === property.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === property.id ? 'Deleting...' : 'Delete Property'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Property Dialog */}
      {editingProperty && (
        <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>Update property information</DialogDescription>
            </DialogHeader>
            <PropertyForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateProperty}
              onCancel={() => setEditingProperty(null)}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Property Form Component
interface PropertyFormProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit: boolean;
}

function PropertyForm({ formData, setFormData, onSubmit, onCancel, isEdit }: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Property Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code *</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vrbo_url">VRBO URL</Label>
          <Input
            id="vrbo_url"
            type="url"
            value={formData.vrbo_url}
            onChange={(e) => setFormData({ ...formData, vrbo_url: e.target.value })}
            placeholder="https://www.vrbo.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="airbnb_url">Airbnb URL</Label>
          <Input
            id="airbnb_url"
            type="url"
            value={formData.airbnb_url}
            onChange={(e) => setFormData({ ...formData, airbnb_url: e.target.value })}
            placeholder="https://www.airbnb.com/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional property information..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
        </Button>
      </DialogFooter>
    </form>
  );
}