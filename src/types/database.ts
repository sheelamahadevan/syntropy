export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type HabitCategory = 'Body' | 'Mind' | 'Craft' | 'Social' | 'Finance'
export type FrictionLevel = 'low' | 'medium' | 'high'
export type TargetType = 'boolean' | 'numeric' | 'duration'

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          category: HabitCategory
          friction_level: FrictionLevel
          target_type: TargetType
          target_value: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: HabitCategory
          friction_level?: FrictionLevel
          target_type?: TargetType
          target_value?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: HabitCategory
          friction_level?: FrictionLevel
          target_type?: TargetType
          target_value?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          log_date: string
          completed: boolean
          actual_value: number
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          log_date: string
          completed?: boolean
          actual_value?: number
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          log_date?: string
          completed?: boolean
          actual_value?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          snapshot_date: string
          analysis: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          snapshot_date: string
          analysis: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snapshot_date?: string
          analysis?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      habit_category: HabitCategory
      friction_level: FrictionLevel
      target_type: TargetType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']

export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type HabitLogInsert = Database['public']['Tables']['habit_logs']['Insert']
export type HabitLogUpdate = Database['public']['Tables']['habit_logs']['Update']

export type AiInsight = Database['public']['Tables']['ai_insights']['Row']
export type AiInsightInsert = Database['public']['Tables']['ai_insights']['Insert']
export type AiInsightUpdate = Database['public']['Tables']['ai_insights']['Update']
