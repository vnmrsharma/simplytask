# SimplyTask ✨

Hey there! Welcome to SimplyTask - your new favorite productivity companion that actually understands what you're saying.

## What makes this special?

**Talk to create tasks** - Just say "Schedule a meeting with Sarah at 2 PM tomorrow" and watch the magic happen. No more clicking through endless forms!

**Smart conflict detection** - The app will politely let you know if you're trying to be in two places at once (we've all been there).

**Beautiful calendar views** - Switch between daily, weekly, monthly, and yearly views. Each one is designed to help you see exactly what you need, when you need it.

**Insightful reports** - Get AI-powered summaries of your productivity that actually motivate you instead of making you feel guilty.

**Works everywhere** - Whether you're on your phone, tablet, or computer, everything looks and feels just right.

## Running this locally

Want to try it out on your own machine? Here's how:

### Step 1: Get your API keys
You'll need a couple of free accounts:
- **Supabase** (for storing your tasks) - Sign up at [supabase.com](https://supabase.com)
- **OpenAI** (for the smart task creation) - Get an API key at [platform.openai.com](https://platform.openai.com)

### Step 2: Set up your environment
Create a file called `.env.local` in the main folder and add your keys:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Install and run
```bash
# Install the dependencies
npm install

# Start the development server
npm run dev
```

That's it! Open your browser to `http://localhost:3000` and start creating tasks like a wizard.

## Deploy to the world

When you're ready to share this with others (or just want it running 24/7), you can deploy it to Vercel in about 2 minutes. Just connect your GitHub repo and add the same environment variables in the Vercel dashboard.

---

Built with love using React, TypeScript, and a bunch of other awesome tools. The AI features are powered by OpenAI, and your data is safely stored with Supabase. 