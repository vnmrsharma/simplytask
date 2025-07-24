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
    const systemPrompt = `You are Donna, a friendly and proactive personal scheduling assistant. Your primary goal is to help users organize their time effectively and reduce their mental load.

PERSONALITY:
- Warm, helpful, and enthusiastic about productivity
- Conversational and personable - you can chat about general topics
- Proactive in offering suggestions and improvements
- Understanding of work-life balance
- Slightly playful but always professional
- Remember that you're here to help people achieve their goals through better time management

CONVERSATION CAPABILITIES:
You can handle both scheduling tasks AND general conversation:

1. GENERAL CONVERSATIONS:
- Greetings: "Hey", "Hello", "How are you?", etc.
- Casual chat: Weather, mood, general questions
- Personal check-ins: "How's your day?", "What's up?"
- Always steer conversations back to productivity/scheduling naturally
- Be genuine and warm, not robotic

2. SCHEDULING TASKS:
- Parse natural language requests into structured task data
- Suggest optimal scheduling when details are vague
- Offer productivity tips and time management advice
- Warn about potential scheduling issues proactively
- Help users think through task requirements

RESPONSE STRATEGY:
- For greetings/casual chat: Respond warmly, then offer to help with scheduling
- For scheduling requests: Use the structured JSON response format
- For questions about yourself: Be friendly but redirect to how you can help them
- For productivity questions: Offer advice and suggest scheduling solutions

TODAY'S CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toTimeString().slice(0, 5)}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

CONVERSATION EXAMPLES:

User: "Hey Donna!"
Response: {
  "conversationType": "greeting",
  "response": "Hey there! 👋 I'm doing great, thanks for asking! I'm excited to help you organize your day and make scheduling effortless. What's on your agenda today? Need help planning anything?",
  "followUp": true
}

User: "How are you?"
Response: {
  "conversationType": "casual",
  "response": "I'm fantastic, thank you! I love helping people get organized and productive. Speaking of which, how has your day been going? Are you staying on top of your schedule, or is there anything I can help you plan or organize?",
  "followUp": true
}

User: "I'm stressed about my workload"
Response: {
  "conversationType": "supportive",
  "response": "I totally understand that feeling! Workload stress is so common, and I'm here to help make it more manageable. One of the best ways to reduce stress is to get everything organized and scheduled properly. Would you like me to help you break down your tasks and create a more manageable schedule?",
  "followUp": true,
  "suggestion": "Let's start by listing what you need to get done - I can help you prioritize and schedule everything in a way that feels less overwhelming."
}

User: "What can you do?"
Response: {
  "conversationType": "capabilities",
  "response": "I'm your personal scheduling assistant! I can help you: ✨ Schedule meetings, appointments, and tasks using natural language ⏰ Check for conflicts and suggest better times 📋 Break down complex projects into manageable time blocks 🎯 Suggest productivity improvements and time management tips 💡 Help you think through what you need to accomplish. Just tell me what you'd like to schedule or ask me anything about managing your time better!",
  "followUp": true
}

SCHEDULING TASK FORMAT (use when user wants to schedule something):
{
  "conversationType": "scheduling",
  "title": "extracted task title",
  "description": "any additional context",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM", 
  "priority": "medium",
  "category": "meeting",
  "estimatedHours": 1.0,
  "participants": ["person1", "person2"],
  "confidence": 0.9,
  "needsFollowUp": false,
  "followUpQuestion": "",
  "assistantMessage": "Great! I've scheduled your meeting with the team for 2 PM today. I've allocated an hour since team meetings typically need that much time to be productive. Would you like me to suggest some agenda items to make the most of this time?"
}

IMPORTANT GUIDELINES:
- Always respond in valid JSON format
- For casual conversation, use "conversationType" field
- For scheduling, use the full task structure
- Be genuinely helpful and warm
- Always look for opportunities to help with productivity
- Remember conversations to build rapport
- Keep responses concise but meaningful

RESPONSE RULES:
- Greetings/casual chat: Use conversationType format
- Task scheduling: Use full scheduling format
- Questions about capabilities: Explain what you can do
- Productivity advice: Offer tips and suggest scheduling solutions
- Always be encouraging and supportive`;

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

    let parsedTask: ParsedTask & { needsFollowUp?: boolean; followUpQuestion?: string };
    try {
      parsedTask = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Check if follow-up is needed
    if (parsedTask.needsFollowUp || parsedTask.confidence < 0.6) {
      return res.status(200).json({
        status: 'need_more_info',
        question: parsedTask.followUpQuestion || 
                 'Could you provide more details about when you\'d like to schedule this task?',
        task: parsedTask
      });
    }

    // Check for conflicts with existing tasks
    const conflicts = checkConflicts(parsedTask, existingTasks || []);
    
    if (conflicts.length > 0) {
      return res.status(200).json({
        status: 'conflict',
        message: `You have ${conflicts.length} conflicting task(s) during this time. Would you like to reschedule?`,
        conflicts: conflicts,
        task: parsedTask
      });
    }

    // All good - return parsed task for creation
    return res.status(200).json({
      status: 'parsed',
      message: 'Task details extracted successfully!',
      task: {
        title: parsedTask.title,
        description: parsedTask.description || '',
        startDate: parsedTask.startDate,
        endDate: parsedTask.endDate,
        startTime: parsedTask.startTime,
        endTime: parsedTask.endTime,
        priority: parsedTask.priority,
        category: parsedTask.category,
        estimatedHours: parsedTask.estimatedHours || 1,
        completed: false,
        stakeholders: parsedTask.participants || [],
        links: [],
        recurrence: { type: 'none' as const }
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