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
  TrendingUp,
  MapPin,
  User,
  Calendar,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface CompletedInspection {
  id: string;
  property_id: string;
  inspector_id: string;
  start_time: string;
  end_time: string;
  status: string;
  property: {
    id: string;
    name: string;
    address: string;
  };
  inspector: {
    id: string;
    name: string;
    email: string;
  };
  total_items: number;
  completed_items: number;
  ai_evaluated_items: number;
}

interface ChecklistItemForAudit {
  id: string;
  title: string;
  category: string;
  ai_status: 'pass' | 'fail' | 'needs_review' | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  status: 'completed' | 'failed' | 'not_applicable' | 'pending';
  notes: string | null;
  auditor_override: boolean;
  auditor_notes: string | null;
  photos: any[];
  reference_photos: any[];
}

interface AuditStats {
  total_inspections: number;
  pending_audit: number;
  audited: number;
  ai_accuracy: number;
  avg_confidence: number;
}

export default function AuditCenter() {
  console.log('🔍 AuditCenter component rendering...');
  
  const navigate = useNavigate();
  const [completedInspections, setCompletedInspections] = useState<CompletedInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<CompletedInspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemForAudit[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total_inspections: 0,
    pending_audit: 0,
    audited: 0,
    ai_accuracy: 0,
    avg_confidence: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [criticalError, setCriticalError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    console.log('🔍 AuditCenter useEffect triggered...');
    initializeAuditCenter();
  }, [searchTerm]);

  const initializeAuditCenter = async () => {
    try {
      // First, run a schema diagnostic
      await runSchemaDiagnostic();
      
      // Then load data
      await Promise.all([
        loadCompletedInspections(),
        loadAuditStats()
      ]);
    } catch (error) {
      console.error('❌ Failed to initialize audit center:', error);
      setCriticalError(error);
    }
  };

  const runSchemaDiagnostic = async () => {
    console.log('🔍 Running schema diagnostic...');
    
    try {
      // Test basic table access
      const tables = ['inspections', 'properties', 'checklist_items'];
      const diagnostics: any = {};

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          diagnostics[table] = {
            accessible: !error,
            error: error?.message,
            hasData: (data?.length || 0) > 0
          };
        } catch (err) {
          diagnostics[table] = {
            accessible: false,
            error: err.message,
            hasData: false
          };
        }
      }

      // Test profiles/users tables
      try {
        const { error: profilesError } = await supabase
          .from('users')
          .select('id, name, email')
          .limit(1);
        
        diagnostics.users = {
          accessible: !profilesError,
          error: profilesError?.message
        };
      } catch (err) {
        diagnostics.users = {
          accessible: false,
          error: err.message
        };
      }

      // Test profiles table as fallback
      try {
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .limit(1);
        
        diagnostics.profiles = {
          accessible: !profilesError,
          error: profilesError?.message
        };
      } catch (err) {
        diagnostics.profiles = {
          accessible: false,
          error: err.message
        };
      }

      console.log('📊 Schema diagnostic results:', diagnostics);
      
      // Check for critical issues
      if (!diagnostics.inspections?.accessible) {
        throw new Error(`Cannot access inspections table: ${diagnostics.inspections?.error}`);
      }
      
      if (!diagnostics.properties?.accessible) {
        throw new Error(`Cannot access properties table: ${diagnostics.properties?.error}`);
      }

      console.log('✅ Schema diagnostic passed');
      
    } catch (error) {
      console.error('❌ Schema diagnostic failed:', error);
      throw new Error(`Database schema issue: ${error.message}`);
    }
  };

  useEffect(() => {
    if (selectedInspection) {
      loadChecklistItems(selectedInspection.id);
    }
  }, [selectedInspection]);

  const loadCompletedInspections = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading completed inspections...');
      
      // Check authentication status first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('🔐 Auth session:', session ? 'Authenticated' : 'Not authenticated');
      
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!session) {
        console.warn('No active session found');
        throw new Error('Please log in to access audit features');
      }
      
      // First, try the optimized query with users
      let inspections: any[] = [];
      let inspectionsError: any = null;

      try {
        const result = await supabase
          .from('inspections')
          .select(`
            id,
            property_id,
            inspector_id,
            start_time,
            end_time,
            status,
            properties!inner (
              id,
              name,
              address
            ),
            users!inspector_id (
              id,
              name,
              email
            )
          `)
          .eq('status', 'completed')
          .order('end_time', { ascending: false });

        inspections = result.data || [];
        inspectionsError = result.error;
        
        if (inspectionsError) {
          console.warn('📊 Users join failed, trying fallback approach:', inspectionsError);
          throw inspectionsError;
        }
        
        console.log('✅ Successfully loaded inspections with users:', inspections.length);
        
      } catch (usersError) {
        console.log('🔄 Falling back to basic inspection query...');
        
        // Fallback: Get inspections without users join
        const basicResult = await supabase
          .from('inspections')
          .select(`
            id,
            property_id,
            inspector_id,
            start_time,
            end_time,
            status,
            properties!inner (
              id,
              name,
              address
            )
          `)
          .eq('status', 'completed')
          .order('end_time', { ascending: false });

        if (basicResult.error) {
          console.error('❌ Even basic query failed:', basicResult.error);
          throw basicResult.error;
        }

        inspections = basicResult.data || [];
        console.log('✅ Fallback query successful:', inspections.length);

        // Manually fetch user data for each inspection
        if (inspections.length > 0) {
          console.log('🔄 Manually fetching user data...');
          const inspectorIds = [...new Set(inspections.map(i => i.inspector_id))];
          
          // Try users table
          let usersData: any[] = [];
          try {
            const usersResult = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', inspectorIds);
            
            if (!usersResult.error && usersResult.data) {
              usersData = usersResult.data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email
              }));
              console.log('✅ Fetched from users table:', usersData.length);
            } else {
              console.warn('👥 Users table query failed:', usersResult.error);
            }
          } catch (usersErr) {
            console.warn('👥 Users table not available');
          }

          // Attach user data to inspections
          inspections = inspections.map(inspection => ({
            ...inspection,
            users: usersData.find(u => u.id === inspection.inspector_id) || {
              id: inspection.inspector_id,
              name: `Inspector ${inspection.inspector_id.slice(0, 8)}`,
              email: 'unknown@example.com'
            }
          }));
        }
      }

      if (inspections.length === 0) {
        console.log('⚠️ No completed inspections found');
        setCompletedInspections([]);
        return;
      }

      // Transform and enrich the data with robust error handling
      const enrichedInspections = await Promise.all(
        (inspections || []).map(async (inspection) => {
          let totalItems = 0;
          let completedItems = 0;
          let aiEvaluatedItems = 0;

          try {
            // Get checklist items count with retries
            const { data: checklistData, error: checklistError } = await supabase
              .from('inspection_checklist_items')
              .select('id, status, ai_status')
              .eq('inspection_id', inspection.id);

            if (checklistError) {
              console.warn(`⚠️ Failed to load checklist for inspection ${inspection.id}:`, checklistError);
            } else if (checklistData) {
              totalItems = checklistData.length;
              completedItems = checklistData.filter(item => 
                item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable'
              ).length;
              aiEvaluatedItems = checklistData.filter(item => item.ai_status !== null).length;
            }
          } catch (checklistErr) {
            console.warn(`⚠️ Exception loading checklist for inspection ${inspection.id}:`, checklistErr);
          }

          // Safe property access with fallbacks
          const property = inspection.properties || {};
          const user = inspection.users || {};

          return {
            id: inspection.id,
            property_id: inspection.property_id,
            inspector_id: inspection.inspector_id,
            start_time: inspection.start_time,
            end_time: inspection.end_time || inspection.start_time, // Fallback if end_time is null
            status: inspection.status,
            property: {
              id: property.id || inspection.property_id,
              name: property.name || `Property ${inspection.property_id?.slice(0, 8) || 'Unknown'}`,
              address: property.address || 'Address not available'
            },
            inspector: {
              id: user.id || inspection.inspector_id,
              name: user.name || `Inspector ${inspection.inspector_id?.slice(0, 8) || 'Unknown'}`,
              email: user.email || 'email@unknown.com'
            },
            total_items: totalItems,
            completed_items: completedItems,
            ai_evaluated_items: aiEvaluatedItems
          } as CompletedInspection;
        })
      );

      // Filter by search term
      let filteredInspections = enrichedInspections;
      if (searchTerm) {
        filteredInspections = enrichedInspections.filter(inspection =>
          inspection.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.inspector.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setCompletedInspections(filteredInspections);

    } catch (error) {
      console.error('❌ Critical failure loading completed inspections:', error);
      logger.error('Failed to load completed inspections', error, 'AUDIT_CENTER');
      setCriticalError(error);
      setCompletedInspections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChecklistItems = async (inspectionId: string) => {
    try {
      console.log(`🔍 Loading checklist items for inspection: ${inspectionId}`);
      
      // First, check if the required columns exist by trying a simple query
      let items: any[] = [];
      let error: any = null;

      try {
        // Try full query with all columns including auditor fields
        const fullResult = await supabase
          .from('inspection_checklist_items')
          .select(`
            id,
            title,
            category,
            ai_status,
            ai_confidence,
            ai_reasoning,
            status,
            notes,
            auditor_override,
            auditor_notes,
            media!checklist_item_id (
              id,
              file_path,
              file_type
            )
          `)
          .eq('inspection_id', inspectionId)
          .order('category', { ascending: true })
          .order('title', { ascending: true });

        items = fullResult.data || [];
        error = fullResult.error;

        if (error && (error.message?.includes('auditor_override') || error.message?.includes('auditor_notes'))) {
          console.warn('🔄 Auditor columns missing, falling back to basic query...');
          throw new Error('Auditor columns missing');
        }

        console.log('✅ Full query successful:', items.length, 'items');

      } catch (fullQueryError) {
        console.log('🔄 Falling back to basic checklist query without auditor fields...');
        
        // Fallback: Query without auditor fields
        const basicResult = await supabase
          .from('inspection_checklist_items')
          .select(`
            id,
            title,
            category,
            ai_status,
            ai_confidence,
            ai_reasoning,
            status,
            notes
          `)
          .eq('inspection_id', inspectionId)
          .order('category', { ascending: true })
          .order('title', { ascending: true });

        if (basicResult.error) {
          console.error('❌ Even basic checklist query failed:', basicResult.error);
          throw basicResult.error;
        }

        items = basicResult.data || [];
        console.log('✅ Basic query successful:', items.length, 'items');

        // Try to fetch media separately if possible
        if (items.length > 0) {
          try {
            const itemIds = items.map(item => item.id);
            const mediaResult = await supabase
              .from('media')
              .select('id, file_path, file_type, checklist_item_id')
              .in('checklist_item_id', itemIds);

            if (!mediaResult.error && mediaResult.data) {
              // Attach media to items
              items = items.map(item => ({
                ...item,
                media: mediaResult.data.filter(m => m.checklist_item_id === item.id)
              }));
              console.log('✅ Media data attached successfully');
            }
          } catch (mediaError) {
            console.warn('⚠️ Could not load media data:', mediaError);
          }
        }
      }

      if (!items || items.length === 0) {
        console.log('⚠️ No checklist items found for this inspection');
        setChecklistItems([]);
        return;
      }

      // Transform with robust error handling and fallbacks
      const transformedItems: ChecklistItemForAudit[] = items.map(item => {
        try {
          return {
            id: item.id || 'unknown',
            title: item.title || 'Untitled Item',
            category: item.category || 'General',
            ai_status: item.ai_status || null,
            ai_confidence: item.ai_confidence || null,
            ai_reasoning: item.ai_reasoning || null,
            status: item.status || 'pending',
            notes: item.notes || null,
            auditor_override: item.auditor_override || false,
            auditor_notes: item.auditor_notes || null,
            photos: item.media?.filter((m: any) => m.file_type?.startsWith('image/')) || [],
            reference_photos: [] // TODO: Add reference photos if available
          };
        } catch (transformError) {
          console.warn('⚠️ Error transforming checklist item:', item.id, transformError);
          return {
            id: item.id || 'unknown',
            title: 'Error loading item',
            category: 'General',
            ai_status: null,
            ai_confidence: null,
            ai_reasoning: null,
            status: 'pending',
            notes: null,
            auditor_override: false,
            auditor_notes: null,
            photos: [],
            reference_photos: []
          };
        }
      });

      console.log('✅ Transformed checklist items:', transformedItems.length);
      setChecklistItems(transformedItems);

    } catch (error) {
      console.error('❌ Critical error loading checklist items:', error);
      logger.error('Failed to load checklist items', error, 'AUDIT_CENTER');
      
      // Set empty state with proper structure for UI
      setChecklistItems([]);
    }
  };

  const loadAuditStats = async () => {
    try {
      // Get overall stats
      const { data: inspections } = await supabase
        .from('inspections')
        .select('status');

      const totalInspections = inspections?.length || 0;
      const completedInspections = inspections?.filter(i => i.status === 'completed').length || 0;

      // Get AI accuracy stats from real audit feedback data
      // These will populate as auditors provide feedback on AI evaluations
      const { data: auditFeedback } = await supabase
        .from('inspection_checklist_items')
        .select('ai_status, auditor_override')
        .not('ai_status', 'is', null);

      const totalAIEvaluations = auditFeedback?.length || 0;
      const correctAIEvaluations = auditFeedback?.filter(item => !item.auditor_override).length || 0;
      const aiAccuracy = totalAIEvaluations > 0 ? (correctAIEvaluations / totalAIEvaluations) * 100 : 0;

      setStats({
        total_inspections: totalInspections,
        pending_audit: completedInspections,
        audited: totalAIEvaluations,
        ai_accuracy: aiAccuracy,
        avg_confidence: 0 // Will be calculated when confidence data is available
      });

    } catch (error) {
      logger.error('Failed to load audit stats', error, 'AUDIT_CENTER');
    }
  };

  const handleAuditorOverride = async (itemId: string, override: boolean, notes: string) => {
    try {
      console.log(`🔧 Updating auditor override for item ${itemId}: override=${override}`);
      
      // First try with auditor columns
      let updateResult = await supabase
        .from('inspection_checklist_items')
        .update({
          auditor_override: override,
          auditor_notes: notes
        })
        .eq('id', itemId);

      if (updateResult.error) {
        // If auditor columns don't exist, try updating just notes
        if (updateResult.error.message?.includes('auditor_override') || 
            updateResult.error.message?.includes('auditor_notes')) {
          console.warn('⚠️ Auditor columns not available, trying to update notes field only...');
          
          const notesUpdate = await supabase
            .from('inspection_checklist_items')
            .update({
              notes: notes ? `[AUDITOR OVERRIDE: ${override}] ${notes}` : null
            })
            .eq('id', itemId);

          if (notesUpdate.error) {
            console.error('❌ Failed to update notes field:', notesUpdate.error);
            throw notesUpdate.error;
          } else {
            console.log('✅ Updated notes field with auditor override');
          }
        } else {
          console.error('❌ Failed to update auditor override:', updateResult.error);
          throw updateResult.error;
        }
      } else {
        console.log('✅ Successfully updated auditor override');
      }

      // Update local state regardless of which update method worked
      setChecklistItems(items =>
        items.map(item =>
          item.id === itemId
            ? { ...item, auditor_override: override, auditor_notes: notes }
            : item
        )
      );

    } catch (error) {
      console.error('❌ Critical error saving auditor override:', error);
      logger.error('Failed to save auditor override', error, 'AUDIT_CENTER');
      
      // Show user-friendly error message
      alert('Failed to save auditor override. Please check your permissions and try again.');
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(new Set(checklistItems.map(item => item.category))).sort();

  // Filter checklist items by category
  const filteredChecklistItems = selectedCategory === 'all'
    ? checklistItems
    : checklistItems.filter(item => item.category === selectedCategory);

  // Group items by category for display
  const groupedItems = filteredChecklistItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItemForAudit[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'not_applicable': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAIStatusColor = (status: string | null) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'needs_review': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
        <div className="text-center text-gray-500 text-sm">
          Loading completed inspections and audit data...
        </div>
      </div>
    );
  }

  // Error boundary fallback for critical failures
  const ErrorFallback = ({ error, onRetry }: { error?: any, onRetry: () => void }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Audit Center</h3>
        <p className="text-gray-600 mb-4">
          There was an issue loading the audit data. This could be due to:
        </p>
        <ul className="text-sm text-gray-500 mb-6 space-y-1">
          <li>• Database permissions or RLS policies</li>
          <li>• Missing database tables or columns</li>
          <li>• Network connectivity issues</li>
          <li>• Authentication problems</li>
        </ul>
        <div className="space-x-2">
          <Button onClick={onRetry}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
        {error && (
          <details className="mt-4 text-xs text-left">
            <summary className="cursor-pointer text-gray-500">Technical Details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );

  // Handle critical errors with fallback UI
  if (criticalError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Center</h1>
            <p className="text-red-600">System Error - Unable to Load Data</p>
          </div>
        </div>
        <ErrorFallback 
          error={criticalError} 
          onRetry={() => {
            setCriticalError(null);
            setIsLoading(true);
            loadCompletedInspections();
            loadAuditStats();
          }} 
        />
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
            Review completed inspections and AI evaluations for quality assurance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => {
            setIsLoading(true);
            setCriticalError(null);
            loadCompletedInspections();
            loadAuditStats();
          }}>
            <Brain className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_inspections}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Audit</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_audit}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audited</p>
                <p className="text-2xl font-bold text-green-600">{stats.audited}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!selectedInspection ? (
        <>
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by property name, address, or inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Completed Inspections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Inspections</CardTitle>
              <CardDescription>
                Click on any inspection to review AI evaluations and inspector assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>AI Evaluated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedInspections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-2">No completed inspections found</p>
                          <p className="text-sm text-gray-400">Completed inspections will appear here for audit review</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedInspections.map((inspection) => (
                      <TableRow key={inspection.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{inspection.property.name}</p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {inspection.property.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{inspection.inspector.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(inspection.end_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{inspection.completed_items}/{inspection.total_items}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${inspection.total_items > 0 ? (inspection.completed_items / inspection.total_items) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">{inspection.ai_evaluated_items} items</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInspection(inspection)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Audit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Inspection Audit View */
        <div className="space-y-6">
          {/* Inspection Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInspection(null)}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inspections
                </Button>
                <Badge className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedInspection.property.name}</h2>
                  <p className="text-gray-600 flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedInspection.property.address}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Property ID: {selectedInspection.property_id.slice(0, 8)}...
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 flex items-center mb-2">
                    <User className="h-4 w-4 mr-1" />
                    {selectedInspection.inspector.name}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(selectedInspection.end_time)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">
                    {selectedInspection.completed_items}/{selectedInspection.total_items} items
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <Brain className="h-4 w-4 inline mr-1" />
                    {selectedInspection.ai_evaluated_items} AI evaluated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Label>Filter by Category:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Items by Category */}
          {Object.keys(groupedItems).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No checklist items found for this inspection</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    {category}
                    <Badge variant="outline" className="ml-2">{items.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>AI Evaluation</TableHead>
                        <TableHead>Inspector Status</TableHead>
                        <TableHead>Inspector Notes</TableHead>
                        <TableHead>Auditor Override</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {item.photos.length > 0 && (
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                  <Camera className="h-3 w-3 mr-1" />
                                  {item.photos.length} photo(s)
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {item.ai_status ? (
                                <>
                                  <Badge className={`${getAIStatusColor(item.ai_status)} text-xs`}>
                                    {item.ai_status.replace('_', ' ')}
                                  </Badge>
                                  {item.ai_confidence && (
                                    <p className="text-xs text-gray-500">
                                      {item.ai_confidence}% confidence
                                    </p>
                                  )}
                                  {item.ai_reasoning && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {item.ai_reasoning}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">No AI evaluation</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {item.notes || 'No notes'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={item.auditor_override}
                                  onChange={(e) => {
                                    const newOverride = e.target.checked;
                                    handleAuditorOverride(item.id, newOverride, item.auditor_notes || '');
                                  }}
                                  className="w-4 h-4"
                                />
                                <Label className="text-sm">Override AI</Label>
                              </div>
                              {item.auditor_override && (
                                <Textarea
                                  placeholder="Auditor notes..."
                                  value={item.auditor_notes || ''}
                                  onChange={(e) => {
                                    // Update local state immediately for UI responsiveness
                                    setChecklistItems(items =>
                                      items.map(i =>
                                        i.id === item.id
                                          ? { ...i, auditor_notes: e.target.value }
                                          : i
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    // Save to database on blur
                                    handleAuditorOverride(item.id, item.auditor_override, e.target.value);
                                  }}
                                  className="text-xs"
                                  rows={2}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {item.photos.length > 0 && (
                                <Button variant="outline" size="sm">
                                  <Camera className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}