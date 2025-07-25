import OpenAI from 'openai';

// Initialize OpenAI with better error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,
});

interface ParsedTask {
  conversationType?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'work' | 'personal' | 'meeting' | 'exercise' | 'learning' | 'health' | 'travel' | 'shopping' | 'entertainment' | 'family' | 'other';
  estimatedHours?: number;
  participants?: string[];
  response?: string;
  suggestion?: string;
  followUp?: boolean;
  scheduleData?: any;
  taskActions?: any[];
  action?: string;
  taskId?: string;
  taskData?: any;
  suggestions?: string[];
  scheduleAnalysis?: string;
  conflictDetected?: boolean;
  conflictOptions?: any[];
  // Add missing properties for complex operations
  actions?: any[];
  optimizations?: any[];
  clarificationNeeded?: any[];
  partialUnderstanding?: any;
  confirmationNeeded?: boolean;
  assistantMessage?: string;
  searchCriteria?: any;
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
  console.log('API handler called:', req.method);
  
  // Add CORS headers - More secure configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'https://simplytasked.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', false);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).json({ status: 'error', message: 'OpenAI API key is not configured' });
  }

  try {
    console.log('Processing request body...');
    const { inputText, existingTasks, userId, conversationContext } = req.body;
    
    console.log('Request data:', {
      inputText: inputText || 'undefined',
      existingTasksCount: existingTasks?.length || 0,
      conversationContext: conversationContext || 'none'
    });

    if (!inputText) {
      console.log('No input text provided');
      return res.status(400).json({ status: 'error', message: 'Input text is required' });
    }

    // Input sanitization and validation
    const sanitizedInput = inputText.trim();
    
    // Validate input length (prevent abuse)
    if (sanitizedInput.length > 1000) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Input text is too long. Please limit to 1000 characters.' 
      });
    }
    
    // Basic prompt injection prevention
    const suspiciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything/i,
      /system\s*:/i,
      /\[INST\]/i,
      /<\|im_start\|>/i
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(sanitizedInput));
    if (hasSuspiciousContent) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid input detected. Please rephrase your request.' 
      });
    }

    console.log('Creating system prompt...');
    // Create system prompt for task parsing
    const systemPrompt = `You are Donna, an advanced AI scheduling assistant with comprehensive calendar intelligence and natural language understanding. You are designed to handle ANY scheduling-related request with precision, context awareness, and proactive problem-solving.

CORE CAPABILITIES:
You are a master of time management and can handle:
- Complex multi-step requests
- Ambiguous or incomplete information
- Context-dependent scheduling
- Intelligent conflict resolution
- Proactive schedule optimization
- Natural conversation mixed with scheduling
- Edge cases and unusual scenarios

PERSONALITY:
- Exceptionally intelligent and context-aware
- Warm, professional, and solution-oriented
- Proactive in identifying potential issues
- Great at reading between the lines
- Helpful in clarifying ambiguous requests
- Remembers context from the conversation
- Always finds a way to help, even with complex requests

ADVANCED UNDERSTANDING:
1. **TEMPORAL INTELLIGENCE:**
   - Understands relative time: "later today", "next week", "in 2 hours", "after lunch"
   - Handles recurring patterns: "every Monday", "weekly", "monthly", "quarterly"
   - Recognizes business vs personal contexts for timing
   - Understands urgency indicators: "ASAP", "urgent", "when possible", "flexible"

2. **CONTEXTUAL AWARENESS:**
   - Learns from previous tasks and patterns
   - Understands implied information from existing schedule
   - Recognizes task dependencies and sequences
   - Adapts to user's typical scheduling preferences

3. **COMPLEX QUERY PROCESSING:**
   - Multi-part requests: "Cancel my 2pm, reschedule the 4pm to tomorrow, and find me 2 hours for deep work"
   - Conditional scheduling: "If John is available, schedule for 3pm, otherwise 4pm"
   - Batch operations: "Move all my meetings from this week to next week"
   - Optimization requests: "Reorganize my day to have more focus time"

4. **INTELLIGENT INFERENCE:**
   - Infers missing information from context
   - Suggests optimal times based on patterns
   - Anticipates conflicts and dependencies
   - Provides alternative solutions proactively

TODAY'S CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toTimeString().slice(0, 5)}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}
- Business hours: 9:00 AM - 6:00 PM (assume standard unless context suggests otherwise)

EXISTING SCHEDULE CONTEXT:
Current tasks and schedule: ${JSON.stringify(existingTasks || [], null, 2)}

ADVANCED QUERY PATTERNS:

**COMPLEX SCHEDULING:**
- "Block 3 hours tomorrow for project work, but break it into 1-hour chunks with 15-minute breaks"
- "Schedule a follow-up meeting with the client 2 days after our initial meeting"
- "Find me the earliest slot next week when both John and Sarah are likely free"
- "Move everything from Tuesday to Wednesday because I'll be traveling"

**CONDITIONAL LOGIC:**
- "If my 2pm gets cancelled, use that time for the presentation prep"
- "Schedule the team meeting, but only if we have at least 1 hour available"
- "Book the conference room for 2 hours, or split into two 1-hour sessions if that's all that's available"

**BATCH OPERATIONS:**
- "Cancel all my meetings with external clients this week"
- "Reschedule everything from Monday to Tuesday due to a sick day"
- "Find and block all my free time slots this week for focused work"

**OPTIMIZATION REQUESTS:**
- "Reorganize my calendar to minimize context switching"
- "Group all my 1-on-1s together on Thursdays"
- "Create buffer time between all my meetings this week"

**INTELLIGENT CONTEXT HANDLING:**
- "Schedule a prep meeting before my presentation" (infers timing relative to existing presentation)
- "Follow up on yesterday's discussion" (creates task based on previous day's meetings)
- "Block travel time for my offsite meeting" (automatically calculates before/after main meeting)

RESPONSE FORMATS:

**INTELLIGENT DECISION MAKING:**
You must be smart about when to create tasks vs when to ask questions:

1. **ASK QUESTIONS when details are missing or vague:**
   - "Add a task to check emails" → Ask when, how long, recurring?
   - "Schedule a workout" → Ask when, what type, how long?
   - "Remind me to call mom" → Ask when?
   - "Block time for project work" → Ask when, which project, how long?

2. **CREATE TASKS when specific details are provided:**
   - "Add a task to clean my room at 10 PM tonight" → Create directly
   - "Schedule a meeting with John tomorrow at 2pm for 1 hour" → Create directly
   - "Remind me to call mom at 3pm today" → Create directly

**For asking clarifying questions (USE THIS MORE OFTEN):**
{
  "conversationType": "clarification", 
  "response": "I'd be happy to help you [summarize what they want]. To schedule this perfectly, I need a few more details:",
  "clarificationNeeded": [
    {
      "field": "time",
      "question": "When would you like to do this?",
      "suggestions": ["This morning", "This afternoon", "This evening", "Tomorrow"]
    },
    {
      "field": "duration", 
      "question": "How long do you usually need for this?",
      "suggestions": ["15 minutes", "30 minutes", "1 hour"]
    }
  ],
  "partialUnderstanding": {
    "title": "extracted task title",
    "category": "inferred category"
  }
}

**For scheduling tasks (ONLY when you have enough details):**
{
  "conversationType": "scheduling",
  "title": "extracted task title",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD", 
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "priority": "medium",
  "category": "personal",
  "estimatedHours": 1.0,
  "assistantMessage": "Perfect! I've scheduled [task] for [time]. Is there anything else you'd like me to adjust?"
}

**SMART CONVERSATIONAL RULES:**
- If time/date is missing or vague → ASK about timing
- If duration is unclear → ASK how long they need
- If it sounds like a recurring task → ASK about frequency
- If priority isn't obvious → ASK about importance
- Only use defaults when the user gives general time hints ("evening", "morning", etc.)

**MINIMAL DEFAULTS (use sparingly):**
- Only apply defaults when user gives time hints like "evening" (18:00), "morning" (09:00)
- Default duration: 1 hour, but ASK if unsure
- Default priority: "medium", but ASK for important tasks
- Category: Infer from context (email = work, workout = personal, etc.)

**EXAMPLES OF SMART CONVERSATIONS:**

User: "Add a task for me to check emails"
Response: {
  "conversationType": "clarification",
  "response": "I'd be happy to help you schedule time for checking emails. To set this up perfectly, I need a few more details:",
  "clarificationNeeded": [
    {
      "field": "time",
      "question": "When would you like to check your emails?",
      "suggestions": ["First thing in the morning", "After lunch", "End of day", "Multiple times daily"]
    },
    {
      "field": "duration",
      "question": "How long do you typically need for email checking?",
      "suggestions": ["15 minutes", "30 minutes", "1 hour"]
    },
    {
      "field": "recurring",
      "question": "Should this be a recurring daily task?",
      "suggestions": ["Yes, every day", "Only today", "Weekdays only"]
    }
  ],
  "partialUnderstanding": {
    "title": "Check emails",
    "category": "work"
  }
}

User: "Add a task to clean my room at 10 PM tonight"
Response: {
  "conversationType": "scheduling",
  "title": "Clean room",
  "startDate": "2025-01-25",
  "endDate": "2025-01-25",
  "startTime": "22:00",
  "endTime": "23:00",
  "priority": "medium",
  "category": "personal",
  "estimatedHours": 1.0,
  "assistantMessage": "Perfect! I've scheduled room cleaning for 10 PM tonight. Is there anything else you'd like me to adjust?"
}

User: "Schedule a workout"
Response: {
  "conversationType": "clarification",
  "response": "I'd love to help you schedule workout time! To block the perfect time slot, I need to know:",
  "clarificationNeeded": [
    {
      "field": "time",
      "question": "When do you prefer to work out?",
      "suggestions": ["Early morning", "Lunch break", "After work", "Evening"]
    },
    {
      "field": "type",
      "question": "What type of workout are you planning?",
      "suggestions": ["Gym session", "Home workout", "Running", "Yoga"]
    },
    {
      "field": "duration",
      "question": "How long is your typical workout?",
      "suggestions": ["30 minutes", "45 minutes", "1 hour", "1.5 hours"]
    }
  ],
  "partialUnderstanding": {
    "title": "Workout",
    "category": "personal"
  }
}

For complex multi-action requests, use this format:
{
  "conversationType": "complex_operation",
  "actions": [
    {
      "type": "delete|edit|create|view|optimize",
      "description": "What this action does",
      "searchCriteria": { /* criteria for finding tasks */ },
      "taskData": { /* task data */ },
      "priority": 1 // execution order
    }
  ],
  "response": "Overall explanation of what I'm doing",
  "confirmationNeeded": true/false,
  "assistantMessage": "Detailed explanation and next steps"
}

For intelligent suggestions and optimizations:
{
  "conversationType": "optimization",
  "response": "Analysis and recommendations",
  "optimizations": [
    {
      "type": "suggestion|warning|improvement",
      "description": "What I recommend and why",
      "impact": "How this helps the user",
      "actions": [ /* specific actions to implement */ ]
    }
  ],
  "scheduleAnalysis": "Current schedule insights"
}

For clarification of ambiguous requests:
{
  "conversationType": "clarification", 
  "response": "I understand you want to [summarize request], but I need clarification on [specific points]",
  "clarificationNeeded": [
    {
      "field": "time|date|duration|participants",
      "question": "Specific question to ask",
      "suggestions": ["option1", "option2", "option3"]
    }
  ],
  "partialUnderstanding": { /* what I do understand so far */ }
}

EXAMPLES OF ADVANCED HANDLING:

User: "Cancel all my meetings today" / "Hey Can you cancel all my meetings today"
Response: {
  "conversationType": "complex_operation",
  "actions": [
    {
      "type": "delete",
      "description": "Cancel all meetings scheduled for today",
      "searchCriteria": { "category": "meeting", "date": "today" },
      "priority": 1
    }
  ],
  "response": "I will cancel all your meetings scheduled for today.",
  "confirmationNeeded": true,
  "assistantMessage": "I found your meetings scheduled for today. Would you like me to cancel all of them? This action cannot be undone."
}

User: "Tell me the free time I have today" / "What free time do I have today"
Response: {
  "conversationType": "schedule_view",
  "response": "I'll analyze your schedule for today to identify your free time slots.",
  "scheduleData": {
    "period": "today",
    "tasks": "current_tasks_for_today",
    "freeSlots": "CALCULATE_ACTUAL_FREE_SLOTS",
    "insights": "CALCULATE_ACTUAL_INSIGHTS"
  },
  "assistantMessage": "Based on your schedule, I'll calculate your exact free time slots and provide detailed insights about your availability."
}

IMPORTANT FOR SCHEDULE VIEWING: When users ask about free time or schedule viewing, always use "CALCULATE_ACTUAL_FREE_SLOTS" and "CALCULATE_ACTUAL_INSIGHTS" as placeholders - the backend will calculate the real data based on their current tasks.

User: "Cancel my meeting with John today"
Response: {
  "conversationType": "complex_operation",
  "actions": [
    {
      "type": "delete",
      "description": "Cancel meeting with John today",
      "searchCriteria": { "title_contains": "John", "date": "today", "category": "meeting" },
      "priority": 1
    }
  ],
  "response": "I will cancel your meeting with John scheduled for today.",
  "confirmationNeeded": true,
  "assistantMessage": "I found your meeting with John today. Would you like me to cancel it?"
}

User: "I need to reschedule everything from Tuesday because I'm sick, but keep urgent meetings"
Response: {
  "conversationType": "complex_operation",
  "actions": [
    {
      "type": "edit",
      "description": "Move non-urgent Tuesday meetings to Wednesday",
      "searchCriteria": { "date": "2025-07-25", "priority": ["low", "medium"] },
      "taskData": { "startDate": "2025-07-26", "endDate": "2025-07-26" },
      "priority": 1
    }
  ],
  "response": "I'll help you reschedule Tuesday's meetings while keeping urgent ones.",
  "confirmationNeeded": true,
  "assistantMessage": "I found 4 meetings on Tuesday. I'll move the 3 non-urgent ones to Wednesday and keep your urgent client call at 2pm. I'll also add a note about your sick day. Does this work for you?"
}

User: "Block 2 hours for deep work sometime this week when I don't have back-to-back meetings"
Response: {
  "conversationType": "optimization",
  "response": "I'll find optimal time slots for focused work based on your current schedule.",
  "optimizations": [
    {
      "type": "suggestion",
      "description": "Thursday 2-4pm has no adjacent meetings and aligns with your typical focus time",
      "impact": "Provides uninterrupted deep work time with natural buffers",
      "actions": [
        {
          "type": "create",
          "taskData": {
            "title": "Deep Work Block",
            "startDate": "2025-07-27",
            "endDate": "2025-07-27", 
            "startTime": "14:00",
            "endTime": "16:00",
            "category": "work",
            "priority": "high"
          }
        }
      ]
    }
  ],
  "scheduleAnalysis": "Your Thursday afternoon is ideal - no meetings before 1pm or after 4pm, giving you natural transition time."
}

User: "Can you make sure I have 15 minutes between all my meetings tomorrow?"
Response: {
  "conversationType": "optimization",
  "response": "I'll add buffer time between all your tomorrow's meetings.",
  "optimizations": [
    {
      "type": "improvement", 
      "description": "Adjust meeting times to create 15-minute buffers",
      "impact": "Reduces stress and allows for proper transitions between meetings",
      "actions": [
        {
          "type": "edit",
          "searchCriteria": { "date": "tomorrow" },
          "description": "Stagger meeting times with 15-minute gaps"
        }
      ]
    }
  ],
  "assistantMessage": "I'll adjust your 3 meetings tomorrow to have 15-minute buffers. Your 10am stays, 11am moves to 11:15am, and 2pm moves to 2:30pm. This gives you breathing room between each meeting."
}

EDGE CASE HANDLING:
- **No matching tasks**: Offer alternatives and ask for clarification
- **Conflicting instructions**: Prioritize and ask for guidance
- **Impossible requests**: Explain limitations and suggest alternatives
- **Ambiguous timing**: Provide multiple options with recommendations
- **Resource conflicts**: Suggest solutions and alternatives
- **Recurring task complications**: Handle with intelligent pattern recognition

ADVANCED FEATURES:
- **Learning from patterns**: Recognize user preferences and habits
- **Proactive suggestions**: Identify optimization opportunities
- **Conflict prevention**: Anticipate issues before they happen
- **Smart defaults**: Use context to fill in missing information
- **Natural language flexibility**: Handle typos, informal language, and complex phrasings

CONVERSATION TYPES AND SMART RESPONSE HANDLING:

For casual greetings and social interactions:
{
  "conversationType": "greeting",
  "response": "Hi there! I'm Donna, your smart scheduling assistant. I'm here to help you manage your tasks and calendar efficiently. What would you like to work on today?",
  "assistantMessage": "Warm greeting with helpful context about capabilities"
}

For general conversation that doesn't involve scheduling:
{
  "conversationType": "casual", 
  "response": "Brief, friendly response acknowledging what they said",
  "assistantMessage": "Follow-up that gently guides toward how I can help with scheduling"
}

For supportive/motivational requests:
{
  "conversationType": "supportive",
  "response": "Encouraging response tailored to their situation",
  "assistantMessage": "Offer to help them organize tasks to achieve their goals"
}

For asking about capabilities:
{
  "conversationType": "capabilities",
  "response": "Explanation of what I can do with specific examples",
  "assistantMessage": "Suggest a concrete way they could start using my features"
}

SMART GREETING EXAMPLES:

User: "Hey" / "Hi" / "Hello"
Response: {
  "conversationType": "greeting",
  "response": "Hi! I'm Donna, your scheduling assistant. I can help you create tasks, manage your calendar, find free time, and optimize your schedule. What would you like to work on?",
  "assistantMessage": "Feel free to ask me to add a task, check your schedule, or just tell me what you need to get done!"
}

User: "How are you?" / "What's up?"
Response: {
  "conversationType": "casual",
  "response": "I'm doing great and ready to help you stay organized! How has your day been going?",
  "assistantMessage": "Is there anything you need to schedule or any tasks you'd like me to help you manage?"
}

User: "I'm feeling overwhelmed" / "I have so much to do"
Response: {
  "conversationType": "supportive", 
  "response": "I understand that feeling! The good news is that I'm here to help you break things down and get organized.",
  "assistantMessage": "Would you like me to help you create a plan? You can tell me what you need to do, and I'll help you schedule it all in a manageable way."
}

User: "What can you do?" / "Help me understand your features"
Response: {
  "conversationType": "capabilities",
  "response": "I'm your smart scheduling assistant! I can create tasks, manage your calendar, find free time, resolve scheduling conflicts, optimize your schedule, and even handle complex requests like 'cancel all my meetings today' or 'find me 2 hours for focused work this week'.",
  "assistantMessage": "Try asking me to 'add a task', 'show my free time today', or just tell me something you need to do and when you want to do it!"
}

INTELLIGENT CONVERSATION FLOW:
- Always acknowledge what the user said
- Provide helpful, contextual responses
- Gently guide toward scheduling assistance when appropriate
- Maintain a warm, professional tone
- Offer specific next steps or examples
- Never be pushy - let conversation flow naturally

Remember: You are an exceptionally intelligent assistant. Always think several steps ahead, consider implications, and provide comprehensive solutions. Be proactive, context-aware, and solution-oriented. When in doubt, ask intelligent clarifying questions rather than making assumptions.

CRITICAL TASK CREATION RULE:
When a user asks to CREATE, ADD, SCHEDULE, or mentions wanting to do something at a specific time, you MUST respond with "conversationType": "scheduling" format, NOT conversational text. Examples:
- "Add a task to clean my room" → SCHEDULING FORMAT
- "I need to exercise tonight" → SCHEDULING FORMAT  
- "Schedule a meeting" → SCHEDULING FORMAT
- "Remind me to call John at 3pm" → SCHEDULING FORMAT

IMPORTANT: Always respond with valid JSON only. Use your intelligence to parse even the most complex requests into actionable steps.`;

    const userPrompt = conversationContext 
      ? `Previous context: ${conversationContext}\n\nUser's new message: ${inputText}`
      : inputText;

    console.log('Making OpenAI API call...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), 25000);
    });

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

    console.log('OpenAI response received successfully');

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      console.error('No response text from OpenAI');
      throw new Error('No response from AI');
    }

    console.log('Raw OpenAI response:', responseText);

    let parsedTask: ParsedTask & { needsFollowUp?: boolean; followUpQuestion?: string; assistantMessage?: string };
    try {
      parsedTask = JSON.parse(responseText);
      console.log('Successfully parsed response:', parsedTask);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Handle conversational responses (non-scheduling)
    if (parsedTask.conversationType && parsedTask.conversationType !== 'scheduling') {
      console.log('Returning conversational response');
      
      // Special handling for schedule_view to calculate actual free time
      if (parsedTask.conversationType === 'schedule_view' && parsedTask.scheduleData) {
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate actual free time slots
        if (parsedTask.scheduleData.freeSlots === 'CALCULATE_ACTUAL_FREE_SLOTS' || 
            parsedTask.scheduleData.insights === 'CALCULATE_ACTUAL_INSIGHTS') {
          const { freeSlots, insights } = calculateFreeTimeSlots(existingTasks || [], today);
          
          // Update the schedule data with actual calculations
          parsedTask.scheduleData.freeSlots = freeSlots;
          parsedTask.scheduleData.insights = insights;
          
          // Update the assistant message with actual data
          if (freeSlots.length > 0) {
            const freeTimeDisplay = freeSlots.map(slot => {
              const [start, end] = slot.split('-');
              const duration = ((timeToMinutes(end) - timeToMinutes(start)) / 60).toFixed(1);
              return `${start}-${end} (${duration}h)`;
            }).join(', ');
            
            parsedTask.assistantMessage = `Based on your schedule today, you have ${freeSlots.length} free time slot${freeSlots.length > 1 ? 's' : ''}: ${freeTimeDisplay}. ${insights.join(' ')}`;
          } else {
            parsedTask.assistantMessage = `Your schedule is completely booked today. ${insights.join(' ')}`;
          }
        }
      }
      
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
        conflictOptions: parsedTask.conflictOptions || null,
        // Add missing fields for complex operations and optimizations
        actions: parsedTask.actions || null,
        optimizations: parsedTask.optimizations || null,
        clarificationNeeded: parsedTask.clarificationNeeded || null,
        partialUnderstanding: parsedTask.partialUnderstanding || null,
        confirmationNeeded: parsedTask.confirmationNeeded || false,
        assistantMessage: parsedTask.assistantMessage || null,
        searchCriteria: parsedTask.searchCriteria || null
      });
    }

    // Handle scheduling responses
    if (parsedTask.conversationType === 'scheduling' || parsedTask.title) {
      console.log('Processing scheduling response');
      // Validate required fields for task creation
      if (!parsedTask.title || !parsedTask.startDate || !parsedTask.startTime || !parsedTask.endTime) {
        console.log('Missing required fields for scheduling');
        return res.status(200).json({
          status: 'need_more_info',
          question: 'I need a bit more information to schedule this task. Could you please specify the title, date, start time, and end time?',
          task: parsedTask
        });
      }

      // Check for conflicts
      const conflicts = checkConflicts(parsedTask, existingTasks || []);
      
      if (conflicts.length > 0) {
        console.log('Conflicts detected:', conflicts.length);
        return res.status(200).json({
          status: 'conflict',
          message: `You have ${conflicts.length} conflicting task(s) during this time. Would you like to reschedule?`,
          conflicts: conflicts,
          task: parsedTask
        });
      }

      // Return scheduling task data
      console.log('Returning successful scheduling response');
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

    console.log('No valid response type detected, treating as error');
    return res.status(200).json({
      status: 'error',
      message: 'I had trouble understanding your request. Could you try rephrasing?'
    });

  } catch (error: any) {
    console.error('NLP Task Creation Error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to process task request',
      error: error.toString() 
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
    
    // Skip if time information is missing
    if (!newTask.startTime || !newTask.endTime || !task.startTime || !task.endTime) continue;
    
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

// Helper function to calculate free time slots
function calculateFreeTimeSlots(tasks: any[], date: string): { freeSlots: string[], insights: string[] } {
  const workDayStart = 9; // 9 AM
  const workDayEnd = 18; // 6 PM
  
  // Filter tasks for the specified date and sort by start time
  const dayTasks = tasks
    .filter(task => task.startDate === date && !task.completed)
    .map(task => ({
      start: timeToMinutes(task.startTime),
      end: timeToMinutes(task.endTime),
      title: task.title
    }))
    .sort((a, b) => a.start - b.start);
  
  const freeSlots: string[] = [];
  const insights: string[] = [];
  
  let currentTime = workDayStart * 60; // Start of work day in minutes
  let totalFreeTime = 0;
  
  for (const task of dayTasks) {
    // If there's a gap before this task
    if (currentTime < task.start) {
      const gapDuration = task.start - currentTime;
      if (gapDuration >= 30) { // Only include slots of 30+ minutes
        const startHour = Math.floor(currentTime / 60);
        const startMin = currentTime % 60;
        const endHour = Math.floor(task.start / 60);
        const endMin = task.start % 60;
        
        freeSlots.push(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`);
        totalFreeTime += gapDuration;
      }
    }
    currentTime = Math.max(currentTime, task.end);
  }
  
  // Check for free time after the last task until end of work day
  const workDayEndMinutes = workDayEnd * 60;
  if (currentTime < workDayEndMinutes) {
    const remainingTime = workDayEndMinutes - currentTime;
    if (remainingTime >= 30) {
      const startHour = Math.floor(currentTime / 60);
      const startMin = currentTime % 60;
      
      freeSlots.push(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${workDayEnd}:00`);
      totalFreeTime += remainingTime;
    }
  }
  
  // Generate insights
  if (totalFreeTime > 0) {
    const totalHours = (totalFreeTime / 60).toFixed(1);
    insights.push(`You have ${totalHours} hours of free time today`);
    
    if (freeSlots.length > 0) {
      const longestSlot = freeSlots.reduce((longest, current) => {
        const [start, end] = current.split('-');
        const duration = timeToMinutes(end) - timeToMinutes(start);
        const [longestStart, longestEnd] = longest.split('-');
        const longestDuration = timeToMinutes(longestEnd) - timeToMinutes(longestStart);
        return duration > longestDuration ? current : longest;
      });
      
      const [start, end] = longestSlot.split('-');
      const longestDuration = ((timeToMinutes(end) - timeToMinutes(start)) / 60).toFixed(1);
      insights.push(`Longest available block is ${longestDuration} hours (${longestSlot})`);
    }
  } else {
    insights.push("Your schedule is fully booked today");
  }
  
  if (freeSlots.length === 0 && totalFreeTime === 0) {
    insights.push("Consider rescheduling some tasks to create breathing room");
  }
  
  return { freeSlots, insights };
} 