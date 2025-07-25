// Vercel Serverless Function - ES Module
// This file must use only ESM (import/export) syntax and global fetch

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: any, res: any) {
  // More secure CORS configuration
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'No OpenAI API key.' });
  }

  try {
    // Vercel passes req.body as an object, but fallback to JSON parse for edge cases
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { tasks, date, period = 'daily' } = body || {};
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(200).json({ summary: `There are no tasks to summarize for this ${period}. Let's set some goals and make progress!` });
    }

    let prompt = '';
    if (period === 'daily') {
      prompt = `
You are an executive productivity coach. Given the following list of tasks for the day, write a short, motivating, positive, and exciting summary of the user's progress. Highlight wins, encourage improvement, and end with a call to action to push for even better results tomorrow. Be uplifting and supportive.

Date: ${date}
Tasks:
${tasks.map((t: any, i: number) => `- ${t.title} [${t.completed ? 'Completed' : 'Pending'}]${t.notes ? `: ${t.notes}` : ''}`).join('\n')}

Summary:
`;
    } else if (period === 'weekly') {
      prompt = `
You are an executive productivity coach. Given the following list of tasks for the week, write a motivating, positive, and exciting summary of the user's weekly progress. Highlight the biggest wins, overall productivity, and provide 2-3 constructive suggestions for improvement based on the data. End with a call to action to make the next week even better. Be uplifting and supportive.

Week: ${date}
Tasks:
${tasks.map((t: any, i: number) => `- ${t.title} [${t.completed ? 'Completed' : 'Pending'}]${t.notes ? `: ${t.notes}` : ''}`).join('\n')}

Summary:
`;
    } else if (period === 'monthly') {
      prompt = `
You are an executive productivity coach. Given the following list of tasks for the month, write a motivating, positive, and exciting summary of the user's monthly progress. Highlight the biggest wins, overall productivity, and provide 2-3 constructive suggestions for improvement based on the data. End with a call to action to make the next month even better. Be uplifting and supportive.

Month: ${date}
Tasks:
${tasks.map((t: any, i: number) => `- ${t.title} [${t.completed ? 'Completed' : 'Pending'}]${t.notes ? `: ${t.notes}` : ''}`).join('\n')}

Summary:
`;
    } else {
      prompt = `Summarize the following tasks in a motivating and positive way.`;
    }

    // Use global fetch (Node 18+ on Vercel)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 180,
        temperature: 0.3
      })
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      console.error('OpenAI error:', error);
      return res.status(500).json({ error: 'OpenAI error: ' + error });
    }

    const data = await openaiRes.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || 'No summary generated.';

    res.status(200).json({ summary });
  } catch (err: any) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
} 