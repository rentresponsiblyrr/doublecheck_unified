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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Search,
  Filter,
  Clock,
  Camera,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Zap,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuditItem {
  id: string;
  inspection_id: string;
  checklist_item_id: string;
  property_name: string;
  inspector_name: string;
  ai_prediction: 'pass' | 'fail' | 'needs_review';
  ai_confidence: number;
  ai_reasoning: string;
  inspector_status: 'completed' | 'failed' | 'not_applicable';
  inspector_notes: string;
  photos: string[];
  reference_photos: string[];
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  auditor_feedback?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AuditStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  accuracy: number;
  avgConfidence: number;
}

export default function AuditCenter() {
  const navigate = useNavigate();
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    accuracy: 0,
    avgConfidence: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAuditIndex, setCurrentAuditIndex] = useState(0);

  useEffect(() => {
    loadAuditItems();
    loadAuditStats();
  }, [filterStatus, filterPriority, searchTerm]);

  const loadAuditItems = async () => {
    try {
      setIsLoading(true);
      
      // Build query
      let query = supabase
        .from('checklist_items')
        .select(`
          id,
          inspection_id,
          title,
          ai_status,
          ai_confidence,
          ai_reasoning,
          status,
          notes,
          inspections (
            id,
            properties (name),
            users (name, email)
          )
        `)
        .not('ai_status', 'is', null);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // For now, we'll use mock data since the audit_feedback table might not exist yet
      const mockAuditItems: AuditItem[] = [
        {
          id: '1',
          inspection_id: 'insp-1',
          checklist_item_id: 'item-1',
          property_name: 'Ocean View Villa',
          inspector_name: 'John Smith',
          ai_prediction: 'pass',
          ai_confidence: 85,
          ai_reasoning: 'Kitchen appears clean and well-maintained based on visual analysis.',
          inspector_status: 'completed',
          inspector_notes: 'Kitchen is spotless, appliances working properly.',
          photos: ['/api/placeholder/400/300'],
          reference_photos: ['/api/placeholder/400/300'],
          created_at: new Date().toISOString(),
          status: 'pending',
          priority: 'medium'
        },
        {
          id: '2',
          inspection_id: 'insp-2',
          checklist_item_id: 'item-2',
          property_name: 'Mountain Cabin',
          inspector_name: 'Sarah Johnson',
          ai_prediction: 'fail',
          ai_confidence: 92,
          ai_reasoning: 'Detected water damage on ceiling, requires attention.',
          inspector_status: 'failed',
          inspector_notes: 'Confirmed water damage from recent leak.',
          photos: ['/api/placeholder/400/300'],
          reference_photos: ['/api/placeholder/400/300'],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          priority: 'high'
        },
        {
          id: '3',
          inspection_id: 'insp-3',
          checklist_item_id: 'item-3',
          property_name: 'City Apartment',
          inspector_name: 'Mike Wilson',
          ai_prediction: 'needs_review',
          ai_confidence: 65,
          ai_reasoning: 'Unclear image quality, manual review recommended.',
          inspector_status: 'completed',
          inspector_notes: 'Bathroom fixtures are in good condition.',
          photos: ['/api/placeholder/400/300'],
          reference_photos: ['/api/placeholder/400/300'],
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'pending',
          priority: 'low'
        }
      ];

      // Filter items based on current filters
      let filteredItems = mockAuditItems;
      
      if (filterStatus !== 'all') {
        filteredItems = filteredItems.filter(item => item.status === filterStatus);
      }
      
      if (filterPriority !== 'all') {
        filteredItems = filteredItems.filter(item => item.priority === filterPriority);
      }
      
      if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
          item.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.inspector_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setAuditItems(filteredItems);

    } catch (error) {
      logger.error('Failed to load audit items', error, 'AUDIT_CENTER');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      // Mock stats for now
      setStats({
        total: 156,
        pending: 23,
        approved: 98,
        rejected: 35,
        accuracy: 89.5,
        avgConfidence: 82.3
      });
    } catch (error) {
      logger.error('Failed to load audit stats', error, 'AUDIT_CENTER');
    }
  };

  const handleAuditDecision = async (decision: 'approve' | 'reject', feedback?: string) => {
    if (!selectedItem) return;

    try {
      // Update the audit item with decision
      const updatedItem = {
        ...selectedItem,
        status: decision === 'approve' ? 'approved' : 'rejected' as const,
        auditor_feedback: feedback
      };

      // Update local state
      setAuditItems(items => 
        items.map(item => 
          item.id === selectedItem.id ? updatedItem : item
        )
      );

      // Move to next item or close
      const nextIndex = currentAuditIndex + 1;
      if (nextIndex < auditItems.length) {
        setCurrentAuditIndex(nextIndex);
        setSelectedItem(auditItems[nextIndex]);
      } else {
        setSelectedItem(null);
        setCurrentAuditIndex(0);
      }

      // Reload stats
      await loadAuditStats();

    } catch (error) {
      logger.error('Failed to save audit decision', error, 'AUDIT_CENTER');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAIPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'needs_review': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Center</h1>
          <p className="text-gray-600">
            Review AI predictions and inspector assessments for quality assurance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Brain className="h-4 w-4 mr-2" />
            Refresh Queue
          </Button>
          <Button onClick={() => navigate('/performance')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Performance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.accuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.avgConfidence}%</p>
              </div>
              <Zap className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by property or inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items Awaiting Review</CardTitle>
          <CardDescription>
            Click on any item to start the detailed audit process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>AI Prediction</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Inspector Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditItems.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.property_name}</TableCell>
                  <TableCell>{item.inspector_name}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getAIPredictionColor(item.ai_prediction)}`}>
                      {item.ai_prediction.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.ai_confidence}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.ai_confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.inspector_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setCurrentAuditIndex(index);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {auditItems.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No items match your current filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Audit Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Audit Review: {selectedItem.property_name}</span>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Item {currentAuditIndex + 1} of {auditItems.length}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentAuditIndex === 0}
                      onClick={() => {
                        const prevIndex = currentAuditIndex - 1;
                        setCurrentAuditIndex(prevIndex);
                        setSelectedItem(auditItems[prevIndex]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentAuditIndex === auditItems.length - 1}
                      onClick={() => {
                        const nextIndex = currentAuditIndex + 1;
                        setCurrentAuditIndex(nextIndex);
                        setSelectedItem(auditItems[nextIndex]);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Review the AI analysis and inspector assessment to make your final decision
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comparison">Photo Comparison</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="inspector">Inspector Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="comparison" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Inspector Photo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img 
                          src={selectedItem.photos[0]} 
                          alt="Inspector photo"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Reference Photo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img 
                          src={selectedItem.reference_photos[0]} 
                          alt="Reference photo"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Prediction
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Result:</span>
                          <Badge className={getAIPredictionColor(selectedItem.ai_prediction)}>
                            {selectedItem.ai_prediction.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Confidence:</span>
                          <span className="font-bold">{selectedItem.ai_confidence}%</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Reasoning:</span>
                          <p className="text-sm text-gray-600 mt-1">{selectedItem.ai_reasoning}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Confidence Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Confidence</span>
                              <span>{selectedItem.ai_confidence}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${selectedItem.ai_confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="inspector" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Inspector Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Inspector:</Label>
                          <p className="text-sm text-gray-600">{selectedItem.inspector_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status:</Label>
                          <Badge variant="outline" className="ml-2">
                            {selectedItem.inspector_status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Notes:</Label>
                        <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                          {selectedItem.inspector_notes || 'No notes provided'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleAuditDecision('approve')}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleAuditDecision('reject')}
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}