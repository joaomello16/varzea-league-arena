import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xibecgyalqgvfminjwmx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYmVjZ3lhbHFndmZtaW5qd214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDA5MjYsImV4cCI6MjA4NDY3NjkyNn0.0lmT4QOoCAE-uVwe-cDmVgME_RFNo7SBdodaQxHGwnI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'user' | 'admin';

export interface User {
  id: string;
  nick: string;
  type: UserType;
  player_id: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  nick: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  user_id: string | null;
  rating?: number;
}

export interface PlayerClaim {
  id: string;
  user_id: string;
  player_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PlayerClaimPending {
  id: string;
  player_nick: string;
  player_avatar_url: string | null;
  user_nick: string;
  user_email: string;
  created_at: string;
}
