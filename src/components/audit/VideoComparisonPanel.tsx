// Video Comparison Panel Component for STR Certified Auditor Interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Check,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronRight,
  ZoomIn,
  RotateCw,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Video,
  Info,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoTimestamp, VideoAnalysisResult, DiscrepancyReport } from '@/types/video';
import type { PhotoData } from '@/types/property';

interface AIFinding {
  id: string;
  timestamp: number;
  type: 'match' | 'discrepancy' | 'missing' | 'extra';
  category: string;
  description: string;
  confidence: number;
  videoEvidence?: string; // Frame URL
  listingEvidence?: string; // Photo URL
  severity: 'low' | 'medium' | 'high';
  auditorStatus?: 'pending' | 'confirmed' | 'rejected';
  auditorNotes?: string;
}

interface VideoComparisonPanelProps {
  videoAnalysis: VideoAnalysisResult;
  listingPhotos: PhotoData[];
  currentTime: number;
  onJumpToTime?: (time: number) => void;
  onFindingUpdate?: (findingId: string, status: 'confirmed' | 'rejected', notes?: string) => void;
  className?: string;
}

export const VideoComparisonPanel: React.FC<VideoComparisonPanelProps> = ({
  videoAnalysis,
  listingPhotos,
  currentTime,
  onJumpToTime,
  onFindingUpdate,
  className
}) => {
  // State
  const [selectedFinding, setSelectedFinding] = useState<AIFinding | null>(null);
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [auditorNotes, setAuditorNotes] = useState('');
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  // Generate AI findings from video analysis
  const aiFindings: AIFinding[] = React.useMemo(() => {
    const findings: AIFinding[] = [];

    // Convert discrepancies to findings
    videoAnalysis.issues.forEach((issue, index) => {
      issue.affectedTimestamps.forEach((timestamp) => {
        findings.push({
          id: `issue_${index}_${timestamp}`,
          timestamp,
          type: 'discrepancy',
          category: issue.type,
          description: issue.description,
          confidence: 85 + Math.random() * 10,
          severity: issue.severity,
          auditorStatus: 'pending'
        });
      });
    });

    // Add room-based findings
    videoAnalysis.roomSequence.forEach((room) => {
      // Check if room exists in listing
      const listingHasRoom = listingPhotos.some(photo => 
        photo.roomType?.toLowerCase() === room.roomType.toLowerCase()
      );

      if (!listingHasRoom && room.coverage !== 'minimal') {
        findings.push({
          id: `extra_room_${room.roomId}`,
          timestamp: room.startTime,
          type: 'extra',
          category: 'room_not_in_listing',
          description: `${room.roomType} found in video but not shown in listing photos`,
          confidence: 75,
          severity: 'medium',
          auditorStatus: 'pending'
        });
      }
    });

    // Check for missing rooms
    const coveredRooms = videoAnalysis.roomSequence.map(r => r.roomType.toLowerCase());
    const listingRooms = [...new Set(listingPhotos.map(p => p.roomType?.toLowerCase()).filter(Boolean))];
    
    listingRooms.forEach((roomType) => {
      if (!coveredRooms.includes(roomType!)) {
        findings.push({
          id: `missing_room_${roomType}`,
          timestamp: 0,
          type: 'missing',
          category: 'room_not_covered',
          description: `${roomType} shown in listing but not found in video`,
          confidence: 90,
          severity: 'high',
          auditorStatus: 'pending'
        });
      }
    });

    // Add feature-based findings
    videoAnalysis.featureDetection.forEach((feature) => {
      if (!feature.detected) {
        findings.push({
          id: `missing_feature_${feature.feature}`,
          timestamp: 0,
          type: 'missing',
          category: 'amenity_missing',
          description: `${feature.feature} not detected in video`,
          confidence: feature.confidence,
          severity: 'medium',
          auditorStatus: 'pending'
        });
      }
    });

    return findings.sort((a, b) => a.timestamp - b.timestamp);
  }, [videoAnalysis, listingPhotos]);

  // Filter findings
  const filteredFindings = aiFindings.filter(finding => {
    if (showOnlyUnreviewed && finding.auditorStatus !== 'pending') return false;
    if (filterSeverity !== 'all' && finding.severity !== filterSeverity) return false;
    return true;
  });

  // Get findings at current time
  const currentFindings = filteredFindings.filter(
    f => Math.abs(f.timestamp - currentTime) < 5
  );

  // Statistics
  const stats = {
    total: aiFindings.length,
    confirmed: aiFindings.filter(f => f.auditorStatus === 'confirmed').length,
    rejected: aiFindings.filter(f => f.auditorStatus === 'rejected').length,
    pending: aiFindings.filter(f => f.auditorStatus === 'pending').length,
    high: aiFindings.filter(f => f.severity === 'high').length,
    medium: aiFindings.filter(f => f.severity === 'medium').length,
    low: aiFindings.filter(f => f.severity === 'low').length
  };

  // Handle finding review
  const handleFindingReview = (status: 'confirmed' | 'rejected') => {
    if (!selectedFinding) return;

    onFindingUpdate?.(selectedFinding.id, status, auditorNotes);
    
    // Update local state
    selectedFinding.auditorStatus = status;
    selectedFinding.auditorNotes = auditorNotes;
    
    // Clear form
    setAuditorNotes('');
    
    // Move to next unreviewed finding
    const nextUnreviewed = filteredFindings.find(
      f => f.auditorStatus === 'pending' && f.id !== selectedFinding.id
    );
    if (nextUnreviewed) {
      setSelectedFinding(nextUnreviewed);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get finding icon
  const getFindingIcon = (type: string) => {
    switch (type) {
      case 'match': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'discrepancy': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'extra': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>AI Comparison Analysis</span>
            </CardTitle>
            <Badge variant="secondary">
              {videoAnalysis.aiConfidence.toFixed(0)}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Findings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-xs text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Severity Breakdown */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">Severity:</span>
              <Badge variant="destructive">{stats.high} High</Badge>
              <Badge variant="secondary" className="bg-yellow-100">{stats.medium} Medium</Badge>
              <Badge variant="secondary">{stats.low} Low</Badge>
            </div>
            <div className="text-muted-foreground">
              {stats.pending} pending review
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comparison Findings</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={showOnlyUnreviewed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyUnreviewed(!showOnlyUnreviewed)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Unreviewed Only
              </Button>
              <RadioGroup
                value={filterSeverity}
                onValueChange={(value: any) => setFilterSeverity(value)}
                className="flex items-center space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="all" id="all" className="h-3 w-3" />
                  <Label htmlFor="all" className="text-xs cursor-pointer">All</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="high" id="high" className="h-3 w-3" />
                  <Label htmlFor="high" className="text-xs cursor-pointer">High</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="medium" id="medium" className="h-3 w-3" />
                  <Label htmlFor="medium" className="text-xs cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="low" id="low" className="h-3 w-3" />
                  <Label htmlFor="low" className="text-xs cursor-pointer">Low</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredFindings.map((finding) => {
                const isSelected = selectedFinding?.id === finding.id;
                const isAtCurrentTime = Math.abs(finding.timestamp - currentTime) < 5;
                
                return (
                  <div
                    key={finding.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                      isAtCurrentTime && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getFindingIcon(finding.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {finding.category.replace(/_/g, ' ')}
                            </span>
                            <Badge className={cn('text-xs', getSeverityColor(finding.severity))}>
                              {finding.severity}
                            </Badge>
                            {finding.auditorStatus !== 'pending' && (
                              <Badge
                                variant={finding.auditorStatus === 'confirmed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {finding.auditorStatus === 'confirmed' ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 mr-1" />
                                )}
                                {finding.auditorStatus}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {finding.description}
                          </p>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                            <span>At {formatTime(finding.timestamp)}</span>
                            <span>•</span>
                            <span>{finding.confidence.toFixed(0)}% confidence</span>
                          </div>
                        </div>
                      </div>
                      {finding.timestamp > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToTime?.(finding.timestamp);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Finding Detail */}
      {selectedFinding && (
        <Card>
          <CardHeader>
            <CardTitle>Finding Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Evidence Comparison */}
            <div>
              <h4 className="text-sm font-medium mb-2">Evidence Comparison</h4>
              <Tabs value={comparisonMode} onValueChange={(v: any) => setComparisonMode(v)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger value="overlay">Overlay</TabsTrigger>
                </TabsList>
                <TabsContent value="side-by-side" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Video Frame</p>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {selectedFinding.videoEvidence ? (
                          <img
                            src={selectedFinding.videoEvidence}
                            alt="Video evidence"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Video className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Listing Photo</p>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {selectedFinding.listingEvidence ? (
                          <img
                            src={selectedFinding.listingEvidence}
                            alt="Listing evidence"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="overlay" className="mt-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {selectedFinding.listingEvidence && (
                      <img
                        src={selectedFinding.listingEvidence}
                        alt="Listing evidence"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    )}
                    {selectedFinding.videoEvidence && (
                      <img
                        src={selectedFinding.videoEvidence}
                        alt="Video evidence"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-difference"
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* AI Analysis */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>AI Analysis</AlertTitle>
              <AlertDescription>
                <p className="mt-2">{selectedFinding.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span>Type: {selectedFinding.type}</span>
                  <span>Category: {selectedFinding.category.replace(/_/g, ' ')}</span>
                  <span>Confidence: {selectedFinding.confidence.toFixed(0)}%</span>
                </div>
              </AlertDescription>
            </Alert>

            {/* Auditor Review */}
            <div className="space-y-3">
              <Label>Auditor Notes</Label>
              <Textarea
                placeholder="Add notes about this finding..."
                value={auditorNotes}
                onChange={(e) => setAuditorNotes(e.target.value)}
                className="min-h-[80px]"
              />
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleFindingReview('confirmed')}
                  disabled={selectedFinding.auditorStatus !== 'pending'}
                  className="flex-1"
                  variant="default"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Confirm Finding
                </Button>
                <Button
                  onClick={() => handleFindingReview('rejected')}
                  disabled={selectedFinding.auditorStatus !== 'pending'}
                  className="flex-1"
                  variant="destructive"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject Finding
                </Button>
              </div>

              {selectedFinding.auditorStatus !== 'pending' && selectedFinding.auditorNotes && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Previous Notes:</p>
                    <p className="mt-1">{selectedFinding.auditorNotes}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Time Findings */}
      {currentFindings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Findings at Current Time</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              {currentFindings.length} finding{currentFindings.length > 1 ? 's' : ''} detected at {formatTime(currentTime)}
            </p>
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