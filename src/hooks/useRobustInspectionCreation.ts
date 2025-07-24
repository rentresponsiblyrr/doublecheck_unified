/**
 * BULLETPROOF INSPECTION CREATION - REPLACING COMPLEX SERVICE
 * 
 * This hook now uses the simple flow to prevent ErrorRecoveryService loops.
 * Direct replacement for the old complex InspectionCreationService.
 */

import { useSimpleInspectionFlow } from "@/hooks/useSimpleInspectionFlow";

export const useRobustInspectionCreation = () => {
  const { startOrResumeInspection, isLoading, error } = useSimpleInspectionFlow();

  const createInspection = async (propertyId: string) => {
    console.log("🔄 ROBUST INSPECTION CREATION - USING SIMPLE FLOW", {
      propertyId,
      timestamp: new Date().toISOString(),
    });

    // Use the bulletproof simple flow instead of complex service
    const result = await startOrResumeInspection(propertyId);
    
    if (result) {
      console.log("✅ Robust creation succeeded via simple flow", { inspectionId: result });
      return result;
    } else {
      console.log("❌ Robust creation failed gracefully (no loops)");
      return null;
    }
  };

  return {
    createInspection,
    isCreating: isLoading, // Map to old interface
  };
};
