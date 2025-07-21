/**
 * Workflow Gesture Controller
 * Advanced mobile gesture handling for inspector workflow
 */

import React, { useRef, useCallback, useEffect, ReactNode } from 'react';
import { useInspectorWorkflowStateMachine } from '../../hooks/useInspectorWorkflowStateMachine';
import { hapticFeedback } from '../../lib/mobile/haptic-feedback';

interface WorkflowGestureControllerProps {
  children: ReactNode;
  onGesture?: (gesture: GestureType, data?: any) => void;
  enableGestures?: boolean;
}

type GestureType = 
  | 'swipe_right' 
  | 'swipe_left' 
  | 'pull_to_refresh' 
  | 'long_press'
  | 'pinch_zoom'
  | 'double_tap';

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
  isPinching: boolean;
}

export const WorkflowGestureController: React.FC<WorkflowGestureControllerProps> = ({
  children,
  onGesture,
  enableGestures = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchDataRef = useRef<TouchData | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { state, transitionTo, canTransitionTo } = useInspectorWorkflowStateMachine();

  // Gesture sensitivity constants
  const SWIPE_THRESHOLD = 50;
  const SWIPE_VELOCITY_THRESHOLD = 0.5;
  const LONG_PRESS_DURATION = 500;
  const PULL_REFRESH_THRESHOLD = 100;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableGestures || e.touches.length > 2) return;

    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isLongPress: false,
      isPinching: e.touches.length === 2
    };

    // Start long press timer
    if (e.touches.length === 1) {
      longPressTimerRef.current = setTimeout(() => {
        if (touchDataRef.current) {
          touchDataRef.current.isLongPress = true;
          handleLongPress(touch.clientX, touch.clientY);
        }
      }, LONG_PRESS_DURATION);
    }
  }, [enableGestures]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enableGestures || !touchDataRef.current) return;

    // Cancel long press if finger moves too much
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchDataRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchDataRef.current.startY);
    
    if ((deltaX > 10 || deltaY > 10) && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [enableGestures]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enableGestures || !touchDataRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchDataRef.current.startX;
    const deltaY = touch.clientY - touchDataRef.current.startY;
    const deltaTime = Date.now() - touchDataRef.current.startTime;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle different gesture types
    if (!touchDataRef.current.isLongPress && velocity > SWIPE_VELOCITY_THRESHOLD) {
      // Swipe gestures
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      }
      
      // Pull to refresh
      if (deltaY > PULL_REFRESH_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
        handlePullToRefresh();
      }
    }

    // Reset touch data
    touchDataRef.current = null;
  }, [enableGestures]);

  const handleSwipeRight = useCallback(() => {
    hapticFeedback.impact('light');
    
    // Navigate to next step in workflow
    switch (state) {
      case 'property_creation_complete':
        if (canTransitionTo({ type: 'START_SCRAPING', payload: { url: '' } })) {
          onGesture?.('swipe_right', { action: 'start_scraping' });
        }
        break;
      case 'scraping_complete':
        if (canTransitionTo({ type: 'SELECT_PROPERTY', payload: { propertyId: '' } })) {
          onGesture?.('swipe_right', { action: 'property_selection' });
        }
        break;
      case 'property_selected':
        if (canTransitionTo({ type: 'CREATE_INSPECTION' })) {
          onGesture?.('swipe_right', { action: 'create_inspection' });
        }
        break;
    }
  }, [state, canTransitionTo, onGesture]);

  const handleSwipeLeft = useCallback(() => {
    hapticFeedback.impact('light');
    
    // Navigate to previous step or cancel current action
    onGesture?.('swipe_left', { action: 'go_back' });
  }, [onGesture]);

  const handleLongPress = useCallback((x: number, y: number) => {
    hapticFeedback.impact('medium');
    
    // Show context menu or detailed options
    onGesture?.('long_press', { 
      action: 'show_context_menu',
      position: { x, y },
      currentState: state
    });
  }, [onGesture, state]);

  const handlePullToRefresh = useCallback(() => {
    hapticFeedback.impact('light');
    
    // Refresh current workflow stage
    switch (state) {
      case 'scraping_failed':
        onGesture?.('pull_to_refresh', { action: 'retry_scraping' });
        break;
      case 'property_selection':
        onGesture?.('pull_to_refresh', { action: 'refresh_properties' });
        break;
      default:
        onGesture?.('pull_to_refresh', { action: 'refresh_current_stage' });
    }
  }, [state, onGesture]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableGestures) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableGestures, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="workflow-gesture-container h-full w-full relative"
      style={{
        touchAction: enableGestures ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {children}
      
      {/* Gesture feedback overlay */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Visual feedback for gestures can be added here */}
      </div>
    </div>
  );
};
