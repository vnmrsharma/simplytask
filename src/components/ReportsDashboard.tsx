import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Target, Award, Clock, ArrowUp, ArrowDown, Minus, PieChart, Activity } from 'lucide-react';
import { Task } from '../types/Task';
import { ReportPeriod } from '../types/Report';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, getWeekStart, formatReportDate, getProductivityInsight } from '../utils/reportUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Pie
} from 'recharts';

// Chart color schemes
const PRIORITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#2563eb',
  low: '#6b7280'
};

const CATEGORY_COLORS = {
  strategic: '#7c3aed',
  operational: '#2563eb',
  meeting: '#059669',
  review: '#ea580c',
  personal: '#6366f1'
};

// Custom chart components
const CircularProgress: React.FC<{ value: number; size?: number; title: string; color?: string }> = ({ 
  value, 
  size = 120, 
  title, 
  color = '#2563eb' 
}) => {
  const data = [{ name: 'completed', value: value, fill: color }];
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={size} height={size}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data}>
            <RadialBar dataKey="value" cornerRadius={10} fill={color} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color }}>{value}%</div>
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600 mt-2">{title}</div>
    </div>
  );
};

interface ReportsDashboardProps {
  tasks: Task[];
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ tasks }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  // Add AI summary state for each period
  const [weeklyAiSummary, setWeeklyAiSummary] = React.useState<string | null>(null);
  const [weeklyAiLoading, setWeeklyAiLoading] = React.useState(false);
  const [weeklyAiError, setWeeklyAiError] = React.useState<string | null>(null);
  const [monthlyAiSummary, setMonthlyAiSummary] = React.useState<string | null>(null);
  const [monthlyAiLoading, setMonthlyAiLoading] = React.useState(false);
  const [monthlyAiError, setMonthlyAiError] = React.useState<string | null>(null);

  // Debug task data
  React.useEffect(() => {
    if (tasks.length > 0) {
      console.log('Tasks loaded:', tasks.length);
    }
  }, [tasks]);

  const currentReport = useMemo(() => {
    switch (selectedPeriod) {
      case 'daily':
        const dailyDate = selectedDate.toISOString().split('T')[0];
        const dailyReport = generateDailyReport(tasks, dailyDate);
        return dailyReport;
      case 'weekly':
        const weekStart = getWeekStart(selectedDate);
        const weeklyReport = generateWeeklyReport(tasks, weekStart);
        return weeklyReport;
      case 'monthly':
        const monthlyReport = generateMonthlyReport(tasks, selectedDate.getMonth(), selectedDate.getFullYear());
        return monthlyReport;
      default:
        const today = new Date().toISOString().split('T')[0];
        return generateDailyReport(tasks, today);
    }
  }, [tasks, selectedPeriod, selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      switch (selectedPeriod) {
        case 'daily':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'weekly':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'monthly':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
      case 'declining':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return 'text-green-600';
      case 'down':
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper to get tasks for a given period
  const getPeriodTasks = (period: 'daily' | 'weekly' | 'monthly') => {
    if (period === 'daily') {
      const targetDate = selectedDate.toISOString().split('T')[0];
      return tasks.filter(task => {
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
        return taskStartDate === targetDate || 
               taskEndDate === targetDate || 
               taskCompletedDate === targetDate ||
               taskCreatedDate === targetDate ||
               (taskStartDate <= targetDate && taskEndDate >= targetDate);
      });
    } else if (period === 'weekly') {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekStartStr = weekStart;
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      return tasks.filter(task => {
        const taskStartDate = task.startDate;
        const taskEndDate = task.endDate;
        const taskCreatedDate = new Date(task.createdAt).toISOString().split('T')[0];
        const taskCompletedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
        
        // Include tasks that:
        // 1. Start within this week
        // 2. End within this week
        // 3. Are completed within this week
        // 4. Are created within this week
        // 5. Span across this week
        return (taskStartDate >= weekStartStr && taskStartDate <= weekEndStr) ||
               (taskEndDate >= weekStartStr && taskEndDate <= weekEndStr) ||
               (taskCompletedDate && taskCompletedDate >= weekStartStr && taskCompletedDate <= weekEndStr) ||
               (taskCreatedDate >= weekStartStr && taskCreatedDate <= weekEndStr) ||
               (taskStartDate <= weekStartStr && taskEndDate >= weekEndStr);
      });
    } else if (period === 'monthly') {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
      const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      return tasks.filter(task => {
        const taskStartDate = task.startDate;
        const taskEndDate = task.endDate;
        const taskCreatedDate = new Date(task.createdAt).toISOString().split('T')[0];
        const taskCompletedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
        
        // Include tasks that:
        // 1. Start within this month
        // 2. End within this month
        // 3. Are completed within this month
        // 4. Are created within this month
        // 5. Span across this month
        return (taskStartDate >= monthStart && taskStartDate <= monthEnd) ||
               (taskEndDate >= monthStart && taskEndDate <= monthEnd) ||
               (taskCompletedDate && taskCompletedDate >= monthStart && taskCompletedDate <= monthEnd) ||
               (taskCreatedDate >= monthStart && taskCreatedDate <= monthEnd) ||
               (taskStartDate <= monthStart && taskEndDate >= monthEnd);
      });
    }
    return [];
  };

  const handleSummarizeAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSummary(null);
    try {
      const dailyDate = selectedDate.toISOString().split('T')[0];
      const todayTasks = getPeriodTasks('daily');
      const response = await window.fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: todayTasks, date: dailyDate, period: 'daily' })
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (err: any) {
      setAiError(err.message || 'Error generating summary');
    } finally {
      setAiLoading(false);
    }
  };

  const handleWeeklySummarizeAI = async () => {
    setWeeklyAiLoading(true);
    setWeeklyAiError(null);
    setWeeklyAiSummary(null);
    try {
      const weekStart = getWeekStart(selectedDate);
      const weekTasks = getPeriodTasks('weekly');
      const response = await window.fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: weekTasks, date: weekStart, period: 'weekly' })
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setWeeklyAiSummary(data.summary);
    } catch (err: any) {
      setWeeklyAiError(err.message || 'Error generating summary');
    } finally {
      setWeeklyAiLoading(false);
    }
  };

  const handleMonthlySummarizeAI = async () => {
    setMonthlyAiLoading(true);
    setMonthlyAiError(null);
    setMonthlyAiSummary(null);
    try {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const monthTasks = getPeriodTasks('monthly');
      const response = await window.fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: monthTasks, date: `${year}-${month + 1}`, period: 'monthly' })
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setMonthlyAiSummary(data.summary);
    } catch (err: any) {
      setMonthlyAiError(err.message || 'Error generating summary');
    } finally {
      setMonthlyAiLoading(false);
    }
  };

  const renderDailyReport = () => {
    const report = currentReport as any;
    const insight = getProductivityInsight(report.productivityScore);

    // Prepare chart data
    const priorityData = Object.entries(report.priorityBreakdown).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number,
      fill: PRIORITY_COLORS[key as keyof typeof PRIORITY_COLORS]
    }));

    const categoryData = Object.entries(report.categoryBreakdown).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number,
      fill: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
      percentage: report.activeTasks > 0 ? Math.round((value as number / report.activeTasks) * 100) : 0
    }));

    // Filter out empty categories for cleaner display
    const activeCategoryData = categoryData.filter(item => item.value > 0);

    return (
      <div className="space-y-4">
        {/* Compact metrics cards - 2 rows on mobile, 1 row on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{report.tasksCompleted}</p>
                <p className="text-xs text-gray-500">{report.completionRate}%</p>
              </div>
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{report.activeTasks}</p>
                <p className="text-xs text-gray-500">today</p>
              </div>
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Score</p>
                <p className="text-2xl font-bold text-purple-600">{report.productivityScore}</p>
                <p className="text-xs text-gray-500">/100</p>
              </div>
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{report.tasksOverdue}</p>
                <p className="text-xs text-gray-500">tasks</p>
              </div>
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Compact Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Compact Circular Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Progress</h3>
            </div>
            <div className="flex items-center justify-center">
              <CircularProgress 
                value={report.completionRate} 
                title="Completion"
                color="#7c3aed"
                size={120}
              />
            </div>
          </div>

          {/* Compact Priority Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Priority Split</h3>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    width={20}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[2, 2, 0, 0]}
                    stroke="none"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Category Mix</h3>
            </div>
            {activeCategoryData.length > 0 ? (
              <div className="space-y-3">
                {/* Compact Pie Chart */}
                <div className="h-24 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={activeCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {activeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} tasks`, name]}
                        contentStyle={{ 
                          background: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend with percentages */}
                <div className="space-y-1">
                  {activeCategoryData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-gray-700 font-medium">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">{entry.value}</span>
                        <span className="text-gray-500">({entry.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Category insights */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600">
                    {activeCategoryData.length > 0 && (
                      <div className="flex justify-between">
                        <span>Most Active:</span>
                        <span className="font-medium text-gray-800">
                          {activeCategoryData.reduce((prev, current) => 
                            prev.value > current.value ? prev : current
                          ).name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">No active tasks</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Executive Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center bg-purple-50 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-600">{report.categoryBreakdown.strategic || 0}</div>
              <div className="text-xs text-purple-700">Strategic</div>
            </div>
            <div className="text-center bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">{report.timeEfficiency}%</div>
              <div className="text-xs text-blue-700">Efficiency</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">{report.delegationRate}%</div>
              <div className="text-xs text-green-700">Delegation</div>
            </div>
            <div className="text-center bg-orange-50 rounded-lg p-3">
              <div className="text-lg font-bold text-orange-600">{report.categoryBreakdown.meeting || 0}</div>
              <div className="text-xs text-orange-700">Meetings</div>
            </div>
          </div>
        </div>

        {/* Daily Insight */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Daily Insight</h3>
          </div>
          <p className={`text-sm ${insight.color}`}>{insight.message}</p>
        </div>

        {/* AI Summary Section */}
        <div className="flex justify-end">
          <button
            onClick={handleSummarizeAI}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 text-sm"
            disabled={aiLoading}
          >
            {aiLoading ? <LoadingSpinner size="sm" /> : 'Summarize with AI'}
          </button>
        </div>
        {aiError && (
          <div className="text-red-600 text-xs mt-1">{String(aiError)}</div>
        )}
        {aiSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mt-2">
            <h4 className="text-sm font-bold text-green-700 mb-2">AI Daily Summary</h4>
            <p className="text-gray-800 text-sm whitespace-pre-line">{String(aiSummary)}</p>
          </div>
        )}
      </div>
    );
  };

  const renderWeeklyReport = () => {
    const report = currentReport as any;
    const insight = getProductivityInsight(report.weeklyProductivityScore);
    const weekTasks = getPeriodTasks('weekly');

    // Prepare compact chart data for weekly view
    const weeklyTrendData = report.dailyBreakdown.map((day: any, index: number) => ({
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      score: day.productivityScore,
      tasks: day.tasksCompleted
    }));

    // Calculate aggregated priority breakdown from daily reports
    const weeklyPriorityData = Object.keys(PRIORITY_COLORS).map((priority) => {
      const totalForPriority = report.dailyBreakdown.reduce((sum: number, day: any) => {
        return sum + (day.priorityBreakdown?.[priority] || 0);
      }, 0);
      return {
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: totalForPriority,
        fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]
      };
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Completed</p>
                <p className="text-3xl font-bold text-green-600">{report.totalTasksCompleted}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{report.averageCompletionRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Score</p>
                <p className="text-3xl font-bold text-purple-600">{report.weeklyProductivityScore}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trend</p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(report.trendDirection)}
                  <span className={`text-lg font-semibold capitalize ${getTrendColor(report.trendDirection)}`}>
                    {report.trendDirection}
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Compact Weekly Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Compact Circular Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Weekly Progress</h3>
            </div>
            <div className="flex items-center justify-center">
              <CircularProgress 
                value={report.weeklyProductivityScore} 
                title="Weekly Score"
                color="#7c3aed"
                size={100}
              />
            </div>
          </div>

          {/* Weekly Trend Line Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Daily Trend</h3>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => [
                      name === 'score' ? `${value}% score` : `${value} tasks`,
                      name === 'score' ? 'Productivity' : 'Tasks'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 4, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compact Priority Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Priority Split</h3>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPriorityData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    interval={0}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[2, 2, 0, 0]}
                    stroke="none"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best & Worst Days</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Best Day</p>
                  <p className="text-sm text-green-600">{formatReportDate(report.bestDay)}</p>
                </div>
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Needs Attention</p>
                  <p className="text-sm text-red-600">{formatReportDate(report.worstDay)}</p>
                </div>
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Progress</h3>
            <div className="space-y-2">
              {report.dailyBreakdown.map((day: any, index: number) => {
                const dayDate = new Date(day.date);
                const dayLabel = `${dayDate.toLocaleDateString('en-US', { weekday: 'short' })} (${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
                
                return (
                  <div key={day.date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-medium">
                      {dayLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {day.tasksCompleted}/{day.tasksCreated} tasks
                      </span>
                      <div className={`w-16 h-2 rounded-full ${
                        day.productivityScore >= 80 ? 'bg-green-200' :
                        day.productivityScore >= 60 ? 'bg-blue-200' :
                        day.productivityScore >= 40 ? 'bg-yellow-200' : 'bg-red-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            day.productivityScore >= 80 ? 'bg-green-600' :
                            day.productivityScore >= 60 ? 'bg-blue-600' :
                            day.productivityScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${day.productivityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Insight</h3>
          </div>
          <p className={`text-lg ${insight.color}`}>{insight.message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleWeeklySummarizeAI}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
            disabled={weeklyAiLoading}
          >
            {weeklyAiLoading ? <LoadingSpinner size="sm" /> : 'Summarize with AI'}
          </button>
        </div>
        {weeklyAiError && (
          <div className="text-red-600 text-sm mt-2">{String(weeklyAiError)}</div>
        )}
        {weeklyAiSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-4">
            <h4 className="text-lg font-bold text-green-700 mb-2">AI Weekly Summary</h4>
            <p className="text-gray-800 text-base whitespace-pre-line">{String(weeklyAiSummary)}</p>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyReport = () => {
    const report = currentReport as any;
    const insight = getProductivityInsight(report.monthlyProductivityScore);
    const monthTasks = getPeriodTasks('monthly');

    // Prepare compact chart data for monthly view
    const monthlyTrendData = report.weeklyBreakdown.map((week: any, index: number) => ({
      week: `W${index + 1}`,
      score: week.weeklyProductivityScore,
      tasks: week.totalTasksCompleted,
      efficiency: week.averageCompletionRate || 0
    }));

    // Calculate aggregated priority breakdown from weekly reports
    const monthlyPriorityData = Object.keys(PRIORITY_COLORS).map((priority) => {
      const totalForPriority = report.weeklyBreakdown.reduce((sum: number, week: any) => {
        return sum + week.dailyBreakdown.reduce((dailySum: number, day: any) => {
          return dailySum + (day.priorityBreakdown?.[priority] || 0);
        }, 0);
      }, 0);
      return {
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: totalForPriority,
        fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]
      };
    });

    // Calculate proper completion data based on actual tasks in the period
    const periodTasks = getPeriodTasks('monthly');
    const completedTasksCount = periodTasks.filter(task => task.completed).length;
    const totalTasksCount = periodTasks.length;
    const pendingTasksCount = totalTasksCount - completedTasksCount;

    const monthlyCompletionData = [
      { name: 'Completed', value: completedTasksCount, fill: '#10b981' },
      { name: 'Pending', value: pendingTasksCount, fill: '#6b7280' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Completed</p>
                <p className="text-3xl font-bold text-green-600">{report.totalTasksCompleted}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Daily Tasks</p>
                <p className="text-3xl font-bold text-blue-600">{report.categoryInsights.averageTasksPerDay}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Score</p>
                <p className="text-3xl font-bold text-purple-600">{report.monthlyProductivityScore}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Trend</p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(report.monthlyTrend)}
                  <span className={`text-lg font-semibold capitalize ${getTrendColor(report.monthlyTrend)}`}>
                    {report.monthlyTrend}
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Compact Monthly Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Compact Circular Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Monthly Score</h3>
            </div>
            <div className="flex items-center justify-center">
              <CircularProgress 
                value={report.monthlyProductivityScore} 
                title="Progress"
                color="#7c3aed"
                size={90}
              />
            </div>
          </div>

          {/* Completion Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Task Completion</h3>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={monthlyCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={35}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {monthlyCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-600 mt-1">
              {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% Complete
            </div>
          </div>

          {/* Monthly Trend Area Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Weekly Progression</h3>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => [
                      name === 'score' ? `${value}% score` : 
                      name === 'tasks' ? `${value} tasks` :
                      `${value}% efficiency`,
                      name === 'score' ? 'Productivity' : 
                      name === 'tasks' ? 'Tasks' : 'Efficiency'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    fill="#93c5fd"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#10b981" 
                    fill="#86efac"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Highlights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Best Week</p>
                  <p className="text-sm text-green-600">{formatReportDate(report.bestWeek)}</p>
                </div>
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Most Productive Day</p>
                  <p className="text-sm text-blue-600">{formatReportDate(report.categoryInsights.mostProductiveDay)}</p>
                </div>
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Peak Hours</p>
                  <p className="text-sm text-purple-600">{report.categoryInsights.peakProductivityHours}</p>
                </div>
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Breakdown</h3>
            <div className="space-y-2">
              {report.weeklyBreakdown.map((week: any, index: number) => {
                const weekStart = new Date(week.weekStart);
                const weekEnd = new Date(week.weekEnd);
                const weekLabel = `Week ${index + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
                
                return (
                  <div key={week.weekStart} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-medium">
                      {weekLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{week.totalTasksCompleted} tasks</span>
                      <div className={`w-16 h-2 rounded-full ${
                        week.weeklyProductivityScore >= 80 ? 'bg-green-200' :
                        week.weeklyProductivityScore >= 60 ? 'bg-blue-200' :
                        week.weeklyProductivityScore >= 40 ? 'bg-yellow-200' : 'bg-red-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            week.weeklyProductivityScore >= 80 ? 'bg-green-600' :
                            week.weeklyProductivityScore >= 60 ? 'bg-blue-600' :
                            week.weeklyProductivityScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${week.weeklyProductivityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Insight</h3>
          </div>
          <p className={`text-lg ${insight.color}`}>{insight.message}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">Completion Rate</p>
              <p className="text-blue-600">{report.averageCompletionRate}% average</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">Total Output</p>
              <p className="text-green-600">{report.totalTasksCompleted} tasks completed</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">Consistency</p>
              <p className="text-purple-600">{report.categoryInsights.averageTasksPerDay} tasks/day</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleMonthlySummarizeAI}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
            disabled={monthlyAiLoading}
          >
            {monthlyAiLoading ? <LoadingSpinner size="sm" /> : 'Summarize with AI'}
          </button>
        </div>
        {monthlyAiError && (
          <div className="text-red-600 text-sm mt-2">{String(monthlyAiError)}</div>
        )}
        {monthlyAiSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-4">
            <h4 className="text-lg font-bold text-green-700 mb-2">AI Monthly Summary</h4>
            <p className="text-gray-800 text-base whitespace-pre-line">{String(monthlyAiSummary)}</p>
          </div>
        )}
      </div>
    );
  };

  const getDateRangeText = () => {
    switch (selectedPeriod) {
      case 'daily':
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'weekly':
        const weekStart = getWeekStart(selectedDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'monthly':
        return selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Productivity Reports</h2>
            <p className="text-gray-600">Track your progress and identify productivity patterns</p>
          </div>
          
          <div className="flex items-center gap-4">            
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    selectedPeriod === period
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowUp className="w-4 h-4 transform rotate-[-90deg]" />
              </button>
              <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">
                {getDateRangeText()}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowUp className="w-4 h-4 transform rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedPeriod === 'daily' && renderDailyReport()}
      {selectedPeriod === 'weekly' && renderWeeklyReport()}
      {selectedPeriod === 'monthly' && renderMonthlyReport()}
    </div>
  );
};