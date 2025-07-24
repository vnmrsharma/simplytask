export interface TaskLink {
  id: string;
  url: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'strategic' | 'operational' | 'meeting' | 'review' | 'personal' | 'custom';
  customCategoryId?: string;
  customCategoryName?: string;
  customCategoryColor?: string;
  department?: string;
  stakeholders?: string[];
  estimatedHours?: number;
  actualHours?: number;
  notes: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
  links: TaskLink[];
  createdAt: string;
  completedAt?: string;
  isOverdue?: boolean;
  isRecurring?: boolean;
  recurrence?: {
    type: 'daily' | 'weekly' | 'custom';
    interval: number; // Every X days/weeks
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly/custom
    endDate?: string; // When to stop recurring
    maxOccurrences?: number; // Alternative to endDate
  };
  parentTaskId?: string; // For recurring task instances
  delegatedTo?: string;
  approvalRequired?: boolean;
  budgetImpact?: 'none' | 'low' | 'medium' | 'high';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export type ViewMode = 'list' | 'calendar';
export type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
export type SortType = 'priority' | 'dueDate' | 'created' | 'category' | 'budgetImpact';