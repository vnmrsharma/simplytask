import React from 'react';
import { CheckCircle, Clock, AlertTriangle, BarChart3, Target, Users, DollarSign, TrendingUp } from 'lucide-react';
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
    const dueToday = tasks.filter(task => !task.completed && isToday(task.endDate)).length;
    const strategic = tasks.filter(task => task.category === 'strategic' && !task.completed).length;
    const delegated = tasks.filter(task => task.delegatedTo && !task.completed).length;
    const highBudgetImpact = tasks.filter(task => (task.budgetImpact === 'high' || task.budgetImpact === 'medium') && !task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { 
      total, 
      completed, 
      overdue, 
      dueToday, 
      strategic, 
      delegated, 
      highBudgetImpact, 
      completionRate,
      pending: total - completed
    };
  }, [tasks]);

  const statItems = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: Target,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const executiveStats = [
    {
      label: 'Strategic Tasks',
      value: stats.strategic,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Delegated Tasks',
      value: stats.delegated,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'High Budget Impact',
      value: stats.highBudgetImpact,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {executiveStats.map((item) => (
            <div key={item.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};