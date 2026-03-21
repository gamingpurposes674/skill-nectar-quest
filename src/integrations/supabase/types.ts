export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          date_achieved: string | null
          description: string | null
          id: string
          profile_id: string
          proof_file_url: string | null
          title: string
          validation_status:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Insert: {
          created_at?: string | null
          date_achieved?: string | null
          description?: string | null
          id?: string
          profile_id: string
          proof_file_url?: string | null
          title: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Update: {
          created_at?: string | null
          date_achieved?: string | null
          description?: string | null
          id?: string
          profile_id?: string
          proof_file_url?: string | null
          title?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advice_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advice_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advice_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          project_id: string
          requester_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id: string
          requester_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          profile_id: string
          project_id: string | null
          reaction_type: string | null
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          profile_id: string
          project_id?: string | null
          reaction_type?: string | null
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          profile_id?: string
          project_id?: string | null
          reaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability: string
          bio: string | null
          created_at: string
          expertise: string[]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorship_messages: {
        Row: {
          created_at: string
          id: string
          mentorship_id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentorship_id: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentorship_id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_messages_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_requests: {
        Row: {
          created_at: string | null
          id: string
          mentee_id: string
          mentor_id: string
          message: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          from_user_id: string | null
          id: string
          message: string | null
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_health_snapshots: {
        Row: {
          achievement_count: number
          collaboration_count: number
          health_value: number
          id: string
          project_count: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          achievement_count?: number
          collaboration_count?: number
          health_value?: number
          id?: string
          project_count?: number
          recorded_at?: string
          user_id: string
        }
        Update: {
          achievement_count?: number
          collaboration_count?: number
          health_value?: number
          id?: string
          project_count?: number
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dream_college: string | null
          full_name: string
          github_url: string | null
          grade: string | null
          id: string
          is_public: boolean | null
          linkedin_url: string | null
          location: string | null
          major: string | null
          portfolio_health: number | null
          portfolio_url: string | null
          school: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dream_college?: string | null
          full_name: string
          github_url?: string | null
          grade?: string | null
          id: string
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          major?: string | null
          portfolio_health?: number | null
          portfolio_url?: string | null
          school?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dream_college?: string | null
          full_name?: string
          github_url?: string | null
          grade?: string | null
          id?: string
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          major?: string | null
          portfolio_health?: number | null
          portfolio_url?: string | null
          school?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_logs: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          author_id: string
          completed: boolean
          created_at: string
          id: string
          milestone_date: string
          project_id: string
          title: string
        }
        Insert: {
          author_id: string
          completed?: boolean
          created_at?: string
          id?: string
          milestone_date?: string
          project_id: string
          title: string
        }
        Update: {
          author_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          milestone_date?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          collaboration_open: boolean | null
          collaborator_completed: boolean | null
          collaborator_id: string | null
          cover_image_url: string | null
          created_at: string | null
          creator_completed: boolean | null
          description: string
          id: string
          is_complete: boolean | null
          project_link: string | null
          project_size: string | null
          proof_file_url: string | null
          required_skills: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          validation_status:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Insert: {
          category?: string | null
          collaboration_open?: boolean | null
          collaborator_completed?: boolean | null
          collaborator_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_completed?: boolean | null
          description: string
          id?: string
          is_complete?: boolean | null
          project_link?: string | null
          project_size?: string | null
          proof_file_url?: string | null
          required_skills?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Update: {
          category?: string | null
          collaboration_open?: boolean | null
          collaborator_completed?: boolean | null
          collaborator_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_completed?: boolean | null
          description?: string
          id?: string
          is_complete?: boolean | null
          project_link?: string | null
          project_size?: string | null
          proof_file_url?: string | null
          required_skills?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      validation_status: "approved" | "rejected" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      validation_status: ["approved", "rejected", "pending"],
    },
  },
} as const
