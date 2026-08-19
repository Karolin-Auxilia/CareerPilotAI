import { supabase, isConfigured } from './client';
import {
  SkillItem,
  ResumeItem,
  Quiz,
  QuizAttempt,
  SkillGapItem,
  CareerRecommendation,
  LearningOutcome,
  CreditTransaction,
  TransactionType,
  UserProfile,
} from '../../types';

// Helper for local storage keying
const getKey = (prefix: string, userId: string) => `cp_${prefix}_${userId}`;

// ----------------------------------------------------
// RESUME OPERATIONS
// ----------------------------------------------------
export async function saveResume(userId: string, resume: Omit<ResumeItem, 'id' | 'user_id' | 'created_at'>): Promise<ResumeItem> {
  const newResume: ResumeItem = {
    id: 'res_' + Date.now(),
    user_id: userId,
    file_name: resume.file_name,
    file_url: resume.file_url,
    file_size: resume.file_size,
    extracted_text: resume.extracted_text,
    created_at: new Date().toISOString(),
  };

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert([newResume])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase saveResume fallback to local storage', e);
    }
  }

  localStorage.setItem(getKey('latest_resume', userId), JSON.stringify(newResume));
  return newResume;
}

export async function getLatestResume(userId: string): Promise<ResumeItem | null> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('latest_resume', userId));
  return local ? JSON.parse(local) : null;
}

// ----------------------------------------------------
// SKILLS OPERATIONS
// ----------------------------------------------------
export async function saveSkills(userId: string, skills: Omit<SkillItem, 'id' | 'user_id' | 'created_at'>[], source: 'resume' | 'manual' | 'assessment'): Promise<SkillItem[]> {
  const items: SkillItem[] = skills.map((s, idx) => ({
    id: 'sk_' + Date.now() + '_' + idx,
    user_id: userId,
    skill_name: s.skill_name,
    category: s.category || 'General',
    proficiency: s.proficiency || 'Intermediate',
    confidence: s.confidence || 0.85,
    evidence: s.evidence || 'User provided',
    source: source,
    created_at: new Date().toISOString(),
  }));

  if (isConfigured && supabase) {
    try {
      // Clear old skills from this source or upsert
      await supabase.from('skills').delete().eq('user_id', userId).eq('source', source);
      const { data } = await supabase.from('skills').insert(items).select();
      if (data) return data;
    } catch (e) {
      console.warn('Supabase saveSkills fallback to local storage', e);
    }
  }

  // Local storage: merge with other sources
  const existingStr = localStorage.getItem(getKey('skills', userId));
  const existing: SkillItem[] = existingStr ? JSON.parse(existingStr) : [];
  const filtered = existing.filter((item) => item.source !== source);
  const updated = [...filtered, ...items];

  localStorage.setItem(getKey('skills', userId), JSON.stringify(updated));
  return updated;
}

export async function getSkills(userId: string): Promise<SkillItem[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true });
      if (data && data.length > 0) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('skills', userId));
  return local ? JSON.parse(local) : [];
}

export async function deleteSkill(userId: string, skillId: string): Promise<boolean> {
  if (isConfigured && supabase) {
    try {
      await supabase.from('skills').delete().eq('id', skillId).eq('user_id', userId);
    } catch {}
  }

  const existingStr = localStorage.getItem(getKey('skills', userId));
  if (existingStr) {
    const existing: SkillItem[] = JSON.parse(existingStr);
    const updated = existing.filter((s) => s.id !== skillId);
    localStorage.setItem(getKey('skills', userId), JSON.stringify(updated));
  }
  return true;
}

// ----------------------------------------------------
// QUIZ OPERATIONS
// ----------------------------------------------------
export async function saveQuiz(userId: string, quiz: Omit<Quiz, 'id' | 'user_id' | 'created_at'>): Promise<Quiz> {
  const newQuiz: Quiz = {
    ...quiz,
    id: 'qz_' + Date.now(),
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  if (isConfigured && supabase) {
    try {
      const { data: quizData } = await supabase
        .from('quizzes')
        .insert([{
          id: newQuiz.id,
          user_id: userId,
          title: newQuiz.title,
          total_questions: newQuiz.total_questions,
          skills_tested: newQuiz.skills_tested,
          status: newQuiz.status,
        }])
        .select()
        .single();

      if (quizData) {
        const questionsPayload = newQuiz.questions.map((q, idx) => ({
          id: 'qq_' + Date.now() + '_' + idx,
          quiz_id: newQuiz.id,
          question_number: q.question_number,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          skill: q.skill,
          difficulty: q.difficulty,
        }));
        await supabase.from('quiz_questions').insert(questionsPayload);
        return newQuiz;
      }
    } catch (e) {
      console.warn('Supabase saveQuiz fallback', e);
    }
  }

  // Local storage
  localStorage.setItem(getKey('active_quiz', userId), JSON.stringify(newQuiz));
  const quizzesListStr = localStorage.getItem(getKey('quizzes_list', userId));
  const quizzesList: Quiz[] = quizzesListStr ? JSON.parse(quizzesListStr) : [];
  quizzesList.unshift(newQuiz);
  localStorage.setItem(getKey('quizzes_list', userId), JSON.stringify(quizzesList));

  return newQuiz;
}

export async function getQuiz(userId: string, quizId?: string): Promise<Quiz | null> {
  if (isConfigured && supabase && quizId) {
    try {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', userId)
        .single();

      if (quizData) {
        const { data: qData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_number', { ascending: true });

        return {
          ...quizData,
          questions: qData || [],
        };
      }
    } catch {}
  }

  if (quizId) {
    const listStr = localStorage.getItem(getKey('quizzes_list', userId));
    if (listStr) {
      const list: Quiz[] = JSON.parse(listStr);
      const found = list.find((q) => q.id === quizId);
      if (found) return found;
    }
  }

  const activeStr = localStorage.getItem(getKey('active_quiz', userId));
  return activeStr ? JSON.parse(activeStr) : null;
}

// ----------------------------------------------------
// QUIZ ATTEMPTS & EVALUATION
// ----------------------------------------------------
export async function saveQuizAttempt(
  userId: string,
  attempt: Partial<QuizAttempt> & { score: number; percentage: number },
  userAnswers?: Record<string, string>
): Promise<QuizAttempt> {
  const newAttempt: QuizAttempt = {
    id: attempt.id || 'att_' + Date.now(),
    quiz_id: attempt.quiz_id || 'quiz_' + Date.now(),
    user_id: userId,
    score: attempt.score,
    total_questions: attempt.total_questions || 15,
    percentage: attempt.percentage,
    correct_answers: attempt.correct_answers || attempt.score,
    incorrect_answers: attempt.incorrect_answers || (15 - attempt.score),
    credits_earned: attempt.credits_earned || 0,
    skill_breakdown: attempt.skill_breakdown || {},
    difficulty_breakdown: attempt.difficulty_breakdown || {},
    answers: attempt.answers || [],
    strengths: attempt.strengths || [],
    weaknesses: attempt.weaknesses || [],
    user_answers: userAnswers || attempt.user_answers || {},
    completed_at: attempt.completed_at || new Date().toISOString(),
    created_at: attempt.created_at || new Date().toISOString(),
  };

  if (isConfigured && supabase) {
    try {
      await supabase.from('quiz_attempts').insert([{
        id: newAttempt.id,
        quiz_id: newAttempt.quiz_id,
        user_id: userId,
        score: newAttempt.score,
        percentage: newAttempt.percentage,
        correct_answers: newAttempt.correct_answers,
        incorrect_answers: newAttempt.incorrect_answers,
        credits_earned: newAttempt.credits_earned,
        skill_breakdown: newAttempt.skill_breakdown,
        difficulty_breakdown: newAttempt.difficulty_breakdown,
      }]);
    } catch (e) {
      console.warn('Supabase saveAttempt fallback', e);
    }
  }

  localStorage.setItem(getKey('latest_attempt', userId), JSON.stringify(newAttempt));
  const attemptsStr = localStorage.getItem(getKey('all_attempts', userId));
  const attempts: QuizAttempt[] = attemptsStr ? JSON.parse(attemptsStr) : [];
  attempts.unshift(newAttempt);
  localStorage.setItem(getKey('all_attempts', userId), JSON.stringify(attempts));

  return newAttempt;
}

export async function getLatestQuizAttempt(userId: string): Promise<QuizAttempt | null> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      if (data) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('latest_attempt', userId));
  return local ? JSON.parse(local) : null;
}

export async function getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      if (data) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('all_attempts', userId));
  return local ? JSON.parse(local) : [];
}

// ----------------------------------------------------
// SKILL GAP ANALYSIS
// ----------------------------------------------------
export async function saveSkillGaps(userId: string, gaps: Omit<SkillGapItem, 'id' | 'user_id' | 'created_at'>[]): Promise<SkillGapItem[]> {
  const items: SkillGapItem[] = gaps.map((g, idx) => ({
    id: 'gap_' + Date.now() + '_' + idx,
    user_id: userId,
    skill_name: g.skill_name,
    current_level: g.current_level,
    target_level: g.target_level,
    gap_level: g.gap_level,
    priority: g.priority,
    reason: g.reason,
    recommendation: g.recommendation,
    created_at: new Date().toISOString(),
  }));

  if (isConfigured && supabase) {
    try {
      await supabase.from('skill_gap_analysis').delete().eq('user_id', userId);
      const { data } = await supabase.from('skill_gap_analysis').insert(items).select();
      if (data) return data;
    } catch (e) {
      console.warn('Supabase saveSkillGaps fallback', e);
    }
  }

  localStorage.setItem(getKey('skill_gaps', userId), JSON.stringify(items));
  return items;
}

export async function getSkillGaps(userId: string): Promise<SkillGapItem[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('skill_gap_analysis')
        .select('*')
        .eq('user_id', userId);
      if (data && data.length > 0) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('skill_gaps', userId));
  return local ? JSON.parse(local) : [];
}

// ----------------------------------------------------
// CAREER RECOMMENDATIONS
// ----------------------------------------------------
export async function saveCareerRecommendations(userId: string, careers: Omit<CareerRecommendation, 'id' | 'user_id' | 'created_at'>[]): Promise<CareerRecommendation[]> {
  const items: CareerRecommendation[] = careers.map((c, idx) => ({
    id: 'car_' + Date.now() + '_' + idx,
    user_id: userId,
    career_name: c.career_name,
    match_percentage: c.match_percentage,
    reasoning: c.reasoning,
    missing_skills: c.missing_skills || [],
    strong_skills: c.strong_skills || [],
    roadmap: c.roadmap || [],
    is_primary: idx === 0,
    market_demand: c.market_demand || 'High',
    avg_salary: c.avg_salary || '$95,000 - $135,000',
    created_at: new Date().toISOString(),
  }));

  if (isConfigured && supabase) {
    try {
      await supabase.from('career_recommendations').delete().eq('user_id', userId);
      const { data } = await supabase.from('career_recommendations').insert(items).select();
      if (data) return data;
    } catch (e) {
      console.warn('Supabase saveCareerRecommendations fallback', e);
    }
  }

  localStorage.setItem(getKey('career_recs', userId), JSON.stringify(items));
  return items;
}

export async function getCareerRecommendations(userId: string): Promise<CareerRecommendation[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('career_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('match_percentage', { ascending: false });
      if (data && data.length > 0) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('career_recs', userId));
  return local ? JSON.parse(local) : [];
}

// ----------------------------------------------------
// LEARNING OUTCOMES
// ----------------------------------------------------
export async function saveLearningOutcomes(userId: string, outcomes: Omit<LearningOutcome, 'id' | 'user_id' | 'created_at'>[]): Promise<LearningOutcome[]> {
  const items: LearningOutcome[] = outcomes.map((o, idx) => ({
    id: 'lo_' + Date.now() + '_' + idx,
    user_id: userId,
    career_name: o.career_name,
    objective: o.objective,
    topics: o.topics || [],
    expected_skill_level: o.expected_skill_level,
    practical_task: o.practical_task,
    project_idea: o.project_idea,
    expected_outcome: o.expected_outcome,
    is_completed: false,
    created_at: new Date().toISOString(),
  }));

  if (isConfigured && supabase) {
    try {
      await supabase.from('learning_outcomes').delete().eq('user_id', userId);
      const { data } = await supabase.from('learning_outcomes').insert(items).select();
      if (data) return data;
    } catch (e) {
      console.warn('Supabase saveLearningOutcomes fallback', e);
    }
  }

  localStorage.setItem(getKey('learning_outcomes', userId), JSON.stringify(items));
  return items;
}

export async function getLearningOutcomes(userId: string): Promise<LearningOutcome[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('learning_outcomes')
        .select('*')
        .eq('user_id', userId);
      if (data && data.length > 0) return data;
    } catch {}
  }

  const local = localStorage.getItem(getKey('learning_outcomes', userId));
  return local ? JSON.parse(local) : [];
}

export async function toggleLearningOutcome(userId: string, outcomeId: string, isCompleted: boolean): Promise<boolean> {
  if (isConfigured && supabase) {
    try {
      await supabase
        .from('learning_outcomes')
        .update({ is_completed: isCompleted })
        .eq('id', outcomeId)
        .eq('user_id', userId);
    } catch {}
  }

  const localStr = localStorage.getItem(getKey('learning_outcomes', userId));
  if (localStr) {
    const list: LearningOutcome[] = JSON.parse(localStr);
    const item = list.find((i) => i.id === outcomeId);
    if (item) {
      item.is_completed = isCompleted;
      localStorage.setItem(getKey('learning_outcomes', userId), JSON.stringify(list));
    }
  }
  return true;
}

export const toggleLearningOutcomeCompletion = toggleLearningOutcome;

// ----------------------------------------------------
// CREDITS & TRANSACTIONS
// ----------------------------------------------------
export async function getUserUnlockedFeatures(userId: string): Promise<string[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('user_feature_usage')
        .select('feature_id')
        .eq('user_id', userId);
      if (data && data.length > 0) return data.map((d: any) => d.feature_id);
    } catch {}
  }

  const unlocksStr = localStorage.getItem(getKey('unlocked_features', userId));
  return unlocksStr ? JSON.parse(unlocksStr) : [];
}
export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    } catch {}
  }

  const local = localStorage.getItem('careerpilot_credit_txs_' + userId);
  return local ? JSON.parse(local) : [];
}

export async function addCreditTransaction(
  userId: string,
  type: TransactionType,
  amount: number,
  feature: string,
  description: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  // Get current profile
  let currentCredits = 5;

  if (isConfigured && supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      if (profile) currentCredits = profile.credits;
    } catch {}
  } else {
    const profiles = JSON.parse(localStorage.getItem('careerpilot_profiles') || '{}');
    if (profiles[userId]) currentCredits = profiles[userId].credits ?? 5;
  }

  // Calculate new balance
  let delta = amount;
  if (type === 'SPENT') {
    delta = -Math.abs(amount);
    if (currentCredits + delta < 0) {
      return { success: false, newBalance: currentCredits, error: 'Insufficient credits' };
    }
  } else {
    delta = Math.abs(amount);
  }

  const newBalance = Math.max(0, currentCredits + delta);

  const tx: CreditTransaction = {
    id: 'tx_' + Date.now(),
    user_id: userId,
    transaction_type: type,
    amount: Math.abs(amount),
    feature,
    description,
    created_at: new Date().toISOString(),
  };

  // Persist transaction & updated credits
  if (isConfigured && supabase) {
    try {
      await supabase.from('credit_transactions').insert([tx]);
      await supabase.from('profiles').update({ credits: newBalance }).eq('id', userId);
    } catch (e) {
      console.warn('Supabase credit transaction error', e);
    }
  }

  // Local storage update
  const storedProfiles = JSON.parse(localStorage.getItem('careerpilot_profiles') || '{}');
  if (storedProfiles[userId]) {
    storedProfiles[userId].credits = newBalance;
    localStorage.setItem('careerpilot_profiles', JSON.stringify(storedProfiles));
  }

  const txListStr = localStorage.getItem('careerpilot_credit_txs_' + userId);
  const txList: CreditTransaction[] = txListStr ? JSON.parse(txListStr) : [];
  txList.unshift(tx);
  localStorage.setItem('careerpilot_credit_txs_' + userId, JSON.stringify(txList));

  return { success: true, newBalance };
}

// ----------------------------------------------------
// FEATURE UNLOCK & USAGE TRACKING
// ----------------------------------------------------
export async function isFeatureUnlocked(userId: string, featureId: string, userPlan: string): Promise<boolean> {
  // If user is on premium plan, everything is unlocked
  if (userPlan === 'premium' || userPlan === 'pro') return true;

  if (isConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('user_feature_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_id', featureId);
      if (data && data.length > 0) return true;
    } catch {}
  }

  const unlocksStr = localStorage.getItem(getKey('unlocked_features', userId));
  const unlocks: string[] = unlocksStr ? JSON.parse(unlocksStr) : [];
  return unlocks.includes(featureId);
}

export async function unlockFeatureWithCredits(
  userId: string,
  featureId: string,
  featureName: string,
  creditCost: number
): Promise<{ success: boolean; error?: string }> {
  // Deduct credits atomically
  const result = await addCreditTransaction(
    userId,
    'SPENT',
    creditCost,
    featureId,
    `Unlocked ${featureName}`
  );

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to deduct credits' };
  }

  // Save feature usage
  if (isConfigured && supabase) {
    try {
      await supabase.from('user_feature_usage').insert([{
        user_id: userId,
        feature_id: featureId,
        credits_used: creditCost,
      }]);
    } catch {}
  }

  const unlocksStr = localStorage.getItem(getKey('unlocked_features', userId));
  const unlocks: string[] = unlocksStr ? JSON.parse(unlocksStr) : [];
  if (!unlocks.includes(featureId)) {
    unlocks.push(featureId);
    localStorage.setItem(getKey('unlocked_features', userId), JSON.stringify(unlocks));
  }

  return { success: true };
}
