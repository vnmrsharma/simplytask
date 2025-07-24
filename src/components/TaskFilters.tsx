import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, List, Search, Target, Users, Building } from 'lucide-react';
import { FilterType, SortType } from '../types/Task';

interface TaskFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  taskCounts: Record<FilterType, number>;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  taskCounts
}) => {
  const filters = [
    { key: 'all' as FilterType, label: 'All Tasks', icon: List, count: taskCounts.all, color: 'gray' },
    { key: 'today' as FilterType, label: 'Today', icon: Calendar, count: taskCounts.today, color: 'blue' },
    { key: 'upcoming' as FilterType, label: 'Upcoming', icon: Clock, count: taskCounts.upcoming, color: 'indigo' },
    { key: 'overdue' as FilterType, label: 'Overdue', icon: AlertTriangle, count: taskCounts.overdue, color: 'red' },
    { key: 'completed' as FilterType, label: 'Completed', icon: CheckCircle, count: taskCounts.completed, color: 'green' },
  ];

  const getFilterStyles = (filter: any, isActive: boolean) => {
    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
    
    if (isActive) {
      const activeColors = {
        gray: 'bg-gray-600 text-white shadow-md',
        blue: 'bg-blue-600 text-white shadow-md',
        indigo: 'bg-indigo-600 text-white shadow-md',
        red: 'bg-red-600 text-white shadow-md',
        green: 'bg-green-600 text-white shadow-md'
      };
      return `${baseStyles} ${activeColors[filter.color as keyof typeof activeColors]}`;
    }
    
    const inactiveColors = {
      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
      indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200',
      red: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
      green: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
    };
    return `${baseStyles} ${inactiveColors[filter.color as keyof typeof inactiveColors]}`;
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={getFilterStyles(filter, activeFilter === filter.key)}
            >
              <filter.icon size={16} />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeFilter === filter.key
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'bg-white text-gray-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:min-w-0">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className="w-full lg:w-auto px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200 bg-gray-50 focus:bg-white"
          >
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="created">Sort by Created</option>
            <option value="category">Sort by Category</option>
            <option value="budgetImpact">Sort by Budget Impact</option>
          </select>
        </div>
      </div>
    </div>
  );
};