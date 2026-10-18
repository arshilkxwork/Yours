import { createClient } from '@supabase/supabase-js';
import { Storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database type helpers
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          relationship_start: string | null;
          created_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          content: string | null;
          type: 'text' | 'image' | 'video' | 'audio' | 'file';
          reply_to: string | null;
          is_pinned: boolean;
          edited_at: string | null;
          deleted_at: string | null;
          disappear_after: number | null;
          created_at: string;
        };
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
      };
      media_attachments: {
        Row: {
          id: string;
          message_id: string;
          storage_path: string;
          mime_type: string;
          size: number;
          duration: number | null;
          thumbnail_path: string | null;
          created_at: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          mood: string;
          content: string | null;
          is_shared: boolean;
          entry_date: string;
          created_at: string;
        };
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          uploader_id: string;
          photo_url: string;
          caption: string | null;
          memory_date: string | null;
          collection_id: string | null;
          stickers: string | null;
          created_at: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          event_date: string;
          event_type: string;
          notes: string | null;
          reminder_days: number | null;
          is_recurring: boolean;
          created_at: string;
        };
      };
      question_answers: {
        Row: {
          id: string;
          user_id: string;
          question_index: number;
          answer_date: string;
          content: string;
          is_shared: boolean;
          created_at: string;
        };
      };
    };
  };
};
