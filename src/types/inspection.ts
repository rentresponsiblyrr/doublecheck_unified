
export interface ChecklistItemType {
  id: string;
  inspection_id: string;
  label: string;
  category: string; // Changed from union type to string to support dynamic categories
  evidence_type: 'photo' | 'video';
  status?: 'completed' | 'failed' | 'not_applicable' | null;
  notes?: string | null;
  notes_history?: NotesHistoryEntry[];
  created_at: string;
}

export interface NotesHistoryEntry {
  text: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface MediaUpload {
  id: string;
  checklist_item_id: string;
  type: 'photo' | 'video';
  url: string;
  user_id?: string;
  uploaded_by_name?: string;
  created_at: string;
}
