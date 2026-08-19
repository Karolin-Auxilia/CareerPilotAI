-- CareerPilotAI Database Schema & Row Level Security (RLS)
-- Supabase PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
    credits INTEGER NOT NULL DEFAULT 5 CHECK (credits >= 0),
    avatar_url TEXT,
    target_career TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    proficiency TEXT NOT NULL DEFAULT 'Beginner' CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    confidence NUMERIC(4,2) DEFAULT 0.85,
    evidence TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('resume', 'manual', 'assessment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 15,
    skills_tested TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. QUIZ_QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 strings e.g. ["A", "B", "C", "D"]
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    skill TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
);

-- 6. QUIZ_ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    credits_earned INTEGER NOT NULL DEFAULT 0,
    skill_breakdown JSONB DEFAULT '{}'::jsonb,
    difficulty_breakdown JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. QUIZ_ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL
);

-- 8. SKILL_GAP_ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS public.skill_gap_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    current_level TEXT NOT NULL,
    target_level TEXT NOT NULL,
    gap_level TEXT NOT NULL CHECK (gap_level IN ('Critical', 'High', 'Moderate', 'Low', 'None')),
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    reason TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. CAREER_RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.career_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    career_name TEXT NOT NULL,
    match_percentage NUMERIC(5,2) NOT NULL,
    reasoning TEXT NOT NULL,
    missing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    strong_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    roadmap JSONB DEFAULT '[]'::jsonb,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. LEARNING_OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS public.learning_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    career_name TEXT NOT NULL,
    objective TEXT NOT NULL,
    topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    expected_skill_level TEXT NOT NULL,
    practical_task TEXT NOT NULL,
    project_idea TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. CREDIT_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARNED', 'SPENT', 'BONUS', 'REFUND')),
    amount INTEGER NOT NULL,
    feature TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. PREMIUM_FEATURES TABLE
CREATE TABLE IF NOT EXISTS public.premium_features (
    id TEXT PRIMARY KEY,
    feature_name TEXT NOT NULL,
    credit_cost INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    description TEXT NOT NULL
);

-- 13. USER_FEATURE_USAGE TABLE
CREATE TABLE IF NOT EXISTS public.user_feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature_id TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'premium',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    payment_provider TEXT NOT NULL DEFAULT 'stripe',
    external_subscription_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEED PREMIUM FEATURES
INSERT INTO public.premium_features (id, feature_name, credit_cost, enabled, description)
VALUES 
    ('advanced_skill_gap', 'Advanced Skill Gap Deep Dive', 2, true, 'Detailed multi-dimension gap analysis and prioritized action plan'),
    ('advanced_career_analysis', 'Multiple Career Paths & Comparison', 3, true, 'Unlock 5+ career pathways and deep comparison matrix'),
    ('detailed_learning_outcomes', 'Detailed Personalized Learning Roadmap', 2, true, 'Full syllabus, weekly project deliverables, and portfolio specs'),
    ('career_comparison', 'Career Comparison Matrix', 2, true, 'Side-by-side market salary, timeline, and prerequisite comparison'),
    ('additional_assessment', 'Advanced Skill Assessment (15 Questions)', 3, true, 'Generate custom deep-dive assessment for specialized topics')
ON CONFLICT (id) DO NOTHING;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Resumes RLS
CREATE POLICY "Users can access own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- 3. Skills RLS
CREATE POLICY "Users can access own skills" ON public.skills FOR ALL USING (auth.uid() = user_id);

-- 4. Quizzes RLS
CREATE POLICY "Users can access own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);

-- 5. Quiz Questions RLS (via quiz_id ownership)
CREATE POLICY "Users can view own quiz questions" ON public.quiz_questions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quizzes WHERE public.quizzes.id = quiz_questions.quiz_id AND public.quizzes.user_id = auth.uid()));

-- 6. Quiz Attempts RLS
CREATE POLICY "Users can access own quiz attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- 7. Quiz Answers RLS
CREATE POLICY "Users can access own quiz answers" ON public.quiz_answers FOR ALL 
USING (EXISTS (SELECT 1 FROM public.quiz_attempts WHERE public.quiz_attempts.id = quiz_answers.attempt_id AND public.quiz_attempts.user_id = auth.uid()));

-- 8. Skill Gap Analysis RLS
CREATE POLICY "Users can access own skill gaps" ON public.skill_gap_analysis FOR ALL USING (auth.uid() = user_id);

-- 9. Career Recommendations RLS
CREATE POLICY "Users can access own career recommendations" ON public.career_recommendations FOR ALL USING (auth.uid() = user_id);

-- 10. Learning Outcomes RLS
CREATE POLICY "Users can access own learning outcomes" ON public.learning_outcomes FOR ALL USING (auth.uid() = user_id);

-- 11. Credit Transactions RLS
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Premium Features RLS (Public read for all authenticated users)
CREATE POLICY "Anyone can view premium feature catalog" ON public.premium_features FOR SELECT USING (true);

-- 13. User Feature Usage RLS
CREATE POLICY "Users can view own feature usage" ON public.user_feature_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log own feature usage" ON public.user_feature_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 14. Subscriptions RLS
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Trigger for auto-profile creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, plan, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Career Pilot User'),
    NEW.email,
    'free',
    5
  );
  
  -- Record initial welcome credits transaction
  INSERT INTO public.credit_transactions (user_id, transaction_type, amount, feature, description)
  VALUES (
    NEW.id,
    'BONUS',
    5,
    'welcome_bonus',
    'Welcome bonus credits for joining CareerPilotAI'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
