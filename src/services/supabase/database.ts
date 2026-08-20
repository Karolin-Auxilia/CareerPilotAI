import { supabase, isConfigured } from './client';
import { CareerRecommendation, CreditTransaction, LearningOutcome, Quiz, QuizAttempt, ResumeItem, SkillGapItem, SkillItem, TransactionType } from '../../types';

function db() {
  if (!isConfigured || !supabase) throw new Error('Supabase is required for application data.');
  return supabase;
}

function newId() {
  return crypto.randomUUID();
}

function uuidOrNewId(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : newId();
}

async function replaceRows<T extends { id: string; user_id: string }>(table: string, userId: string, rows: T[]): Promise<T[]> {
  const client = db();
  const removed = await client.from(table).delete().eq('user_id', userId);
  if (removed.error) throw removed.error;
  if (!rows.length) return [];
  const inserted = await client.from(table).insert(rows).select();
  if (inserted.error) throw inserted.error;
  return inserted.data || [];
}

export async function saveResume(userId: string, resume: Omit<ResumeItem, 'id' | 'user_id' | 'created_at'>): Promise<ResumeItem> {
  const row = { ...resume, id: newId(), user_id: userId, created_at: new Date().toISOString() };
  const result = await db().from('resumes').insert([row]).select().single();
  if (result.error) throw result.error;
  return result.data;
}

export async function getLatestResume(userId: string): Promise<ResumeItem | null> {
  const result = await db().from('resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function saveSkills(userId: string, skills: Omit<SkillItem, 'id' | 'user_id' | 'created_at'>[], source: 'resume' | 'manual' | 'assessment'): Promise<SkillItem[]> {
  const rows = skills.map((skill) => ({ ...skill, id: newId(), user_id: userId, source, created_at: new Date().toISOString() }));
  const client = db();
  const removed = await client.from('skills').delete().eq('user_id', userId).eq('source', source);
  if (removed.error) throw removed.error;
  if (!rows.length) return [];
  const result = await client.from('skills').insert(rows).select();
  if (result.error) throw result.error;
  return result.data || [];
}

export async function getSkills(userId: string): Promise<SkillItem[]> {
  const result = await db().from('skills').select('*').eq('user_id', userId).order('category', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

export async function deleteSkill(userId: string, skillId: string): Promise<boolean> {
  const result = await db().from('skills').delete().eq('id', skillId).eq('user_id', userId);
  if (result.error) throw result.error;
  return true;
}

export async function saveQuiz(userId: string, quiz: Omit<Quiz, 'id' | 'user_id' | 'created_at'>): Promise<Quiz> {
  const client = db();
  const item: Quiz = { ...quiz, id: newId(), user_id: userId, created_at: new Date().toISOString() };
  const quizResult = await client.from('quizzes').insert([{ id: item.id, user_id: userId, title: item.title, total_questions: item.total_questions, skills_tested: item.skills_tested, status: item.status }]).select().single();
  if (quizResult.error) throw quizResult.error;
  const questions = item.questions.map((question) => ({ ...question, id: newId(), quiz_id: item.id }));
  if (questions.length) {
    const questionResult = await client.from('quiz_questions').insert(questions);
    if (questionResult.error) throw questionResult.error;
  }
  return { ...item, ...quizResult.data, questions };
}

export async function getQuiz(userId: string, quizId?: string): Promise<Quiz | null> {
  if (!quizId) return null;
  const client = db();
  const quizResult = await client.from('quizzes').select('*').eq('id', quizId).eq('user_id', userId).maybeSingle();
  if (quizResult.error) throw quizResult.error;
  if (!quizResult.data) return null;
  const questions = await client.from('quiz_questions').select('*').eq('quiz_id', quizId).order('question_number', { ascending: true });
  if (questions.error) throw questions.error;
  return { ...quizResult.data, questions: questions.data || [] };
}

export async function saveQuizAttempt(userId: string, attempt: Partial<QuizAttempt> & { score: number; percentage: number }, userAnswers?: Record<string, string>): Promise<QuizAttempt> {
  const item: QuizAttempt = { id: uuidOrNewId(attempt.id), quiz_id: attempt.quiz_id || '', user_id: userId, score: attempt.score, total_questions: attempt.total_questions || 15, percentage: attempt.percentage, correct_answers: attempt.correct_answers || attempt.score, incorrect_answers: attempt.incorrect_answers || (15 - attempt.score), credits_earned: attempt.credits_earned || 0, skill_breakdown: attempt.skill_breakdown || {}, difficulty_breakdown: attempt.difficulty_breakdown || {}, answers: attempt.answers || [], strengths: attempt.strengths || [], weaknesses: attempt.weaknesses || [], user_answers: userAnswers || attempt.user_answers || {}, completed_at: attempt.completed_at || new Date().toISOString(), created_at: attempt.created_at || new Date().toISOString() };
  const result = await db().from('quiz_attempts').insert([{
    id: item.id,
    quiz_id: item.quiz_id,
    user_id: item.user_id,
    score: item.score,
    total_questions: item.total_questions,
    percentage: item.percentage,
    correct_answers: item.correct_answers,
    incorrect_answers: item.incorrect_answers,
    credits_earned: item.credits_earned,
    skill_breakdown: item.skill_breakdown,
    difficulty_breakdown: item.difficulty_breakdown,
    completed_at: item.completed_at,
  }]).select().single();
  if (result.error) throw result.error;
  return result.data || item;
}

export async function getLatestQuizAttempt(userId: string): Promise<QuizAttempt | null> {
  const result = await db().from('quiz_attempts').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const result = await db().from('quiz_attempts').select('*').eq('user_id', userId).order('completed_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

export async function saveSkillGaps(userId: string, gaps: Omit<SkillGapItem, 'id' | 'user_id' | 'created_at'>[]): Promise<SkillGapItem[]> {
  return replaceRows('skill_gap_analysis', userId, gaps.map((gap) => ({ ...gap, id: newId(), user_id: userId, created_at: new Date().toISOString() })));
}

export async function getSkillGaps(userId: string): Promise<SkillGapItem[]> {
  const result = await db().from('skill_gap_analysis').select('*').eq('user_id', userId);
  if (result.error) throw result.error;
  return result.data || [];
}

export async function saveCareerRecommendations(userId: string, careers: Omit<CareerRecommendation, 'id' | 'user_id' | 'created_at'>[]): Promise<CareerRecommendation[]> {
  return replaceRows('career_recommendations', userId, careers.map((career, index) => ({ ...career, id: newId(), user_id: userId, is_primary: index === 0, created_at: new Date().toISOString() })));
}

export async function getCareerRecommendations(userId: string): Promise<CareerRecommendation[]> {
  const result = await db().from('career_recommendations').select('*').eq('user_id', userId).order('match_percentage', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

function sanitizeSavedLearningOutcomes(items: Omit<LearningOutcome, 'id' | 'user_id' | 'created_at'>[]): Omit<LearningOutcome, 'id' | 'user_id' | 'created_at'>[] {
  const blockedPatterns = ['master modern javascript', 'javascript (es6+)', 'modern javascript', 'full stack developer'];
  return items.filter((item) => {
    const objective = (item.objective || '').trim().toLowerCase();
    const normalized = objective.replace(/[^a-z0-9\s+]/g, ' ').replace(/\s+/g, ' ').trim();
    return !blockedPatterns.some((pattern) => normalized.includes(pattern));
  });
}

export async function saveLearningOutcomes(userId: string, outcomes: Omit<LearningOutcome, 'id' | 'user_id' | 'created_at'>[]): Promise<LearningOutcome[]> {
  const cleaned = sanitizeSavedLearningOutcomes(outcomes);
  return replaceRows('learning_outcomes', userId, cleaned.map((outcome) => ({ ...outcome, id: newId(), user_id: userId, created_at: new Date().toISOString() })));
}

export async function getLearningOutcomes(userId: string): Promise<LearningOutcome[]> {
  const result = await db().from('learning_outcomes').select('*').eq('user_id', userId);
  if (result.error) throw result.error;
  return (result.data || []).filter((item) => {
    const objective = (item.objective || '').trim().toLowerCase();
    const normalized = objective.replace(/[^a-z0-9\s+]/g, ' ').replace(/\s+/g, ' ').trim();
    return !['master modern javascript', 'javascript (es6+)', 'modern javascript', 'full stack developer'].some((pattern) => normalized.includes(pattern));
  });
}

export async function toggleLearningOutcome(userId: string, outcomeId: string, isCompleted: boolean): Promise<boolean> {
  const result = await db().from('learning_outcomes').update({ is_completed: isCompleted }).eq('id', outcomeId).eq('user_id', userId);
  if (result.error) throw result.error;
  return true;
}

export const toggleLearningOutcomeCompletion = toggleLearningOutcome;

export async function getUserUnlockedFeatures(userId: string): Promise<string[]> {
  const result = await db().from('user_feature_usage').select('feature_id').eq('user_id', userId);
  if (result.error) throw result.error;
  return [...new Set((result.data || []).map((row: { feature_id: string }) => row.feature_id))];
}

export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  const result = await db().from('credit_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

export async function addCreditTransaction(userId: string, type: TransactionType, amount: number, feature: string, description: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const client = db();
  const profile = await client.from('profiles').select('credits').eq('id', userId).single();
  if (profile.error) throw profile.error;
  const delta = type === 'SPENT' ? -Math.abs(amount) : Math.abs(amount);
  const newBalance = profile.data.credits + delta;
  if (newBalance < 0) return { success: false, newBalance: profile.data.credits, error: 'Insufficient credits' };
  const transaction = await client.from('credit_transactions').insert([{ id: newId(), user_id: userId, transaction_type: type, amount: Math.abs(amount), feature, description }]);
  if (transaction.error) throw transaction.error;
  const update = await client.from('profiles').update({ credits: newBalance }).eq('id', userId);
  if (update.error) throw update.error;
  return { success: true, newBalance };
}

export async function isFeatureUnlocked(userId: string, featureId: string, userPlan: string): Promise<boolean> {
  if (userPlan === 'premium' || userPlan === 'pro') return true;
  const result = await db().from('user_feature_usage').select('id').eq('user_id', userId).eq('feature_id', featureId).limit(1);
  if (result.error) throw result.error;
  return Boolean(result.data?.length);
}

export async function unlockFeatureWithCredits(userId: string, featureId: string, featureName: string, creditCost: number): Promise<{ success: boolean; error?: string }> {
  const result = await addCreditTransaction(userId, 'SPENT', creditCost, featureId, `Unlocked ${featureName}`);
  if (!result.success) return { success: false, error: result.error || 'Failed to deduct credits' };
  const usage = await db().from('user_feature_usage').insert([{ user_id: userId, feature_id: featureId, credits_used: creditCost }]);
  if (usage.error) throw usage.error;
  return { success: true };
}

export async function saveQuizProgress(userId: string, quizId: string, answers: Record<number, string>, currentIndex: number): Promise<void> {
  const result = await db().from('quiz_progress').upsert({ user_id: userId, quiz_id: quizId, answers, current_index: currentIndex, updated_at: new Date().toISOString() }, { onConflict: 'user_id,quiz_id' });
  if (result.error) throw result.error;
}

export async function getQuizProgress(userId: string, quizId: string): Promise<{ answers: Record<number, string>; currentIndex: number } | null> {
  const result = await db().from('quiz_progress').select('answers,current_index').eq('user_id', userId).eq('quiz_id', quizId).maybeSingle();
  if (result.error) throw result.error;
  return result.data ? { answers: result.data.answers || {}, currentIndex: result.data.current_index || 0 } : null;
}

export async function clearQuizProgress(userId: string, quizId: string): Promise<void> {
  const result = await db().from('quiz_progress').delete().eq('user_id', userId).eq('quiz_id', quizId);
  if (result.error) throw result.error;
}

export async function getTechBookmarks(userId: string): Promise<string[]> {
  const result = await db().from('tech_bookmarks').select('article_id').eq('user_id', userId);
  if (result.error) throw result.error;
  return (result.data || []).map((row: { article_id: string }) => row.article_id);
}

export async function setTechBookmark(userId: string, articleId: string, bookmarked: boolean): Promise<void> {
  const client = db();
  const result = bookmarked
    ? await client.from('tech_bookmarks').upsert({ user_id: userId, article_id: articleId }, { onConflict: 'user_id,article_id' })
    : await client.from('tech_bookmarks').delete().eq('user_id', userId).eq('article_id', articleId);
  if (result.error) throw result.error;
}
