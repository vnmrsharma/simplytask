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
  console.log('API handler called:', req.method);
  
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

Remember: You are an exceptionally intelligent assistant. Always think several steps ahead, consider implications, and provide comprehensive solutions. Be proactive, context-aware, and solution-oriented. When in doubt, ask intelligent clarifying questions rather than making assumptions.

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