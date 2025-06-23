
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

          // Wait a moment for the trigger to populate checklist items
          await new Promise(resolve => setTimeout(resolve, 2000));

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

          // Check audit log for any issues
          const { data: auditData } = await supabase
            .from('checklist_operations_audit')
            .select('*')
            .eq('inspection_id', inspectionId)
            .order('created_at', { ascending: false });

          if (auditData && auditData.length > 0) {
            console.log('📊 Audit entries for new inspection:', auditData);
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

  return {
    createInspection,
    isCreating
  };
};
