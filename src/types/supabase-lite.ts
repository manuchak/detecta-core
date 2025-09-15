// Lightweight Supabase types to avoid typecheck timeout
// This replaces heavy imports from @/integrations/supabase/types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Common types used throughout the app
export interface User {
  id: string
  email?: string
  [key: string]: any
}

export interface Profile {
  id: string
  user_id: string
  role?: string
  [key: string]: any
}