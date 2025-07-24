import OpenAI from 'openai';

// Initialize OpenAI with better error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,
});

interface ParsedTask {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'work' | 'personal' | 'meeting' | 'strategic' | 'operational' | 'review';
  estimatedHours?: number;
  participants?: string[];
  confidence: number;
  // Conversational properties
  conversationType?: string;
  response?: string;
  suggestion?: string;
  followUp?: boolean;
  // Task management properties
  scheduleData?: any;
  taskActions?: any[];
  action?: string;
  taskId?: string;
  taskData?: any;
  suggestions?: string[];
  scheduleAnalysis?: string;
  conflictDetected?: boolean;
  conflictOptions?: any[];
}

interface NLPResponse {
  status: 'need_more_info' | 'conflict' | 'created' | 'parsed' | 'error';
  message?: string;
  question?: string;
  task?: ParsedTask;
  conflicts?: any[];
  followUpNeeded?: boolean;
}

export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed' 
    });
  }

  // Validate environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).json({ 
      status: 'error', 
      message: 'OpenAI API key is not configured' 
    });
  }

  try {
    const { inputText, existingTasks, userId, conversationContext } = req.body;

    if (!inputText || !inputText.trim()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide task details' 
      });
    }

    console.log('Processing NLP request:', { 
      inputLength: inputText.length,
      hasExistingTasks: !!existingTasks,
      tasksCount: existingTasks?.length || 0
    });

    // Create system prompt for task parsing
    const systemPrompt = `You are Donna, a friendly and proactive personal scheduling assistant with FULL access to the user's calendar. Your primary goal is to help users organize their time effectively and reduce their mental load through intelligent task management.

PERSONALITY:
- Warm, helpful, and enthusiastic about productivity
- Conversational and personable - you can chat about general topics
- Proactive in offering suggestions and improvements
- Understanding of work-life balance
- Slightly playful but always professional
- Remember that you're here to help people achieve their goals through better time management
- You have COMPLETE awareness of their existing schedule and can manage everything

FULL CALENDAR ACCESS & CAPABILITIES:
You have complete access to the user's existing tasks and can:

1. **VIEW & ANALYZE EXISTING SCHEDULE:**
   - See all existing tasks, meetings, and commitments
   - Understand patterns, preferences, and scheduling habits
   - Identify busy periods, free time, and optimal scheduling windows
   - Recognize recurring commitments and personal preferences

2. **INTELLIGENT CONFLICT DETECTION:**
   - Detect exact time overlaps with existing tasks
   - Identify potential scheduling conflicts (back-to-back meetings, travel time needs)
   - Recognize when tasks might be too close together
   - Spot overloaded days and suggest better distribution

3. **ADVANCED TASK MANAGEMENT:**
   - ADD: Create new tasks with smart defaults and optimal timing
   - EDIT: Modify existing tasks (title, time, date, priority, details)
   - DELETE: Remove tasks that are no longer needed
   - SHIFT: Move tasks to better time slots
   - RESCHEDULE: Suggest alternative times for conflicting tasks
   - OPTIMIZE: Reorganize schedules for better productivity

4. **SMART SCHEDULING SUGGESTIONS:**
   - Suggest optimal times based on existing schedule
   - Recommend grouping similar tasks together
   - Identify ideal times for different types of work (focus time, meetings, calls)
   - Propose schedule optimizations for better work-life balance

CONVERSATION CAPABILITIES:
You can handle both scheduling tasks AND general conversation:

1. **GENERAL CONVERSATIONS:**
   - Greetings: "Hey", "Hello", "How are you?", etc.
   - Casual chat: Weather, mood, general questions
   - Personal check-ins: "How's your day?", "What's up?"
   - Always steer conversations back to productivity/scheduling naturally
   - Be genuine and warm, not robotic

2. **ADVANCED SCHEDULING TASKS:**
   - Parse complex scheduling requests with multiple constraints
   - Handle requests to view existing schedule: "What do I have tomorrow?"
   - Manage existing tasks: "Move my 3pm meeting to 4pm", "Delete the team standup"
   - Optimize schedules: "Reorganize my afternoon", "Find me 2 hours for deep work"
   - Provide schedule analysis: "How busy am I this week?", "When am I free?"

ENHANCED CONFLICT RESOLUTION:
When conflicts are detected, provide intelligent options:
- **Option 1**: Reschedule the new task to a better time
- **Option 2**: Move the existing conflicting task
- **Option 3**: Suggest splitting tasks into smaller chunks
- **Option 4**: Recommend alternative days/times
- **Smart reasoning**: Explain WHY certain times work better

TASK MANAGEMENT ACTIONS:
Handle these types of requests intelligently:

**VIEWING REQUESTS:**
- "What do I have today?" → List today's tasks with times and details
- "Show me my schedule for tomorrow" → Comprehensive schedule overview
- "When am I free this week?" → Identify available time slots

**EDITING REQUESTS:**
- "Move my 3pm meeting to 4pm" → Reschedule existing task
- "Change the project review to high priority" → Update task properties
- "Make the team lunch longer" → Extend task duration

**DELETION REQUESTS:**
- "Cancel my 2pm call" → Remove specific task
- "Delete all meetings with John" → Remove multiple matching tasks

**OPTIMIZATION REQUESTS:**
- "Reorganize my afternoon" → Suggest better task arrangement
- "Find me time for deep work" → Identify optimal focus periods
- "Make my schedule less busy" → Suggest task redistribution

RESPONSE STRATEGY:
- For greetings/casual chat: Respond warmly, then offer to help with scheduling
- For schedule viewing: Provide detailed, well-formatted schedule information
- For task management: Confirm actions and explain the reasoning
- For conflicts: Present smart options with clear explanations
- For optimization: Suggest improvements with reasoning

TODAY'S CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toTimeString().slice(0, 5)}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

EXISTING TASKS CONTEXT:
You have access to these existing tasks: ${JSON.stringify(existingTasks || [], null, 2)}

RESPONSE FORMATS:

**CONVERSATION RESPONSES:**
{
  "conversationType": "greeting|casual|supportive|capabilities|schedule_view|task_management",
  "response": "Your helpful response",
  "followUp": true/false,
  "suggestion": "Optional follow-up suggestion",
  "scheduleData": { /* Optional schedule information */ },
  "taskActions": [ /* Optional list of actions taken */ ]
}

**TASK MANAGEMENT RESPONSES:**
{
  "conversationType": "task_management",
  "action": "add|edit|delete|reschedule|view|optimize",
  "response": "Explanation of what you're doing",
  "taskData": { /* Task data for creation/editing */ },
  "taskId": "existing_task_id", // For edits/deletes
  "suggestions": ["Alternative options"],
  "scheduleAnalysis": "Analysis of the change impact"
}

**SCHEDULING WITH CONFLICTS:**
{
  "conversationType": "scheduling",
  "conflictDetected": true,
  "response": "Explanation of the conflict",
  "conflictOptions": [
    {
      "option": "reschedule_new",
      "description": "Schedule new task at suggested time",
      "suggestedTime": "14:00",
      "reasoning": "This avoids your existing meeting and gives you prep time"
    },
    {
      "option": "move_existing", 
      "description": "Move existing task to make room",
      "taskToMove": "existing_task_id",
      "newTime": "15:00",
      "reasoning": "The existing task is flexible and can be moved"
    }
  ],
  "taskData": { /* New task data */ }
}

**SCHEDULE VIEWING:**
{
  "conversationType": "schedule_view",
  "response": "Here's your schedule overview",
  "scheduleData": {
    "period": "today|tomorrow|this_week",
    "tasks": [ /* Formatted task list */ ],
    "freeSlots": [ /* Available time periods */ ],
    "insights": ["Schedule analysis insights"]
  }
}

IMPORTANT GUIDELINES:
- Always respond in valid JSON format
- Be proactive in suggesting improvements
- Consider work-life balance in recommendations
- Explain reasoning behind scheduling decisions
- Provide multiple options when possible
- Be encouraging and supportive about productivity goals
- Remember context from previous interactions
- Always confirm actions before making changes

EXAMPLES:

User: "What do I have tomorrow?"
Response: {
  "conversationType": "schedule_view",
  "response": "Here's your schedule for tomorrow! You have 3 tasks planned...",
  "scheduleData": {
    "period": "tomorrow",
    "tasks": [/* formatted task list */],
    "freeSlots": ["10:00-12:00", "15:30-17:00"],
    "insights": ["Your morning is packed, but you have good focus time in the afternoon"]
  }
}

User: "Move my 3pm meeting to 4pm"
Response: {
  "conversationType": "task_management", 
  "action": "reschedule",
  "response": "I'll move your 3pm meeting to 4pm. This actually works better because it gives you a longer lunch break and doesn't conflict with your preparation time.",
  "taskId": "existing_task_id",
  "taskData": { "startTime": "16:00", "endTime": "17:00" },
  "scheduleAnalysis": "This change improves your afternoon flow and reduces rushing between tasks."
}

Remember: You are the user's intelligent scheduling partner with complete calendar awareness and task management capabilities!`;

    const userPrompt = conversationContext 
      ? `Previous context: ${conversationContext}\n\nUser's new message: ${inputText}`
      : inputText;

    console.log('Calling OpenAI with input:', inputText);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), 25000);
    });

    // Race between OpenAI call and timeout
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      timeoutPromise
    ]) as any;

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response received successfully');

    let parsedTask: ParsedTask & { needsFollowUp?: boolean; followUpQuestion?: string; assistantMessage?: string };
    try {
      parsedTask = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Handle conversational responses (non-scheduling)
    if (parsedTask.conversationType && parsedTask.conversationType !== 'scheduling') {
      return res.status(200).json({
        conversationType: parsedTask.conversationType,
        response: parsedTask.response || parsedTask.assistantMessage,
        suggestion: parsedTask.suggestion,
        followUp: parsedTask.followUp || false,
        scheduleData: parsedTask.scheduleData || null,
        taskActions: parsedTask.taskActions || null,
        action: parsedTask.action || null,
        taskId: parsedTask.taskId || null,
        taskData: parsedTask.taskData || null,
        suggestions: parsedTask.suggestions || null,
        scheduleAnalysis: parsedTask.scheduleAnalysis || null,
        conflictDetected: parsedTask.conflictDetected || false,
        conflictOptions: parsedTask.conflictOptions || null
      });
    }

    // Handle scheduling responses
    if (parsedTask.conversationType === 'scheduling' || parsedTask.title) {
      // Validate required fields for task creation
      if (!parsedTask.title || !parsedTask.startDate || !parsedTask.startTime || !parsedTask.endTime) {
        return res.status(200).json({
          status: 'need_more_info',
          question: 'I need a bit more information to schedule this task. Could you please specify the title, date, start time, and end time?',
          task: parsedTask
        });
      }

      // Check for conflicts
      const conflicts = checkConflicts(parsedTask, existingTasks || []);
      
      if (conflicts.length > 0) {
        return res.status(200).json({
          status: 'conflict',
          message: `You have ${conflicts.length} conflicting task(s) during this time. Would you like to reschedule?`,
          conflicts: conflicts,
          task: parsedTask
        });
      }

      // Return scheduling task data
      return res.status(200).json({
        conversationType: 'scheduling',
        title: parsedTask.title,
        description: parsedTask.description || '',
        startDate: parsedTask.startDate,
        endDate: parsedTask.endDate || parsedTask.startDate,
        startTime: parsedTask.startTime,
        endTime: parsedTask.endTime,
        priority: parsedTask.priority || 'medium',
        category: parsedTask.category || 'personal',
        estimatedHours: parsedTask.estimatedHours || 1.0,
        participants: parsedTask.participants || [],
        assistantMessage: parsedTask.assistantMessage || 'Perfect! I\'ve got all the details to create your task.'
      });
    }

    // Legacy handling for old format responses
    if (parsedTask.needsFollowUp || parsedTask.confidence < 0.6) {
      return res.status(200).json({
        status: 'need_more_info',
        question: parsedTask.followUpQuestion || 'Could you provide more details about this task?',
        task: parsedTask
      });
    }

    const conflicts = checkConflicts(parsedTask, existingTasks || []);
    
    if (conflicts.length > 0) {
      return res.status(200).json({
        status: 'conflict',
        message: `You have ${conflicts.length} conflicting task(s) during this time. Would you like to reschedule?`,
        conflicts: conflicts,
        task: parsedTask
      });
    }

    return res.status(200).json({
      status: 'parsed',
      message: 'Task details extracted successfully!',
      task: {
        title: parsedTask.title,
        description: parsedTask.description || '',
        startDate: parsedTask.startDate,
        endDate: parsedTask.endDate || parsedTask.startDate,
        startTime: parsedTask.startTime,
        endTime: parsedTask.endTime,
        priority: parsedTask.priority || 'medium',
        category: parsedTask.category || 'personal',
        estimatedHours: parsedTask.estimatedHours || 1.0,
        participants: parsedTask.participants || [],
        recurrence: null,
        stakeholders: parsedTask.participants || [],
        links: []
      }
    });

  } catch (error: any) {
    console.error('NLP Task Creation Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process task request'
    });
  }
}

function checkConflicts(newTask: ParsedTask, existingTasks: any[]): any[] {
  const conflicts = [];
  
  for (const task of existingTasks) {
    // Skip completed tasks
    if (task.completed) continue;
    
    // Check if tasks are on the same date
    if (task.startDate !== newTask.startDate && task.endDate !== newTask.endDate) continue;
    
    // Convert times to minutes for easier comparison
    const newStart = timeToMinutes(newTask.startTime);
    const newEnd = timeToMinutes(newTask.endTime);
    const existingStart = timeToMinutes(task.startTime);
    const existingEnd = timeToMinutes(task.endTime);
    
    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      conflicts.push({
        id: task.id,
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        date: task.startDate
      });
    }
  }
  
  return conflicts;
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
} 