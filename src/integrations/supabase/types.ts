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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      analytics_settings: {
        Row: {
          engagement_change: string | null
          engagement_rate: string | null
          growth: string | null
          growth_change: string | null
          id: string
          total_users: string | null
          total_views: string | null
          updated_at: string | null
          users_change: string | null
          views_change: string | null
        }
        Insert: {
          engagement_change?: string | null
          engagement_rate?: string | null
          growth?: string | null
          growth_change?: string | null
          id?: string
          total_users?: string | null
          total_views?: string | null
          updated_at?: string | null
          users_change?: string | null
          views_change?: string | null
        }
        Update: {
          engagement_change?: string | null
          engagement_rate?: string | null
          growth?: string | null
          growth_change?: string | null
          id?: string
          total_users?: string | null
          total_views?: string | null
          updated_at?: string | null
          users_change?: string | null
          views_change?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_leads: {
        Row: {
          budget_range: string | null
          company_name: string
          created_at: string
          email: string
          id: string
          project_details: string | null
          service: string
          status: string
        }
        Insert: {
          budget_range?: string | null
          company_name: string
          created_at?: string
          email: string
          id?: string
          project_details?: string | null
          service: string
          status?: string
        }
        Update: {
          budget_range?: string | null
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          project_details?: string | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_gigs: {
        Row: {
          category: string
          contact_info: string
          created_at: string
          description: string
          id: string
          is_approved: boolean
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          contact_info: string
          created_at?: string
          description: string
          id?: string
          is_approved?: boolean
          title: string
          user_id: string
        }
        Update: {
          category?: string
          contact_info?: string
          created_at?: string
          description?: string
          id?: string
          is_approved?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      digest_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      post_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          description: string | null
          engagement_score: number | null
          id: string
          image_url: string | null
          is_trending: boolean | null
          likes_count: number | null
          news_category: string | null
          publish_at: string | null
          published: boolean | null
          reading_time: number | null
          search_vector: unknown
          status: string
          tags: string[] | null
          title: string
          user_id: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          description?: string | null
          engagement_score?: number | null
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          likes_count?: number | null
          news_category?: string | null
          publish_at?: string | null
          published?: boolean | null
          reading_time?: number | null
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title: string
          user_id: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          description?: string | null
          engagement_score?: number | null
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          likes_count?: number | null
          news_category?: string | null
          publish_at?: string | null
          published?: boolean | null
          reading_time?: number | null
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title?: string
          user_id?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          handle: string
          id: string
          is_public: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle: string
          id: string
          is_public?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string
          id?: string
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reading_streaks: {
        Row: {
          created_at: string
          current_streak: number
          last_read_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_read_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_read_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
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
      Vouchers: {
        Row: {
          created_at: string | null
          exam_type: string
          id: string
          is_used: boolean | null
          pin: string | null
          serial_number: string | null
        }
        Insert: {
          created_at?: string | null
          exam_type: string
          id?: string
          is_used?: boolean | null
          pin?: string | null
          serial_number?: string | null
        }
        Update: {
          created_at?: string | null
          exam_type?: string
          id?: string
          is_used?: boolean | null
          pin?: string | null
          serial_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_profile_activity: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          category: string
          content: string
          created_at: string | null
          description: string | null
          engagement_score: number | null
          id: string
          image_url: string | null
          is_trending: boolean | null
          likes_count: number | null
          news_category: string | null
          publish_at: string | null
          published: boolean | null
          reading_time: number | null
          search_vector: unknown
          status: string
          tags: string[] | null
          title: string
          user_id: string
          video_url: string | null
          views: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      public_profile_stats: {
        Args: { p_user_id: string }
        Returns: {
          bookmark_count: number
          comment_count: number
          reaction_count: number
        }[]
      }
      publish_due_posts: { Args: never; Returns: number }
      record_read: {
        Args: never
        Returns: {
          created_at: string
          current_streak: number
          last_read_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reading_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_posts: {
        Args: {
          p_category?: string
          p_from?: string
          p_limit?: number
          p_news_category?: string
          p_offset?: number
          p_to?: string
          q?: string
        }
        Returns: {
          category: string
          content: string
          created_at: string | null
          description: string | null
          engagement_score: number | null
          id: string
          image_url: string | null
          is_trending: boolean | null
          likes_count: number | null
          news_category: string | null
          publish_at: string | null
          published: boolean | null
          reading_time: number | null
          search_vector: unknown
          status: string
          tags: string[] | null
          title: string
          user_id: string
          video_url: string | null
          views: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      trending_tags: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          score: number
          tag: string
          uses: number
        }[]
      }
      user_taste: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          weight: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
