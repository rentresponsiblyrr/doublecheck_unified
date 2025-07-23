/**
 * Production Inspection Business Logic Hook
 * Extracted from ProductionInspectionWorkflow.tsx for surgical refactoring
 */

import { useState, useEffect } from "react";
import {
  productionDb,
  ProductionProperty,
  ProductionSafetyItem,
} from "@/services/productionDatabaseService";
import { logger as log } from "@/lib/utils/logger";

interface InspectionState {
  currentStep:
    | "property-selection"
    | "inspection-active"
    | "checklist-completion"
    | "submission";
  selectedProperty: ProductionProperty | null;
  inspectionId: string | null;
  checklistItems: ProductionSafetyItem[];
  completedItems: string[];
  notes: Record<string, string>;
}

export const useProductionInspection = () => {
  const [inspectionState, setInspectionState] = useState<InspectionState>({
    currentStep: "property-selection",
    selectedProperty: null,
    inspectionId: null,
    checklistItems: [],
    completedItems: [],
    notes: {},
  });

  const [properties, setProperties] = useState<ProductionProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const propertyList = await productionDb.getAllProperties();
      setProperties(propertyList);

      const role = await productionDb.getCurrentUserRole();
      setCurrentUser(role);

      log.info("Initial data loaded successfully", {
        component: "useProductionInspection",
        action: "loadInitialData",
        propertyCount: propertyList.length,
        userRole: role,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load initial data";
      setError(errorMessage);

      log.error("Failed to load initial data", err as Error, {
        component: "useProductionInspection",
        action: "loadInitialData",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelection = async (property: ProductionProperty) => {
    try {
      setLoading(true);
      setError(null);

      const inspectionId = await productionDb.createInspection(
        property.property_id,
      );
      const safetyItems = await productionDb.getAllSafetyItems();
      const requiredItems = safetyItems.filter((item) => item.required);

      setInspectionState({
        currentStep: "inspection-active",
        selectedProperty: property,
        inspectionId,
        checklistItems: requiredItems,
        completedItems: [],
        notes: {},
      });

      log.info("Inspection started successfully", {
        component: "useProductionInspection",
        action: "startInspection",
        propertyId: property.property_id,
        inspectionId,
        checklistItemCount: requiredItems.length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start inspection";
      setError(errorMessage);

      log.error("Failed to start inspection", err as Error, {
        component: "useProductionInspection",
        action: "startInspection",
        propertyId: property.property_id,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemCompletion = (
    itemId: string,
    completed: boolean,
    notes?: string,
  ) => {
    setInspectionState((prev) => {
      const newCompletedItems = completed
        ? [...prev.completedItems.filter((id) => id !== itemId), itemId]
        : prev.completedItems.filter((id) => id !== itemId);

      const newNotes = notes ? { ...prev.notes, [itemId]: notes } : prev.notes;

      return {
        ...prev,
        completedItems: newCompletedItems,
        notes: newNotes,
      };
    });

    log.info("Checklist item updated", {
      component: "useProductionInspection",
      action: "updateChecklistItem",
      itemId,
      completed,
      hasNotes: !!notes,
    });
  };

  const handleInspectionSubmission = async () => {
    try {
      setLoading(true);
      setError(null);

      setInspectionState((prev) => ({
        ...prev,
        currentStep: "submission",
      }));

      log.info("Inspection submitted successfully", {
        component: "useProductionInspection",
        action: "submitInspection",
        inspectionId: inspectionState.inspectionId,
        completedItemsCount: inspectionState.completedItems.length,
        totalItemsCount: inspectionState.checklistItems.length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit inspection";
      setError(errorMessage);

      log.error("Failed to submit inspection", err as Error, {
        component: "useProductionInspection",
        action: "submitInspection",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetWorkflow = () => {
    setInspectionState({
      currentStep: "property-selection",
      selectedProperty: null,
      inspectionId: null,
      checklistItems: [],
      completedItems: [],
      notes: {},
    });
    setError(null);
  };

  const getCompletionPercentage = () => {
    if (inspectionState.checklistItems.length === 0) return 0;
    return Math.round(
      (inspectionState.completedItems.length /
        inspectionState.checklistItems.length) *
        100,
    );
  };

  return {
    inspectionState,
    properties,
    loading,
    error,
    currentUser,
    loadInitialData,
    handlePropertySelection,
    handleItemCompletion,
    handleInspectionSubmission,
    resetWorkflow,
    getCompletionPercentage,
  };
};
