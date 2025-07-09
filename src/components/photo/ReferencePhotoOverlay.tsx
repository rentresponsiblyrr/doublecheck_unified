// Reference Photo Overlay Component for STR Certified

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  X,
  Move,
  Maximize2,
  Minimize2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Unlock,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferencePhotoOverlayProps {
  photoUrl: string;
  opacity?: number;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onOpacityChange?: (opacity: number) => void;
  onClose?: () => void;
  allowResize?: boolean;
  allowRotate?: boolean;
  allowFlip?: boolean;
  locked?: boolean;
  className?: string;
}

export const ReferencePhotoOverlay: React.FC<ReferencePhotoOverlayProps> = ({
  photoUrl,
  opacity = 30,
  initialPosition = { x: 20, y: 20 },
  initialSize = { width: 200, height: 150 },
  onOpacityChange,
  onClose,
  allowResize = true,
  allowRotate = true,
  allowFlip = true,
  locked = false,
  className
}) => {
  // State
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLocked, setIsLocked] = useState(locked);
  const [currentOpacity, setCurrentOpacity] = useState(opacity);

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

  // Handle opacity changes
  useEffect(() => {
    setCurrentOpacity(opacity);
  }, [opacity]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked || isMinimized) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    positionStartRef.current = { ...position };
  };

  // Handle drag move
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    setPosition({
      x: positionStartRef.current.x + deltaX,
      y: positionStartRef.current.y + deltaY
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked || !allowResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    resizeStartRef.current = {
      width: size.width,
      height: size.height,
      x: clientX,
      y: clientY
    };
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStartRef.current.x;
    const deltaY = clientY - resizeStartRef.current.y;
    
    // Maintain aspect ratio
    const aspectRatio = resizeStartRef.current.width / resizeStartRef.current.height;
    const newWidth = Math.max(100, resizeStartRef.current.width + deltaX);
    const newHeight = newWidth / aspectRatio;
    
    setSize({
      width: newWidth,
      height: newHeight
    });
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Set up global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove);
      document.addEventListener('touchend', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.removeEventListener('touchmove', handleResizeMove);
        document.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove]);

  // Handle rotation
  const handleRotate = () => {
    if (isLocked) return;
    setRotation((prev) => (prev + 90) % 360);
  };

  // Handle flip
  const handleFlipH = () => {
    if (isLocked) return;
    setFlipH(!flipH);
  };

  const handleFlipV = () => {
    if (isLocked) return;
    setFlipV(!flipV);
  };

  // Handle opacity change
  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setCurrentOpacity(newOpacity);
    onOpacityChange?.(newOpacity);
  };

  // Calculate transform
  const transform = `
    rotate(${rotation}deg)
    scaleX(${flipH ? -1 : 1})
    scaleY(${flipV ? -1 : 1})
  `;

  if (isMinimized) {
    return (
      <div
        className="fixed top-4 left-4 z-40"
        style={{ left: position.x, top: position.y }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="shadow-lg"
        >
          <Layers className="h-4 w-4 mr-1" />
          Reference
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        'absolute z-30 select-none',
        isDragging && 'cursor-move',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
    >
      <Card className="relative w-full h-full overflow-hidden shadow-xl bg-black/20 backdrop-blur-sm">
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => setIsLocked(!isLocked)}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>
              
              {allowRotate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={handleRotate}
                  disabled={isLocked}
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              )}
              
              {allowFlip && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={handleFlipH}
                    disabled={isLocked}
                  >
                    <FlipHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={handleFlipV}
                    disabled={isLocked}
                  >
                    <FlipVertical className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={onClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Photo Container */}
        <div
          className="relative w-full h-full cursor-move"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <img
            src={photoUrl}
            alt="Reference"
            className="w-full h-full object-cover"
            style={{
              opacity: currentOpacity / 100,
              transform,
              transformOrigin: 'center'
            }}
            draggable={false}
          />
          
          {/* Resize Handle */}
          {allowResize && !isLocked && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-white/50 cursor-se-resize"
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            />
          )}
        </div>

        {/* Opacity Control */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2">
          <div className="flex items-center space-x-2">
            <EyeOff className="h-3 w-3 text-white/60" />
            <Slider
              value={[currentOpacity]}
              onValueChange={handleOpacityChange}
              min={0}
              max={100}
              step={5}
              className="flex-1"
              disabled={isLocked}
            />
            <Eye className="h-3 w-3 text-white" />
            <span className="text-xs text-white min-w-[3ch]">{currentOpacity}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Simplified static reference photo
export const StaticReferencePhoto: React.FC<{
  photoUrl: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  onToggle?: () => void;
}> = ({
  photoUrl,
  position = 'top-left',
  size = 'small',
  onToggle
}) => {
  const sizeClasses = {
    small: 'w-24 h-18',
    medium: 'w-32 h-24',
    large: 'w-48 h-36'
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={cn(
      'fixed z-20',
      positionClasses[position]
    )}>
      <Card className={cn(
        'overflow-hidden shadow-xl cursor-pointer',
        sizeClasses[size]
      )}
      onClick={onToggle}
      >
        <img
          src={photoUrl}
          alt="Reference"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-xs text-white font-medium">Reference</p>
        </div>
      </Card>
    </div>
  );
};

// Mobile-optimized reference toggle
export const MobileReferenceToggle: React.FC<{
  photoUrl: string;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ photoUrl, isVisible, onToggle }) => {
  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 right-4 z-30 shadow-lg"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {/* Reference Photo */}
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-20">
          <img
            src={photoUrl}
            alt="Reference"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      )}
    </>
  );
};