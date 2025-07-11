import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  BarChart3,
  Calendar,
  Filter,
  Search,
  Play,
  Pause,
  Download,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

// Hooks and Services
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useLearningAnalytics } from '@/hooks/useLearningAnalytics';
import { useVideoReview } from '@/hooks/useVideoReview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { auditorService, type InspectionForReview, type AuditorMetrics } from '@/services/auditorService';
import { statusCountService } from '@/services/statusCountService';
import { logger } from '@/utils/logger';

// Components
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { EnhancedVideoPlayer } from '@/components/video/EnhancedVideoPlayer';
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel';
import { FeedbackForm } from '@/components/audit/FeedbackForm';
import { MetricsChart } from '@/components/audit/MetricsChart';

// Types for legacy support
interface Inspection {
  id: string;
  propertyId: string;
  propertyAddress: string;
  inspectorId: string;
  inspectorName: string;
  status: 'pending_review' | 'in_review' | 'completed' | 'approved' | 'rejected';
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  aiScore: number;
  photoCount: number;
  videoCount: number;
  issuesFound: number;
  estimatedReviewTime: number;
}

interface AIAnalysis {
  overallScore: number;
  confidence: number;
  completedItems: number;
  totalItems: number;
  photoCount: number;
  videoCount: number;
  issues: Array<{
    id: string;
    label: string;
    category: string | null;
    status: string | null;
    ai_status: string | null;
    notes: string | null;
  }>;
  recommendations: string[];
}

export function AuditorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { error, handleError, withErrorHandling } = useErrorHandling();
  const { trackLearningEvent, getPersonalizedRecommendations } = useLearningAnalytics();
  const { playVideo, pauseVideo, seekTo, isPlaying } = useVideoReview();

  // State Management
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'needs_revision' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Data Queries - Real inspection data
  const { data: inspectionsData, isLoading: isLoadingInspections, error: inspectionsError } = useQuery({
    queryKey: ['inspections', 'pending_review', filterStatus, filterPriority, searchQuery],
    queryFn: async () => {
      logger.info('Fetching inspections for auditor dashboard', {
        filterStatus,
        searchQuery
      }, 'AUDITOR_DASHBOARD');

      const result = await auditorService.getInspectionsPendingReview(50, {
        status: filterStatus,
        searchQuery: searchQuery || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inspections');
      }

      return result.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Transform real data to legacy format for existing UI
  const inspections: Inspection[] = (inspectionsData || []).map(inspection => ({
    id: inspection.id,
    propertyId: inspection.property_id,
    propertyAddress: inspection.properties?.address || 'Unknown Address',
    inspectorId: inspection.inspector_id,
    inspectorName: inspection.users?.name || 'Unknown Inspector',
    status: inspection.status as any,
    submittedAt: inspection.start_time,
    priority: inspection.ai_analysis_summary?.issues_count > 5 ? 'high' : 
              inspection.ai_analysis_summary?.issues_count > 2 ? 'medium' : 'low',
    aiScore: inspection.ai_analysis_summary?.overall_score || 0,
    photoCount: inspection.ai_analysis_summary?.photo_count || 0,
    videoCount: inspection.ai_analysis_summary?.video_count || 0,
    issuesFound: inspection.ai_analysis_summary?.issues_count || 0,
    estimatedReviewTime: Math.max(5, Math.min(30, 
      (inspection.ai_analysis_summary?.total_items || 0) * 2 + 
      (inspection.ai_analysis_summary?.issues_count || 0) * 3
    ))
  }));

  // Get auditor metrics using centralized service
  const { data: auditorMetrics } = useQuery({
    queryKey: ['auditor_metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        return await statusCountService.getAuditorMetrics(user.id, 'today');
      } catch (error) {
        logger.warn('Failed to fetch auditor metrics', error, 'AUDITOR_DASHBOARD');
        return null;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  // Get detailed inspection data
  const { data: currentInspectionDetails } = useQuery({
    queryKey: ['inspection_details', selectedInspection],
    queryFn: async () => {
      if (!selectedInspection) return null;
      
      logger.info('Fetching detailed inspection for review', {
        inspectionId: selectedInspection
      }, 'AUDITOR_DASHBOARD');

      const result = await auditorService.getInspectionForReview(selectedInspection);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inspection details');
      }

      const inspection = result.data;
      if (!inspection) return null;

      // Transform to expected format
      const photos = inspection.checklist_items.flatMap(item => 
        item.media_files
          .filter(media => media.type === 'photo')
          .map(media => ({
            id: media.id,
            url: media.url,
            room: item.title,
            timestamp: media.created_at,
            fileName: media.file_name
          }))
      );

      const videos = inspection.checklist_items.flatMap(item =>
        item.media_files
          .filter(media => media.type === 'video')
          .map(media => ({
            id: media.id,
            url: media.url,
            duration: 0, // TODO: Add duration to media_files table
            timestamp: media.created_at,
            fileName: media.file_name
          }))
      );

      const aiAnalysis = {
        overallScore: inspection.ai_analysis_summary?.overall_score || 0,
        confidence: inspection.ai_analysis_summary?.confidence_average || 0,
        completedItems: inspection.ai_analysis_summary?.completed_items || 0,
        totalItems: inspection.ai_analysis_summary?.total_items || 0,
        photoCount: inspection.ai_analysis_summary?.photo_count || 0,
        videoCount: inspection.ai_analysis_summary?.video_count || 0,
        issues: inspection.checklist_items
          .filter(item => item.ai_status === 'fail' || item.ai_status === 'needs_review')
          .map(item => ({
            id: item.id,
            label: item.title,
            category: null,
            status: item.status,
            ai_status: item.ai_status,
            notes: item.notes
          })),
        recommendations: [
          'Review flagged items carefully',
          'Check photo quality and clarity',
          'Verify AI analysis accuracy'
        ]
      };

      return {
        inspection: inspections.find(i => i.id === selectedInspection),
        photos,
        videos,
        aiAnalysis
      };
    },
    enabled: !!selectedInspection,
  });

  // Submit review decision mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({
      inspectionId,
      decision,
      feedback,
      overrides = []
    }: {
      inspectionId: string;
      decision: 'approved' | 'rejected' | 'needs_revision';
      feedback: string;
      overrides?: Array<{
        checklistItemId: string;
        originalAiStatus: string;
        auditorStatus: string;
        reasoning: string;
      }>;
    }) => {
      const reviewDecision = {
        inspectionId,
        decision,
        feedback,
        overrides,
        reviewTime: 15 // TODO: Track actual review time
      };

      const result = await auditorService.submitReviewDecision(reviewDecision);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      return result;
    },
    onSuccess: () => {
      // Refresh inspections list
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['auditor_metrics'] });
      
      // Clear selection
      setSelectedInspection(null);
      setReviewDecision(null);
      setFeedbackText('');
      
      logger.info('Review decision submitted successfully', {}, 'AUDITOR_DASHBOARD');
    },
    onError: (error) => {
      logger.error('Failed to submit review decision', error, 'AUDITOR_DASHBOARD');
      handleError(error as Error);
    }
  });

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!selectedInspection || !reviewDecision) return;
    
    await withErrorHandling(async () => {
      await submitReviewMutation.mutateAsync({
        inspectionId: selectedInspection,
        decision: reviewDecision,
        feedback: feedbackText
      });
      
      // Track learning event
      trackLearningEvent({
        type: 'audit_decision',
        data: {
          decision: reviewDecision,
          inspectionId: selectedInspection,
          feedback: feedbackText
        }
      });
    });
  };

  // Event Handlers
  const handleInspectionSelect = (inspectionId: string) => {
    setSelectedInspection(inspectionId);
    trackLearningEvent('inspection_selected', { inspectionId });
  };

  // Helper function to get priority
  const getPriority = (inspection: Inspection) => {
    if (!inspection.end_time) return 'medium';
    const hoursAgo = (Date.now() - new Date(inspection.end_time).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 2) return 'high';
    if (hoursAgo < 24) return 'medium';
    return 'low';
  };

  // Helper function to get photo/video counts
  const getMediaCounts = (inspection: InspectionForReview) => {
    const items = inspection.checklist_items || [];
    const photoCount = items.reduce((count, item) => 
      count + (item.media?.filter(m => m.type === 'photo').length || 0), 0
    );
    const videoCount = items.reduce((count, item) => 
      count + (item.media?.filter(m => m.type === 'video').length || 0), 0
    );
    return { photoCount, videoCount };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Helper functions for status display
  const getDisplayStatus = (inspection: any) => {
    // Map database status to display status
    switch (inspection.status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Pending Review';
      case 'pending_review':
        return 'Pending Review';
      case 'in_review':
        return 'In Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'needs_revision':
        return 'Needs Revision';
      default:
        return 'Unknown';
    }
  };

  // Filter inspections based on search query, status filter, and priority filter
  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = searchQuery === '' || 
      inspection.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.inspectorName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || inspection.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || inspection.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'outline';
      case 'In Progress': return 'default';
      case 'Pending Review': return 'secondary';
      case 'In Review': return 'default';
      case 'Approved': return 'outline';
      case 'Rejected': return 'destructive';
      case 'Needs Revision': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Auditor Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{auditorMetrics?.pendingReviews || 0} pending</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{auditorMetrics?.totalReviews || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                  <p className="text-2xl font-bold">{auditorMetrics?.avgReviewTime || 0}m</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-2xl font-bold">{auditorMetrics?.approvalRate || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                  <p className="text-2xl font-bold">{auditorMetrics?.aiAccuracyRate || 0}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queue">Review Queue</TabsTrigger>
            <TabsTrigger value="review">Active Review</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
          </TabsList>

          {/* Review Queue */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inspection Queue</CardTitle>
                    <CardDescription>
                      Pending inspections requiring review
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search inspections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending_review">Pending</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => {
                      const { photoCount, videoCount } = getMediaCounts(inspection);
                      const priority = getPriority(inspection);
                      const displayStatus = getDisplayStatus(inspection);
                      const completedItems = inspection.checklist_items?.filter(item => item.status === 'completed').length || 0;
                      const totalItems = inspection.checklist_items?.length || 0;
                      const completionScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                      const issuesFound = inspection.checklist_items?.filter(item => item.ai_status && item.ai_status !== 'pass').length || 0;
                      
                      return (
                        <TableRow key={inspection.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {inspection.properties?.name || inspection.properties?.address || 'Unknown Property'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {photoCount} photos, {videoCount} video{videoCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{inspection.users?.name || 'Unknown Inspector'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(displayStatus) as any}>
                              {displayStatus.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(priority) as any}>
                              {priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{completionScore}%</span>
                              {completionScore < 80 && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{issuesFound}</TableCell>
                          <TableCell>
                            {inspection.end_time ? (
                              <span className="text-sm text-gray-500">
                                {new Date(inspection.end_time).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">In progress</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleInspectionSelect(inspection.id);
                                setActiveTab('review');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Review */}
          <TabsContent value="review" className="space-y-6">
            {selectedInspection && currentInspectionDetails ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Review Area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Video Player */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Video Walkthrough</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentInspectionDetails.videos.length > 0 ? (
                        <EnhancedVideoPlayer
                          src={currentInspectionDetails.videos[0]?.url}
                          title={`Inspection Video - ${currentInspectionDetails.inspection?.propertyAddress || 'Property'}`}
                          timestamp={currentInspectionDetails.videos[0]?.timestamp}
                          onPlay={playVideo}
                          onPause={pauseVideo}
                          onSeek={seekTo}
                          onTimeUpdate={(currentTime) => {
                            logger.info('Video time update', { currentTime }, 'AUDITOR_DASHBOARD');
                          }}
                          onError={(error) => {
                            logger.error('Video playback error', { error }, 'AUDITOR_DASHBOARD');
                            handleError(new Error(error));
                          }}
                          showControls={true}
                          showTimestamps={true}
                          autoplay={false}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No video available for this inspection</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Videos are automatically captured during the inspection process
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Photo Gallery */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Photo Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentInspectionDetails.photos.length > 0 ? (
                        <>
                          <div className="grid grid-cols-4 gap-4">
                            {currentInspectionDetails.photos.slice(0, 8).map((photo) => (
                              <div key={photo.id} className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700">
                                <img
                                  src={photo.url}
                                  alt={`Photo ${photo.id}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                          {currentInspectionDetails.photos.length > 8 && (
                            <Button variant="outline" className="mt-4 w-full">
                              View All {currentInspectionDetails.photos.length} Photos
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No photos available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* AI Analysis */}
                  <AIAnalysisPanel analysis={currentInspectionDetails.aiAnalysis} />

                  {/* Review Decision */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Decision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Button
                          variant={reviewDecision === 'approved' ? 'default' : 'outline'}
                          onClick={() => setReviewDecision('approved')}
                          className="flex-1"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant={reviewDecision === 'rejected' ? 'destructive' : 'outline'}
                          onClick={() => setReviewDecision('rejected')}
                          className="flex-1"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      <Button
                        variant={reviewDecision === 'needs_revision' ? 'secondary' : 'outline'}
                        onClick={() => setReviewDecision('needs_revision')}
                        className="w-full"
                      >
                        Request Revision
                      </Button>

                      <Textarea
                        placeholder="Add feedback for the inspector..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={4}
                      />

                      <Button
                        onClick={handleSubmitReview}
                        disabled={!reviewDecision || submitReviewMutation.isPending}
                        className="w-full"
                      >
                        {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an Inspection to Review
                  </h3>
                  <p className="text-gray-500">
                    Choose an inspection from the queue to begin the review process.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsChart 
                    data={[
                      { name: 'Mon', reviews: 12, avgTime: 15 },
                      { name: 'Tue', reviews: 8, avgTime: 18 },
                      { name: 'Wed', reviews: 15, avgTime: 12 },
                      { name: 'Thu', reviews: 10, avgTime: 20 },
                      { name: 'Fri', reviews: 14, avgTime: 16 },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Accuracy Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Overall Accuracy</span>
                      <span className="font-bold">{auditorMetrics?.aiAccuracyRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>False Positives</span>
                      <span className="font-bold">8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>False Negatives</span>
                      <span className="font-bold">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback History */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>
                  Feedback provided to inspectors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock feedback entries */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">123 Main St - Approved</p>
                        <p className="text-sm text-gray-600">Excellent documentation quality</p>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">456 Oak Ave - Revision Requested</p>
                        <p className="text-sm text-gray-600">Need additional photos of kitchen area</p>
                      </div>
                      <span className="text-sm text-gray-500">4 hours ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AuditorDashboard;