export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      checklist_items: {
        Row: {
          ai_status: string | null
          category: string | null
          created_at: string | null
          evidence_type: string | null
          id: string
          inspection_id: string | null
          label: string | null
          notes: string | null
          source_photo_url: string | null
          static_item_id: string | null
          status: string | null
        }
        Insert: {
          ai_status?: string | null
          category?: string | null
          created_at?: string | null
          evidence_type?: string | null
          id?: string
          inspection_id?: string | null
          label?: string | null
          notes?: string | null
          source_photo_url?: string | null
          static_item_id?: string | null
          status?: string | null
        }
        Update: {
          ai_status?: string | null
          category?: string | null
          created_at?: string | null
          evidence_type?: string | null
          id?: string
          inspection_id?: string | null
          label?: string | null
          notes?: string | null
          source_photo_url?: string | null
          static_item_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_static_item_id_fkey"
            columns: ["static_item_id"]
            isOneToOne: false
            referencedRelation: "static_safety_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          certification_status: string | null
          completed: boolean | null
          end_time: string | null
          id: string
          inspector_id: string | null
          property_id: string | null
          start_time: string | null
        }
        Insert: {
          certification_status?: string | null
          completed?: boolean | null
          end_time?: string | null
          id?: string
          inspector_id?: string | null
          property_id?: string | null
          start_time?: string | null
        }
        Update: {
          certification_status?: string | null
          completed?: boolean | null
          end_time?: string | null
          id?: string
          inspector_id?: string | null
          property_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string | null
          property_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          property_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          property_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          checklist_item_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          checklist_item_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          checklist_item_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          added_by: string | null
          address: string | null
          created_at: string | null
          id: string
          name: string | null
          status: string | null
          vrbo_url: string | null
        }
        Insert: {
          added_by?: string | null
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: string | null
          vrbo_url?: string | null
        }
        Update: {
          added_by?: string | null
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: string | null
          vrbo_url?: string | null
        }
        Relationships: []
      }
      static_safety_items: {
        Row: {
          active_date: string | null
          category: string | null
          checklist_id: number
          created_at: string | null
          deleted: boolean | null
          deleted_date: string | null
          evidence_type: string
          gpt_prompt: string | null
          id: string
          label: string
          notes: string | null
          required: boolean | null
          updated_at: string | null
        }
        Insert: {
          active_date?: string | null
          category?: string | null
          checklist_id?: number
          created_at?: string | null
          deleted?: boolean | null
          deleted_date?: string | null
          evidence_type: string
          gpt_prompt?: string | null
          id?: string
          label: string
          notes?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active_date?: string | null
          category?: string | null
          checklist_id?: number
          created_at?: string | null
          deleted?: boolean | null
          deleted_date?: string | null
          evidence_type?: string
          gpt_prompt?: string | null
          id?: string
          label?: string
          notes?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
