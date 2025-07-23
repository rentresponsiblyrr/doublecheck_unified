export interface Category {
  id: string;
  name: string;
  description?: string;
  color_class: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCounts extends Category {
  item_count?: number;
  completed_count?: number;
}
