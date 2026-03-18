export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          avatar_icon: string | null
          phone: string | null
          email: string | null
          stripe_account_id: string | null
          stripe_onboarded: boolean
          paypal_merchant_id: string | null
          paypal_onboarded: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          avatar_icon?: string | null
          phone?: string | null
          email?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          paypal_merchant_id?: string | null
          paypal_onboarded?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          avatar_icon?: string | null
          phone?: string | null
          email?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          paypal_merchant_id?: string | null
          paypal_onboarded?: boolean
        }
      }
      pools: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          commissioner_id: string
          invite_code: string
          is_public: boolean
          scoring_system: Json
          locked_at: string | null
          status: 'draft' | 'open' | 'locked' | 'active' | 'completed'
          bracket_type: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          locks_at: string | null
          max_members: number | null
          join_requires_approval: boolean
          entry_fee: number | null
          payout_structure: Json | null
          payment_instructions: string | null
          payment_methods: Json
          max_brackets_per_member: number
          fee_per_bracket: boolean
          one_payout_per_person: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          commissioner_id: string
          invite_code?: string
          is_public?: boolean
          scoring_system?: Json
          locked_at?: string | null
          status?: 'draft' | 'open' | 'locked' | 'active' | 'completed'
          bracket_type?: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          locks_at?: string | null
          max_members?: number | null
          join_requires_approval?: boolean
          entry_fee?: number | null
          payout_structure?: Json | null
          payment_instructions?: string | null
          payment_methods?: Json
          max_brackets_per_member?: number
          fee_per_bracket?: boolean
          one_payout_per_person?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          commissioner_id?: string
          invite_code?: string
          is_public?: boolean
          scoring_system?: Json
          locked_at?: string | null
          status?: 'draft' | 'open' | 'locked' | 'active' | 'completed'
          bracket_type?: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          locks_at?: string | null
          max_members?: number | null
          join_requires_approval?: boolean
          entry_fee?: number | null
          payout_structure?: Json | null
          payment_instructions?: string | null
          payment_methods?: Json
          max_brackets_per_member?: number
          fee_per_bracket?: boolean
          one_payout_per_person?: boolean
        }
      }
      pool_members: {
        Row: {
          id: string
          created_at: string
          pool_id: string
          user_id: string
          role: 'commissioner' | 'member'
          payment_status: 'unpaid' | 'paid' | 'waived' | 'pending_verification'
          payment_date: string | null
          payment_note: string | null
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          paypal_order_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          pool_id: string
          user_id: string
          role?: 'commissioner' | 'member'
          payment_status?: 'unpaid' | 'paid' | 'waived' | 'pending_verification'
          payment_date?: string | null
          payment_note?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paypal_order_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          pool_id?: string
          user_id?: string
          role?: 'commissioner' | 'member'
          payment_status?: 'unpaid' | 'paid' | 'waived' | 'pending_verification'
          payment_date?: string | null
          payment_note?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paypal_order_id?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          abbreviation: string
          seed: number | null
          region: 'East' | 'West' | 'South' | 'Midwest' | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          is_active: boolean
          espn_id: number | null
          season: number
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
          seed?: number | null
          region?: 'East' | 'West' | 'South' | 'Midwest' | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          is_active?: boolean
          espn_id?: number | null
          season?: number
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string
          seed?: number | null
          region?: 'East' | 'West' | 'South' | 'Midwest' | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          is_active?: boolean
          espn_id?: number | null
          season?: number
        }
      }
      games: {
        Row: {
          id: string
          round: number
          game_number: number
          region: 'East' | 'West' | 'South' | 'Midwest' | 'Final Four' | 'Championship' | null
          team1_id: string | null
          team2_id: string | null
          winner_id: string | null
          team1_score: number | null
          team2_score: number | null
          scheduled_at: string | null
          completed_at: string | null
          status: 'scheduled' | 'in_progress' | 'completed'
          next_game_id: string | null
          season: number
        }
        Insert: {
          id?: string
          round: number
          game_number: number
          region?: 'East' | 'West' | 'South' | 'Midwest' | 'Final Four' | 'Championship' | null
          team1_id?: string | null
          team2_id?: string | null
          winner_id?: string | null
          team1_score?: number | null
          team2_score?: number | null
          scheduled_at?: string | null
          completed_at?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          next_game_id?: string | null
          season?: number
        }
        Update: {
          id?: string
          round?: number
          game_number?: number
          region?: 'East' | 'West' | 'South' | 'Midwest' | 'Final Four' | 'Championship' | null
          team1_id?: string | null
          team2_id?: string | null
          winner_id?: string | null
          team1_score?: number | null
          team2_score?: number | null
          scheduled_at?: string | null
          completed_at?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          next_game_id?: string | null
          season?: number
        }
      }
      brackets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          user_id: string
          name: string
          bracket_name: string | null
          is_submitted: boolean
          score: number
          max_possible_score: number
          picks: Json
          bracket_type: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          previous_rank: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          name?: string
          bracket_name?: string | null
          is_submitted?: boolean
          score?: number
          max_possible_score?: number
          picks?: Json
          bracket_type?: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          previous_rank?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          user_id?: string
          name?: string
          bracket_name?: string | null
          is_submitted?: boolean
          score?: number
          max_possible_score?: number
          picks?: Json
          bracket_type?: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          previous_rank?: number | null
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          pool_id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          avatar_icon: string | null
          bracket_id: string
          bracket_name: string
          score: number
          max_possible_score: number
          bracket_type: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
          rank: number
        }
      }
    }
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      pool_status: 'draft' | 'open' | 'locked' | 'active' | 'completed'
      game_status: 'scheduled' | 'in_progress' | 'completed'
      member_role: 'commissioner' | 'member'
    }
  }
}

// Achievement types (added manually)
export interface AchievementRow {
  id: string
  name: string
  description: string
  emoji: string
  category: 'picks' | 'social' | 'pools' | 'streaks' | 'special'
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  secret: boolean
  created_at: string
}

export interface UserAchievementRow {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  metadata: Record<string, unknown>
}

// Referral
export interface Referral {
  id: string
  referrer_id: string | null
  referred_id: string | null
  pool_id: string | null
  invite_code: string
  created_at: string
  converted_at: string | null
}

// Pool join request
export interface PoolJoinRequest {
  id: string
  pool_id: string
  user_id: string
  invite_code: string | null
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  resolved_at: string | null
}

// SmackMessage (not in DB types codegen yet — added manually)
export interface SmackMessage {
  id: string
  pool_id: string
  user_id: string
  message: string
  created_at: string
  reactions: Record<string, string[]>
  profiles?: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Payment type (payments table)
export interface Payment {
  id: string
  created_at: string
  updated_at: string
  pool_id: string
  user_id: string
  bracket_id: string | null
  amount: number
  status: 'unpaid' | 'pending_verification' | 'paid' | 'waived' | 'refunded'
  payment_method: string | null
  payment_platform: string | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  paypal_order_id: string | null
  payment_date: string | null
  payment_note: string | null
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Pool = Database['public']['Tables']['pools']['Row']
export type PoolMember = Database['public']['Tables']['pool_members']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Bracket = Database['public']['Tables']['brackets']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']

// Bracket picks type
export interface BracketPicks {
  [gameId: string]: string // gameId -> teamId (winner pick)
}

export interface TeamWithRecord extends Team {
  wins?: number
  losses?: number
}
