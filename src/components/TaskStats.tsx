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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Task Overview
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Target size={14} />
              <span className="text-xs font-medium">Total</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle size={14} />
              <span className="text-xs font-medium">Done</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Clock size={14} />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.pending}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">Rate</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
          </div>
          
          {stats.overdue > 0 && (
            <div className="text-center col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};