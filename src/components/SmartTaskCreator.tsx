import React, { useState } from 'react';
import { 
  Brain, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  MessageCircle,
  Sparkles,
  Clock,
  Calendar
} from 'lucide-react';
import { Task } from '../types/Task';

interface SmartTaskCreatorProps {
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onClose?: () => void;
  isExpanded?: boolean;
}

interface ConversationMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ParsedTaskResponse {
  status: 'need_more_info' | 'conflict' | 'parsed' | 'error';
  message?: string;
  question?: string;
  task?: any;
  conflicts?: any[];
}

export const SmartTaskCreator: React.FC<SmartTaskCreatorProps> = ({ 
  tasks, 
  onCreateTask, 
  onClose,
  isExpanded = false 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [conversationContext, setConversationContext] = useState('');
  const [pendingTask, setPendingTask] = useState<any>(null);
  const [showConversation, setShowConversation] = useState(isExpanded);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    setConversation(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to conversation
    addMessage('user', userInput);
    setShowConversation(true);

    try {
      const response = await fetch('/api/nlp-task-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: userInput,
          existingTasks: tasks,
          conversationContext: conversationContext
        }),
      });

      const data: ParsedTaskResponse = await response.json();
      
      switch (data.status) {
        case 'need_more_info':
          addMessage('assistant', data.question || 'Could you provide more details?');
          setConversationContext(prev => `${prev}\nUser: ${userInput}\nAssistant: ${data.question}`);
          setPendingTask(data.task);
          break;

        case 'conflict':
          addMessage('assistant', data.message || 'There seems to be a scheduling conflict.');
          if (data.conflicts && data.conflicts.length > 0) {
            const conflictDetails = data.conflicts.map(c => 
              `• ${c.title} (${c.startTime} - ${c.endTime})`
            ).join('\n');
            addMessage('assistant', `Conflicting tasks:\n${conflictDetails}\n\nWould you like to reschedule or continue anyway?`);
          }
          setPendingTask(data.task);
          break;

        case 'parsed':
          addMessage('assistant', data.message || 'Task created successfully!');
          if (data.task) {
            // Create the task
            await onCreateTask(data.task);
            addMessage('assistant', `✅ Task "${data.task.title}" has been scheduled for ${data.task.startDate} at ${data.task.startTime}.`);
            
            // Reset conversation
            setTimeout(() => {
              setConversation([]);
              setConversationContext('');
              setPendingTask(null);
              if (!isExpanded) {
                setShowConversation(false);
              }
            }, 3000);
          }
          break;

        case 'error':
          addMessage('assistant', `❌ ${data.message || 'Sorry, I encountered an error processing your request.'}`);
          break;
      }

    } catch (error) {
      console.error('Smart task creation error:', error);
      addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCreate = async () => {
    if (!pendingTask) return;
    
    setIsLoading(true);
    try {
      await onCreateTask(pendingTask);
      addMessage('assistant', `✅ Task "${pendingTask.title}" has been created despite conflicts.`);
      
      // Reset
      setTimeout(() => {
        setConversation([]);
        setConversationContext('');
        setPendingTask(null);
        if (!isExpanded) {
          setShowConversation(false);
        }
      }, 2000);
    } catch (error) {
      addMessage('assistant', '❌ Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    "Schedule a meeting with the team at 2 PM today",
    "Block 2 hours for project work tomorrow morning",
    "Remind me to call the client at 4 PM",
    "Book a lunch meeting with Sarah next Tuesday"
  ];

  if (!showConversation && !isExpanded) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Smart Create
                <Sparkles className="h-4 w-4 text-purple-500" />
              </h3>
              <p className="text-sm text-gray-600">Create tasks with natural language</p>
            </div>
          </div>
          <button
            onClick={() => setShowConversation(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Try it
          </button>
        </div>

        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Schedule a meeting with John at 3 PM today..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6" />
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Smart Task Creator
                <Sparkles className="h-4 w-4" />
              </h3>
              <p className="text-blue-100 text-sm">Describe your task in natural language</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      {conversation.length > 0 && (
        <div className="max-h-60 overflow-y-auto p-4 bg-gray-50 border-b">
          <div className="space-y-3">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Assistant</span>
                    </div>
                  )}
                  <div className="whitespace-pre-line">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your task naturally..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Conflict Resolution Buttons */}
          {pendingTask && conversation.some(m => m.content.includes('conflict')) && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleForceCreate}
                disabled={isLoading}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Create Anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingTask(null);
                  addMessage('assistant', 'Let me know when you\'d like to reschedule.');
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Reschedule
              </button>
            </div>
          )}
        </form>

        {/* Quick Suggestions */}
        {conversation.length === 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="text-left text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 