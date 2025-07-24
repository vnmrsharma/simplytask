import React from 'react';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { Task } from '../types/Task';
import { isOverdue, isToday } from '../utils/dateUtils';

interface TaskStatsProps {
  tasks: Task[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const stats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const overdue = tasks.filter(task => !task.completed && isOverdue(task.endDate, task.endTime, task.completed)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pending = total - completed;

    return { 
      total, 
      completed, 
      overdue, 
      completionRate,
      pending
    };
  }, [tasks]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Task Overview
        </h3>
      </div>
      
      {/* Stats Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Total Tasks */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-2">
              <Target size={16} />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          {/* Completed Tasks */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Done</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completed}</div>
          </div>
          
          {/* Pending Tasks */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.pending}</div>
          </div>
          
          {/* Completion Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-2">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">Rate</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
          </div>
          
          {/* Overdue Tasks - Always show, even if 0 */}
          <div className="text-center col-span-2 lg:col-span-1">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Overdue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.overdue}</div>
          </div>
        </div>
      </div>
    </div>
  );
};