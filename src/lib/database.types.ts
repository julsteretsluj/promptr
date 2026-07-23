export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type TextSize = 'medium' | 'large' | 'xlarge'
export type HomeLayout = 'plan_first' | 'routines_first'
export type PlanItemStatus = 'pending' | 'done' | 'skipped'
export type ReminderChannel = 'email' | 'calendar'
export type ReminderJobStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          text_size: TextSize
          accent: string
          reduce_motion: boolean
          home_layout: HomeLayout
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          text_size?: TextSize
          accent?: string
          reduce_motion?: boolean
          home_layout?: HomeLayout
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          text_size?: TextSize
          accent?: string
          reduce_motion?: boolean
          home_layout?: HomeLayout
        }
      }
      checklists: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          icon: string
          color: string
          steps: Json
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string
          icon?: string
          color?: string
          steps?: Json
          archived?: boolean
        }
        Update: {
          title?: string
          description?: string
          icon?: string
          color?: string
          steps?: Json
          archived?: boolean
        }
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_date: string
          notes?: string
        }
        Update: {
          notes?: string
        }
      }
      daily_plan_items: {
        Row: {
          id: string
          plan_id: string
          user_id: string
          checklist_id: string | null
          preset_id: string | null
          title: string
          scheduled_time: string | null
          sort_order: number
          status: PlanItemStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          user_id: string
          checklist_id?: string | null
          preset_id?: string | null
          title: string
          scheduled_time?: string | null
          sort_order?: number
          status?: PlanItemStatus
        }
        Update: {
          checklist_id?: string | null
          preset_id?: string | null
          title?: string
          scheduled_time?: string | null
          sort_order?: number
          status?: PlanItemStatus
        }
      }
      reminder_settings: {
        Row: {
          user_id: string
          email_enabled: boolean
          calendar_enabled: boolean
          lead_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_enabled?: boolean
          calendar_enabled?: boolean
          lead_minutes?: number
        }
        Update: {
          email_enabled?: boolean
          calendar_enabled?: boolean
          lead_minutes?: number
        }
      }
      reminder_jobs: {
        Row: {
          id: string
          user_id: string
          plan_item_id: string | null
          channel: ReminderChannel
          fire_at: string
          payload: Json
          status: ReminderJobStatus
          error: string | null
          calendar_event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_item_id?: string | null
          channel: ReminderChannel
          fire_at: string
          payload?: Json
          status?: ReminderJobStatus
          error?: string | null
          calendar_event_id?: string | null
        }
        Update: {
          status?: ReminderJobStatus
          error?: string | null
          calendar_event_id?: string | null
          fire_at?: string
          payload?: Json
        }
      }
      google_tokens: {
        Row: {
          user_id: string
          refresh_token: string
          access_token: string | null
          expires_at: string | null
          scope: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          refresh_token: string
          access_token?: string | null
          expires_at?: string | null
          scope?: string | null
        }
        Update: {
          refresh_token?: string
          access_token?: string | null
          expires_at?: string | null
          scope?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ChecklistRow = Database['public']['Tables']['checklists']['Row']
export type DailyPlan = Database['public']['Tables']['daily_plans']['Row']
export type DailyPlanItem = Database['public']['Tables']['daily_plan_items']['Row']
export type ReminderSettings = Database['public']['Tables']['reminder_settings']['Row']
