import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Target, Award, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Task } from '../types/Task';
import { ReportPeriod } from '../types/Report';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, getWeekStart, formatReportDate, getProductivityInsight } from '../utils/reportUtils';
import { LoadingSpinner } from './LoadingSpinner';

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

  const currentReport = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedPeriod) {
      case 'daily':
        return generateDailyReport(tasks, today);
      case 'weekly':
        const weekStart = getWeekStart(selectedDate);
        return generateWeeklyReport(tasks, weekStart);
      case 'monthly':
        return generateMonthlyReport(tasks, selectedDate.getMonth(), selectedDate.getFullYear());
      default:
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
    const today = selectedDate.toISOString().split('T')[0];
    if (period === 'daily') {
      return tasks.filter(task => {
        const created = new Date(task.createdAt).toISOString().split('T')[0] === today;
        const completed = task.completedAt && new Date(task.completedAt).toISOString().split('T')[0] === today;
        return created || completed;
      });
    } else if (period === 'weekly') {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return tasks.filter(task => {
        const created = new Date(task.createdAt);
        const completed = task.completedAt ? new Date(task.completedAt) : null;
        return (
          (created >= new Date(weekStart) && created <= weekEnd) ||
          (completed && completed >= new Date(weekStart) && completed <= weekEnd)
        );
      });
    } else if (period === 'monthly') {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      return tasks.filter(task => {
        const created = new Date(task.createdAt);
        const completed = task.completedAt ? new Date(task.completedAt) : null;
        return (
          (created.getMonth() === month && created.getFullYear() === year) ||
          (completed && completed.getMonth() === month && completed.getFullYear() === year)
        );
      });
    }
    return [];
  };

  const handleSummarizeAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSummary(null);
    try {
      const today = selectedDate.toISOString().split('T')[0];
      const todayTasks = getPeriodTasks('daily');
      const response = await window.fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: todayTasks, date: today, period: 'daily' })
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

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-3xl font-bold text-green-600">{report.tasksCompleted}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{report.completionRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productivity Score</p>
                <p className="text-3xl font-bold text-purple-600">{report.productivityScore}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">{report.tasksOverdue}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{report.categoryBreakdown.strategic}</div>
              <div className="text-sm text-gray-600">Strategic Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.timeEfficiency}%</div>
              <div className="text-sm text-gray-600">Time Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{report.delegationRate}%</div>
              <div className="text-sm text-gray-600">Delegation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{report.categoryBreakdown.meeting}</div>
              <div className="text-sm text-gray-600">Meetings</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="text-center">
                <div className={`text-2xl font-bold ${
                  priority === 'critical' ? 'text-red-600' :
                  priority === 'high' ? 'text-orange-600' :
                  priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {count}
                </div>
                <div className="text-sm text-gray-600 capitalize">{priority}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Daily Insight</h3>
          </div>
          <p className={`text-lg ${insight.color}`}>{insight.message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSummarizeAI}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
            disabled={aiLoading}
          >
            {aiLoading ? <LoadingSpinner size="sm" /> : 'Summarize with AI'}
          </button>
        </div>
        {aiError && (
          <div className="text-red-600 text-sm mt-2">{String(aiError)}</div>
        )}
        {aiSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-4">
            <h4 className="text-lg font-bold text-green-700 mb-2">AI Motivation Summary</h4>
            <p className="text-gray-800 text-base whitespace-pre-line">{String(aiSummary)}</p>
          </div>
        )}
      </div>
    );
  };

  const renderWeeklyReport = () => {
    const report = currentReport as any;
    const insight = getProductivityInsight(report.weeklyProductivityScore);
    const weekTasks = getPeriodTasks('weekly');
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
              {report.dailyBreakdown.map((day: any, index: number) => (
                <div key={day.date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{day.tasksCompleted} tasks</span>
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
              ))}
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
              {report.weeklyBreakdown.map((week: any, index: number) => (
                <div key={week.weekStart} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-medium">
                    Week {index + 1}
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
              ))}
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