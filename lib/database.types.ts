/**
 * Manual Supabase database type definitions.
 * Regenerate with:
 *   npx supabase gen types typescript --project-id rcvarkhfdavprartsydl > lib/database.types.ts
 * once the CLI is authenticated.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      sets: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          cards: Json;
          is_favorite: boolean | null;
          is_public: boolean | null;
          progress: Json | null;
          share_token: string | null;
          shared_at: string | null;
          created_at: string;
          last_studied: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          cards?: Json;
          is_favorite?: boolean | null;
          is_public?: boolean | null;
          progress?: Json | null;
          share_token?: string | null;
          shared_at?: string | null;
          created_at?: string;
          last_studied?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          cards?: Json;
          is_favorite?: boolean | null;
          is_public?: boolean | null;
          progress?: Json | null;
          share_token?: string | null;
          shared_at?: string | null;
          created_at?: string;
          last_studied?: string | null;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          set_id: string;
          interval: number;
          repetitions: number;
          ease_factor: number;
          next_review: string;
          last_studied: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          set_id: string;
          interval: number;
          repetitions: number;
          ease_factor: number;
          next_review: string;
          last_studied?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          set_id?: string;
          interval?: number;
          repetitions?: number;
          ease_factor?: number;
          next_review?: string;
          last_studied?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          set_id: string;
          reason: string;
          comment: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          set_id: string;
          reason: string;
          comment?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          set_id?: string;
          reason?: string;
          comment?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
