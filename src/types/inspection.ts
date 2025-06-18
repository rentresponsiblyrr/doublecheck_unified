
export interface ChecklistItemType {
  id: string;
  inspection_id: string;
  label: string;
  category: 'safety' | 'amenity' | 'cleanliness' | 'maintenance';
  evidence_type: 'photo' | 'video';
  status?: 'completed' | null;
  created_at: string;
}

export interface MediaUpload {
  id: string;
  checklist_item_id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}
