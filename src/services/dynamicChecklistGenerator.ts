/**
 * Dynamic Checklist Generator
 * Creates property-specific checklist items based on scraped data
 * Handles multi-bedroom, multi-bathroom properties intelligently
 */

import { supabase } from "@/integrations/supabase/client";
import { ScrapedPropertyData } from "@/types/scraped-data";
import { debugLogger } from '@/utils/debugLogger';

interface ChecklistTemplate {
  label: string;
  category: string;
  evidence_type: string;
  priority?: number;
}

export class DynamicChecklistGenerator {
  /**
   * Generate dynamic checklist items based on property specifications
   */
  static async generateForInspection(
    inspectionId: string,
    scrapedData: ScrapedPropertyData
  ): Promise<{ success: boolean; itemsCreated: number; error?: string }> {
    try {
      debugLogger.info("🏠 Generating dynamic checklist for inspection", {
        inspectionId,
        bedrooms: scrapedData.specifications?.bedrooms,
        bathrooms: scrapedData.specifications?.bathrooms,
        amenities: scrapedData.amenities?.length,
      });

      const checklistItems: any[] = [];
      
      // Generate bedroom-specific items
      const bedroomCount = scrapedData.specifications?.bedrooms || 1;
      for (let i = 1; i <= bedroomCount; i++) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: `Bedroom ${i}: Smoke detector present and functional`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bedroom ${i}: Window locks secure`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bedroom ${i}: No trip hazards or damaged flooring`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bedroom ${i}: Adequate lighting and outlets functional`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      // Generate bathroom-specific items
      const bathroomCount = scrapedData.specifications?.bathrooms || 1;
      for (let i = 1; i <= bathroomCount; i++) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: `Bathroom ${i}: GFCI outlets present near water sources`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bathroom ${i}: Non-slip surfaces in tub/shower`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bathroom ${i}: Proper ventilation (fan or window)`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: `Bathroom ${i}: Hot water temperature safe (<120°F)`,
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      // Add amenity-specific items if detected
      if (scrapedData.amenities?.includes("Pool") || scrapedData.amenities?.includes("Swimming Pool")) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: "Pool: Safety fence/barrier present and secure",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: "Pool: Safety equipment accessible (life ring, shepherd's hook)",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: "Pool: No electrical hazards near water",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      if (scrapedData.amenities?.includes("Hot Tub") || scrapedData.amenities?.includes("Spa")) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: "Hot Tub: Cover secure and lockable",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: "Hot Tub: GFCI protection verified",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      if (scrapedData.amenities?.includes("Fireplace")) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: "Fireplace: Screen/barrier present and secure",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: "Fireplace: Carbon monoxide detector within 15 feet",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      if (scrapedData.amenities?.includes("Balcony") || scrapedData.amenities?.includes("Deck")) {
        checklistItems.push(
          {
            inspection_id: inspectionId,
            label: "Balcony/Deck: Railing height minimum 42 inches",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          },
          {
            inspection_id: inspectionId,
            label: "Balcony/Deck: Railing gaps less than 4 inches",
            category: "safety",
            evidence_type: "photo",
            created_at: new Date().toISOString(),
          }
        );
      }

      // Add standard items that apply to all properties
      const standardItems = [
        {
          inspection_id: inspectionId,
          label: "Main entrance: Clear of trip hazards",
          category: "safety",
          evidence_type: "photo",
          created_at: new Date().toISOString(),
        },
        {
          inspection_id: inspectionId,
          label: "Kitchen: Fire extinguisher present and accessible",
          category: "safety",
          evidence_type: "photo",
          created_at: new Date().toISOString(),
        },
        {
          inspection_id: inspectionId,
          label: "Living areas: Adequate emergency lighting",
          category: "safety",
          evidence_type: "photo",
          created_at: new Date().toISOString(),
        },
        {
          inspection_id: inspectionId,
          label: "Property exterior: Address clearly visible",
          category: "safety",
          evidence_type: "photo",
          created_at: new Date().toISOString(),
        },
        {
          inspection_id: inspectionId,
          label: "Emergency information posted visibly",
          category: "safety",
          evidence_type: "photo",
          created_at: new Date().toISOString(),
        },
      ];

      checklistItems.push(...standardItems);

      // Insert all checklist items
      if (checklistItems.length > 0) {
        const { error } = await supabase
          .from("checklist_items")
          .insert(checklistItems);

        if (error) {
          debugLogger.error("Failed to insert dynamic checklist items:", error);
          return {
            success: false,
            itemsCreated: 0,
            error: "Failed to create checklist items",
          };
        }
      }

      debugLogger.info(`✅ Created ${checklistItems.length} dynamic checklist items`);
      return {
        success: true,
        itemsCreated: checklistItems.length,
      };
    } catch (error) {
      debugLogger.error("Error generating dynamic checklist:", error);
      return {
        success: false,
        itemsCreated: 0,
        error: "Failed to generate checklist",
      };
    }
  }

  /**
   * Update existing inspection with dynamic items based on new scraped data
   */
  static async updateInspectionChecklist(
    inspectionId: string,
    scrapedData: ScrapedPropertyData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, check if inspection already has items
      const { data: existingItems } = await supabase
        .from("checklist_items")
        .select("id")
        .eq("inspection_id", inspectionId)
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        debugLogger.info("Inspection already has checklist items, skipping generation");
        return { success: true };
      }

      // Generate new items
      const result = await this.generateForInspection(inspectionId, scrapedData);
      return result;
    } catch (error) {
      debugLogger.error("Error updating inspection checklist:", error);
      return {
        success: false,
        error: "Failed to update checklist",
      };
    }
  }
}