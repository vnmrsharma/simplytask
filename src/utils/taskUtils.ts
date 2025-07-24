import { Task, FilterType, SortType } from '../types/Task';
import { isOverdue, isToday, isTomorrow, getCurrentTime } from './dateUtils';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateRecurringTasks = (task: Task): Task[] => {
  if (!task.isRecurring || !task.recurrence) return [task];

  const recurringTasks: Task[] = [task];
  const { type, interval, daysOfWeek, endDate, maxOccurrences } = task.recurrence;
  const startDate = new Date(task.startDate);
  const taskEndDate = new Date(task.endDate);
  const taskDuration = taskEndDate.getTime() - startDate.getTime();

  let currentDate = new Date(startDate);
  let occurrenceCount = 1;
  const maxDate = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default
  const maxOccur = maxOccurrences || 100; // Default limit

  while (occurrenceCount < maxOccur && currentDate <= maxDate) {
    let nextDate: Date;

    if (type === 'daily') {
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + interval);
    } else if (type === 'weekly') {
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + (7 * interval));
    } else if (type === 'custom' && daysOfWeek) {
      // Find next occurrence based on selected days of week
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      
      while (!daysOfWeek.includes(nextDate.getDay()) && nextDate <= maxDate) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else {
      break;
    }

    if (nextDate <= maxDate) {
      const nextEndDate = new Date(nextDate.getTime() + taskDuration);
      
      const recurringTask: Task = {
        ...task,
        id: generateId(),
        startDate: nextDate.toISOString().split('T')[0],
        startTime: task.startTime,
        endDate: nextEndDate.toISOString().split('T')[0],
        endTime: task.endTime,
        completed: false,
        completedAt: undefined,
        parentTaskId: task.id,
        createdAt: new Date().toISOString()
      };

      recurringTasks.push(recurringTask);
      currentDate = nextDate;
      occurrenceCount++;
    } else {
      break;
    }
  }

  return recurringTasks;
};

export const shouldGenerateNextRecurrence = (task: Task, allTasks: Task[]): boolean => {
  if (!task.isRecurring || !task.recurrence || !task.completed) return false;

  // Check if there's already a future instance of this recurring task
  const futureInstances = allTasks.filter(t => 
    (t.parentTaskId === task.id || t.parentTaskId === task.parentTaskId) &&
    new Date(t.startDate) > new Date() &&
    !t.completed
  );

  return futureInstances.length === 0;
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'text-red-700 bg-red-50 border-red-200';
    case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'strategic': return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'operational': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'meeting': return 'text-green-700 bg-green-50 border-green-200';
    case 'review': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'personal': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'custom': return 'text-gray-700 bg-gray-50 border-gray-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getBudgetImpactColor = (impact: string): string => {
  switch (impact) {
    case 'high': return 'text-red-700 bg-red-50 border-red-200';
    case 'medium': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'low': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getRiskLevelColor = (risk: string): string => {
  switch (risk) {
    case 'critical': return 'text-red-700 bg-red-50 border-red-200';
    case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-700 bg-green-50 border-green-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getPriorityWeight = (priority: string): number => {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

export const filterTasks = (tasks: Task[], filter: FilterType): Task[] => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return tasks.filter(task => 
        !task.completed && (isToday(task.startDate) || isToday(task.endDate))
      );
    case 'upcoming':
      return tasks.filter(task => 
        !task.completed && new Date(`${task.startDate}T${task.startTime}`) > now
      );
    case 'overdue':
      return tasks.filter(task => 
        !task.completed && isOverdue(task.endDate, task.endTime, task.completed)
      );
    case 'completed':
      return tasks.filter(task => task.completed);
    default:
      return tasks.filter(task => !task.completed);
  }
};

export const sortTasks = (tasks: Task[], sortBy: SortType): Task[] => {
  return [...tasks].sort((a, b) => {
    // Always prioritize overdue tasks
    const aOverdue = isOverdue(a.endDate, a.endTime, a.completed);
    const bOverdue = isOverdue(b.endDate, b.endTime, b.completed);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    switch (sortBy) {
      case 'priority':
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      case 'dueDate':
        return new Date(`${a.endDate}T${a.endTime}`).getTime() - new Date(`${b.endDate}T${b.endTime}`).getTime();
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'category':
        const categoryOrder = { strategic: 0, operational: 1, meeting: 2, review: 3, personal: 4 };
        return (categoryOrder[a.category as keyof typeof categoryOrder] || 5) - (categoryOrder[b.category as keyof typeof categoryOrder] || 5);
      case 'budgetImpact':
        const budgetOrder = { high: 0, medium: 1, low: 2, none: 3 };
        return (budgetOrder[a.budgetImpact as keyof typeof budgetOrder] || 4) - (budgetOrder[b.budgetImpact as keyof typeof budgetOrder] || 4);
      default:
        return 0;
    }
  });
};

export const processOverdueTasks = (tasks: Task[]): Task[] => {
  const tomorrow = getTomorrow();
  const currentTime = getCurrentTime();
  
  return tasks.map(task => {
    if (!task.completed && isOverdue(task.endDate, task.endTime, task.completed)) {
      // Move overdue tasks to tomorrow and mark as overdue
      return {
        ...task,
        startDate: isTomorrow(task.startDate) ? task.startDate : tomorrow,
        startTime: task.startTime,
        endDate: tomorrow,
        endTime: task.endTime,
        isOverdue: true
      };
    }
    return task;
  });
};

const getTomorrow = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};