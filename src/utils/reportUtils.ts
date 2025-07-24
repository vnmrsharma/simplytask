import { Task } from '../types/Task';
import { DailyReport, WeeklyReport, MonthlyReport } from '../types/Report';

export const generateDailyReport = (tasks: Task[], date: string): DailyReport => {
  const dayTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
    const completedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
    return taskDate === date || completedDate === date;
  });

  const completedTasks = dayTasks.filter(task => 
    task.completed && task.completedAt && 
    new Date(task.completedAt).toISOString().split('T')[0] === date
  );

  const createdTasks = dayTasks.filter(task => 
    new Date(task.createdAt).toISOString().split('T')[0] === date
  );

  const overdueTasks = dayTasks.filter(task => 
    !task.completed && new Date(`${task.endDate}T${task.endTime}`) < new Date(date)
  );

  const completionRate = createdTasks.length > 0 
    ? Math.round((completedTasks.length / createdTasks.length) * 100) 
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
    tasksCreated: createdTasks.length,
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

  const bestDay = dailyReports.reduce((best, current) => 
    current.productivityScore > best.productivityScore ? current : best
  ).date;

  const worstDay = dailyReports.reduce((worst, current) => 
    current.productivityScore < worst.productivityScore ? current : worst
  ).date;

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
  const averageCompletionRate = Math.round(
    weeklyReports.reduce((sum, week) => sum + week.averageCompletionRate, 0) / weeklyReports.length
  );

  const bestWeek = weeklyReports.reduce((best, current) => 
    current.weeklyProductivityScore > best.weeklyProductivityScore ? current : best
  ).weekStart;

  const worstWeek = weeklyReports.reduce((worst, current) => 
    current.weeklyProductivityScore < worst.weeklyProductivityScore ? current : worst
  ).weekStart;

  const monthlyProductivityScore = Math.round(
    weeklyReports.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / weeklyReports.length
  );

  // Determine monthly trend
  const firstHalf = weeklyReports.slice(0, Math.floor(weeklyReports.length / 2));
  const secondHalf = weeklyReports.slice(Math.floor(weeklyReports.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, week) => sum + week.weeklyProductivityScore, 0) / secondHalf.length;
  
  const monthlyTrend = secondHalfAvg > firstHalfAvg + 5 ? 'improving' : 
                      secondHalfAvg < firstHalfAvg - 5 ? 'declining' : 'stable';

  // Calculate category insights
  const allDailyReports = weeklyReports.flatMap(week => week.dailyBreakdown);
  const mostProductiveDay = allDailyReports.reduce((best, current) => 
    current.productivityScore > best.productivityScore ? current : best
  ).date;

  const averageTasksPerDay = Math.round(totalCompleted / allDailyReports.length);

  return {
    month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
    year,
    totalTasksCompleted: totalCompleted,
    totalTasksCreated: totalCreated,
    averageCompletionRate,
    bestWeek,
    worstWeek,
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