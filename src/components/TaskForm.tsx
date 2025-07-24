import React, { useState, useEffect } from 'react';
import { X, Plus, ExternalLink, Trash2, Repeat, Calendar, Settings } from 'lucide-react';
import { Task, TaskLink } from '../types/Task';
import { generateId } from '../utils/taskUtils';
import { getToday, getCurrentTime, getEndOfDay } from '../utils/dateUtils';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { CategoryManager } from './CategoryManager';
import { addMinutes } from 'date-fns';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState<Task['category']>(task?.category || 'operational');
  const [customCategoryId, setCustomCategoryId] = useState(task?.customCategoryId || '');
  const [department, setDepartment] = useState(task?.department || '');
  const [stakeholders, setStakeholders] = useState<string[]>(task?.stakeholders || []);
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || 1);
  const [delegatedTo, setDelegatedTo] = useState(task?.delegatedTo || '');
  const [approvalRequired, setApprovalRequired] = useState(task?.approvalRequired || false);
  const [budgetImpact, setBudgetImpact] = useState<Task['budgetImpact']>(task?.budgetImpact || 'none');
  const [riskLevel, setRiskLevel] = useState<Task['riskLevel']>(task?.riskLevel || 'low');
  const [notes, setNotes] = useState(task?.notes || '');
  const [startDate, setStartDate] = useState(task?.startDate || getToday());
  const [startTime, setStartTime] = useState(task?.startTime || getCurrentTime());
  const [endDate, setEndDate] = useState(task?.endDate || getToday());
  const [endTime, setEndTime] = useState(task?.endTime || getEndOfDay());
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [links, setLinks] = useState<TaskLink[]>(task?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'custom'>(task?.recurrence?.type || 'daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(task?.recurrence?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(task?.recurrence?.daysOfWeek || []);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task?.recurrence?.endDate || '');
  const [maxOccurrences, setMaxOccurrences] = useState(task?.recurrence?.maxOccurrences || 10);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count'>('count');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);
  
  const { categories } = useCustomCategories();

  // When estimatedHours or startTime changes, update endTime unless user changed it manually
  useEffect(() => {
    if (!endTimeManuallySet) {
      // Parse start time (HH:mm)
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startDateObj = new Date();
      startDateObj.setHours(startHour, startMinute, 0, 0);
      // Add estimated hours (as minutes)
      const endDateObj = addMinutes(startDateObj, Math.round(estimatedHours * 60));
      // Format end time as HH:mm
      const newEndTime = endDateObj.toTimeString().slice(0,5);
      setEndTime(newEndTime);
    }
  }, [estimatedHours, startTime]);

  // If user changes endTime manually, set flag
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
    setEndTimeManuallySet(true);
  };
  // If user changes startTime, reset manual flag
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
    setEndTimeManuallySet(false);
  };

  const addLink = () => {
    if (newLinkUrl.trim()) {
      const link: TaskLink = {
        id: generateId(),
        url: newLinkUrl.trim(),
        title: newLinkTitle.trim() || newLinkUrl.trim()
      };
      setLinks([...links, link]);
      setNewLinkUrl('');
      setNewLinkTitle('');
    }
  };

  const addStakeholder = () => {
    if (newStakeholder.trim() && !stakeholders.includes(newStakeholder.trim())) {
      setStakeholders([...stakeholders, newStakeholder.trim()]);
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (stakeholder: string) => {
    setStakeholders(stakeholders.filter(s => s !== stakeholder));
  };

  const removeLink = (linkId: string) => {
    setLinks(links.filter(link => link.id !== linkId));
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Get custom category details if selected
    const selectedCustomCategory = categories.find(cat => cat.id === customCategoryId);

    const recurrence = isRecurring ? {
      type: recurrenceType,
      interval: recurrenceInterval,
      daysOfWeek: recurrenceType === 'custom' ? selectedDays : 
                  recurrenceType === 'weekly' ? [new Date(startDate).getDay()] : undefined,
      endDate: recurrenceEndType === 'date' ? recurrenceEndDate : undefined,
      maxOccurrences: recurrenceEndType === 'count' ? maxOccurrences : undefined
    } : undefined;

    onSubmit({
      title: title.trim(),
      category,
      customCategoryId: category === 'custom' ? customCategoryId : undefined,
      customCategoryName: selectedCustomCategory?.name,
      customCategoryColor: selectedCustomCategory?.color,
      department: department.trim() || undefined,
      stakeholders: stakeholders.length > 0 ? stakeholders : undefined,
      estimatedHours,
      delegatedTo: delegatedTo.trim() || undefined,
      approvalRequired,
      budgetImpact,
      riskLevel,
      notes: notes.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
      priority,
      completed: task?.completed || false,
      links,
      completedAt: task?.completedAt,
      isOverdue: task?.isOverdue,
      isRecurring,
      recurrence
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-screen sm:max-h-[95vh] overflow-y-auto my-2 sm:my-4">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-6 border-b rounded-t-xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {task ? 'Update task details and settings' : 'Add a new task to your workflow'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title *
            </label>
                          <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-lg touch-manipulation"
                placeholder="Enter task title..."
                required
              />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center justify-between">
                  <span>Task Category *</span>
                  <button
                    type="button"
                    onClick={() => setShowCategoryManager(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200"
                  >
                    <Settings size={14} />
                    Manage
                  </button>
                </div>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Task['category'])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="strategic">Strategic Initiative</option>
                <option value="operational">Operational Task</option>
                <option value="meeting">Meeting/Call</option>
                <option value="review">Review/Approval</option>
                <option value="personal">Personal Development</option>
                {categories.length > 0 && <option value="custom">Custom Category</option>}
              </select>
              
              {category === 'custom' && categories.length > 0 && (
                <select
                  value={customCategoryId}
                  onChange={(e) => setCustomCategoryId(e.target.value)}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select custom category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                Department/Team
              </label>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Engineering, Sales, Marketing"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimatedHours"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                min="0.25"
                max="40"
                step="0.25"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="budgetImpact" className="block text-sm font-semibold text-gray-700 mb-2">
                Budget Impact
              </label>
              <select
                id="budgetImpact"
                value={budgetImpact}
                onChange={(e) => setBudgetImpact(e.target.value as Task['budgetImpact'])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="none">No Impact</option>
                <option value="low">Low (&lt;$10K)</option>
                <option value="medium">Medium ($10K-$100K)</option>
                <option value="high">High (&gt;$100K)</option>
              </select>
            </div>
            <div>
              <label htmlFor="riskLevel" className="block text-sm font-semibold text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                id="riskLevel"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as Task['riskLevel'])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date & Time *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  min={startDate}
                  required
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="delegatedTo" className="block text-sm font-semibold text-gray-700 mb-2">
              Delegated To
            </label>
            <input
              type="text"
              id="delegatedTo"
              value={delegatedTo}
              onChange={(e) => setDelegatedTo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Team member or department"
            />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                id="approvalRequired"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="approvalRequired" className="text-sm font-semibold text-amber-800">
                Requires executive approval before completion
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Stakeholders
            </label>
            <div className="space-y-3">
              {stakeholders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stakeholders.map((stakeholder) => (
                    <span
                      key={stakeholder}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                    >
                      {stakeholder}
                      <button
                        type="button"
                        onClick={() => removeStakeholder(stakeholder)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-1 transition-all duration-200"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStakeholder}
                  onChange={(e) => setNewStakeholder(e.target.value)}
                  placeholder="Add stakeholder name"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
                />
                <button
                  type="button"
                  onClick={addStakeholder}
                  disabled={!newStakeholder.trim()}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-200"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Links
            </label>
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <ExternalLink size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{link.title}</div>
                    <div className="text-xs text-gray-500">{link.url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Link title (optional)"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={addLink}
                  disabled={!newLinkUrl.trim()}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-200"
                >
                  <Plus size={16} />
                  Add Link
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="isRecurring" className="flex items-center gap-2 text-sm font-semibold text-purple-800">
                <Repeat size={16} />
                Make this a recurring task
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <label className="block text-sm font-semibold text-purple-800 mb-2">
                    Recurrence Pattern
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'custom')}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>

                {(recurrenceType === 'daily' || recurrenceType === 'weekly') && (
                  <div>
                    <label className="block text-sm font-semibold text-purple-800 mb-2">
                      Repeat every {recurrenceType === 'daily' ? 'X days' : 'X weeks'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}

                {recurrenceType === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-purple-800 mb-2">
                      Select Days of Week
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {dayNames.map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            selectedDays.includes(index)
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-purple-800 mb-2">
                    End Recurrence
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="endByCount"
                        name="recurrenceEnd"
                        checked={recurrenceEndType === 'count'}
                        onChange={() => setRecurrenceEndType('count')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <label htmlFor="endByCount" className="text-sm text-purple-800 font-medium">
                        After
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxOccurrences}
                        onChange={(e) => setMaxOccurrences(parseInt(e.target.value) || 10)}
                        disabled={recurrenceEndType !== 'count'}
                        className="w-20 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                      />
                      <span className="text-sm text-purple-800 font-medium">occurrences</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="endByDate"
                        name="recurrenceEnd"
                        checked={recurrenceEndType === 'date'}
                        onChange={() => setRecurrenceEndType('date')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <label htmlFor="endByDate" className="text-sm text-purple-800 font-medium">
                        On date
                      </label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        disabled={recurrenceEndType !== 'date'}
                        min={endDate}
                        className="px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 sm:py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all duration-200 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
      
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}
    </div>
  );
};