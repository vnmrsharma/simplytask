import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, AlertTriangle, ExternalLink, FileText, Edit3, Trash2, Repeat, Users, DollarSign, Shield, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Task } from '../types/Task';
import { formatDate, formatTime, formatDateTimeRange, getDaysUntilDue, isOverdue } from '../utils/dateUtils';
import { getPriorityColor, getCategoryColor, getBudgetImpactColor, getRiskLevelColor } from '../utils/taskUtils';
import { ErrorAlert } from './ErrorAlert';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  error?: string;
  onClearError?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  error, 
  onClearError 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const daysUntilDue = getDaysUntilDue(task.endDate, task.endTime);
  const taskIsOverdue = isOverdue(task.endDate, task.endTime, task.completed);
  
  const getDueDateStatus = () => {
    if (task.completed) return 'text-green-600';
    if (taskIsOverdue) return 'text-red-600';
    if (daysUntilDue <= 1) return 'text-orange-600';
    if (daysUntilDue <= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    await onToggleComplete(task.id);
    setIsUpdating(false);
  };
  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
      taskIsOverdue && !task.completed 
        ? 'border-red-200 bg-red-50/30' 
        : task.completed 
        ? 'border-green-200 bg-green-50/30' 
        : 'border-gray-200'
    }`}>
      {error && (
        <div className="p-4 border-b border-gray-200">
          <ErrorAlert error={error} onDismiss={onClearError} />
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={handleToggleComplete}
            disabled={isUpdating}
            className={`flex-shrink-0 mt-1 p-1 rounded-full transition-all duration-200 hover:scale-110 touch-manipulation ${
              task.completed ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            ) : (
              <Circle size={20} className="sm:w-6 sm:h-6" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className={`text-base sm:text-lg font-semibold transition-all duration-200 ${
                  task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(task.category)}`}>
                    {task.customCategoryName || task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                  </span>
                  
                  {task.isRecurring && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                      <Repeat size={12} />
                      Recurring
                    </span>
                  )}
                  
                  {task.delegatedTo && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                      <Users size={12} />
                      Delegated
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                  title={showDetails ? "Hide details" : "Show details"}
                >
                  {showDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                  title="Edit task"
                >
                  <Edit3 size={18} />
                </button>
                
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                  title="Delete task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span className={getDueDateStatus()}>
                  {formatDateTimeRange(task.startDate, task.startTime, task.endDate, task.endTime)}
                </span>
              </div>
              
              {task.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{task.estimatedHours}h estimated</span>
                </div>
              )}
              
              {taskIsOverdue && !task.completed && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle size={14} />
                  <span className="font-medium">Overdue</span>
                </div>
              )}
            </div>
              </div>
            </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {task.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={14} />
                  Notes
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {task.notes}
                </p>
              </div>
            )}

            {(task.department || task.delegatedTo || task.budgetImpact !== 'none' || task.riskLevel !== 'low') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.department && (
                    <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</span>
                    <p className="text-sm text-gray-900 mt-1">{task.department}</p>
                    </div>
                  )}
                
                {task.delegatedTo && (
                    <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delegated To</span>
                    <p className="text-sm text-gray-900 mt-1">{task.delegatedTo}</p>
                    </div>
                  )}
                
                {task.budgetImpact !== 'none' && (
                    <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget Impact</span>
                    <p className={`text-sm mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBudgetImpactColor(task.budgetImpact)}`}>
                        <DollarSign size={12} />
                      {task.budgetImpact.charAt(0).toUpperCase() + task.budgetImpact.slice(1)}
                    </p>
                    </div>
                  )}
                
                {task.riskLevel !== 'low' && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Level</span>
                    <p className={`text-sm mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(task.riskLevel)}`}>
                      <Shield size={12} />
                      {task.riskLevel.charAt(0).toUpperCase() + task.riskLevel.slice(1)}
                    </p>
                  </div>
                )}
              </div>
            )}

                {task.stakeholders && task.stakeholders.length > 0 && (
                  <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users size={14} />
                  Stakeholders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {task.stakeholders.map((stakeholder, index) => (
                        <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {stakeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

            {task.links && task.links.length > 0 && (
                  <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <ExternalLink size={14} />
                  Related Links
                </h4>
                    <div className="space-y-2">
                      {task.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group touch-manipulation"
                        >
                      <ExternalLink size={14} className="flex-shrink-0" />
                      <span className="group-hover:underline truncate">{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>
    </div>
  );
};