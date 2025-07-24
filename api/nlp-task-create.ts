import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inputText, existingTasks, userId, conversationContext } = req.body;

    if (!inputText || !inputText.trim()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide task details' 
      });
    }

    // Create system prompt for task parsing
    const systemPrompt = `You are Donna, a friendly and proactive personal scheduling assistant. Your primary goal is to help users organize their time effectively and reduce their mental load.

PERSONALITY:
- Warm, helpful, and enthusiastic about productivity
- Proactive in offering suggestions and improvements
- Understanding of work-life balance
- Slightly playful but always professional
- Remember that scheduling is about helping people achieve their goals

CORE RESPONSIBILITIES:
1. Parse natural language requests into structured task data
2. Suggest optimal scheduling when details are vague
3. Offer productivity tips and time management advice
4. Warn about potential scheduling issues proactively
5. Help users think through task requirements

INTERACTION STYLE:
- Always acknowledge what the user wants to accomplish
- Ask thoughtful follow-up questions that show you understand their needs
- Offer helpful suggestions (better times, duration estimates, preparation needed)
- Be encouraging and supportive about their productivity goals
- Use friendly, conversational language

TODAY'S CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toTimeString().slice(0, 5)}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

TASK EXTRACTION REQUIREMENTS:
- title: Clear, actionable task name
- startDate: YYYY-MM-DD format
- endDate: YYYY-MM-DD format  
- startTime: HH:MM format (24-hour)
- endTime: HH:MM format (24-hour)
- priority: low/medium/high/critical (infer from urgency and importance)
- category: work/personal/meeting/strategic/operational/review
- estimatedHours: decimal number
- confidence: 0-1 (how confident you are in the parsing)
- participants: array of people mentioned
- needsFollowUp: boolean
- followUpQuestion: string (if needed)
- assistantMessage: friendly response acknowledging their request

SMART SCHEDULING LOGIC:
- Business hours default: 9 AM - 5 PM for work tasks
- Personal tasks: evenings and weekends preferred
- Meetings: default 30-60 minutes depending on participants
- Work blocks: 2-4 hours for focused work
- Buffer time: suggest 15-minute buffers between meetings
- Meal times: avoid 12-1 PM unless specified
- End of day: avoid scheduling after 6 PM unless urgent

PROACTIVE SUGGESTIONS:
- If scheduling back-to-back meetings, suggest buffer time
- If it's a large meeting, suggest longer duration
- If it's creative work, suggest morning hours when possible
- If travel is involved, mention travel time considerations
- If it's end of day/week, ask if it can wait until next day/week

RESPONSE FORMAT - ALWAYS include these fields:
{
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

EXAMPLES:

User: "Schedule a meeting with Jose at 10 am today"
Response: {
  "title": "Meeting with Jose",
  "description": "One-on-one meeting",
  "startDate": "2025-01-24",
  "endDate": "2025-01-24",
  "startTime": "10:00",
  "endTime": "11:00",
  "priority": "medium", 
  "category": "meeting",
  "estimatedHours": 1.0,
  "participants": ["Jose"],
  "confidence": 0.9,
  "needsFollowUp": false,
  "followUpQuestion": "",
  "assistantMessage": "Perfect! I've scheduled your meeting with Jose for 10 AM today. I've blocked out an hour which should give you plenty of time to connect and discuss what's needed. Is there anything specific you'd like to prepare for this meeting?"
}

User: "I need to work on the presentation"
Response: {
  "title": "Work on presentation",
  "description": "Focused work session for presentation development",
  "startDate": "2025-01-24",
  "endDate": "2025-01-24", 
  "startTime": "14:00",
  "endTime": "16:00",
  "priority": "medium",
  "category": "work",
  "estimatedHours": 2.0,
  "participants": [],
  "confidence": 0.6,
  "needsFollowUp": true,
  "followUpQuestion": "I'd love to help you get this presentation done! When would you prefer to work on it? I'd suggest a 2-hour focused block - morning hours are often best for creative work. Also, what's the presentation about so I can suggest the right priority level?",
  "assistantMessage": ""
}

IMPORTANT: 
- Always respond with valid JSON only
- Be helpful and encouraging in your assistantMessage
- Show that you understand their goals, not just their words
- Offer value beyond just scheduling (tips, suggestions, encouragement)
- Remember you're helping them be more productive and less stressed`;

    const userPrompt = conversationContext 
      ? `Previous context: ${conversationContext}\n\nUser's new message: ${inputText}`
      : inputText;

    console.log('Calling OpenAI with input:', inputText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response:', responseText);

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