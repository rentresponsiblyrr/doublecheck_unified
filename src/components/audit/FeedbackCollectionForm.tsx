// Feedback Collection Form Component for STR Certified
// Allows auditors to provide feedback on AI predictions

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Brain,
  Target,
  TrendingUp,
  Send,
  Save,
  Trash2,
  Plus,
  Edit3,
  Image as ImageIcon,
  Video,
  FileText,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  FeedbackFormData,
  FeedbackItem,
  FeedbackCategory,
  AuditorFeedback
} from '@/types/learning';
import { createFeedbackProcessor } from '@/lib/ai/feedback-processor';
import { useMutation } from '@tanstack/react-query';

interface FeedbackCollectionFormProps {
  inspectionId: string;
  auditorId: string;
  aiPredictions: Array<{
    id: string;
    category: FeedbackCategory;
    value: any;
    confidence: number;
    context?: {
      roomType?: string;
      photoId?: string;
      videoTimestamp?: number;
      checklistItemId?: string;
    };
  }>;
  onSubmit?: (feedback: AuditorFeedback[]) => void;
  onSaveDraft?: (draft: FeedbackFormData) => void;
  initialDraft?: FeedbackFormData;
  className?: string;
}

export const FeedbackCollectionForm: React.FC<FeedbackCollectionFormProps> = ({
  inspectionId,
  auditorId,
  aiPredictions,
  onSubmit,
  onSaveDraft,
  initialDraft,
  className
}) => {
  // State
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallRating, setOverallRating] = useState(3);
  const [comments, setComments] = useState('');
  const [suggestedImprovements, setSuggestedImprovements] = useState<string[]>([]);
  const [newImprovement, setNewImprovement] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'all'>('all');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Initialize feedback processor
  const feedbackProcessor = React.useMemo(() => createFeedbackProcessor(), []);

  // Initialize feedback items from AI predictions
  useEffect(() => {
    const items: FeedbackItem[] = aiPredictions.map(prediction => ({
      id: prediction.id,
      type: prediction.category,
      aiValue: prediction.value,
      correctValue: prediction.value, // Initially same as AI
      confidenceRating: prediction.confidence,
      severity: 'minor',
      explanation: '',
      evidence: {
        photoIds: prediction.context?.photoId ? [prediction.context.photoId] : undefined,
        videoTimestamp: prediction.context?.videoTimestamp,
        checklistItemId: prediction.context?.checklistItemId
      }
    }));

    // Apply initial draft if provided
    if (initialDraft) {
      const draftMap = new Map(initialDraft.feedbackItems.map(item => [item.id, item]));
      items.forEach(item => {
        const draft = draftMap.get(item.id);
        if (draft) {
          Object.assign(item, draft);
        }
      });
      setOverallRating(initialDraft.overallRating);
      setComments(initialDraft.comments || '');
      setSuggestedImprovements(initialDraft.suggestedImprovements || []);
    }

    setFeedbackItems(items);
  }, [aiPredictions, initialDraft]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData: FeedbackFormData = {
        inspectionId,
        feedbackItems: feedbackItems.filter(item => 
          JSON.stringify(item.aiValue) !== JSON.stringify(item.correctValue) ||
          item.explanation
        ),
        overallRating,
        comments,
        suggestedImprovements
      };

      const feedback = await feedbackProcessor.collectFeedback(
        formData,
        auditorId,
        inspectionId
      );

      return feedback;
    },
    onSuccess: (feedback) => {
      onSubmit?.(feedback);
    }
  });

  // Filter items
  const filteredItems = feedbackItems.filter(item => {
    if (filterCategory !== 'all' && item.type !== filterCategory) return false;
    if (showOnlyErrors && JSON.stringify(item.aiValue) === JSON.stringify(item.correctValue)) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: feedbackItems.length,
    corrections: feedbackItems.filter(item => 
      JSON.stringify(item.aiValue) !== JSON.stringify(item.correctValue)
    ).length,
    reviewed: feedbackItems.filter(item => item.explanation).length,
    highSeverity: feedbackItems.filter(item => item.severity === 'major').length
  };

  // Handle item update
  const updateFeedbackItem = (id: string, updates: Partial<FeedbackItem>) => {
    setFeedbackItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Handle save draft
  const handleSaveDraft = () => {
    const draft: FeedbackFormData = {
      inspectionId,
      feedbackItems,
      overallRating,
      comments,
      suggestedImprovements
    };
    onSaveDraft?.(draft);
  };

  // Toggle item expansion
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add improvement suggestion
  const addImprovement = () => {
    if (newImprovement.trim()) {
      setSuggestedImprovements(prev => [...prev, newImprovement.trim()]);
      setNewImprovement('');
    }
  };

  // Remove improvement suggestion
  const removeImprovement = (index: number) => {
    setSuggestedImprovements(prev => prev.filter((_, i) => i !== index));
  };

  // Get category color
  const getCategoryColor = (category: FeedbackCategory) => {
    const colors: Record<FeedbackCategory, string> = {
      photo_quality: 'bg-blue-100 text-blue-800',
      object_detection: 'bg-purple-100 text-purple-800',
      room_classification: 'bg-green-100 text-green-800',
      damage_assessment: 'bg-red-100 text-red-800',
      completeness_check: 'bg-yellow-100 text-yellow-800',
      safety_compliance: 'bg-orange-100 text-orange-800',
      amenity_verification: 'bg-indigo-100 text-indigo-800',
      measurement_accuracy: 'bg-pink-100 text-pink-800',
      condition_rating: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Render value based on type
  const renderValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>AI Learning Feedback</span>
              </CardTitle>
              <CardDescription>
                Help improve our AI by reviewing and correcting its predictions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Predictions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.corrections}</div>
            <p className="text-xs text-muted-foreground">Corrections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.highSeverity}</div>
            <p className="text-xs text-muted-foreground">High Severity</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review AI Predictions</CardTitle>
            <div className="flex items-center space-x-4">
              <Select
                value={filterCategory}
                onValueChange={(value: any) => setFilterCategory(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="photo_quality">Photo Quality</SelectItem>
                  <SelectItem value="object_detection">Object Detection</SelectItem>
                  <SelectItem value="room_classification">Room Classification</SelectItem>
                  <SelectItem value="damage_assessment">Damage Assessment</SelectItem>
                  <SelectItem value="completeness_check">Completeness Check</SelectItem>
                  <SelectItem value="safety_compliance">Safety Compliance</SelectItem>
                  <SelectItem value="amenity_verification">Amenity Verification</SelectItem>
                  <SelectItem value="measurement_accuracy">Measurement Accuracy</SelectItem>
                  <SelectItem value="condition_rating">Condition Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showErrors"
                  checked={showOnlyErrors}
                  onCheckedChange={(checked) => setShowOnlyErrors(!!checked)}
                />
                <Label htmlFor="showErrors" className="text-sm cursor-pointer">
                  Show only errors
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const hasError = JSON.stringify(item.aiValue) !== JSON.stringify(item.correctValue);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'border rounded-lg p-4 transition-all',
                      hasError ? 'border-red-200 bg-red-50' : 'border-gray-200',
                      isExpanded && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="mt-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge className={cn('text-xs', getCategoryColor(item.type))}>
                              {item.type.replace(/_/g, ' ')}
                            </Badge>
                            {hasError && (
                              <Badge variant="destructive" className="text-xs">
                                Correction
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {item.confidenceRating}% confidence
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">AI Prediction</p>
                              <p className="text-sm font-mono">{renderValue(item.aiValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Correct Value</p>
                              <p className={cn(
                                'text-sm font-mono',
                                hasError && 'text-red-600 font-semibold'
                              )}>
                                {renderValue(item.correctValue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.explanation && (
                          <Badge variant="secondary" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Explained
                          </Badge>
                        )}
                        {hasError ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        {/* Correct Value Input */}
                        <div>
                          <Label>Correct Value</Label>
                          <div className="mt-1">
                            {typeof item.aiValue === 'boolean' ? (
                              <RadioGroup
                                value={String(item.correctValue)}
                                onValueChange={(value) => 
                                  updateFeedbackItem(item.id, { correctValue: value === 'true' })
                                }
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="true" id={`${item.id}_true`} />
                                    <Label htmlFor={`${item.id}_true`}>Yes</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="false" id={`${item.id}_false`} />
                                    <Label htmlFor={`${item.id}_false`}>No</Label>
                                  </div>
                                </div>
                              </RadioGroup>
                            ) : typeof item.aiValue === 'number' ? (
                              <div className="flex items-center space-x-2">
                                <Slider
                                  value={[item.correctValue]}
                                  onValueChange={([value]) => 
                                    updateFeedbackItem(item.id, { correctValue: value })
                                  }
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="w-12 text-sm font-mono">{item.correctValue}</span>
                              </div>
                            ) : (
                              <Textarea
                                value={
                                  typeof item.correctValue === 'string' 
                                    ? item.correctValue 
                                    : JSON.stringify(item.correctValue, null, 2)
                                }
                                onChange={(e) => {
                                  try {
                                    const value = JSON.parse(e.target.value);
                                    updateFeedbackItem(item.id, { correctValue: value });
                                  } catch {
                                    updateFeedbackItem(item.id, { correctValue: e.target.value });
                                  }
                                }}
                                className="font-mono text-sm"
                                rows={3}
                              />
                            )}
                          </div>
                        </div>

                        {/* Severity */}
                        <div>
                          <Label>Severity</Label>
                          <RadioGroup
                            value={item.severity}
                            onValueChange={(value: any) => 
                              updateFeedbackItem(item.id, { severity: value })
                            }
                            className="flex items-center space-x-4 mt-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="minor" id={`${item.id}_minor`} />
                              <Label htmlFor={`${item.id}_minor`} className="cursor-pointer">
                                Minor
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="moderate" id={`${item.id}_moderate`} />
                              <Label htmlFor={`${item.id}_moderate`} className="cursor-pointer">
                                Moderate
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="major" id={`${item.id}_major`} />
                              <Label htmlFor={`${item.id}_major`} className="cursor-pointer">
                                Major
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Confidence Rating */}
                        <div>
                          <Label>Your Confidence Level</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Slider
                              value={[item.confidenceRating]}
                              onValueChange={([value]) => 
                                updateFeedbackItem(item.id, { confidenceRating: value })
                              }
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="w-12 text-sm font-mono">{item.confidenceRating}%</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <Label>Explanation (Optional)</Label>
                          <Textarea
                            placeholder="Explain why this correction is needed..."
                            value={item.explanation || ''}
                            onChange={(e) => 
                              updateFeedbackItem(item.id, { explanation: e.target.value })
                            }
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        {/* Evidence */}
                        {item.evidence && (
                          <div>
                            <Label>Related Evidence</Label>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              {item.evidence.photoIds && (
                                <div className="flex items-center space-x-1">
                                  <ImageIcon className="h-4 w-4" />
                                  <span>{item.evidence.photoIds.length} photos</span>
                                </div>
                              )}
                              {item.evidence.videoTimestamp !== undefined && (
                                <div className="flex items-center space-x-1">
                                  <Video className="h-4 w-4" />
                                  <span>Video at {formatTime(item.evidence.videoTimestamp)}</span>
                                </div>
                              )}
                              {item.evidence.checklistItemId && (
                                <div className="flex items-center space-x-1">
                                  <FileText className="h-4 w-4" />
                                  <span>Checklist item</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Overall Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Rating */}
          <div>
            <Label>Overall AI Performance Rating</Label>
            <div className="flex items-center space-x-4 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setOverallRating(rating)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    overallRating >= rating
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
                >
                  <Target className="h-6 w-6" />
                </button>
              ))}
              <span className="text-sm text-muted-foreground">
                {overallRating === 1 && 'Poor'}
                {overallRating === 2 && 'Fair'}
                {overallRating === 3 && 'Good'}
                {overallRating === 4 && 'Very Good'}
                {overallRating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div>
            <Label>Additional Comments</Label>
            <Textarea
              placeholder="Any additional feedback about the AI's performance..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Suggested Improvements */}
          <div>
            <Label>Suggested Improvements</Label>
            <div className="space-y-2 mt-1">
              {suggestedImprovements.map((improvement, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{improvement}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImprovement(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add a suggestion..."
                  value={newImprovement}
                  onChange={(e) => setNewImprovement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addImprovement()}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button size="sm" onClick={addImprovement}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Status */}
      {submitMutation.isPending && (
        <Alert>
          <Sparkles className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Submitting your feedback to improve our AI...
          </AlertDescription>
        </Alert>
      )}

      {submitMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Thank you! Your feedback has been submitted and will help improve our AI.
          </AlertDescription>
        </Alert>
      )}

      {submitMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to submit feedback. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}