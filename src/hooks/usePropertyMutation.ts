
import { supabase } from "@/integrations/supabase/client";
import type { PropertyFormData } from "@/types/propertySubmission";

export const usePropertyMutation = () => {
  const executePropertyMutation = async (
    formData: PropertyFormData,
    user: any,
    isEditing: boolean,
    editId: string | null
  ) => {
    const submitData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      vrbo_url: formData.vrbo_url.trim() || null,
      airbnb_url: formData.airbnb_url.trim() || null,
    };

    console.log(`${isEditing ? '📝 Updating' : '➕ Creating'} property with data:`, {
      ...submitData,
      userId: user.id,
      userEmail: user.email,
      isEditing,
      editId,
      timestamp: new Date().toISOString()
    });

    if (isEditing) {
      console.log('🔄 Executing UPDATE operation...');
      return await supabase
        .from('properties')
        .update({
          ...submitData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editId)
        .select()
        .single();
    } else {
      console.log('🆕 Executing INSERT operation...');
      return await supabase
        .from('properties')
        .insert({
          ...submitData,
          added_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
  };

  return { executePropertyMutation };
};
