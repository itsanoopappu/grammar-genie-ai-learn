-- Create grammar_topics table
CREATE TABLE IF NOT EXISTS grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category TEXT NOT NULL,
  difficulty_score INTEGER NOT NULL CHECK (difficulty_score BETWEEN 1 AND 100),
  prerequisites JSONB DEFAULT '[]',
  learning_objectives JSONB DEFAULT '[]',
  common_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES grammar_topics(id),
  type TEXT NOT NULL CHECK (type IN ('fill-blank', 'multiple-choice', 'transformation', 'error-correction', 'sentence-building')),
  content JSONB NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
  estimated_time_seconds INTEGER DEFAULT 60,
  success_rate FLOAT DEFAULT 0.5,
  discrimination_index FLOAT DEFAULT 0.3,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic_id UUID REFERENCES grammar_topics(id),
  session_type TEXT CHECK (session_type IN ('practice', 'assessment', 'review', 'challenge')),
  exercises_attempted INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  difficulty_progression JSONB DEFAULT '[]',
  error_patterns JSONB DEFAULT '{}',
  engagement_score FLOAT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  exercise_id UUID REFERENCES exercises(id),
  session_id UUID REFERENCES practice_sessions(id),
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  hint_used BOOLEAN DEFAULT false,
  error_type TEXT,
  ai_feedback JSONB,
  difficulty_at_attempt INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic_id UUID REFERENCES grammar_topics(id),
  skill_level FLOAT NOT NULL CHECK (skill_level BETWEEN 0 AND 1) DEFAULT 0.5,
  confidence_interval FLOAT DEFAULT 0.2,
  attempts_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  mastery_level TEXT CHECK (mastery_level IN ('novice', 'developing', 'proficient', 'advanced', 'expert')),
  next_review_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  path_type TEXT DEFAULT 'adaptive' CHECK (path_type IN ('adaptive', 'structured', 'review', 'challenge')),
  current_topic_id UUID REFERENCES grammar_topics(id),
  completed_topics JSONB DEFAULT '[]',
  recommended_next_topics JSONB DEFAULT '[]',
  target_level TEXT CHECK (target_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  estimated_completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exercises_topic_difficulty') THEN
        CREATE INDEX idx_exercises_topic_difficulty ON exercises(topic_id, difficulty_level);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_skills_user_topic') THEN
        CREATE INDEX idx_user_skills_user_topic ON user_skills(user_id, topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_practice_sessions_user_topic') THEN
        CREATE INDEX idx_practice_sessions_user_topic ON practice_sessions(user_id, topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exercise_attempts_user_session') THEN
        CREATE INDEX idx_exercise_attempts_user_session ON exercise_attempts(user_id, session_id);
    END IF;
END$$;

-- Add RLS policies
ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Grammar topics are publicly readable" ON grammar_topics;
DROP POLICY IF EXISTS "Exercises are publicly readable" ON exercises;
DROP POLICY IF EXISTS "Users can manage own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their own exercise attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can create their own exercise attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can view their own learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Users can update their own learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Users can create their own learning paths" ON learning_paths;

-- Create new policies
CREATE POLICY "Grammar topics are publicly readable" ON grammar_topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Exercises are publicly readable" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own practice sessions" ON practice_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own exercise attempts" ON exercise_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own exercise attempts" ON exercise_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own skills" ON user_skills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own skills" ON user_skills
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own skills" ON user_skills
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own learning paths" ON learning_paths
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own learning paths" ON learning_paths
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create their own learning paths" ON learning_paths
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_grammar_topics_updated_at ON grammar_topics;
DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths;

-- Create new triggers
CREATE TRIGGER update_grammar_topics_updated_at
    BEFORE UPDATE ON grammar_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();