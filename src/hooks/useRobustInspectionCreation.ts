
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useRobustInspectionCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createInspection = async (propertyId: string) => {
    if (isCreating) {
      console.warn('⚠️ Inspection creation already in progress, ignoring duplicate request');
      return null;
    }

    setIsCreating(true);
    console.log('🚀 Starting robust inspection creation for property:', propertyId);

    try {
      // Check for existing active inspections first
      const { data: existingInspections, error: checkError } = await supabase
        .from('inspections')
        .select('id, completed')
        .eq('property_id', propertyId)
        .eq('completed', false);

      if (checkError) {
        console.error('❌ Error checking existing inspections:', checkError);
        throw checkError;
      }

      if (existingInspections && existingInspections.length > 0) {
        console.log('📋 Found existing active inspection:', existingInspections[0].id);
        toast({
          title: "Active inspection found",
          description: "Redirecting to existing inspection...",
        });
        return existingInspections[0].id;
      }

      // Create new inspection with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let inspectionId = null;

      while (attempts < maxAttempts && !inspectionId) {
        attempts++;
        console.log(`📝 Creating inspection attempt ${attempts}/${maxAttempts}`);

        try {
          const { data: newInspection, error: createError } = await supabase
            .from('inspections')
            .insert([{
              property_id: propertyId,
              start_time: new Date().toISOString(),
              status: 'available',
              completed: false
            }])
            .select()
            .single();

          if (createError) {
            console.error(`❌ Attempt ${attempts} failed:`, createError);
            if (attempts === maxAttempts) {
              throw createError;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }

          inspectionId = newInspection.id;
          console.log('✅ Inspection created successfully:', inspectionId);

          // Now manually populate checklist items with proper category mapping
          await populateChecklistItems(inspectionId);

          // Verify checklist items were created
          const { data: checklistItems, error: checklistError } = await supabase
            .from('checklist_items')
            .select('id')
            .eq('inspection_id', inspectionId);

          if (checklistError) {
            console.error('❌ Error checking checklist items:', checklistError);
          } else {
            console.log(`📋 Verified ${checklistItems?.length || 0} checklist items created`);
          }

        } catch (attemptError) {
          console.error(`💥 Attempt ${attempts} exception:`, attemptError);
          if (attempts === maxAttempts) {
            throw attemptError;
          }
        }
      }

      if (!inspectionId) {
        throw new Error('Failed to create inspection after multiple attempts');
      }

      toast({
        title: "Inspection created",
        description: "Ready to start the inspection process.",
      });

      return inspectionId;

    } catch (error) {
      console.error('💥 Inspection creation failed:', error);
      toast({
        title: "Failed to create inspection",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to populate checklist items with proper category mapping
  const populateChecklistItems = async (inspectionId: string) => {
    try {
      console.log('📋 Manually populating checklist items for inspection:', inspectionId);
      
      // Get static safety items
      const { data: staticItems, error: fetchError } = await supabase
        .from('static_safety_items')
        .select('*')
        .eq('deleted', false)
        .eq('required', true);

      if (fetchError) {
        console.error('❌ Error fetching static safety items:', fetchError);
        throw fetchError;
      }

      if (!staticItems || staticItems.length === 0) {
        console.warn('⚠️ No static safety items found');
        return;
      }

      // Updated category mapping based on actual database constraint values
      const categoryMapping: Record<string, string> = {
        'safety': 'safety',
        'Security': 'safety',
        'security': 'safety',
        'Fire Safety': 'safety',
        'fire_safety': 'safety',
        'Pool Safety': 'safety',
        'pool_safety': 'safety',
        'Emergency': 'safety',
        'emergency': 'safety',
        'accessibility': 'accessibility',
        'Accessibility': 'accessibility',
        'amenities': 'amenities',
        'Amenities': 'amenities',
        'cleanliness': 'cleanliness',
        'Cleanliness': 'cleanliness',
        'accuracy': 'accuracy',
        'Accuracy': 'accuracy',
        'listing_accuracy': 'accuracy',
        'Listing Accuracy': 'accuracy',
        'default': 'safety' // fallback category
      };

      // Prepare checklist items with mapped categories
      const checklistItems = staticItems.map(item => {
        const mappedCategory = categoryMapping[item.category] || categoryMapping['default'];
        console.log(`📝 Mapping category "${item.category}" to "${mappedCategory}" for item "${item.label}"`);
        
        return {
          inspection_id: inspectionId,
          label: item.label,
          category: mappedCategory,
          evidence_type: item.evidence_type,
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
      });

      console.log('📝 Inserting checklist items:', checklistItems.length);

      // Insert checklist items
      const { error: insertError } = await supabase
        .from('checklist_items')
        .insert(checklistItems);

      if (insertError) {
        console.error('❌ Error inserting checklist items:', insertError);
        throw insertError;
      }

      // Log successful population
      await supabase
        .from('checklist_operations_audit')
        .insert({
          inspection_id: inspectionId,
          operation_type: 'manual_populate',
          items_affected: checklistItems.length,
          metadata: { 
            manual_insertion: true, 
            category_mapping_applied: true,
            mapped_categories: checklistItems.map(item => ({
              label: item.label,
              original_category: staticItems.find(si => si.id === item.static_item_id)?.category,
              mapped_category: item.category
            }))
          }
        });

      console.log('✅ Successfully populated checklist items manually');
      
    } catch (error) {
      console.error('💥 Error in manual checklist population:', error);
      throw error;
    }
  };

  return {
    createInspection,
    isCreating
  };
};
