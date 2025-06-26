
import { useState, useEffect, memo } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { CompletedChecklistItem } from "@/components/CompletedChecklistItem";
import { ChecklistItemCard } from "@/components/ChecklistItemCard";
import { OptimizedChecklistItemCore } from "@/components/OptimizedChecklistItemCore";

interface OptimizedChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
  priority?: 'high' | 'medium' | 'low';
}

export const OptimizedChecklistItem = memo(({ item, onComplete, priority = 'medium' }: OptimizedChecklistItemProps) => {
  const [isInView, setIsInView] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  const isCompleted = item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable';

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Optimized intersection observer for mobile performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { 
        threshold: 0.3, // Trigger earlier for better mobile UX
        rootMargin: '50px' // Load before fully visible
      }
    );

    const element = document.getElementById(`checklist-item-${item.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [item.id]);

  // If item is completed, show the completed state component
  if (isCompleted) {
    return <CompletedChecklistItem item={item} onComplete={onComplete} />;
  }

  return (
    <ChecklistItemCard
      itemId={item.id}
      priority={priority}
      networkStatus={networkStatus}
    >
      <OptimizedChecklistItemCore
        item={item}
        onComplete={onComplete}
        networkStatus={networkStatus}
        isInView={isInView}
      />
    </ChecklistItemCard>
  );
});

OptimizedChecklistItem.displayName = 'OptimizedChecklistItem';
