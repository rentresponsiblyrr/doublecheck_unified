/**
 * OPTIMIZED TOASTER - MINIMAL PERFORMANCE IMPACT
 * 
 * Lightweight toaster implementation that doesn't bloat the bundle.
 * Uses CSS animations for 60fps performance.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface OptimizedToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

// Global toast state (lightweight)
let toasts: Toast[] = [];
let listeners: Set<(toasts: Toast[]) => void> = new Set();

// Toast management functions
export const toast = {
  show: (toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      id: Math.random().toString(36).substring(2, 9),
      duration: 5000,
      ...toast,
    };

    toasts = [newToast, ...toasts.slice(0, 4)]; // Keep max 5 toasts
    listeners.forEach(listener => listener(toasts));

    // Auto-dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(newToast.id);
      }, newToast.duration);
    }

    return newToast.id;
  },

  success: (message: string, title?: string) => 
    toast.show({ type: 'success', description: message, title }),

  error: (message: string, title?: string) => 
    toast.show({ type: 'error', description: message, title }),

  warning: (message: string, title?: string) => 
    toast.show({ type: 'warning', description: message, title }),

  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(listener => listener(toasts));
  },

  clear: () => {
    toasts = [];
    listeners.forEach(listener => listener(toasts));
  },
};

// Toast component
const ToastComponent: React.FC<{ 
  toast: Toast; 
  onDismiss: (id: string) => void;
}> = ({ toast: toastData, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation
    setTimeout(() => onDismiss(toastData.id), 150);
  }, [toastData.id, onDismiss]);

  const typeStyles = {
    default: 'bg-background border-border',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  };

  return (
    <div
      className={cn(
        'relative p-4 border rounded-lg shadow-lg transition-all duration-150 ease-out pointer-events-auto',
        'transform translate-x-0 opacity-100',
        !isVisible && 'translate-x-full opacity-0',
        typeStyles[toastData.type || 'default']
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {toastData.title && (
            <div className="font-medium text-sm mb-1">
              {toastData.title}
            </div>
          )}
          {toastData.description && (
            <div className="text-sm opacity-90">
              {toastData.description}
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-3 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Main toaster component
export const OptimizedToaster: React.FC<OptimizedToasterProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToastsChange = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts.slice(0, maxToasts));
    };

    listeners.add(handleToastsChange);
    handleToastsChange(toasts); // Set initial state

    return () => {
      listeners.delete(handleToastsChange);
    };
  }, [maxToasts]);

  if (currentToasts.length === 0) return null;

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 pointer-events-none',
        'max-w-sm w-full',
        positionStyles[position]
      )}
      aria-label="Notifications"
    >
      {currentToasts.map(toastData => (
        <ToastComponent
          key={toastData.id}
          toast={toastData}
          onDismiss={toast.dismiss}
        />
      ))}
    </div>
  );
};