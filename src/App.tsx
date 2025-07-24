import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, List, Download, Target, BarChart3, LogOut } from 'lucide-react';
import { Task, ViewMode, FilterType, SortType } from './types/Task';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingPage } from './components/LoadingSpinner';
import { ErrorAlert } from './components/ErrorAlert';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { TaskCalendar } from './components/TaskCalendar';
import { TaskFilters } from './components/TaskFilters';
import { TaskStats } from './components/TaskStats';
import { ReportsDashboard } from './components/ReportsDashboard';
import { AuthForm } from './components/AuthForm';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { generateId, filterTasks, sortTasks, processOverdueTasks, generateRecurringTasks, shouldGenerateNextRecurrence } from './utils/taskUtils';
import { getToday } from './utils/dateUtils';

function App() {
  const { user, loading: authLoading, signOut, error: authError, clearError: clearAuthError } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleTaskComplete, error: tasksError, clearError: clearTasksError } = useTasks();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'reports'>('list');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  // Global error state
  const globalError = authError || tasksError;
  const clearGlobalError = () => {
    clearAuthError();
    clearTasksError();
  };
  const filteredTasks = useMemo(() => {
    let filtered = filterTasks(tasks, activeFilter);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.notes.toLowerCase().includes(query)
      );
    }
    
    return sortTasks(filtered, sortBy);
  }, [tasks, activeFilter, sortBy, searchQuery]);

  const taskCounts = useMemo(() => {
    return {
      all: filterTasks(tasks, 'all').length,
      today: filterTasks(tasks, 'today').length,
      upcoming: filterTasks(tasks, 'upcoming').length,
      overdue: filterTasks(tasks, 'overdue').length,
      completed: filterTasks(tasks, 'completed').length,
    };
  }, [tasks]);

  // Show auth form if not authenticated
  if (authLoading) {
    return <LoadingPage message="Initializing TaskFlow Pro..." />;
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    createTask(taskData);
    setShowTaskForm(false);
  };

  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;
    updateTask(editingTask.id, taskData);
    setEditingTask(undefined);
  };

  const handleToggleComplete = (taskId: string) => {
    toggleTaskComplete(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDateClick = (date: string) => {
    setShowTaskForm(true);
    // We could pre-fill the form with the selected date
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl shadow-md">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">SimplyTask</h1>
                    <p className="text-xs text-gray-600">Executive Productivity Suite</p>
                  </div>
                </div>
              </div>
            
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List size={16} />
                    <span className="hidden sm:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      viewMode === 'calendar'
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar size={16} />
                    <span className="hidden sm:inline">Calendar</span>
                  </button>
                  <button
                    onClick={() => setViewMode('reports')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      viewMode === 'reports'
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 size={16} />
                    <span className="hidden sm:inline">Reports</span>
                  </button>
                </div>
              
                <button
                  onClick={exportTasks}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <Download size={16} />
                  <span className="hidden lg:inline">Export</span>
                </button>
              
                <button
                  onClick={handleSignOut}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">New Task</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {globalError && (
            <div className="mb-6">
              <ErrorAlert error={globalError} onDismiss={clearGlobalError} />
            </div>
          )}
          
          <div className="space-y-8">
            {viewMode !== 'reports' && <TaskStats tasks={tasks} />}
          
            {viewMode === 'list' && (
              <>
                <TaskFilters
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  taskCounts={taskCounts}
                />
              
                <div className="space-y-4">
                  {tasksLoading ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your tasks...</h3>
                      <p className="text-gray-600">Please wait while we fetch your data</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-400 mb-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <List size={48} />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No tasks found' : 'No tasks yet'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {searchQuery 
                          ? 'Try adjusting your search or filters'
                          : 'Create your first task to get started'
                        }
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowTaskForm(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Plus size={16} />
                          Create Your First Task
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        error={tasksError}
                        onClearError={clearTasksError}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {viewMode === 'calendar' && (
              <TaskCalendar
                tasks={tasks}
                onTaskClick={handleEditTask}
                onDateClick={handleDateClick}
              />
            )}

            {viewMode === 'reports' && (
              <ReportsDashboard tasks={tasks} />
            )}
          </div>
        </main>

        <Footer />

        {showTaskForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(undefined)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;