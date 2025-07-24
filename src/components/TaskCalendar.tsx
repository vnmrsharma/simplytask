import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus,
  Grid3X3,
  List,
  Eye,
  Zap
} from 'lucide-react';
import { Task } from '../types/Task';
import { getPriorityColor } from '../utils/taskUtils';
import { isOverdue } from '../utils/dateUtils';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateClick: (date: string) => void;
}

type CalendarView = 'daily' | 'weekly' | 'monthly' | 'yearly';

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateHeader = (date: Date, view: CalendarView): string => {
  switch (view) {
    case 'daily':
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return '';
  }
};

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('daily');

  // Define helper functions first
  const getTasksForDate = (date: Date) => {
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
    return tasks.filter(task => {
      const taskStart = task.startDate;
      const taskEnd = task.endDate;
      return dateStr >= taskStart && dateStr <= taskEnd;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentPeriod = (date: Date) => {
    switch (view) {
      case 'monthly':
        return date.getMonth() === currentDate.getMonth();
      case 'yearly':
        return date.getFullYear() === currentDate.getFullYear();
      default:
        return true;
    }
  };

  // Pre-calculate calendar days for monthly view to avoid conditional hooks
  const monthlyCalendarDays = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Calculate current view tasks
  const currentViewTasks = useMemo(() => {
    switch (view) {
      case 'daily':
        return getTasksForDate(currentDate);
      case 'weekly':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return tasks.filter(task => {
          const taskDate = new Date(task.startDate);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      case 'monthly':
        return tasks.filter(task => {
          const taskDate = new Date(task.startDate);
          return taskDate.getFullYear() === currentDate.getFullYear() && 
                 taskDate.getMonth() === currentDate.getMonth();
        });
      case 'yearly':
        return tasks.filter(task => {
          const taskDate = new Date(task.startDate);
          return taskDate.getFullYear() === currentDate.getFullYear();
        });
      default:
        return [];
    }
  }, [tasks, currentDate, view, getTasksForDate]);

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (view) {
        case 'daily':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'weekly':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'monthly':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'yearly':
          newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const renderDailyView = () => {
    const dayTasks = getTasksForDate(currentDate);
    
    return (
      <div className="space-y-6">
        {/* Time slots */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule for {isToday(currentDate) ? 'Today' : formatDateHeader(currentDate, 'daily').split(',')[0]}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 24 }, (_, hour) => {
              const hourTasks = dayTasks.filter(task => {
                const taskHour = parseInt(task.startTime.split(':')[0]);
                return taskHour === hour;
              });
              
              return (
                <div key={hour} className="flex hover:bg-gray-50">
                  <div className="w-16 sm:w-20 flex-shrink-0 p-2 sm:p-4 text-xs sm:text-sm text-gray-500 border-r border-gray-100">
                    {hour === 0 ? '12 AM' : 
                     hour < 12 ? `${hour} AM` : 
                     hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1 p-2 sm:p-4">
                    {hourTasks.length > 0 ? (
                      <div className="space-y-2">
                        {hourTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${
                              task.completed 
                                ? 'bg-green-50 border border-green-200' 
                                : isOverdue(task.endDate, task.endTime, task.completed)
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className={`font-medium ${task.completed ? 'line-through text-green-700' : 'text-gray-900'}`}>
                                  {task.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatTime(task.startTime)} - {formatTime(task.endTime)}
                                </p>
                                {task.description && (
                                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className={`w-3 h-3 rounded-full ml-3 ${
                                task.priority === 'critical' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-orange-500' :
                                task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">No tasks scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const dateStr = day.getFullYear() + '-' + 
                           String(day.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(day.getDate()).padStart(2, '0');
            
            // Calculate task density for visual feedback
            const taskDensity = dayTasks.length;
            const completedTasks = dayTasks.filter(t => t.completed).length;
            const pendingTasks = dayTasks.length - completedTasks;
            
            return (
              <div key={index} className="min-h-[400px] flex flex-col">
                <div className={`p-3 border-b border-gray-200 text-center relative ${
                  isToday(day) ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  {/* Task density indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    taskDensity === 0 ? 'bg-gray-200' :
                    taskDensity <= 2 ? 'bg-green-400' :
                    taskDensity <= 4 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  
                  <div className="text-sm font-medium text-gray-700">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  {dayTasks.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="text-xs text-gray-500">
                        {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                      </div>
                      {completedTasks > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">{completedTasks}</span>
                        </div>
                      )}
                      {pendingTasks > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-600">{pendingTasks}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div 
                  className="flex-1 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onDateClick(dateStr)}
                >
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {dayTasks.slice(0, 6).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`text-xs p-2 rounded cursor-pointer hover:shadow-sm transition-all relative ${
                          task.completed 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : isOverdue(task.endDate, task.endTime, task.completed)
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : task.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200'
                            : task.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : task.priority === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {/* Priority indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                          task.priority === 'critical' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`} />
                        
                        <div className="ml-2">
                          <div className={`font-medium truncate leading-tight ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                          <div className="text-xs opacity-75 leading-tight flex items-center gap-1 mt-0.5">
                            <span>{formatTime(task.startTime)}</span>
                            {task.category && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{task.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 6 && (
                      <div 
                        className="text-xs text-center py-2 text-gray-500 hover:text-gray-700 cursor-pointer border border-dashed border-gray-300 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateClick(dateStr); // Open day view to see all tasks
                        }}
                      >
                        +{dayTasks.length - 6} more tasks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="bg-gray-50 p-4 text-center">
              <div className="text-sm font-medium text-gray-700 hidden sm:block">{day}</div>
              <div className="text-sm font-medium text-gray-700 sm:hidden">{day.slice(0, 3)}</div>
            </div>
          ))}
          
          {monthlyCalendarDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const dateStr = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0');
            
            // Calculate task density for visual indicator
            const taskDensity = dayTasks.length;
            const densityColor = taskDensity === 0 ? 'bg-gray-100' : 
                                taskDensity <= 2 ? 'bg-green-100' :
                                taskDensity <= 4 ? 'bg-yellow-100' :
                                'bg-red-100';
            
            return (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                  !isCurrentPeriod(date) ? 'text-gray-400 bg-gray-50 border-l-gray-200' : 
                  isToday(date) ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 border-l-blue-500' : 
                  `border-l-transparent hover:${densityColor.replace('bg-', 'border-l-').replace('-100', '-300')}`
                }`}
                onClick={() => onDateClick(dateStr)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isToday(date) ? 'text-blue-600' : 
                    !isCurrentPeriod(date) ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className={`flex items-center gap-1`}>
                      {/* Task density dots */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(dayTasks.length, 5) }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i < dayTasks.filter(t => !t.completed).length ? 
                                taskDensity <= 2 ? 'bg-green-500' :
                                taskDensity <= 4 ? 'bg-yellow-500' :
                                'bg-red-500'
                              : 'bg-gray-300'
                            }`}
                          />
                        ))}
                        {dayTasks.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">+</span>
                        )}
                      </div>
                      
                      {/* Task count badge */}
                      <div className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        isToday(date) ? 'bg-blue-100 text-blue-700' : 
                        taskDensity <= 2 ? 'bg-green-100 text-green-700' :
                        taskDensity <= 4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {dayTasks.length}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 max-h-20 overflow-hidden">
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity relative ${
                        task.completed 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : isOverdue(task.endDate, task.endTime, task.completed)
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : task.priority === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {/* Priority indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                        task.priority === 'critical' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      
                      <div className="ml-2">
                        <div className={`truncate font-medium leading-tight ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </div>
                        <div className="text-xs opacity-75 leading-tight">
                          {formatTime(task.startTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dayTasks.length > 2 && (
                    <div 
                      className="text-xs text-center py-1 text-gray-500 hover:text-gray-700 cursor-pointer border border-dashed border-gray-300 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(dateStr); // Open day view to see all tasks
                      }}
                    >
                      +{dayTasks.length - 2} more tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearlyView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentDate.getFullYear(), i, 1);
      return month;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map((month, index) => {
          const monthTasks = tasks.filter(task => {
            const taskDate = new Date(task.startDate);
            return taskDate.getFullYear() === currentDate.getFullYear() && 
                   taskDate.getMonth() === index;
          });

          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          const startCalendar = new Date(monthStart);
          startCalendar.setDate(startCalendar.getDate() - monthStart.getDay());
          const endCalendar = new Date(monthEnd);
          endCalendar.setDate(endCalendar.getDate() + (6 - monthEnd.getDay()));

          const monthDays = [];
          const current = new Date(startCalendar);
          while (current <= endCalendar) {
            monthDays.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }

          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {month.toLocaleDateString('en-US', { month: 'long' })}
                </h3>
                {monthTasks.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {monthTasks.length} task{monthTasks.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-xs text-gray-500 text-center p-1 font-medium">
                    {day}
                  </div>
                ))}
                
                {monthDays.map((date, dayIndex) => {
                  const dayTasks = getTasksForDate(date);
                  const isCurrentMonth = date.getMonth() === index;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`text-xs text-center p-1 cursor-pointer hover:bg-blue-50 rounded ${
                        !isCurrentMonth ? 'text-gray-300' : 
                        isToday(date) ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'
                      } ${dayTasks.length > 0 && isCurrentMonth ? 'font-semibold' : ''}`}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setCurrentDate(new Date(date));
                          setView('daily');
                        }
                      }}
                    >
                      <div>{date.getDate()}</div>
                      {dayTasks.length > 0 && isCurrentMonth && (
                        <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                          dayTasks.some(t => t.priority === 'critical') ? 'bg-red-400' :
                          dayTasks.some(t => t.priority === 'high') ? 'bg-orange-400' :
                          'bg-blue-400'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const viewButtons = [
    { key: 'daily', label: 'Day', icon: Eye },
    { key: 'weekly', label: 'Week', icon: List },
    { key: 'monthly', label: 'Month', icon: Grid3X3 },
    { key: 'yearly', label: 'Year', icon: Calendar },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Navigation and View Switcher */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
            <button
              onClick={() => navigate('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center flex-1 sm:flex-none">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {formatDateHeader(currentDate, view)}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {currentViewTasks.length} task{currentViewTasks.length !== 1 ? 's' : ''} 
                {view !== 'daily' ? ` this ${view.slice(0, -2)}` : ' today'}
              </p>
            </div>
            
            <button
              onClick={() => navigate('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {viewButtons.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'daily' && renderDailyView()}
      {view === 'weekly' && renderWeeklyView()}
      {view === 'monthly' && renderMonthlyView()}
      {view === 'yearly' && renderYearlyView()}

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentViewTasks.length}
            </div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentViewTasks.filter(t => t.completed).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {currentViewTasks.filter(t => !t.completed && isOverdue(t.endDate, t.endTime, t.completed)).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentViewTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
        </div>
      </div>
    </div>
  );
};