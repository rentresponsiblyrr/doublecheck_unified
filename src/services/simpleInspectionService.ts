/**
 * Simple Inspection Service - Direct Database Operations
 * No RPC complexity, just straightforward Supabase calls
 */

import { supabase } from "@/integrations/supabase/client";
import { debugLogger } from "@/utils/debugLogger";

export interface CreateInspectionParams {
  propertyId: string;
  inspectorId?: string;
  scrapedData?: any; // ScrapedPropertyData from VRBO
}

export interface InspectionResult {
  success: boolean;
  inspectionId?: string;
  error?: string;
}

export class SimpleInspectionService {
  /**
   * Create an inspection with direct database operations
   * No RPC, no complexity, just simple inserts
   */
  static async createInspection({
    propertyId,
    inspectorId,
    scrapedData,
  }: CreateInspectionParams): Promise<InspectionResult> {
    try {
      // Get current user if no inspector provided
      let finalInspectorId = inspectorId;
      if (!finalInspectorId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            error: "You must be logged in to create an inspection",
          };
        }
        finalInspectorId = user.id;
      }

      // Check if property exists
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, name")
        .eq("id", propertyId)
        .single();

      if (propertyError || !property) {
        debugLogger.error("simpleInspectionService", "Property not found", propertyError);
        return {
          success: false,
          error: "Property not found. Please select a valid property.",
        };
      }

      // Check for existing active inspection
      const { data: existingInspection } = await supabase
        .from("inspections")
        .select("id")
        .eq("property_id", propertyId)
        .in("status", ["in_progress", "draft"])
        .single();

      if (existingInspection) {
        return {
          success: false,
          error: "An active inspection already exists for this property.",
        };
      }

      // Create the inspection
      const { data: newInspection, error: inspectionError } = await supabase
        .from("inspections")
        .insert({
          property_id: propertyId,
          inspector_id: finalInspectorId,
          status: "in_progress",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (inspectionError || !newInspection) {
        debugLogger.error("simpleInspectionService", "Failed to create inspection", inspectionError);
        return {
          success: false,
          error: "Failed to create inspection. Please try again.",
        };
      }

      // If we have scraped data, generate dynamic checklist
      if (scrapedData && scrapedData.specifications) {
        debugLogger.info("simpleInspectionService", "Generating dynamic checklist from scraped data");
        const { DynamicChecklistGenerator } = await import("./dynamicChecklistGenerator");
        const checklistResult = await DynamicChecklistGenerator.generateForInspection(
          newInspection.id,
          scrapedData
        );
        
        if (checklistResult.success) {
          debugLogger.info("simpleInspectionService", `Created ${checklistResult.itemsCreated} dynamic checklist items`);
        }
      } else {
        // Fallback to static checklist items
        const { data: staticItems, error: itemsError } = await supabase
          .from("static_safety_items")
          .select("*")
          .eq("required", true)
          .order("checklist_id", { ascending: true });

        if (itemsError) {
          debugLogger.error("simpleInspectionService", "Failed to fetch checklist items", itemsError);
          // Don't fail the inspection creation, just log the error
        }

        // Create checklist items for this inspection
        if (staticItems && staticItems.length > 0) {
          const checklistItems = staticItems.map((item) => ({
            inspection_id: newInspection.id,
            static_item_id: item.id,
            label: item.label || "Checklist Item",
            category: item.category || "safety",
            evidence_type: item.evidence_type || "photo",
            status: null,
            created_at: new Date().toISOString(),
          }));

          const { error: checklistError } = await supabase
            .from("checklist_items")
            .insert(checklistItems);

          if (checklistError) {
            debugLogger.error("simpleInspectionService", "Failed to create checklist items", checklistError);
            // Don't fail, inspection is created
          }
        }
      }

      debugLogger.info("simpleInspectionService", "Inspection created successfully", newInspection.id);
      return {
        success: true,
        inspectionId: newInspection.id,
      };
    } catch (error) {
      debugLogger.error("simpleInspectionService", "Unexpected error creating inspection", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Get or create an inspection for a property
   */
  static async getOrCreateInspection(
    propertyId: string
  ): Promise<InspectionResult> {
    try {
      // First check for existing active inspection
      const { data: existing } = await supabase
        .from("inspections")
        .select("id")
        .eq("property_id", propertyId)
        .in("status", ["in_progress", "draft"])
        .single();

      if (existing) {
        return {
          success: true,
          inspectionId: existing.id,
        };
      }

      // No existing inspection, create a new one
      return await this.createInspection({ propertyId });
    } catch (error) {
      debugLogger.error("simpleInspectionService", "Error in getOrCreateInspection", error);
      return {
        success: false,
        error: "Failed to get or create inspection.",
      };
    }
  }
}