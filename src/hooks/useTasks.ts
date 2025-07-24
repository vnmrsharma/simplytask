import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types/Task';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  const { handleAsync, error, isLoading, clearError, setLoading } = useErrorHandler();

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    await handleAsync(async () => {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_stakeholders(stakeholder_name),
          task_links(id, url, title),
          task_recurrence(*),
          custom_categories(name, color)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw new Error(`Failed to fetch tasks: ${tasksError.message}`);

      const formattedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        title: task.title,
        category: task.custom_category_id ? 'custom' : task.category,
        customCategoryId: task.custom_category_id || undefined,
        customCategoryName: task.custom_categories?.name,
        customCategoryColor: task.custom_categories?.color,
        department: task.department || undefined,
        stakeholders: task.task_stakeholders?.map((s: any) => s.stakeholder_name) || [],
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours || undefined,
        notes: task.notes,
        startDate: task.start_date,
        startTime: task.start_time,
        endDate: task.end_date,
        endTime: task.end_time,
        priority: task.priority,
        completed: task.completed,
        links: task.task_links || [],
        createdAt: task.created_at,
        completedAt: task.completed_at || undefined,
        isOverdue: task.is_overdue || false,
        isRecurring: task.is_recurring || false,
        recurrence: task.task_recurrence ? {
          type: task.task_recurrence.recurrence_type,
          interval: task.task_recurrence.interval_value,
          daysOfWeek: task.task_recurrence.days_of_week || undefined,
          endDate: task.task_recurrence.end_date || undefined,
          maxOccurrences: task.task_recurrence.max_occurrences || undefined,
        } : undefined,
        parentTaskId: task.parent_task_id || undefined,
        delegatedTo: task.delegated_to || undefined,
        approvalRequired: task.approval_required,
        budgetImpact: task.budget_impact,
        riskLevel: task.risk_level,
      }));

      setTasks(formattedTasks);
    }, 'Failed to load tasks');
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('You must be signed in to create tasks');
    }

    // Create optimistic task for immediate UI update
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`, // Temporary ID
      ...taskData,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - add task to UI immediately
    setTasks(prev => [optimisticTask, ...prev]);

    return handleAsync(async () => {
      // Insert main task
      const { data: taskResult, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title: taskData.title,
            category: taskData.category === 'custom' ? 'custom' : taskData.category,
            custom_category_id: taskData.customCategoryId || null,
            department: taskData.department || null,
            estimated_hours: taskData.estimatedHours || 1,
            actual_hours: taskData.actualHours || null,
            notes: taskData.notes,
            start_date: taskData.startDate,
            start_time: taskData.startTime,
            end_date: taskData.endDate,
            end_time: taskData.endTime,
            priority: taskData.priority,
            completed: taskData.completed,
            completed_at: taskData.completedAt || null,
            is_overdue: taskData.isOverdue || false,
            is_recurring: taskData.isRecurring || false,
            parent_task_id: taskData.parentTaskId || null,
            delegated_to: taskData.delegatedTo || null,
            approval_required: taskData.approvalRequired || false,
            budget_impact: taskData.budgetImpact || 'none',
            risk_level: taskData.riskLevel || 'low',
          },
        ])
        .select()
        .single();

      if (taskError) {
        // Remove optimistic task on error
        setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
        throw new Error(`Failed to create task: ${taskError.message}`);
      }

      // Insert stakeholders if any
      if (taskData.stakeholders && taskData.stakeholders.length > 0) {
        const stakeholderInserts = taskData.stakeholders.map(name => ({
          task_id: taskResult.id,
          stakeholder_name: name,
        }));

        await supabase.from('task_stakeholders').insert(stakeholderInserts);
      }

      // Insert links if any
      if (taskData.links && taskData.links.length > 0) {
        const linkInserts = taskData.links.map(link => ({
          task_id: taskResult.id,
          url: link.url,
          title: link.title,
        }));

        await supabase.from('task_links').insert(linkInserts);
      }

      // Insert recurrence if any
      if (taskData.isRecurring && taskData.recurrence) {
        await supabase.from('task_recurrence').insert([
          {
            task_id: taskResult.id,
            recurrence_type: taskData.recurrence.type,
            interval_value: taskData.recurrence.interval,
            days_of_week: taskData.recurrence.daysOfWeek || null,
            end_date: taskData.recurrence.endDate || null,
            max_occurrences: taskData.recurrence.maxOccurrences || null,
          },
        ]);
      }

      // Re-fetch all tasks to get the real data and remove the optimistic one
      await fetchTasks();
      return taskResult;
    }, 'Failed to create task');
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    // Optimistic update - update task in UI immediately
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...taskData }
        : task
    ));

    return handleAsync(async () => {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          category: taskData.category === 'custom' ? 'custom' : taskData.category,
          custom_category_id: taskData.customCategoryId || null,
          department: taskData.department || null,
          estimated_hours: taskData.estimatedHours,
          actual_hours: taskData.actualHours || null,
          notes: taskData.notes,
          start_date: taskData.startDate,
          start_time: taskData.startTime,
          end_date: taskData.endDate,
          end_time: taskData.endTime,
          priority: taskData.priority,
          completed: taskData.completed,
          completed_at: taskData.completedAt || null,
          is_overdue: taskData.isOverdue || false,
          delegated_to: taskData.delegatedTo || null,
          approval_required: taskData.approvalRequired || false,
          budget_impact: taskData.budgetImpact,
          risk_level: taskData.riskLevel,
        })
        .eq('id', taskId);

      if (taskError) {
        // Revert optimistic update on error
        setTasks(originalTasks);
        throw new Error(`Failed to update task: ${taskError.message}`);
      }

      // Re-fetch to ensure consistency
      await fetchTasks();
    }, 'Failed to update task');
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update - remove task from UI immediately
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(task => task.id !== taskId));

    return handleAsync(async () => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        // Revert optimistic update on error
        setTasks(originalTasks);
        throw new Error(`Failed to delete task: ${error.message}`);
      }

      // Re-fetch to ensure consistency (in case there were concurrent changes)
      await fetchTasks();
    }, 'Failed to delete task');
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const updates = {
      completed: !task.completed,
      completed_at: !task.completed ? now : null,
      is_overdue: false, // Clear overdue status when completed
    };

    // Optimistic update - update task in UI immediately
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, ...updates }
        : t
    ));

    try {
      await updateTask(taskId, updates);
    } catch (error) {
      // Revert optimistic update on error
      setTasks(originalTasks);
      throw error;
    }
  };

  return {
    tasks,
    loading: isLoading,
    error,
    clearError,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    refetch: fetchTasks,
  };
}