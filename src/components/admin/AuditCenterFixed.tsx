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
import { 
  Shield, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react';

interface AuditItem {
  id: string;
  inspection_id: string;
  property_name: string;
  inspector_name: string;
  checklist_item: string;
  ai_status: 'pass' | 'fail' | 'needs_review';
  ai_confidence: number;
  auditor_status?: 'approved' | 'rejected' | 'pending';
  created_at: string;
  updated_at: string;
}

const mockAuditItems: AuditItem[] = [
  {
    id: '1',
    inspection_id: 'INS-001',
    property_name: 'Mountain View Cabin',
    inspector_name: 'John Inspector',
    checklist_item: 'Kitchen Cleanliness',
    ai_status: 'pass',
    ai_confidence: 0.95,
    auditor_status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    inspection_id: 'INS-002',
    property_name: 'Beachfront Villa',
    inspector_name: 'Jane Inspector',
    checklist_item: 'Safety Equipment',
    ai_status: 'fail',
    ai_confidence: 0.87,
    auditor_status: 'pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    inspection_id: 'INS-003',
    property_name: 'City Apartment',
    inspector_name: 'Bob Inspector',
    checklist_item: 'Bathroom Amenities',
    ai_status: 'needs_review',
    ai_confidence: 0.72,
    auditor_status: 'pending',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '4',
    inspection_id: 'INS-004',
    property_name: 'Lakeside Cottage',
    inspector_name: 'Alice Inspector',
    checklist_item: 'WiFi Information',
    ai_status: 'pass',
    ai_confidence: 0.91,
    auditor_status: 'approved',
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: '5',
    inspection_id: 'INS-005',
    property_name: 'Downtown Loft',
    inspector_name: 'Charlie Inspector',
    checklist_item: 'Property Walkthrough Video',
    ai_status: 'fail',
    ai_confidence: 0.66,
    auditor_status: 'rejected',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export default function AuditCenterFixed() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setItems(mockAuditItems);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.inspector_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.checklist_item.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || item.auditor_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getAIStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'needs_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAuditorStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAuditDecision = (itemId: string, decision: 'approved' | 'rejected') => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, auditor_status: decision, updated_at: new Date().toISOString() }
          : item
      )
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Center</h1>
            <p className="text-gray-600 mt-1">Loading audit items...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Audit Center</h1>
          <p className="text-gray-600 mt-1">Review and approve AI-generated inspection results</p>
        </div>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Audit Settings
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
            <CardTitle className="text-base">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(i => i.auditor_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(i => i.auditor_status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(items.reduce((sum, item) => sum + item.ai_confidence, 0) / items.length * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Audit Queue</span>
          </CardTitle>
          <CardDescription>
            Review AI-generated inspection results and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inspections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Audit Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspection</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Checklist Item</TableHead>
                  <TableHead>AI Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Auditor Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.property_name}</div>
                        <div className="text-sm text-gray-500">{item.inspection_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.inspector_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.checklist_item}</div>
                    </TableCell>
                    <TableCell>
                      {getAIStatusBadge(item.ai_status)}
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${getConfidenceColor(item.ai_confidence)}`}>
                        {Math.round(item.ai_confidence * 100)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAuditorStatusBadge(item.auditor_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        {item.auditor_status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAuditDecision(item.id, 'approved')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAuditDecision(item.id, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit items found matching your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Component Working!</strong> Audit center is now displaying correctly with mock data.
        </AlertDescription>
      </Alert>
    </div>
  );
}