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
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          corrections: Json | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          sender: string | null
          session_id: string | null
        }
        Insert: {
          corrections?: Json | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          sender?: string | null
          session_id?: string | null
        }
        Update: {
          corrections?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          sender?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_recommendations: {
        Row: {
          drill_data: Json | null
          id: string
          level: string
          reason: string | null
          recommended_at: string | null
          resolved: boolean | null
          topic: string
          user_id: string | null
        }
        Insert: {
          drill_data?: Json | null
          id?: string
          level: string
          reason?: string | null
          recommended_at?: string | null
          resolved?: boolean | null
          topic: string
          user_id?: string | null
        }
        Update: {
          drill_data?: Json | null
          id?: string
          level?: string
          reason?: string | null
          recommended_at?: string | null
          resolved?: boolean | null
          topic?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drill_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_hierarchy: {
        Row: {
          department: string
          id: number
          name: string
          parent_id: number | null
          title: string
        }
        Insert: {
          department: string
          id?: number
          name: string
          parent_id?: number | null
          title: string
        }
        Update: {
          department?: string
          id?: number
          name?: string
          parent_id?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_hierarchy_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "employee_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      "Org Data": {
        Row: {
          department: string | null
          id: number
          name: string | null
          parent_id: string | null
          title: string | null
        }
        Insert: {
          department?: string | null
          id?: number
          name?: string | null
          parent_id?: string | null
          title?: string | null
        }
        Update: {
          department?: string | null
          id?: number
          name?: string | null
          parent_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      placement_tests: {
        Row: {
          completed_at: string | null
          id: string
          level: string | null
          score: number | null
          started_at: string | null
          test_type: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          level?: string | null
          score?: number | null
          started_at?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          level?: string | null
          score?: number | null
          started_at?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          completed_lessons: number | null
          created_at: string | null
          id: string
          level: string | null
          streak: number | null
          total_lessons: number | null
          updated_at: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          completed_lessons?: number | null
          created_at?: string | null
          id: string
          level?: string | null
          streak?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          completed_lessons?: number | null
          created_at?: string | null
          id?: string
          level?: string | null
          streak?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          correct_answer: string
          explanation: string | null
          id: string
          is_correct: boolean | null
          level: string | null
          options: Json | null
          question: string
          test_id: string | null
          topic: string | null
          user_answer: string | null
        }
        Insert: {
          correct_answer: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          level?: string | null
          options?: Json | null
          question: string
          test_id?: string | null
          topic?: string | null
          user_answer?: string | null
        }
        Update: {
          correct_answer?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          level?: string | null
          options?: Json | null
          question?: string
          test_id?: string | null
          topic?: string | null
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "placement_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          awarded_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          awarded_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          awarded_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memory: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          user_id: string | null
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          confidence: string | null
          correct: number | null
          id: string
          incorrect: number | null
          last_attempt: string | null
          level: string
          topic: string
          user_id: string | null
        }
        Insert: {
          confidence?: string | null
          correct?: number | null
          id?: string
          incorrect?: number | null
          last_attempt?: string | null
          level: string
          topic: string
          user_id?: string | null
        }
        Update: {
          confidence?: string | null
          correct?: number | null
          id?: string
          incorrect?: number | null
          last_attempt?: string | null
          level?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
