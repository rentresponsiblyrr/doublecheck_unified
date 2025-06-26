
import { useState, useEffect } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { ChecklistItemCore } from "@/components/ChecklistItemCore";
import { ChecklistItemPresenceTracker } from "@/components/ChecklistItemPresenceTracker";
import { CompletedChecklistItem } from "@/components/CompletedChecklistItem";

interface ChecklistItemContainerProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const ChecklistItemContainer = ({ item, onComplete }: ChecklistItemContainerProps) => {
  const [isInView, setIsInView] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);

  const isCompleted = item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable';

  // Track when this item comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
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
    <>
      <div 
        id={`checklist-item-${item.id}`}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <ChecklistItemCore
          item={item}
          onComplete={onComplete}
          onNotesChange={setCurrentNotes}
          onUploadingChange={setIsUploading}
        />
      </div>

      {/* Presence Tracking */}
      <ChecklistItemPresenceTracker
        itemId={item.id}
        inspectionId={item.inspection_id}
        isInView={isInView}
        isUploading={isUploading}
        currentNotes={currentNotes}
      />
    </>
  );
};
