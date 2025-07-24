export interface Database {
  public: {
    Tables: {
      custom_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          custom_category_id: string | null;
          department: string | null;
          estimated_hours: number;
          actual_hours: number | null;
          notes: string;
          start_date: string;
          start_time: string;
          end_date: string;
          end_time: string;
          priority: 'low' | 'medium' | 'high' | 'critical';
          completed: boolean;
          completed_at: string | null;
          is_overdue: boolean;
          is_recurring: boolean;
          parent_task_id: string | null;
          delegated_to: string | null;
          approval_required: boolean;
          budget_impact: 'none' | 'low' | 'medium' | 'high';
          risk_level: 'low' | 'medium' | 'high' | 'critical';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string;
          custom_category_id?: string | null;
          department?: string | null;
          estimated_hours?: number;
          actual_hours?: number | null;
          notes?: string;
          start_date: string;
          start_time: string;
          end_date: string;
          end_time: string;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          completed?: boolean;
          completed_at?: string | null;
          is_overdue?: boolean;
          is_recurring?: boolean;
          parent_task_id?: string | null;
          delegated_to?: string | null;
          approval_required?: boolean;
          budget_impact?: 'none' | 'low' | 'medium' | 'high';
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          custom_category_id?: string | null;
          department?: string | null;
          estimated_hours?: number;
          actual_hours?: number | null;
          notes?: string;
          start_date?: string;
          start_time?: string;
          end_date?: string;
          end_time?: string;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          completed?: boolean;
          completed_at?: string | null;
          is_overdue?: boolean;
          is_recurring?: boolean;
          parent_task_id?: string | null;
          delegated_to?: string | null;
          approval_required?: boolean;
          budget_impact?: 'none' | 'low' | 'medium' | 'high';
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
        };
      };
      task_stakeholders: {
        Row: {
          id: string;
          task_id: string;
          stakeholder_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          stakeholder_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          stakeholder_name?: string;
          created_at?: string;
        };
      };
      task_links: {
        Row: {
          id: string;
          task_id: string;
          url: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          url: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          url?: string;
          title?: string;
          created_at?: string;
        };
      };
      task_recurrence: {
        Row: {
          id: string;
          task_id: string;
          recurrence_type: 'daily' | 'weekly' | 'custom';
          interval_value: number;
          days_of_week: number[] | null;
          end_date: string | null;
          max_occurrences: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          recurrence_type: 'daily' | 'weekly' | 'custom';
          interval_value?: number;
          days_of_week?: number[] | null;
          end_date?: string | null;
          max_occurrences?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          recurrence_type?: 'daily' | 'weekly' | 'custom';
          interval_value?: number;
          days_of_week?: number[] | null;
          end_date?: string | null;
          max_occurrences?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}