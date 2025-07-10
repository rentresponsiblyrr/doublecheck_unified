
import { useEffect } from "react";
import { useInspectorPresence } from "@/hooks/useInspectorPresence";

interface ChecklistItemPresenceTrackerProps {
  itemId: string;
  inspectionId: string;
  isInView: boolean;
  isUploading: boolean;
  currentNotes: string;
}

export const ChecklistItemPresenceTracker = ({
  itemId,
  inspectionId,
  isInView,
  isUploading,
  currentNotes
}: ChecklistItemPresenceTrackerProps) => {
  // const { updatePresence } = useInspectorPresence(inspectionId); // DISABLED - missing table
  const updatePresence = () => {}; // Placeholder

  // Update presence when user starts working on item
  useEffect(() => {
    if (isInView && (isUploading || currentNotes.length > 0)) {
      updatePresence('working', itemId, { 
        hasNotes: currentNotes.length > 0,
        isUploading 
      });
    }
  }, [isInView, isUploading, currentNotes, itemId, updatePresence]);

  // Update presence when item comes into view
  useEffect(() => {
    if (isInView) {
      updatePresence('viewing', itemId);
    }
  }, [isInView, itemId, updatePresence]);

  return null; // This is a logic-only component
};
