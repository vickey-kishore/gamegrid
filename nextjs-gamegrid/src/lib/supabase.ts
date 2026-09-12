import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          role: 'admin' | 'creator' | 'player'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          role?: 'admin' | 'creator' | 'player'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          role?: 'admin' | 'creator' | 'player'
          created_at?: string
          updated_at?: string
        }
      }
      auctions: {
        Row: {
          id: number
          auction_name: string
          event_name: string
          category: string
          events: string
          roster_rules: any[]
          allow_retention: boolean
          max_retained_players: number
          retention_price: number
          auction_date: string
          description: string
          minimum_bid: number
          bid_increment: number
          maximum_bid: number
          status: 'Draft' | 'Published' | 'Live' | 'Completed'
          is_deleted: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          auction_name: string
          event_name?: string
          category?: string
          events?: string
          roster_rules?: any[]
          allow_retention?: boolean
          max_retained_players?: number
          retention_price?: number
          auction_date?: string
          description?: string
          minimum_bid?: number
          bid_increment?: number
          maximum_bid?: number
          status?: 'Draft' | 'Published' | 'Live' | 'Completed'
          is_deleted?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          auction_name?: string
          event_name?: string
          category?: string
          events?: string
          roster_rules?: any[]
          allow_retention?: boolean
          max_retained_players?: number
          retention_price?: number
          auction_date?: string
          description?: string
          minimum_bid?: number
          bid_increment?: number
          maximum_bid?: number
          status?: 'Draft' | 'Published' | 'Live' | 'Completed'
          is_deleted?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      auction_teams: {
        Row: {
          id: number
          auction_id: number
          team_name: string
          logo_path: string
          purse_amount: number
          remaining_purse: number
          minimum_players: number
          maximum_players: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          auction_id: number
          team_name: string
          logo_path?: string
          purse_amount: number
          remaining_purse?: number
          minimum_players: number
          maximum_players?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          auction_id?: number
          team_name?: string
          logo_path?: string
          purse_amount?: number
          remaining_purse?: number
          minimum_players?: number
          maximum_players?: number
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: number
          name: string
          category: string
          base_price: number
          image_url: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          base_price?: number
          image_url?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          base_price?: number
          image_url?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auction_players: {
        Row: {
          id: number
          auction_id: number
          player_id: number
          status: 'Available' | 'Sold' | 'Unsold'
          sold_to_team_id?: number
          sold_price?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          auction_id: number
          player_id: number
          status?: 'Available' | 'Sold' | 'Unsold'
          sold_to_team_id?: number
          sold_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          auction_id?: number
          player_id?: number
          status?: 'Available' | 'Sold' | 'Unsold'
          sold_to_team_id?: number
          sold_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      bids: {
        Row: {
          id: number
          auction_id: number
          auction_player_id: number
          team_id: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: number
          auction_id: number
          auction_player_id: number
          team_id: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: number
          auction_id?: number
          auction_player_id?: number
          team_id?: number
          amount?: number
          created_at?: string
        }
      }
      tournaments: {
        Row: {
          id: number
          tournament_name: string
          description: string
          start_date: string
          end_date: string
          status: 'Draft' | 'Active' | 'Completed'
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tournament_name: string
          description?: string
          start_date: string
          end_date: string
          status?: 'Draft' | 'Active' | 'Completed'
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tournament_name?: string
          description?: string
          start_date?: string
          end_date?: string
          status?: 'Draft' | 'Active' | 'Completed'
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      auction_event_categories: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      roster_category_constraints: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      auction_registrations: {
        Row: {
          id: number
          auction_id: number
          name: string
          category: string
          club: string
          dob: string
          mobile_number: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          auction_id: number
          name: string
          category: string
          club: string
          dob: string
          mobile_number: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          auction_id?: number
          name?: string
          category?: string
          club?: string
          dob?: string
          mobile_number?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
