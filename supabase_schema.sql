-- ==============================================================================
-- CareerPilotAI — Complete Supabase Database Schema
-- Run this SQL in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 5,
  avatar_url TEXT,
  target_career TEXT DEFAULT 'Full Stack Developer',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, plan, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'free',
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  proficiency TEXT DEFAULT 'Intermediate',
  confidence NUMERIC DEFAULT 0.85,
  evidence TEXT,
  source TEXT DEFAULT 'resume',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skills"
  ON public.skills FOR ALL
  USING (auth.uid() = user_id);


-- 3. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
  ON public.resumes FOR ALL
  USING (auth.uid() = user_id);


-- 4. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  total_questions INTEGER DEFAULT 15,
  skills_tested JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = user_id);


-- 5. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quiz_id TEXT REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  skill TEXT,
  difficulty TEXT
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read questions of accessible quizzes"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE public.quizzes.id = public.quiz_questions.quiz_id
      AND public.quizzes.user_id = auth.uid()
    )
  );


-- 6. QUIZ ATTEMPTS & EVALUATION TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quiz_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER DEFAULT 15,
  percentage NUMERIC NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  credits_earned INTEGER DEFAULT 0,
  skill_breakdown JSONB DEFAULT '{}'::jsonb,
  difficulty_breakdown JSONB DEFAULT '{}'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attempts"
  ON public.quiz_attempts FOR ALL
  USING (auth.uid() = user_id);


-- 7. SKILL GAP ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS public.skill_gap_analysis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  current_level TEXT,
  target_level TEXT,
  gap_level TEXT,
  priority TEXT,
  reason TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.skill_gap_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skill gap analysis"
  ON public.skill_gap_analysis FOR ALL
  USING (auth.uid() = user_id);


-- 8. CAREER RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.career_recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  career_name TEXT NOT NULL,
  match_percentage INTEGER NOT NULL,
  reasoning TEXT,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  strong_skills JSONB DEFAULT '[]'::jsonb,
  roadmap JSONB DEFAULT '[]'::jsonb,
  is_primary BOOLEAN DEFAULT false,
  market_demand TEXT DEFAULT 'High',
  avg_salary TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career recommendations"
  ON public.career_recommendations FOR ALL
  USING (auth.uid() = user_id);


-- 9. LEARNING OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS public.learning_outcomes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  career_name TEXT,
  objective TEXT NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  expected_skill_level TEXT,
  practical_task TEXT,
  project_idea TEXT,
  expected_outcome TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning outcomes"
  ON public.learning_outcomes FOR ALL
  USING (auth.uid() = user_id);


-- 10. CREDIT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  feature TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.uid() = user_id);


-- 11. USER FEATURE USAGE & UNLOCKS
CREATE TABLE IF NOT EXISTS public.user_feature_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_id TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feature unlocks"
  ON public.user_feature_usage FOR ALL
  USING (auth.uid() = user_id);
