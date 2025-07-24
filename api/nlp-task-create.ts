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
    const systemPrompt = `You are an intelligent task scheduling assistant. Your job is to parse natural language input and extract task information.

INSTRUCTIONS:
1. Extract task details from user input
2. Infer missing information when possible (use smart defaults)
3. If critical information is missing, ask ONE specific follow-up question
4. Always return valid JSON

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
CURRENT TIME: ${new Date().toTimeString().slice(0, 5)}

REQUIRED FIELDS:
- title: Clear, concise task name
- startDate: YYYY-MM-DD format (default to today if not specified)
- endDate: YYYY-MM-DD format (same as startDate for single-day tasks)
- startTime: HH:MM format (24-hour)
- endTime: HH:MM format (calculated from duration or default 1 hour)
- priority: low/medium/high/critical (infer from context)
- category: work/personal/meeting/strategic/operational/review
- estimatedHours: decimal number (calculate from start/end time)
- confidence: 0-1 (how confident you are in the parsing)

SMART DEFAULTS:
- If no time specified, default to next available hour during business hours (9-17)
- If no duration specified, default to 1 hour for meetings, 2 hours for work tasks
- If "today" mentioned, use today's date
- If "tomorrow" mentioned, use tomorrow's date
- If day name mentioned (Monday, Tuesday, etc.), use next occurrence

EXAMPLES:
Input: "Schedule a meeting with Jose at 10 am today"
Output: {
  "title": "Meeting with Jose",
  "startDate": "2025-01-24",
  "endDate": "2025-01-24", 
  "startTime": "10:00",
  "endTime": "11:00",
  "priority": "medium",
  "category": "meeting",
  "estimatedHours": 1,
  "participants": ["Jose"],
  "confidence": 0.9,
  "needsFollowUp": false
}

Input: "Work on the presentation"
Output: {
  "title": "Work on presentation",
  "startDate": "2025-01-24",
  "endDate": "2025-01-24",
  "startTime": "14:00",
  "endTime": "16:00", 
  "priority": "medium",
  "category": "work",
  "estimatedHours": 2,
  "confidence": 0.7,
  "needsFollowUp": true,
  "followUpQuestion": "When would you like to work on the presentation?"
}

RESPOND ONLY WITH VALID JSON. NO EXPLANATIONS OR MARKDOWN.`;

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