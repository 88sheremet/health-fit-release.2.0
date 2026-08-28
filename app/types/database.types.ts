 export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: number | null;
          note?: string | null;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          day: number;
          type: "food" | "mental" | "physical";
          title: string;
          what_doing: Json;
          why_doing: string;
          reward: number | null;
        };
        Insert: {
          id?: string;
          day: number;
          type: "food" | "mental" | "physical";
          title: string;
          what_doing: Json;
          why_doing: string;
          reward?: number | null;
        };
        Update: {
          id?: string;
          day?: number;
          type?: "food" | "mental" | "physical";
          title?: string;
          what_doing?: Json;
          why_doing?: string;
          reward?: number | null;
        };
        Relationships: [];
      };
      daily_task_completions: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          day_index: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          day_index: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          day_index?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
      weekly_tasks: {
        Row: {
          id: string;
          week: number;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Insert: {
          id?: string;
          week: number;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Update: {
          id?: string;
          week?: number;
          title?: string;
          what_doing?: string;
          why_doing?: string;
        };
        Relationships: [];
      };
      weekly_task_completions: {
        Row: {
          id: string;
          user_id: string;
          weekly_task_id: string;
          week: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weekly_task_id: string;
          week: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weekly_task_id?: string;
          week?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          energy: number;
          streak: number;
          last_visit_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          energy?: number;
          streak?: number;
          last_visit_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          energy?: number;
          streak?: number;
          last_visit_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      screening_results: {
        Row: {
          user_id: string;
          answers: Json;
          physical_score: number | null;
          food_score: number | null;
          mind_score: number | null;
          dominant_problem: string | null;
          completed_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          answers: Json;
          physical_score?: number | null;
          food_score?: number | null;
          mind_score?: number | null;
          dominant_problem?: string | null;
          completed_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          answers?: Json;
          physical_score?: number | null;
          food_score?: number | null;
          mind_score?: number | null;
          dominant_problem?: string | null;
          completed_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
