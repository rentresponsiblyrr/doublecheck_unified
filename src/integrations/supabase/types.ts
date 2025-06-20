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
      checklist_audit_log: {
        Row: {
          action_type: string
          checklist_item_id: string | null
          created_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          checklist_item_id?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          checklist_item_id?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_audit_log_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "static_safety_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          ai_status: string | null
          category: string | null
          created_at: string | null
          evidence_type: string
          id: string
          inspection_id: string
          label: string
          notes: string | null
          source_photo_url: string | null
          static_item_id: string | null
          status: string | null
        }
        Insert: {
          ai_status?: string | null
          category?: string | null
          created_at?: string | null
          evidence_type: string
          id?: string
          inspection_id: string
          label: string
          notes?: string | null
          source_photo_url?: string | null
          static_item_id?: string | null
          status?: string | null
        }
        Update: {
          ai_status?: string | null
          category?: string | null
          created_at?: string | null
          evidence_type?: string
          id?: string
          inspection_id?: string
          label?: string
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
          property_id: string
          start_time: string | null
          status: string | null
        }
        Insert: {
          certification_status?: string | null
          completed?: boolean | null
          end_time?: string | null
          id?: string
          inspector_id?: string | null
          property_id: string
          start_time?: string | null
          status?: string | null
        }
        Update: {
          certification_status?: string | null
          completed?: boolean | null
          end_time?: string | null
          id?: string
          inspector_id?: string | null
          property_id?: string
          start_time?: string | null
          status?: string | null
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
          checklist_item_id: string
          created_at: string | null
          file_path: string | null
          id: string
          notes: string | null
          type: string
          url: string | null
        }
        Insert: {
          checklist_item_id: string
          created_at?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          type: string
          url?: string | null
        }
        Update: {
          checklist_item_id?: string
          created_at?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          type?: string
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
          added_by: string
          address: string | null
          airbnb_url: string | null
          created_at: string | null
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
          vrbo_url: string | null
        }
        Insert: {
          added_by: string
          address?: string | null
          airbnb_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
          vrbo_url?: string | null
        }
        Update: {
          added_by?: string
          address?: string | null
          airbnb_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
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
      user_activity: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_login_at: string | null
          name: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_notifications: {
        Row: {
          created_at: string
          id: string
          property_id: string
          response: string | null
          sent_at: string | null
          status: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          response?: string | null
          sent_at?: string | null
          status?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          response?: string | null
          sent_at?: string | null
          status?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: { _user_id: string; _email: string }
        Returns: undefined
      }
      get_properties_with_inspections: {
        Args: { _user_id?: string }
        Returns: {
          property_id: string
          property_name: string
          property_address: string
          property_vrbo_url: string
          property_airbnb_url: string
          property_status: string
          property_created_at: string
          inspection_count: number
          completed_inspection_count: number
          active_inspection_count: number
          latest_inspection_id: string
          latest_inspection_completed: boolean
        }[]
      }
      get_property_status: {
        Args: { _completed_count: number; _active_count: number }
        Returns: {
          status: string
          color: string
          text_label: string
        }[]
      }
      get_user_role_simple: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          target_user_id: string
          activity_type: string
          activity_description?: string
          activity_metadata?: Json
        }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          target_user_id: string
          new_name: string
          new_email: string
          changed_by_user_id: string
        }
        Returns: undefined
      }
      update_user_status: {
        Args: {
          target_user_id: string
          new_status: string
          changed_by_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "inspector" | "reviewer"
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
    Enums: {
      app_role: ["admin", "inspector", "reviewer"],
    },
  },
} as const
