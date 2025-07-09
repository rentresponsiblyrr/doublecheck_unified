// Video Annotation Tools Component for STR Certified Auditor Interface

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Edit3,
  Square,
  Circle,
  Type,
  Check,
  X,
  AlertTriangle,
  Flag,
  Save,
  Trash2,
  ChevronDown,
  Clock,
  User,
  Palette,
  MousePointer,
  Move,
  ZoomIn,
  Undo,
  Redo,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoAnnotation {
  id: string;
  timestamp: number;
  type: 'comment' | 'drawing' | 'flag';
  status?: 'pass' | 'fail' | 'needs_review';
  content: string;
  drawing?: DrawingData;
  author: string;
  createdAt: Date;
  position?: { x: number; y: number };
  color?: string;
}

export interface DrawingData {
  tool: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'text';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
}

interface VideoAnnotationToolsProps {
  currentTime: number;
  videoElement?: HTMLVideoElement | null;
  annotations: VideoAnnotation[];
  onAddAnnotation: (annotation: Omit<VideoAnnotation, 'id' | 'createdAt'>) => void;
  onUpdateAnnotation: (id: string, annotation: Partial<VideoAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  currentUser: string;
  className?: string;
}

export const VideoAnnotationTools: React.FC<VideoAnnotationToolsProps> = ({
  currentTime,
  videoElement,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentUser,
  className
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'comment' | 'drawing' | 'flag'>('comment');
  const [commentText, setCommentText] = useState('');
  const [flagStatus, setFlagStatus] = useState<'pass' | 'fail' | 'needs_review'>('needs_review');
  const [drawingTool, setDrawingTool] = useState<DrawingData['tool']>('pen');
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<DrawingData | null>(null);

  // Get annotations for current time (within 2 seconds)
  const currentAnnotations = annotations.filter(
    ann => Math.abs(ann.timestamp - currentTime) < 2
  );

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!commentText.trim()) return;

    onAddAnnotation({
      timestamp: currentTime,
      type: 'comment',
      content: commentText,
      author: currentUser
    });

    setCommentText('');
  };

  // Handle flag submission
  const handleAddFlag = () => {
    onAddAnnotation({
      timestamp: currentTime,
      type: 'flag',
      status: flagStatus,
      content: `Flagged as ${flagStatus.replace('_', ' ')}`,
      author: currentUser
    });
  };

  // Initialize canvas for drawing
  useEffect(() => {
    if (activeTab === 'drawing' && canvasRef.current && videoElement) {
      const canvas = canvasRef.current;
      const rect = videoElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab, videoElement]);

  // Handle drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    drawingRef.current = {
      tool: drawingTool,
      points: [{ x, y }],
      color: drawingColor,
      strokeWidth: 3
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !drawingRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingRef.current.points.push({ x, y });

    // Draw on canvas
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const points = drawingRef.current.points;
      if (points.length > 1) {
        const lastPoint = points[points.length - 2];
        const currentPoint = points[points.length - 1];
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !drawingRef.current) return;

    setIsDrawing(false);

    // Save drawing annotation
    onAddAnnotation({
      timestamp: currentTime,
      type: 'drawing',
      content: `Drawing annotation with ${drawingTool}`,
      drawing: drawingRef.current,
      author: currentUser
    });

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    drawingRef.current = null;
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500';
      case 'fail':
        return 'bg-red-500';
      case 'needs_review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Annotation Tools Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Annotation Tools</CardTitle>
            <Badge variant="secondary">
              {formatTime(currentTime)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tool Tabs */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={activeTab === 'comment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('comment')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button
              variant={activeTab === 'drawing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('drawing')}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Draw
            </Button>
            <Button
              variant={activeTab === 'flag' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('flag')}
            >
              <Flag className="h-4 w-4 mr-1" />
              Flag
            </Button>
          </div>

          {/* Comment Tab */}
          {activeTab === 'comment' && (
            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment about this moment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          )}

          {/* Drawing Tab */}
          {activeTab === 'drawing' && (
            <div className="space-y-3">
              {/* Drawing Tools */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={drawingTool === 'pen' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setDrawingTool('pen')}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={drawingTool === 'rectangle' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setDrawingTool('rectangle')}
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button
                  variant={drawingTool === 'circle' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setDrawingTool('circle')}
                >
                  <Circle className="h-4 w-4" />
                </Button>
                <Button
                  variant={drawingTool === 'text' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setDrawingTool('text')}
                >
                  <Type className="h-4 w-4" />
                </Button>
                
                <div className="flex-1" />
                
                {/* Color Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: drawingColor }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="grid grid-cols-4 gap-2">
                      {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map(color => (
                        <button
                          key={color}
                          className={cn(
                            'w-8 h-8 rounded border-2',
                            drawingColor === color ? 'border-primary' : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setDrawingColor(color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Drawing Canvas */}
              {videoElement && (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Alert className="m-2">
                    <AlertDescription>
                      Draw on the video to highlight areas. Your drawing will be saved at the current timestamp.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* Flag Tab */}
          {activeTab === 'flag' && (
            <div className="space-y-3">
              <RadioGroup value={flagStatus} onValueChange={(value: any) => setFlagStatus(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pass" id="pass" />
                  <Label htmlFor="pass" className="flex items-center cursor-pointer">
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Pass
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fail" id="fail" />
                  <Label htmlFor="fail" className="flex items-center cursor-pointer">
                    <X className="h-4 w-4 mr-1 text-red-600" />
                    Fail
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="needs_review" id="needs_review" />
                  <Label htmlFor="needs_review" className="flex items-center cursor-pointer">
                    <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                    Needs Review
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={handleAddFlag} className="w-full">
                <Flag className="h-4 w-4 mr-2" />
                Add Flag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Annotations */}
      {currentAnnotations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Annotations at {formatTime(currentTime)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {currentAnnotations.map((annotation) => (
                  <AnnotationItem
                    key={annotation.id}
                    annotation={annotation}
                    isSelected={selectedAnnotation === annotation.id}
                    onSelect={() => setSelectedAnnotation(annotation.id)}
                    onDelete={() => onDeleteAnnotation(annotation.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All Annotations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Annotations</CardTitle>
            <Badge variant="secondary">
              {annotations.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {annotations.map((annotation) => (
                <AnnotationItem
                  key={annotation.id}
                  annotation={annotation}
                  isSelected={selectedAnnotation === annotation.id}
                  onSelect={() => setSelectedAnnotation(annotation.id)}
                  onDelete={() => onDeleteAnnotation(annotation.id)}
                  showTimestamp
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Annotation item component
const AnnotationItem: React.FC<{
  annotation: VideoAnnotation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  showTimestamp?: boolean;
}> = ({ annotation, isSelected, onSelect, onDelete, showTimestamp }) => {
  const getIcon = () => {
    switch (annotation.type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'drawing':
        return <Edit3 className="h-4 w-4" />;
      case 'flag':
        return <Flag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (annotation.status) {
      const colors = {
        pass: 'bg-green-500',
        fail: 'bg-red-500',
        needs_review: 'bg-yellow-500'
      };
      
      return (
        <Badge className={cn('text-xs', colors[annotation.status])}>
          {annotation.status.replace('_', ' ')}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{annotation.author}</span>
              {getStatusBadge()}
              {showTimestamp && (
                <span className="text-xs text-muted-foreground">
                  at {formatTime(annotation.timestamp)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {annotation.content}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}