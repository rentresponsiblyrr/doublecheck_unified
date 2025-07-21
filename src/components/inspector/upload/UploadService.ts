import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Property, ChecklistItem, UploadItem } from './types';

export class UploadService {
  static async createInspection(property: Property): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          property_id: property.id,
          status: 'in_progress',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      logger.logError('Failed to create inspection', { propertyId: property.id, error });
      throw new Error('Failed to create inspection record');
    }
  }

  static async uploadPhoto(file: File, inspectionId: string, checklistItemId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${inspectionId}/${checklistItemId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create media record
      const { data, error: insertError } = await supabase
        .from('media')
        .insert({
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return data.id;
    } catch (error) {
      logger.logError('Photo upload failed', { fileName: file.name, error });
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  static async uploadVideo(file: File, inspectionId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${inspectionId}/videos/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('inspection-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('media')
        .insert({
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return data.id;
    } catch (error) {
      logger.logError('Video upload failed', { fileName: file.name, error });
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  static async saveChecklistData(
    inspectionId: string, 
    checklistItems: ChecklistItem[]
  ): Promise<void> {
    try {
      const records = checklistItems.map(item => ({
        inspection_id: inspectionId,
        checklist_item_id: item.id,
        notes: item.notes,
        status: item.status,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('inspection_checklist_items')
        .insert(records);

      if (error) throw error;
    } catch (error) {
      logger.logError('Failed to save checklist data', { inspectionId, error });
      throw new Error('Failed to save inspection checklist');
    }
  }

  static generateUploadItems(checklistItems: ChecklistItem[]): UploadItem[] {
    const items: UploadItem[] = [];

    checklistItems.forEach((checklistItem) => {
      // Add photos
      checklistItem.photos.forEach((photo, index) => {
        items.push({
          id: `photo-${checklistItem.id}-${index}`,
          type: 'photo',
          name: `${checklistItem.title} - Photo ${index + 1}`,
          size: photo.size,
          progress: 0,
          status: 'pending'
        });
      });
    });

    // Add data record
    items.push({
      id: 'checklist-data',
      type: 'data',
      name: 'Inspection Checklist Data',
      size: JSON.stringify(checklistItems).length,
      progress: 0,
      status: 'pending'
    });

    return items;
  }
}