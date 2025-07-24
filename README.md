# SimplyTask ✨

Hey there! Welcome to SimplyTask - your new favorite productivity companion that actually understands what you're saying. This isn't just another to-do app; it's like having a personal assistant who gets you and helps you stay organized without the stress.

## What makes this special?

Imagine having a friendly assistant named Donna who not only helps you schedule tasks by just talking to her naturally, but also gives you insights into your productivity, handles conflicts like a pro, and makes sure you're always on top of your game. That's SimplyTask!

## 🌟 **Core Features**

### 💬 **Meet Donna - Your AI Scheduling Assistant**
Just talk to her like you would a friend! Say things like "Hey Donna, schedule a meeting with Sarah at 2 PM tomorrow" or even casual stuff like "I'm feeling overwhelmed with my schedule." She gets it all and responds naturally while helping you stay organized.

### 🧠 **Smart Conflict Detection**
Donna is smart enough to catch when you're trying to be in two places at once. She'll politely let you know about conflicts and help you figure out better times that actually work.

### 📅 **Beautiful Calendar Views**
Switch between daily, weekly, monthly, and yearly views depending on what you need to see. Each view is designed to give you the perfect amount of information without overwhelming you.

### 📊 **AI-Powered Productivity Reports**
Get daily, weekly, and monthly summaries that actually motivate you instead of making you feel guilty. These aren't just numbers - they're insights powered by AI that help you understand your patterns and celebrate your wins.

### 🎨 **Visual Analytics That Make Sense**
Charts, graphs, and progress indicators that show your productivity in ways that are actually useful. See your task completion rates, priority breakdowns, and trends over time.

### 📱 **Works Everywhere**
Whether you're on your phone, tablet, or computer, everything looks and feels just right. The interface adapts to your device so you can stay productive anywhere.

### 🔒 **Your Data, Your Privacy**
Built with Supabase for rock-solid security and your OpenAI interactions happen through secure serverless functions. Your personal information never leaves secure, encrypted environments.

### 🎯 **Smart Categories & Priorities**
Create custom categories that make sense for your life and work. The system learns your patterns and helps suggest the right priority levels for different types of tasks.

## 🚀 **Getting Started Locally**

Want to run this on your own machine? Here's how to get everything set up - don't worry, it's easier than it looks!

### **Step 1: Get Your Free API Keys**

You'll need a couple of free accounts (seriously, they're free):

**Supabase** (for storing your tasks securely)
1. Head to [supabase.com](https://supabase.com) and create an account
2. Create a new project (give it any name you like)
3. Go to Settings → API and grab your:
   - Project URL (starts with `https://`)
   - `anon/public` key (the long string)

**OpenAI** (for Donna's AI magic)
1. Visit [platform.openai.com](https://platform.openai.com) and sign up
2. Go to API Keys section and create a new key
3. Copy that key somewhere safe (you'll need it in a minute)

### **Step 2: Clone and Set Up the Project**

```bash
# Clone the repository
git clone [your-repo-url]
cd to-do

# Install all the dependencies
npm install
```

### **Step 3: Configure Your Environment**

Create a file called `.env.local` in the main project folder and add your keys:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Make sure there are no spaces around the `=` signs, and replace the placeholder text with your actual keys!

### **Step 4: Set Up Your Database**

The database setup is super simple with Supabase:

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase/migrations/20250723155509_golden_cottage.sql`
3. Paste it into the SQL Editor and run it
4. That's it! Your database is ready to go.

### **Step 5: Run the App**

```bash
# Start the development server
npm run dev
```

Open your browser and go to `http://localhost:3000`. You should see SimplyTask ready to help you get organized!

### **Step 6: Test Donna**

Try saying something like:
- "Hey Donna! How are you?"
- "Schedule a meeting with the team at 2 PM today"
- "I'm feeling overwhelmed with my schedule"

She should respond naturally and help you out!

## 🌐 **Deploying to Production**

When you're ready to share this with the world (or just want it running 24/7 for yourself):

### **Deploy to Vercel** (Recommended - it's free!)

1. Push your code to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. **CRITICAL**: Add the same environment variables in your Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy!

Vercel will automatically handle the serverless functions and make Donna work perfectly in production.

## 🛠 **Tech Stack** (For the Curious)

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: OpenAI GPT-4o-mini via Vercel serverless functions / feel free to use any or write me an email I can share a small model I created derived from LLama 3.0 that can run locally on your system.
- **Charts**: Recharts for beautiful data visualization
- **Hosting**: Vercel (frontend + serverless functions)

## 💡 **Tips for the Best Experience**

- **Be Natural**: Talk to Donna like you would a human assistant
- **Try Different Views**: Switch between calendar views to find what works for you
- **Check Your Reports**: The AI summaries are actually motivating and helpful
- **Use Categories**: Create categories that make sense for your workflow
- **Trust the Conflict Detection**: When Donna says there's a conflict, listen to her!

## 🤔 **Need Help?**

If something's not working right, here are the most common fixes:

- **Donna isn't responding**: Check that your `OPENAI_API_KEY` is set correctly
- **Tasks aren't saving**: Verify your Supabase credentials in `.env.local`
- **Charts look weird**: Make sure you ran the database migration
- **Local development issues**: Try running `vercel dev` instead of `npm run dev`

## 🎉 **That's It!**

You now have your own AI-powered productivity assistant running locally. Donna is ready to help you get organized, stay motivated, and actually enjoy managing your tasks.

Remember: this isn't just about getting things done - it's about making the process of staying organized actually pleasant. Enjoy! ✨

---