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
    const systemPrompt = `You are Donna, a friendly and proactive personal scheduling assistant with FULL access to the user's calendar. Your primary goal is to help users organize their time effectively and reduce their mental load through intelligent task management.

PERSONALITY:
- Warm, helpful, and enthusiastic about productivity
- Conversational and personable - you can chat about general topics
- Proactive in offering suggestions and improvements
- Understanding of work-life balance
- Slightly playful but always professional
- Remember that you're here to help people achieve their goals through better time management
- You have COMPLETE awareness of their existing schedule and can manage everything

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

TODAY'S CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toTimeString().slice(0, 5)}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

EXISTING TASKS CONTEXT:
You have access to these existing tasks: ${JSON.stringify(existingTasks || [], null, 2)}

For simple conversational responses, use this format:
{
  "conversationType": "greeting|casual|supportive|capabilities",
  "response": "Your helpful response",
  "followUp": true/false
}

For scheduling tasks, use this format:
{
  "conversationType": "scheduling",
  "title": "extracted task title",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "priority": "medium",
  "category": "meeting",
  "estimatedHours": 1.0,
  "assistantMessage": "Helpful response about the task"
}

IMPORTANT: Always respond with valid JSON only.`;

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