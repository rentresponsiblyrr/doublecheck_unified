/**
 * SIMPLE BULLETPROOF INSPECTION FLOW
 * 
 * Completely bypasses ErrorRecoveryService to prevent refresh loops.
 * Simple, direct logic with comprehensive error handling.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface InspectionFlowState {
  isLoading: boolean;
  error: string | null;
}

export const useSimpleInspectionFlow = () => {
  const [state, setState] = useState<InspectionFlowState>({
    isLoading: false,
    error: null,
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const startOrResumeInspection = useCallback(async (propertyId: string) => {
    setState({ isLoading: true, error: null });

    try {
      console.log("🚀 SIMPLE INSPECTION FLOW STARTED", {
        propertyId,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Get current user (no throwing, just logging)
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.log("❌ Auth check failed", { authError });
        toast({
          title: "Authentication Required",
          description: "Please sign in to start inspections.",
          variant: "destructive",
        });
        setState({ isLoading: false, error: "Authentication required" });
        return null;
      }

      const userId = authData.user.id;
      console.log("✅ User authenticated", { userId });

      // Step 2: Check for ANY existing inspection for this property by this user
      console.log("🔍 Checking for existing inspections...");
      
      const { data: existingInspections, error: queryError } = await supabase
        .from("inspections")
        .select("id, status, created_at")
        .eq("property_id", propertyId)
        .eq("inspector_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) {
        console.log("❌ Query error (non-fatal)", { queryError });
        // Don't fail here - continue to create new inspection
      }

      // Step 3: If we found existing inspections, try to resume the most recent one
      if (existingInspections && existingInspections.length > 0) {
        const latestInspection = existingInspections[0];
        
        console.log("🔄 Found existing inspection", {
          inspectionId: latestInspection.id,
          status: latestInspection.status,
        });

        // Only resume if it's not in final states
        if (!["cancelled", "approved"].includes(latestInspection.status)) {
          console.log("✅ Resuming existing inspection");
          
          const inspectionUrl = `/inspection/${latestInspection.id}`;
          navigate(inspectionUrl);
          
          toast({
            title: "Resuming Inspection",
            description: `Continuing your ${latestInspection.status} inspection.`,
          });
          
          setState({ isLoading: false, error: null });
          return latestInspection.id;
        }
        
        console.log("⚠️ Existing inspection is in final state, will create new one");
      }

      // Step 4: Create new inspection using our simple service
      console.log("🆕 Creating new inspection using SimpleInspectionService...");
      
      const { SimpleInspectionService } = await import("@/services/simpleInspectionService");
      const result = await SimpleInspectionService.createInspection({
        propertyId,
        inspectorId: userId,
      });

      if (!result.success) {
        console.log("🚨 Failed to create inspection", { error: result.error });
        toast({
          title: "Unable to Create Inspection",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        setState({ isLoading: false, error: result.error || "Failed to create inspection" });
        return null;
      }

      const newInspection = { id: result.inspectionId };
      const insertError = null;

      // Error handling is done above in the service result check
      if (insertError) {
        // This should never happen now but kept for safety
        toast({
          title: "Unable to Create Inspection",
          description: "Database error occurred. Please try again in a moment.",
          variant: "destructive",
        });
        setState({ isLoading: false, error: insertError.message });
        return null;
      }

      if (!newInspection?.id) {
        console.log("❌ No inspection ID returned");
        toast({
          title: "Creation Failed",
          description: "No inspection ID was returned. Please try again.",
          variant: "destructive",
        });
        setState({ isLoading: false, error: "No inspection ID returned" });
        return null;
      }

      console.log("✅ New inspection created", { inspectionId: newInspection.id });

      // Step 5: Navigate to the new inspection
      const inspectionUrl = `/inspection/${newInspection.id}`;
      navigate(inspectionUrl);
      
      toast({
        title: "Inspection Started",
        description: "New inspection created successfully!",
      });

      setState({ isLoading: false, error: null });
      return newInspection.id;

    } catch (error) {
      // CRITICAL: Never throw errors - always handle gracefully
      console.log("🚨 SIMPLE FLOW ERROR (HANDLED)", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Inspection Flow Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });

      setState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      return null;
    }
  }, [navigate, toast]);

  return {
    startOrResumeInspection,
    isLoading: state.isLoading,
    error: state.error,
  };
};