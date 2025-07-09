// Photo Guidance Overlay Component for STR Certified Mobile Capture

import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  Grid3X3,
  Focus,
  Sun,
  Move,
  ZoomIn,
  Eye,
  ChevronRight
} from 'lucide-react';
import type { PhotoGuidance, GuidanceMessage, OverlayGuide } from '@/types/photo';
import { cn } from '@/lib/utils';

interface PhotoGuidanceOverlayProps {
  guidance: PhotoGuidance;
  referencePhotoUrl?: string;
  onCapture: () => void;
  onRetake: () => void;
  isCapturing?: boolean;
  showReferencePhoto?: boolean;
  className?: string;
}

export const PhotoGuidanceOverlay: React.FC<PhotoGuidanceOverlayProps> = ({
  guidance,
  referencePhotoUrl,
  onCapture,
  onRetake,
  isCapturing = false,
  showReferencePhoto = true,
  className
}) => {
  const [showReference, setShowReference] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Cycle through messages
  useEffect(() => {
    if (guidance.messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => 
          (prev + 1) % guidance.messages.length
        );
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [guidance.messages.length]);

  const primaryMessage = guidance.messages[currentMessageIndex] || guidance.messages[0];

  const getMessageIcon = (type: GuidanceMessage['type']) => {
    switch (type) {
      case 'error':
        return <X className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <Check className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getMessageStyle = (type: GuidanceMessage['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/90 text-white';
      case 'warning':
        return 'bg-yellow-500/90 text-white';
      case 'success':
        return 'bg-green-500/90 text-white';
      default:
        return 'bg-blue-500/90 text-white';
    }
  };

  const getActionIcon = (action?: string) => {
    if (!action) return null;
    
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('focus')) return <Focus className="h-4 w-4" />;
    if (lowerAction.includes('light')) return <Sun className="h-4 w-4" />;
    if (lowerAction.includes('move') || lowerAction.includes('step')) return <Move className="h-4 w-4" />;
    if (lowerAction.includes('closer')) return <ZoomIn className="h-4 w-4" />;
    return <ChevronRight className="h-4 w-4" />;
  };

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Overlay Guides */}
      <div className="absolute inset-0 pointer-events-none">
        {guidance.overlayGuides?.map((guide, index) => (
          <OverlayGuideElement key={index} guide={guide} />
        ))}
      </div>

      {/* Reference Photo Toggle */}
      {showReferencePhoto && referencePhotoUrl && (
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReference(!showReference)}
            className="shadow-lg"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showReference ? 'Hide' : 'Show'} Reference
          </Button>
        </div>
      )}

      {/* Reference Photo */}
      {showReference && referencePhotoUrl && (
        <div className="absolute top-16 left-4 z-20 w-32 h-24 md:w-48 md:h-36">
          <Card className="overflow-hidden shadow-xl">
            <img
              src={referencePhotoUrl}
              alt="Reference"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
              Reference Photo
            </div>
          </Card>
        </div>
      )}

      {/* Quality Score */}
      <div className="absolute top-4 right-4 z-20">
        <div className={cn(
          'px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm',
          guidance.isAcceptable ? 'bg-green-500/90' : 'bg-red-500/90'
        )}>
          <div className="text-white text-center">
            <div className="text-2xl font-bold">{guidance.qualityScore}%</div>
            <div className="text-xs">Quality Score</div>
          </div>
        </div>
      </div>

      {/* Main Guidance Message */}
      {primaryMessage && (
        <div className="absolute bottom-32 left-4 right-4 z-20">
          <Alert className={cn(
            'shadow-xl border-0',
            getMessageStyle(primaryMessage.type)
          )}>
            <div className="flex items-center space-x-2">
              {getMessageIcon(primaryMessage.type)}
              <AlertDescription className="flex-1 text-white font-medium">
                {primaryMessage.message}
              </AlertDescription>
            </div>
            {primaryMessage.action && (
              <div className="mt-2 flex items-center space-x-2 text-white/90">
                {getActionIcon(primaryMessage.action)}
                <span className="text-sm">{primaryMessage.action}</span>
              </div>
            )}
          </Alert>
        </div>
      )}

      {/* Message Indicators */}
      {guidance.messages.length > 1 && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center space-x-1 z-20">
          {guidance.messages.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                index === currentMessageIndex
                  ? 'bg-white'
                  : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}

      {/* Capture Controls */}
      <div className="absolute bottom-4 left-0 right-0 z-20">
        <div className="flex items-center justify-center space-x-4">
          {/* Retake Button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={onRetake}
            disabled={isCapturing}
            className="shadow-xl"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Retake
          </Button>

          {/* Capture Button */}
          <Button
            variant={guidance.isAcceptable ? 'default' : 'destructive'}
            size="lg"
            onClick={onCapture}
            disabled={isCapturing || !guidance.isAcceptable}
            className="shadow-xl min-w-[150px]"
          >
            {isCapturing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                {guidance.isAcceptable ? 'Capture Photo' : 'Quality Too Low'}
              </>
            )}
          </Button>
        </div>

        {/* Status Text */}
        <div className="mt-2 text-center">
          <Badge
            variant={guidance.isAcceptable ? 'default' : 'destructive'}
            className="shadow-lg"
          >
            {guidance.isAcceptable ? 'Photo Acceptable' : 'Please Improve Photo'}
          </Badge>
        </div>
      </div>

      {/* Improvement Suggestions (Mobile Optimized) */}
      {!guidance.isAcceptable && guidance.messages.length > 0 && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <Card className="bg-black/70 backdrop-blur-sm text-white p-3">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Quick Tips
            </h4>
            <ul className="space-y-1 text-xs">
              {guidance.messages
                .filter(m => m.type !== 'error' && m.action)
                .slice(0, 3)
                .map((msg, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-yellow-400">•</span>
                    <span>{msg.action}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

// Overlay Guide Element Component
const OverlayGuideElement: React.FC<{ guide: OverlayGuide }> = ({ guide }) => {
  const renderGuide = () => {
    switch (guide.type) {
      case 'grid':
        return <GridOverlay color={guide.color} opacity={guide.opacity} />;
      
      case 'frame':
        return guide.coordinates ? (
          <FrameOverlay
            coordinates={guide.coordinates}
            color={guide.color}
            opacity={guide.opacity}
            label={guide.label}
          />
        ) : null;
      
      case 'arrow':
        return guide.coordinates ? (
          <ArrowOverlay
            coordinates={guide.coordinates}
            color={guide.color}
            label={guide.label}
          />
        ) : null;
      
      case 'highlight':
        return guide.coordinates ? (
          <HighlightOverlay
            coordinates={guide.coordinates}
            color={guide.color}
            opacity={guide.opacity}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return <>{renderGuide()}</>;
};

// Grid Overlay (Rule of Thirds)
const GridOverlay: React.FC<{
  color?: string;
  opacity?: number;
}> = ({ color = '#00ff00', opacity = 0.3 }) => {
  return (
    <svg className="absolute inset-0 w-full h-full">
      <defs>
        <pattern id="grid" width="33.33%" height="33.33%">
          <rect width="100%" height="100%" fill="none" stroke={color} strokeWidth="1" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke={color} strokeWidth="2" opacity={opacity} />
      <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke={color} strokeWidth="2" opacity={opacity} />
      <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke={color} strokeWidth="2" opacity={opacity} />
      <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke={color} strokeWidth="2" opacity={opacity} />
    </svg>
  );
};

// Frame Overlay (Focus Area)
const FrameOverlay: React.FC<{
  coordinates: { x: number; y: number; width: number; height: number };
  color?: string;
  opacity?: number;
  label?: string;
}> = ({ coordinates, color = '#ff0000', opacity = 0.5, label }) => {
  return (
    <div
      className="absolute border-2 rounded"
      style={{
        left: `${coordinates.x}%`,
        top: `${coordinates.y}%`,
        width: `${coordinates.width}%`,
        height: `${coordinates.height}%`,
        borderColor: color,
        opacity
      }}
    >
      {label && (
        <div
          className="absolute -top-6 left-0 px-2 py-1 text-xs font-medium rounded"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// Arrow Overlay (Directional Guidance)
const ArrowOverlay: React.FC<{
  coordinates: { x: number; y: number; width: number; height: number };
  color?: string;
  label?: string;
}> = ({ coordinates, color = '#ffff00', label }) => {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: `${coordinates.x}%`,
        top: `${coordinates.y}%`,
        width: `${coordinates.width}%`,
        height: `${coordinates.height}%`
      }}
    >
      <div className="relative">
        <ChevronRight className="h-12 w-12" style={{ color }} />
        {label && (
          <div
            className="absolute top-full mt-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap"
            style={{ backgroundColor: color, color: 'black' }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

// Highlight Overlay (Area of Interest)
const HighlightOverlay: React.FC<{
  coordinates: { x: number; y: number; width: number; height: number };
  color?: string;
  opacity?: number;
}> = ({ coordinates, color = '#00ff00', opacity = 0.2 }) => {
  return (
    <div
      className="absolute rounded"
      style={{
        left: `${coordinates.x}%`,
        top: `${coordinates.y}%`,
        width: `${coordinates.width}%`,
        height: `${coordinates.height}%`,
        backgroundColor: color,
        opacity
      }}
    />
  );
};

// Simplified Mobile Version
export const MobilePhotoGuidance: React.FC<{
  isAcceptable: boolean;
  qualityScore: number;
  primaryMessage?: string;
  onCapture: () => void;
  isCapturing?: boolean;
}> = ({
  isAcceptable,
  qualityScore,
  primaryMessage,
  onCapture,
  isCapturing = false
}) => {
  return (
    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      {/* Quality Indicator */}
      <div className="text-center mb-4">
        <div className={cn(
          'inline-flex items-center space-x-2 px-4 py-2 rounded-full',
          isAcceptable ? 'bg-green-500' : 'bg-red-500'
        )}>
          {isAcceptable ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <X className="h-5 w-5 text-white" />
          )}
          <span className="text-white font-medium">{qualityScore}%</span>
        </div>
      </div>

      {/* Message */}
      {primaryMessage && (
        <p className="text-white text-center text-sm mb-4">
          {primaryMessage}
        </p>
      )}

      {/* Capture Button */}
      <Button
        variant={isAcceptable ? 'default' : 'secondary'}
        size="lg"
        onClick={onCapture}
        disabled={isCapturing || !isAcceptable}
        className="w-full"
      >
        {isCapturing ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Camera className="h-5 w-5 mr-2" />
            {isAcceptable ? 'Take Photo' : 'Improve Quality First'}
          </>
        )}
      </Button>
    </div>
  );
};