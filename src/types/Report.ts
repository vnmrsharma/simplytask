export interface DailyReport {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  tasksOverdue: number;
  completionRate: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: {
    strategic: number;
    operational: number;
    meeting: number;
    review: number;
    personal: number;
  };
  timeEfficiency: number;
  delegationRate: number;
  productivityScore: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalTasksCompleted: number;
  totalTasksCreated: number;
  averageCompletionRate: number;
  bestDay: string;
  worstDay: string;
  trendDirection: 'up' | 'down' | 'stable';
  weeklyProductivityScore: number;
  dailyBreakdown: DailyReport[];
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalTasksCompleted: number;
  totalTasksCreated: number;
  averageCompletionRate: number;
  bestWeek: string;
  worstWeek: string;
  monthlyTrend: 'improving' | 'declining' | 'stable';
  monthlyProductivityScore: number;
  weeklyBreakdown: WeeklyReport[];
  categoryInsights: {
    mostProductiveDay: string;
    averageTasksPerDay: number;
    peakProductivityHours: string;
  };
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';