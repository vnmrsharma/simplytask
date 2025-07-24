/*
  # Initial Schema for TaskFlow Pro

  1. New Tables
    - `custom_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, unique per user)
      - `color` (text, hex color code)
      - `created_at` (timestamp)
    - `tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `category` (text, references predefined or custom categories)
      - `custom_category_id` (uuid, foreign key to custom_categories, nullable)
      - `department` (text, nullable)
      - `estimated_hours` (numeric, default 1)
      - `actual_hours` (numeric, nullable)
      - `notes` (text, default '')
      - `start_date` (date)
      - `start_time` (time)
      - `end_date` (date)
      - `end_time` (time)
      - `priority` (text, check constraint)
      - `completed` (boolean, default false)
      - `completed_at` (timestamp, nullable)
      - `is_overdue` (boolean, default false)
      - `is_recurring` (boolean, default false)
      - `parent_task_id` (uuid, foreign key to tasks, nullable)
      - `delegated_to` (text, nullable)
      - `approval_required` (boolean, default false)
      - `budget_impact` (text, default 'none')
      - `risk_level` (text, default 'low')
      - `created_at` (timestamp)
    - `task_stakeholders`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `stakeholder_name` (text)
      - `created_at` (timestamp)
    - `task_links`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `url` (text)
      - `title` (text)
      - `created_at` (timestamp)
    - `task_recurrence`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `recurrence_type` (text, check constraint)
      - `interval_value` (integer, default 1)
      - `days_of_week` (integer[], nullable)
      - `end_date` (date, nullable)
      - `max_occurrences` (integer, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access their own tasks and categories
*/

-- Custom Categories Table
CREATE TABLE IF NOT EXISTS custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON custom_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'operational',
  custom_category_id uuid REFERENCES custom_categories(id) ON DELETE SET NULL,
  department text,
  estimated_hours numeric DEFAULT 1,
  actual_hours numeric,
  notes text DEFAULT '',
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_date date NOT NULL,
  end_time time NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  is_overdue boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  delegated_to text,
  approval_required boolean DEFAULT false,
  budget_impact text DEFAULT 'none' CHECK (budget_impact IN ('none', 'low', 'medium', 'high')),
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Task Stakeholders Table
CREATE TABLE IF NOT EXISTS task_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  stakeholder_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage stakeholders for their tasks"
  ON task_stakeholders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_stakeholders.task_id 
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_stakeholders.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Task Links Table
CREATE TABLE IF NOT EXISTS task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage links for their tasks"
  ON task_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_links.task_id 
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_links.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Task Recurrence Table
CREATE TABLE IF NOT EXISTS task_recurrence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  recurrence_type text NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'custom')),
  interval_value integer DEFAULT 1,
  days_of_week integer[],
  end_date date,
  max_occurrences integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_recurrence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage recurrence for their tasks"
  ON task_recurrence
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_recurrence.task_id 
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_recurrence.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_custom_categories_user_id ON custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_task_stakeholders_task_id ON task_stakeholders(task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrence_task_id ON task_recurrence(task_id);