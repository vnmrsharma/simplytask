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
    } ${task.isOverdue ? 'ring-1 ring-red-200' : ''}`}>
      {error && (
        <div className="p-4 pb-0">
          <ErrorAlert error={error} onDismiss={onClearError} />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleComplete}
            disabled={isUpdating}
            className={`mt-1 transition-all duration-200 disabled:opacity-50 ${
              task.completed 
                ? 'text-green-600' 
                : 'text-gray-400 hover:text-green-600 hover:scale-105'
            }`}
          >
            {isUpdating ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : task.completed ? (
              <CheckCircle2 size={20} />
            ) : (
              <Circle size={20} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold text-lg leading-tight ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span 
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                  task.category === 'custom' && task.customCategoryColor
                    ? 'text-white border-opacity-50'
                    : getCategoryColor(task.category)
                }`}
                style={task.category === 'custom' && task.customCategoryColor ? {
                  backgroundColor: task.customCategoryColor,
                  borderColor: task.customCategoryColor
                } : {}}
              >
                {task.category === 'custom' ? task.customCategoryName : task.category}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {task.isRecurring && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <Repeat size={12} className="mr-1" />
                  Recurring
                </span>
              )}
              {task.delegatedTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  <Users size={12} className="mr-1" />
                  Delegated
                </span>
              )}
              {task.approvalRequired && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <Shield size={12} className="mr-1" />
                  Approval Required
                </span>
              )}
              {task.isOverdue && !task.completed && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle size={12} className="mr-1" />
                  Overdue
                </span>
              )}
            </div>
            
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <div className={`flex items-center gap-1 ${getDueDateStatus()}`}>
                <Calendar size={14} />
                <span>{formatDateTimeRange(task.startDate, task.startTime, task.endDate, task.endTime)}</span>
                {!task.completed && (
                  <span className="ml-1 font-medium">
                    ({daysUntilDue > 0 ? `${daysUntilDue} days left` : daysUntilDue === 0 ? 'Today' : `${Math.abs(daysUntilDue)} days overdue`})
                  </span>
                )}
              </div>
            </div>

            {(task.notes || task.links.length > 0) && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            )}

            {showDetails && (
              <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 bg-gray-50/50 -mx-6 px-6 pb-4 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.department && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Department</h4>
                      <p className="text-sm text-gray-700 bg-white px-2 py-1 rounded border">{task.department}</p>
                    </div>
                  )}
                  {task.estimatedHours && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Estimated Time</h4>
                      <p className="text-sm text-gray-700 flex items-center gap-1 bg-white px-2 py-1 rounded border">
                        <Clock size={14} />
                        {task.estimatedHours} hours
                      </p>
                    </div>
                  )}
                  {task.budgetImpact && task.budgetImpact !== 'none' && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Budget Impact</h4>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getBudgetImpactColor(task.budgetImpact)}`}>
                        <DollarSign size={12} />
                        {task.budgetImpact}
                      </span>
                    </div>
                  )}
                  {task.riskLevel && task.riskLevel !== 'low' && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Risk Level</h4>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColor(task.riskLevel)}`}>
                        <AlertTriangle size={12} />
                        {task.riskLevel}
                      </span>
                    </div>
                  )}
                </div>
                {task.delegatedTo && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Delegated To</h4>
                    <p className="text-sm text-gray-700 flex items-center gap-1 bg-white px-2 py-1 rounded border">
                      <Users size={14} />
                      {task.delegatedTo}
                    </p>
                  </div>
                )}
                {task.stakeholders && task.stakeholders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Stakeholders</h4>
                    <div className="flex flex-wrap gap-1">
                      {task.stakeholders.map((stakeholder) => (
                        <span
                          key={stakeholder}
                          className="inline-flex items-center px-3 py-1 bg-white text-gray-700 rounded-full text-xs border font-medium"
                        >
                          {stakeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {task.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{task.notes}</p>
                    </div>
                  </div>
                )}
                {task.links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Links</h4>
                    <div className="space-y-2">
                      {task.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-white p-2 rounded border hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink size={14} />
                          {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};