/**
 * VictorOS Supabase Canonical Database Types
 * Generated representation of VictorOS PostgreSQL schema in Supabase.
 * Acts as the authoritative source of truth for all Supabase queries.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "editor" | "viewer";
export type ContentStatus = "draft" | "published" | "archived";
export type LabStatus = "active" | "experimental" | "archived" | "exploring" | "building" | "paused" | "completed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      tags: {
        Row: {
          id: string;
          slug: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      technologies: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      projects: {
        Row: {
          id: string;
          slug: string;
          number: string | null;
          title: string;
          subtitle: string | null;
          description: string | null;
          category: string;
          version: string | null;
          status: ContentStatus;
          featured: boolean;
          hero_image_url: string | null;
          github_url: string | null;
          live_url: string | null;
          metrics: Json | null;
          technologies: string[] | null;
          architecture_nodes: Json | null;
          architecture_lines: Json | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          number?: string | null;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          category: string;
          version?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          hero_image_url?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          metrics?: Json | null;
          technologies?: string[] | null;
          architecture_nodes?: Json | null;
          architecture_lines?: Json | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          number?: string | null;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          category?: string;
          version?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          hero_image_url?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          metrics?: Json | null;
          technologies?: string[] | null;
          architecture_nodes?: Json | null;
          architecture_lines?: Json | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      project_sections: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          content?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string;
          reading_time: number;
          status: ContentStatus;
          featured: boolean;
          cover_image_url: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content: string;
          reading_time?: number;
          status?: ContentStatus;
          featured?: boolean;
          cover_image_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string;
          reading_time?: number;
          status?: ContentStatus;
          featured?: boolean;
          cover_image_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      labs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          status: LabStatus;
          stars: number;
          live_url: string | null;
          github_url: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          status?: LabStatus;
          stars?: number;
          live_url?: string | null;
          github_url?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          category?: string;
          status?: LabStatus;
          stars?: number;
          live_url?: string | null;
          github_url?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      concepts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          definition: string;
          key_points: string[] | null;
          related_concepts: string[] | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: string;
          definition: string;
          key_points?: string[] | null;
          related_concepts?: string[] | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: string;
          definition?: string;
          key_points?: string[] | null;
          related_concepts?: string[] | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      media_assets: {
        Row: {
          id: string;
          filename: string;
          file_path: string;
          mime_type: string;
          size_bytes: number;
          public_url: string;
          bucket: string;
          alt_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          file_path: string;
          mime_type: string;
          size_bytes: number;
          public_url: string;
          bucket: string;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          file_path?: string;
          mime_type?: string;
          size_bytes?: number;
          public_url?: string;
          bucket?: string;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      content_relationships: {
        Row: {
          id: string;
          source_type: string;
          source_id: string;
          target_type: string;
          target_id: string;
          relationship_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_type: string;
          source_id: string;
          target_type: string;
          target_id: string;
          relationship_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_type?: string;
          source_id?: string;
          target_type?: string;
          target_id?: string;
          relationship_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      project_tags: {
        Row: {
          project_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      project_technologies: {
        Row: {
          project_id: string;
          technology_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          technology_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          technology_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      project_media: {
        Row: {
          id: string;
          project_id: string;
          media_asset_id: string;
          role: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          media_asset_id: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          media_asset_id?: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      article_tags: {
        Row: {
          article_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      article_technologies: {
        Row: {
          article_id: string;
          technology_id: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          technology_id: string;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          technology_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      article_media: {
        Row: {
          id: string;
          article_id: string;
          media_asset_id: string;
          role: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          media_asset_id: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          media_asset_id?: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      lab_media: {
        Row: {
          id: string;
          lab_id: string;
          media_asset_id: string;
          role: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          media_asset_id: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lab_id?: string;
          media_asset_id?: string;
          role?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      content_concepts: {
        Row: {
          id: string;
          concept_id: string;
          content_type: string;
          content_id: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          concept_id: string;
          content_type: string;
          content_id: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          concept_id?: string;
          content_type?: string;
          content_id?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      concept_relationships: {
        Row: {
          id: string;
          source_concept_id: string;
          target_concept_id: string;
          relationship_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_concept_id: string;
          target_concept_id: string;
          relationship_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_concept_id?: string;
          target_concept_id?: string;
          relationship_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      github_repositories: {
        Row: {
          id: string;
          repo_name: string;
          full_name: string;
          description: string | null;
          html_url: string;
          stars_count: number;
          forks_count: number;
          open_issues_count: number;
          primary_language: string | null;
          is_fork: boolean;
          last_pushed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repo_name: string;
          full_name: string;
          description?: string | null;
          html_url: string;
          stars_count?: number;
          forks_count?: number;
          open_issues_count?: number;
          primary_language?: string | null;
          is_fork?: boolean;
          last_pushed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repo_name?: string;
          full_name?: string;
          description?: string | null;
          html_url?: string;
          stars_count?: number;
          forks_count?: number;
          open_issues_count?: number;
          primary_language?: string | null;
          is_fork?: boolean;
          last_pushed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      github_sync_logs: {
        Row: {
          id: string;
          synced_at: string;
          status: "success" | "failure";
          synced_repos_count: number;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          synced_at?: string;
          status: "success" | "failure";
          synced_repos_count?: number;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          synced_at?: string;
          status?: "success" | "failure";
          synced_repos_count?: number;
          error_message?: string | null;
        };
        Relationships: [];
      };

      content_chunks: {
        Row: {
          id: string;
          source_type: string;
          source_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_type: string;
          source_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_type?: string;
          source_id?: string;
          chunk_index?: number;
          content?: string;
          token_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      embeddings: {
        Row: {
          id: string;
          chunk_id: string;
          embedding: number[];
          model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chunk_id: string;
          embedding: number[];
          model?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chunk_id?: string;
          embedding?: number[];
          model?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      ai_conversations: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };

      narrations: {
        Row: {
          id: string;
          source_type: string;
          source_id: string;
          audio_url: string;
          duration_seconds: number;
          voice_model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_type: string;
          source_id: string;
          audio_url: string;
          duration_seconds: number;
          voice_model: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_type?: string;
          source_id?: string;
          audio_url?: string;
          duration_seconds?: number;
          voice_model?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      lab_status: LabStatus;
    };
  };
}
