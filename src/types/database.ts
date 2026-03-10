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
          phone: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
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
        }
      }
      pool_members: {
        Row: {
          id: string
          created_at: string
          pool_id: string
          user_id: string
          role: 'commissioner' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          pool_id: string
          user_id: string
          role?: 'commissioner' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          pool_id?: string
          user_id?: string
          role?: 'commissioner' | 'member'
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
          is_submitted: boolean
          score: number
          max_possible_score: number
          picks: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          name?: string
          is_submitted?: boolean
          score?: number
          max_possible_score?: number
          picks?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          user_id?: string
          name?: string
          is_submitted?: boolean
          score?: number
          max_possible_score?: number
          picks?: Json
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
          bracket_id: string
          bracket_name: string
          score: number
          max_possible_score: number
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
