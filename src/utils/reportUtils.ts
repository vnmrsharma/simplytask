import { Task } from '../types/Task';
import { DailyReport, WeeklyReport, MonthlyReport } from '../types/Report';

export const generateDailyReport = (tasks: Task[], date: string): DailyReport => {
  // Filter tasks that are relevant for this specific date
  const dayTasks = tasks.filter(task => {
    const taskStartDate = task.startDate;
    const taskEndDate = task.endDate;
    const taskCreatedDate = new Date(task.createdAt).toISOString().split('T')[0];
    const taskCompletedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
    
    // Include tasks that:
    // 1. Start on this date
    // 2. End on this date  
    // 3. Are completed on this date
    // 4. Are created on this date
    // 5. Span across this date (multi-day tasks)
    const startMatch = taskStartDate === date;
    const endMatch = taskEndDate === date;
    const completedMatch = taskCompletedDate === date;
    const createdMatch = taskCreatedDate === date;
    const spansMatch = taskStartDate <= date && taskEndDate >= date;
    
    return startMatch || endMatch || completedMatch || createdMatch || spansMatch;
  });

  // Tasks completed specifically on this date - Use proper date extraction
  const completedTasks = dayTasks.filter(task => {
    if (!task.completed) return false;
    
    // If task is completed but has no completedAt timestamp, 
    // treat it as completed on the task's end date
    if (!task.completedAt) {
      return task.endDate === date;
    }
    
    // Normal case: task has completedAt timestamp
    const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
    return completedDate === date;
  });

  // Tasks that were scheduled/active on this date (not just created)
  const activeTasks = dayTasks.filter(task => {
    const taskStartDate = task.startDate;
    const taskEndDate = task.endDate;
    return taskStartDate <= date && taskEndDate >= date;
  });

  // Tasks that became overdue on this date
  const overdueTasks = dayTasks.filter(task => 
    !task.completed && task.endDate < date
  );

  const completionRate = activeTasks.length > 0 
    ? Math.round((completedTasks.length / activeTasks.length) * 100) 
    : 0;

  const priorityBreakdown = {
    critical: completedTasks.filter(t => t.priority === 'critical').length,
    high: completedTasks.filter(t => t.priority === 'high').length,
    medium: completedTasks.filter(t => t.priority === 'medium').length,
    low: completedTasks.filter(t => t.priority === 'low').length,
  };

  const categoryBreakdown = {
    strategic: completedTasks.filter(t => t.category === 'strategic').length,
    operational: completedTasks.filter(t => t.category === 'operational').length,
    meeting: completedTasks.filter(t => t.category === 'meeting').length,
    review: completedTasks.filter(t => t.category === 'review').length,
    personal: completedTasks.filter(t => t.category === 'personal').length,
  };

  // Calculate time efficiency (actual vs estimated)
  const tasksWithTimeData = completedTasks.filter(t => t.estimatedHours && t.actualHours);
  const timeEfficiency = tasksWithTimeData.length > 0 
    ? Math.round((tasksWithTimeData.reduce((sum, t) => sum + (t.estimatedHours! / Math.max(t.actualHours!, 0.1)), 0) / tasksWithTimeData.length) * 100): 100;

  // Calculate delegation rate
  const delegatedTasks = dayTasks.filter(t => t.delegatedTo);
  const delegationRate = dayTasks.length > 0 ? Math.round((delegatedTasks.length / dayTasks.length) * 100) : 0;

  // Calculate productivity score based on completion rate, priority, and overdue tasks
  const priorityScore = (priorityBreakdown.critical * 4) + (priorityBreakdown.high * 3) + 
                       (priorityBreakdown.medium * 2) + (priorityBreakdown.low * 1);
  const overduePenalty = overdueTasks.length * 10;
  const strategicBonus = categoryBreakdown.strategic * 5; // Bonus for strategic work
  const productivityScore = Math.max(0, Math.min(100, completionRate + priorityScore + strategicBonus - overduePenalty));

  return {
    date,
    tasksCompleted: completedTasks.length,
    tasksCreated: activeTasks.length, // Changed from createdTasks to activeTasks
    tasksOverdue: overdueTasks.length,
    completionRate,
    priorityBreakdown,
    categoryBreakdown,
    timeEfficiency,
    delegationRate,
    productivityScore: Math.round(productivityScore)
  };
};

export const generateWeeklyReport = (tasks: Task[], weekStart: string): WeeklyReport => {
  const weekEnd = getWeekEnd(weekStart);
  const dailyReports: DailyReport[] = [];
  
  // Generate daily reports for the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    dailyReports.push(generateDailyReport(tasks, dateStr));
  }

  const totalCompleted = dailyReports.reduce((sum, day) => sum + day.tasksCompleted, 0);
  const totalCreated = dailyReports.reduce((sum, day) => sum + day.tasksCreated, 0);
  const averageCompletionRate = Math.round(
    dailyReports.reduce((sum, day) => sum + day.completionRate, 0) / 7
  );

  // Handle edge cases for best/worst day when all days have same score or no tasks
  const validDays = dailyReports.filter(day => day.tasksCompleted > 0 || day.tasksCreated > 0);
  
  const bestDay = validDays.length > 0 
    ? validDays.reduce((best, current) => 
    current.productivityScore > best.productivityScore ? current : best
      ).date
    : dailyReports[0].date; // Fallback to first day if no valid days

  const worstDay = validDays.length > 0
    ? validDays.reduce((worst, current) => 
    current.productivityScore < worst.productivityScore ? current : worst
      ).date
    : dailyReports[6].date; // Fallback to last day if no valid days

  const weeklyProductivityScore = Math.round(
    dailyReports.reduce((sum, day) => sum + day.productivityScore, 0) / 7
  );

  // Determine trend direction
  const firstHalf = dailyReports.slice(0, 3).reduce((sum, day) => sum + day.productivityScore, 0) / 3;
  const secondHalf = dailyReports.slice(4, 7).reduce((sum, day) => sum + day.productivityScore, 0) / 3;
  const trendDirection = secondHalf > firstHalf + 5 ? 'up' : 
                        secondHalf < firstHalf - 5 ? 'down' : 'stable';

  return {
    weekStart,
    weekEnd,
    totalTasksCompleted: totalCompleted,
    totalTasksCreated: totalCreated,
    averageCompletionRate,
    bestDay,
    worstDay,
    trendDirection,
    weeklyProductivityScore,
    dailyBreakdown: dailyReports
  };
};

export const generateMonthlyReport = (tasks: Task[], month: number, year: number): MonthlyReport => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const weeklyReports: WeeklyReport[] = [];

  // Generate weekly reports for the month
  let currentWeekStart = new Date(monthStart);
  while (currentWeekStart <= monthEnd) {
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];
    weeklyReports.push(generateWeeklyReport(tasks, weekStartStr));
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const totalCompleted = weeklyReports.reduce((sum, week) => sum + week.totalTasksCompleted, 0);
  const totalCreated = weeklyReports.reduce((sum, week) => sum + week.totalTasksCreated, 0);
  const averageCompletionRate = weeklyReports.length > 0 ? Math.round(
    weeklyReports.reduce((sum, week) => sum + week.averageCompletionRate, 0) / weeklyReports.length
  ) : 0;

  // Handle edge cases for best/worst week when all weeks have same score or no tasks
  const validWeeks = weeklyReports.filter(week => week.totalTasksCompleted > 0 || week.totalTasksCreated > 0);

  const bestWeek = validWeeks.length > 0
    ? validWeeks.reduce((best, current) => 
    current.weeklyProductivityScore > best.weeklyProductivityScore ? current : best
      ).weekStart
    : weeklyReports.length > 0 ? weeklyReports[0].weekStart : monthStart.toISOString().split('T')[0];

  const worstWeek = validWeeks.length > 0
    ? validWeeks.reduce((worst, current) => 
    current.weeklyProductivityScore < worst.weeklyProductivityScore ? current : worst
      ).weekStart
    : weeklyReports.length > 0 ? weeklyReports[weeklyReports.length - 1].weekStart : monthStart.toISOString().split('T')[0];

  const monthlyProductivityScore = weeklyReports.length > 0 ? Math.round(
    weeklyReports.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / weeklyReports.length
  ) : 0;

  // Determine monthly trend
  const firstHalf = weeklyReports.slice(0, Math.floor(weeklyReports.length / 2));
  const secondHalf = weeklyReports.slice(Math.floor(weeklyReports.length / 2));
  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / secondHalf.length : 0;
  
  const monthlyTrend = secondHalfAvg > firstHalfAvg + 5 ? 'improving' : 
                      secondHalfAvg < firstHalfAvg - 5 ? 'declining' : 'stable';

  // Calculate category insights
  const allDailyReports = weeklyReports.flatMap(week => week.dailyBreakdown);
  const validDailyReports = allDailyReports.filter(day => day.tasksCompleted > 0 || day.tasksCreated > 0);
  
  const mostProductiveDay = validDailyReports.length > 0
    ? validDailyReports.reduce((best, current) => 
    current.productivityScore > best.productivityScore ? current : best
      ).date
    : allDailyReports.length > 0 ? allDailyReports[0].date : monthStart.toISOString().split('T')[0];

  const averageTasksPerDay = allDailyReports.length > 0 ? Math.round(totalCompleted / allDailyReports.length) : 0;

  return {
    month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
    year,
    totalTasksCompleted: totalCompleted,
    totalTasksCreated: totalCreated,
    averageCompletionRate,
    bestWeek,
    worstWeek: worstWeek,
    monthlyTrend,
    monthlyProductivityScore,
    weeklyBreakdown: weeklyReports,
    categoryInsights: {
      mostProductiveDay,
      averageTasksPerDay,
      peakProductivityHours: 'Morning (9-11 AM)' // This could be enhanced with actual time tracking
    }
  };
};

const getWeekEnd = (weekStart: string): string => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
};

export const getWeekStart = (date: Date): string => {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart.toISOString().split('T')[0];
};

export const formatReportDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getProductivityInsight = (score: number): { message: string; color: string } => {
  if (score >= 90) return { message: 'Exceptional productivity! You\'re crushing your goals.', color: 'text-green-600' };
  if (score >= 75) return { message: 'Great work! You\'re maintaining high productivity.', color: 'text-blue-600' };
  if (score >= 60) return { message: 'Good progress. Consider optimizing your workflow.', color: 'text-yellow-600' };
  if (score >= 40) return { message: 'Room for improvement. Focus on priority tasks.', color: 'text-orange-600' };
  return { message: 'Let\'s get back on track. Start with small wins.', color: 'text-red-600' };
};