/**
 * Inspection Workflow Business Logic Hook
 * Extracted from InspectionWorkflowContainer.tsx for surgical refactoring
 */

import { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { PhotoAnalysis } from "@/types/ai-analysis";
import type { DynamicChecklistItem } from "@/lib/ai/dynamic-checklist-generator";

// Professional TypeScript Interfaces
export interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  listingUrl?: string;
  images?: string[];
}

export interface ChecklistData {
  items: DynamicChecklistItem[];
  estimatedTime: number;
  totalItems: number;
}

export interface InspectionStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error";
  required: boolean;
  data?: unknown;
}

// State Management with Reducer Pattern
export interface WorkflowState {
  currentStep: number;
  selectedProperty: Property | null;
  generatedChecklist: ChecklistData | null;
  currentInspectionId: string | null;
  capturedPhotos: Record<
    string,
    { file: File; analysis: PhotoAnalysis | null }
  >;
  isRecording: boolean;
  offlineMode: boolean;
  syncProgress: number;
  syncStatus: string;
  isGeneratingChecklist: boolean;
  inspectionSteps: InspectionStep[];
}

export type WorkflowAction =
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_SELECTED_PROPERTY"; payload: Property | null }
  | { type: "SET_GENERATED_CHECKLIST"; payload: ChecklistData | null }
  | { type: "SET_INSPECTION_ID"; payload: string | null }
  | {
      type: "SET_CAPTURED_PHOTOS";
      payload: Record<string, { file: File; analysis: PhotoAnalysis | null }>;
    }
  | { type: "SET_IS_RECORDING"; payload: boolean }
  | { type: "SET_OFFLINE_MODE"; payload: boolean }
  | { type: "SET_SYNC_PROGRESS"; payload: number }
  | { type: "SET_SYNC_STATUS"; payload: string }
  | { type: "SET_IS_GENERATING_CHECKLIST"; payload: boolean }
  | {
      type: "UPDATE_STEP_STATUS";
      payload: { stepId: string; status: InspectionStep["status"] };
    };

// Professional Reducer Implementation
const workflowReducer = (
  state: WorkflowState,
  action: WorkflowAction,
): WorkflowState => {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_SELECTED_PROPERTY":
      return { ...state, selectedProperty: action.payload };
    case "SET_GENERATED_CHECKLIST":
      return { ...state, generatedChecklist: action.payload };
    case "SET_INSPECTION_ID":
      return { ...state, currentInspectionId: action.payload };
    case "SET_CAPTURED_PHOTOS":
      return { ...state, capturedPhotos: action.payload };
    case "SET_IS_RECORDING":
      return { ...state, isRecording: action.payload };
    case "SET_OFFLINE_MODE":
      return { ...state, offlineMode: action.payload };
    case "SET_SYNC_PROGRESS":
      return { ...state, syncProgress: action.payload };
    case "SET_SYNC_STATUS":
      return { ...state, syncStatus: action.payload };
    case "SET_IS_GENERATING_CHECKLIST":
      return { ...state, isGeneratingChecklist: action.payload };
    case "UPDATE_STEP_STATUS":
      return {
        ...state,
        inspectionSteps: state.inspectionSteps.map((step) =>
          step.id === action.payload.stepId
            ? { ...step, status: action.payload.status }
            : step,
        ),
      };
    default:
      return state;
  }
};

// Initial State Definition
const initialState: WorkflowState = {
  currentStep: 0,
  selectedProperty: null,
  generatedChecklist: null,
  currentInspectionId: null,
  capturedPhotos: {},
  isRecording: false,
  offlineMode: false,
  syncProgress: 0,
  syncStatus: "idle",
  isGeneratingChecklist: false,
  inspectionSteps: [
    {
      id: "property_selection",
      title: "Select Property",
      description: "Choose or add a property for inspection",
      status: "in_progress",
      required: true,
    },
    {
      id: "checklist_generation",
      title: "Generate Checklist",
      description: "AI-powered inspection checklist creation",
      status: "pending",
      required: true,
    },
    {
      id: "photo_capture",
      title: "Photo Documentation",
      description: "Capture photos with AI guidance",
      status: "pending",
      required: true,
    },
    {
      id: "video_walkthrough",
      title: "Video Walkthrough",
      description: "Record comprehensive property walkthrough",
      status: "pending",
      required: false,
    },
    {
      id: "offline_sync",
      title: "Upload & Sync",
      description: "Sync data and media to cloud",
      status: "pending",
      required: true,
    },
  ],
};

export const useInspectionWorkflow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { error, handleError, clearError, withErrorHandling } =
    useErrorHandling();
  const { startTracking, trackEvent } = usePerformanceMonitoring();

  // Professional State Management
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Professional Navigation Handler
  const handleSafeReturn = useCallback(() => {
    try {
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  }, [navigate]);

  // Error Boundary Setup
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      handleError(new Error("Something went wrong. Please try again."));
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
  }, [handleError]);

  // Performance Monitoring Setup
  useEffect(() => {
    const stopTracking = startTracking("inspection_workflow");
    trackEvent("workflow_started", {
      propertyId: searchParams.get("propertyId"),
    });

    return () => stopTracking();
  }, [startTracking, trackEvent, searchParams]);

  // Online Status Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      trackEvent("connection_restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      dispatch({ type: "SET_OFFLINE_MODE", payload: true });
      trackEvent("connection_lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [trackEvent]);

  // Professional Event Handlers
  const handlePropertySelect = useCallback(
    async (property: Property) => {
      await withErrorHandling(async () => {
        dispatch({ type: "SET_SELECTED_PROPERTY", payload: property });
        dispatch({
          type: "UPDATE_STEP_STATUS",
          payload: { stepId: "property_selection", status: "completed" },
        });
        dispatch({
          type: "UPDATE_STEP_STATUS",
          payload: { stepId: "checklist_generation", status: "in_progress" },
        });

        trackEvent("property_selected", {
          propertyId: property.id,
          propertyType: property.type,
        });
      });
    },
    [withErrorHandling, trackEvent],
  );

  const handleChecklistGenerated = useCallback(
    async (checklist: ChecklistData) => {
      await withErrorHandling(async () => {
        if (!checklist) {
          // Regeneration request
          dispatch({ type: "SET_IS_GENERATING_CHECKLIST", payload: true });
          return;
        }

        dispatch({ type: "SET_GENERATED_CHECKLIST", payload: checklist });
        dispatch({
          type: "UPDATE_STEP_STATUS",
          payload: { stepId: "checklist_generation", status: "completed" },
        });
        dispatch({
          type: "UPDATE_STEP_STATUS",
          payload: { stepId: "photo_capture", status: "in_progress" },
        });

        trackEvent("checklist_generated", {
          itemCount: checklist.totalItems,
          estimatedTime: checklist.estimatedTime,
        });
      });
    },
    [withErrorHandling, trackEvent],
  );

  const handleStepNavigation = useCallback(
    (direction: "next" | "back") => {
      const newStep =
        direction === "next"
          ? Math.min(state.currentStep + 1, state.inspectionSteps.length - 1)
          : Math.max(state.currentStep - 1, 0);

      dispatch({ type: "SET_CURRENT_STEP", payload: newStep });

      trackEvent("step_navigation", {
        direction,
        fromStep: state.currentStep,
        toStep: newStep,
        stepId: state.inspectionSteps[newStep]?.id,
      });
    },
    [state.currentStep, state.inspectionSteps, trackEvent],
  );

  return {
    // State
    state,
    dispatch,
    isOnline,
    error,
    user,

    // Actions
    handleSafeReturn,
    handlePropertySelect,
    handleChecklistGenerated,
    handleStepNavigation,
    clearError,

    // Navigation
    navigate,
  };
};
