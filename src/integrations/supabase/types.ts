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
      assessment_results: {
        Row: {
          assessment_type: string
          created_at: string | null
          detailed_analysis: Json | null
          id: string
          next_steps: Json | null
          overall_score: number
          recommended_level: string | null
          strengths: Json | null
          topics_assessed: Json
          user_id: string | null
          weaknesses: Json | null
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          detailed_analysis?: Json | null
          id?: string
          next_steps?: Json | null
          overall_score: number
          recommended_level?: string | null
          strengths?: Json | null
          topics_assessed: Json
          user_id?: string | null
          weaknesses?: Json | null
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          detailed_analysis?: Json | null
          id?: string
          next_steps?: Json | null
          overall_score?: number
          recommended_level?: string | null
          strengths?: Json | null
          topics_assessed?: Json
          user_id?: string | null
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          corrections: Json | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          sender: Database["public"]["Enums"]["chat_sender_type"]
          session_id: string | null
        }
        Insert: {
          corrections?: Json | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          sender: Database["public"]["Enums"]["chat_sender_type"]
          session_id?: string | null
        }
        Update: {
          corrections?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          sender?: Database["public"]["Enums"]["chat_sender_type"]
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
          score: number | null
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
          score?: number | null
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
          score?: number | null
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
      exercise_attempts: {
        Row: {
          ai_feedback: Json | null
          attempted_at: string | null
          difficulty_at_attempt: number | null
          error_type: string | null
          exercise_id: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean
          session_id: string | null
          time_taken_seconds: number | null
          user_answer: Json
          user_id: string | null
        }
        Insert: {
          ai_feedback?: Json | null
          attempted_at?: string | null
          difficulty_at_attempt?: number | null
          error_type?: string | null
          exercise_id?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct: boolean
          session_id?: string | null
          time_taken_seconds?: number | null
          user_answer: Json
          user_id?: string | null
        }
        Update: {
          ai_feedback?: Json | null
          attempted_at?: string | null
          difficulty_at_attempt?: number | null
          error_type?: string | null
          exercise_id?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean
          session_id?: string | null
          time_taken_seconds?: number | null
          user_answer?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json
          created_at: string | null
          difficulty_level: number
          discrimination_index: number | null
          estimated_time_seconds: number | null
          id: string
          success_rate: number | null
          tags: Json | null
          topic_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          difficulty_level: number
          discrimination_index?: number | null
          estimated_time_seconds?: number | null
          id?: string
          success_rate?: number | null
          tags?: Json | null
          topic_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          difficulty_level?: number
          discrimination_index?: number | null
          estimated_time_seconds?: number | null
          id?: string
          success_rate?: number | null
          tags?: Json | null
          topic_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topic_combinations: {
        Row: {
          cef_level: string
          created_at: string | null
          grammar_category: string
          grammar_topic: string
          id: string
          last_used_at: string | null
          questions_generated: number | null
          subject_category: string
          subject_topic: string
        }
        Insert: {
          cef_level: string
          created_at?: string | null
          grammar_category: string
          grammar_topic: string
          id?: string
          last_used_at?: string | null
          questions_generated?: number | null
          subject_category: string
          subject_topic: string
        }
        Update: {
          cef_level?: string
          created_at?: string | null
          grammar_category?: string
          grammar_topic?: string
          id?: string
          last_used_at?: string | null
          questions_generated?: number | null
          subject_category?: string
          subject_topic?: string
        }
        Relationships: []
      }
      grammar_topics: {
        Row: {
          category: string
          common_errors: Json | null
          created_at: string | null
          description: string | null
          difficulty_score: number
          id: string
          learning_objectives: Json | null
          level: string
          name: string
          prerequisites: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          common_errors?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_score: number
          id?: string
          learning_objectives?: Json | null
          level: string
          name: string
          prerequisites?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          common_errors?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_score?: number
          id?: string
          learning_objectives?: Json | null
          level?: string
          name?: string
          prerequisites?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          completed_topics: Json | null
          created_at: string | null
          current_topic_id: string | null
          estimated_completion_date: string | null
          id: string
          path_type: string | null
          recommended_next_topics: Json | null
          target_level: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_topics?: Json | null
          created_at?: string | null
          current_topic_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          path_type?: string | null
          recommended_next_topics?: Json | null
          target_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_topics?: Json | null
          created_at?: string | null
          current_topic_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          path_type?: string | null
          recommended_next_topics?: Json | null
          target_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_current_topic_id_fkey"
            columns: ["current_topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_tests: {
        Row: {
          adaptive_difficulty_progression: Json | null
          assessment_type: string | null
          completed_at: string | null
          confidence_score: number | null
          current_difficulty_level: string | null
          id: string
          immediate_feedback: boolean | null
          level: string | null
          score: number | null
          started_at: string | null
          total_questions: number | null
          user_id: string | null
          weighted_score: number | null
        }
        Insert: {
          adaptive_difficulty_progression?: Json | null
          assessment_type?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          current_difficulty_level?: string | null
          id?: string
          immediate_feedback?: boolean | null
          level?: string | null
          score?: number | null
          started_at?: string | null
          total_questions?: number | null
          user_id?: string | null
          weighted_score?: number | null
        }
        Update: {
          adaptive_difficulty_progression?: Json | null
          assessment_type?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          current_difficulty_level?: string | null
          id?: string
          immediate_feedback?: boolean | null
          level?: string | null
          score?: number | null
          started_at?: string | null
          total_questions?: number | null
          user_id?: string | null
          weighted_score?: number | null
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
      practice_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          difficulty_progression: Json | null
          engagement_score: number | null
          error_patterns: Json | null
          exercises_attempted: number | null
          exercises_correct: number | null
          id: string
          session_type: string | null
          started_at: string | null
          time_spent_seconds: number | null
          topic_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_progression?: Json | null
          engagement_score?: number | null
          error_patterns?: Json | null
          exercises_attempted?: number | null
          exercises_correct?: number | null
          id?: string
          session_type?: string | null
          started_at?: string | null
          time_spent_seconds?: number | null
          topic_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_progression?: Json | null
          engagement_score?: number | null
          error_patterns?: Json | null
          exercises_attempted?: number | null
          exercises_correct?: number | null
          id?: string
          session_type?: string | null
          started_at?: string | null
          time_spent_seconds?: number | null
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
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
          detailed_explanation: string | null
          difficulty_score: number | null
          explanation: string | null
          first_principles_explanation: string | null
          grammar_category: string | null
          grammar_topic: string | null
          id: string
          is_correct: boolean | null
          level: string | null
          options: Json | null
          question: string
          question_type: string | null
          subject_category: string | null
          test_id: string | null
          topic: string | null
          topic_tags: Json | null
          user_answer: string | null
          wrong_answer_explanations: Json | null
        }
        Insert: {
          correct_answer: string
          detailed_explanation?: string | null
          difficulty_score?: number | null
          explanation?: string | null
          first_principles_explanation?: string | null
          grammar_category?: string | null
          grammar_topic?: string | null
          id?: string
          is_correct?: boolean | null
          level?: string | null
          options?: Json | null
          question: string
          question_type?: string | null
          subject_category?: string | null
          test_id?: string | null
          topic?: string | null
          topic_tags?: Json | null
          user_answer?: string | null
          wrong_answer_explanations?: Json | null
        }
        Update: {
          correct_answer?: string
          detailed_explanation?: string | null
          difficulty_score?: number | null
          explanation?: string | null
          first_principles_explanation?: string | null
          grammar_category?: string | null
          grammar_topic?: string | null
          id?: string
          is_correct?: boolean | null
          level?: string | null
          options?: Json | null
          question?: string
          question_type?: string | null
          subject_category?: string | null
          test_id?: string | null
          topic?: string | null
          topic_tags?: Json | null
          user_answer?: string | null
          wrong_answer_explanations?: Json | null
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
      used_topics: {
        Row: {
          cef_level: string
          created_at: string | null
          id: string
          last_used_at: string | null
          questions_generated: number | null
          topic_category: string
          topic_name: string
        }
        Insert: {
          cef_level: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          questions_generated?: number | null
          topic_category: string
          topic_name: string
        }
        Update: {
          cef_level?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          questions_generated?: number | null
          topic_category?: string
          topic_name?: string
        }
        Relationships: []
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
      user_question_history: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          seen_at: string
          test_id: string | null
          user_answer: string | null
          user_id: string
          weighted_points: number | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          seen_at?: string
          test_id?: string | null
          user_answer?: string | null
          user_id: string
          weighted_points?: number | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          seen_at?: string
          test_id?: string | null
          user_answer?: string | null
          user_id?: string
          weighted_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_question_history_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "placement_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          attempts_count: number | null
          confidence_interval: number | null
          created_at: string | null
          id: string
          last_practiced: string | null
          mastery_level: string | null
          next_review_due: string | null
          skill_level: number
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts_count?: number | null
          confidence_interval?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          next_review_due?: string | null
          skill_level?: number
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts_count?: number | null
          confidence_interval?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          next_review_due?: string | null
          skill_level?: number
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
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
      get_adaptive_questions_for_user: {
        Args: {
          p_user_id: string
          p_current_level?: string
          p_limit?: number
          p_exclude_question_ids?: string[]
        }
        Returns: {
          id: string
          question: string
          options: Json
          correct_answer: string
          topic: string
          level: string
          explanation: string
          detailed_explanation: string
          first_principles_explanation: string
          wrong_answer_explanations: Json
          difficulty_score: number
        }[]
      }
      get_unseen_questions_for_user: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          id: string
          question: string
          options: Json
          correct_answer: string
          topic: string
          level: string
          explanation: string
          detailed_explanation: string
          first_principles_explanation: string
          wrong_answer_explanations: Json
          difficulty_score: number
        }[]
      }
    }
    Enums: {
      chat_sender_type: "user" | "ai"
      test_type: "standard" | "adaptive"
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
      chat_sender_type: ["user", "ai"],
      test_type: ["standard", "adaptive"],
    },
  },
} as const
