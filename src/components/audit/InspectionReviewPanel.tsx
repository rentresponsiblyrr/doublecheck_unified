/**
 * @fileoverview Inspection Review Panel Component
 * Handles detailed inspection review, AI analysis, and decision making
 * ENTERPRISE GRADE: Single responsibility for review operations
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Play,
  Pause,
  Eye,
  Camera,
  Video,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { EnhancedVideoPlayer } from '@/components/video/EnhancedVideoPlayer';
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel';
import { logger } from '@/utils/logger';

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

interface InspectionReviewPanelProps {
  inspection: Inspection | null;
  isLoading: boolean;
  onApprove: (inspectionId: string, feedback: string) => Promise<void>;
  onReject: (inspectionId: string, feedback: string) => Promise<void>;
  onRequestRevision: (inspectionId: string, feedback: string) => Promise<void>;
}

export const InspectionReviewPanel: React.FC<InspectionReviewPanelProps> = ({
  inspection,
  isLoading,
  onApprove,
  onReject,
  onRequestRevision
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'needs_revision' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);

  // Mock AI analysis - in real implementation, fetch from API
  React.useEffect(() => {
    if (inspection) {
      setAIAnalysis({
        overallScore: inspection.aiScore,
        confidence: Math.min(95, inspection.aiScore + 10),
        completedItems: Math.max(1, inspection.photoCount + inspection.videoCount - inspection.issuesFound),
        totalItems: inspection.photoCount + inspection.videoCount,
        photoCount: inspection.photoCount,
        videoCount: inspection.videoCount,
        issues: Array.from({ length: inspection.issuesFound }, (_, i) => ({
          id: `issue_${i}`,
          label: `Issue ${i + 1}`,
          category: ['safety', 'cleanliness', 'maintenance'][i % 3],
          status: 'flagged',
          ai_status: 'attention_required',
          notes: `AI detected potential issue requiring review`
        })),
        recommendations: [
          'Review flagged safety items carefully',
          'Verify photo quality meets standards',
          'Check completeness of inspection coverage'
        ]
      });
    }
  }, [inspection]);

  const handleSubmitDecision = async () => {
    if (!inspection || !reviewDecision || !feedbackText.trim()) return;

    try {
      setIsSubmitting(true);
      
      logger.info('Submitting review decision', {
        inspectionId: inspection.id,
        decision: reviewDecision,
        feedbackLength: feedbackText.length
      }, 'INSPECTION_REVIEW_PANEL');

      switch (reviewDecision) {
        case 'approved':
          await onApprove(inspection.id, feedbackText);
          break;
        case 'rejected':
          await onReject(inspection.id, feedbackText);
          break;
        case 'needs_revision':
          await onRequestRevision(inspection.id, feedbackText);
          break;
      }

      // Reset form after successful submission
      setReviewDecision(null);
      setFeedbackText('');
      
    } catch (error) {
      logger.error('Failed to submit review decision', error, 'INSPECTION_REVIEW_PANEL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Loading inspection details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inspection) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspection Selected</h3>
          <p className="text-gray-600">Select an inspection from the queue to begin your review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inspection Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6" />
              <span>Inspection Review</span>
            </div>
            <Badge variant="outline">ID: {inspection.id.slice(-8)}</Badge>
          </CardTitle>
          <CardDescription>
            {inspection.propertyAddress} • Inspector: {inspection.inspectorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">AI Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(inspection.aiScore)}`}>
                {inspection.aiScore}%
              </div>
              <Badge variant={getScoreBadgeVariant(inspection.aiScore)}>
                {inspection.aiScore >= 80 ? 'High Quality' : 
                 inspection.aiScore >= 60 ? 'Medium Quality' : 'Needs Review'}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Media Count</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Camera className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{inspection.photoCount}</span>
                </div>
                <div className="flex items-center">
                  <Video className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{inspection.videoCount}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Issues Found</div>
              <div className="flex items-center">
                {inspection.issuesFound > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-red-600 font-medium">{inspection.issuesFound}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-green-600 font-medium">None</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Est. Review Time</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                <span>{inspection.estimatedReviewTime} minutes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Property Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Address:</span> {inspection.propertyAddress}</div>
                    <div><span className="font-medium">Property ID:</span> {inspection.propertyId}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Inspector Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {inspection.inspectorName}</div>
                    <div><span className="font-medium">Inspector ID:</span> {inspection.inspectorId}</div>
                    <div><span className="font-medium">Submitted:</span> {new Date(inspection.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {inspection.issuesFound > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Issues Require Attention</AlertTitle>
                  <AlertDescription>
                    This inspection has {inspection.issuesFound} flagged issues that require careful review.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photo Review ({inspection.photoCount} photos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4" />
                <p>Photo review interface would be implemented here</p>
                <p className="text-sm">Display inspection photos with AI analysis overlay</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>Video Review ({inspection.videoCount} videos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4" />
                <p>Video review interface would be implemented here</p>
                <p className="text-sm">Enhanced video player with timeline annotations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis">
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Results</CardTitle>
                <CardDescription>
                  Automated analysis with {aiAnalysis.confidence}% confidence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{aiAnalysis.overallScore}%</div>
                    <div className="text-sm text-blue-800">Overall Score</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{aiAnalysis.completedItems}/{aiAnalysis.totalItems}</div>
                    <div className="text-sm text-green-800">Items Completed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{aiAnalysis.confidence}%</div>
                    <div className="text-sm text-yellow-800">AI Confidence</div>
                  </div>
                </div>

                {aiAnalysis.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Flagged Issues</h4>
                    <div className="space-y-2">
                      {aiAnalysis.issues.map((issue) => (
                        <div key={issue.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="font-medium">{issue.label}</span>
                              <Badge variant="outline">{issue.category}</Badge>
                            </div>
                            <Badge variant="destructive">{issue.ai_status}</Badge>
                          </div>
                          {issue.notes && (
                            <p className="text-sm text-red-700 mt-2">{issue.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">AI Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {aiAnalysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Decision Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
          <CardDescription>
            Provide your assessment and feedback for this inspection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Button
              variant={reviewDecision === 'approved' ? 'default' : 'outline'}
              onClick={() => setReviewDecision('approved')}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <Button
              variant={reviewDecision === 'needs_revision' ? 'default' : 'outline'}
              onClick={() => setReviewDecision('needs_revision')}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Revision
            </Button>
            
            <Button
              variant={reviewDecision === 'rejected' ? 'destructive' : 'outline'}
              onClick={() => setReviewDecision('rejected')}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Feedback {reviewDecision && '*'}
            </label>
            <Textarea
              placeholder={
                reviewDecision === 'approved' ? 'Provide positive feedback and any suggestions...' :
                reviewDecision === 'rejected' ? 'Explain the reasons for rejection...' :
                reviewDecision === 'needs_revision' ? 'Detail what needs to be revised...' :
                'Select a decision above and provide your feedback...'
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              disabled={!reviewDecision}
            />
          </div>

          <Button
            onClick={handleSubmitDecision}
            disabled={!reviewDecision || !feedbackText.trim() || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting Decision...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Review Decision
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};