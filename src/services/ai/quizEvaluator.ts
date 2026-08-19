import { Quiz, QuizAttempt, QuizQuestion, UserAnswer } from '../../types';

export interface EvaluationResult {
  score: number;
  total: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  credits_earned: number;
  skill_breakdown: Record<string, any>;
  difficulty_breakdown: Record<string, { total: number; correct: number; percentage: number }>;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

export function calculateCreditReward(percentage: number): number {
  if (percentage >= 90) return 5;
  if (percentage >= 80) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 60) return 1;
  return 0;
}

export async function evaluateQuizSubmission(
  quiz: Quiz,
  userAnswersInput: Record<string, string> | UserAnswer[],
  userId?: string
): Promise<QuizAttempt> {
  let correctCount = 0;
  const total = quiz.questions.length || 15;

  const answersList: UserAnswer[] = [];
  const answersMap: Record<string, string> = {};

  if (Array.isArray(userAnswersInput)) {
    userAnswersInput.forEach((ans) => {
      answersMap[ans.question_id] = ans.selected_option;
      answersMap[String(ans.question_number)] = ans.selected_option;
    });
  } else {
    Object.assign(answersMap, userAnswersInput);
  }

  const skillTotals: Record<string, { total: number; correct: number }> = {};
  const difficultyTotals: Record<string, { total: number; correct: number }> = {
    Easy: { total: 0, correct: 0 },
    Medium: { total: 0, correct: 0 },
    Hard: { total: 0, correct: 0 },
  };

  quiz.questions.forEach((q: QuizQuestion, idx: number) => {
    const selected =
      answersMap[q.id] ||
      answersMap[String(q.question_number)] ||
      answersMap[String(idx)] ||
      '';
    const isCorrect = selected && selected.trim() === q.correct_answer.trim();

    answersList.push({
      question_id: q.id,
      question_number: q.question_number,
      selected_option: selected,
      is_correct: Boolean(isCorrect),
      time_spent_seconds: 15,
    });

    if (isCorrect) {
      correctCount++;
    }

    // Skill breakdown
    const sName = q.skill || 'General';
    if (!skillTotals[sName]) {
      skillTotals[sName] = { total: 0, correct: 0 };
    }
    skillTotals[sName].total += 1;
    if (isCorrect) {
      skillTotals[sName].correct += 1;
    }

    // Difficulty breakdown
    const diff = q.difficulty || 'Medium';
    if (!difficultyTotals[diff]) {
      difficultyTotals[diff] = { total: 0, correct: 0 };
    }
    difficultyTotals[diff].total += 1;
    if (isCorrect) {
      difficultyTotals[diff].correct += 1;
    }
  });

  const percentage = Math.round((correctCount / total) * 100);
  const credits_earned = calculateCreditReward(percentage);

  const skill_breakdown: Record<string, any> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(skillTotals).forEach(([skill, stats]) => {
    const skillPct = Math.round((stats.correct / stats.total) * 100);
    skill_breakdown[skill] = { total: stats.total, correct: stats.correct, percentage: skillPct };
    if (skillPct >= 75) {
      strengths.push(`${skill} (${skillPct}%)`);
    } else if (skillPct < 60) {
      weaknesses.push(`${skill} (${skillPct}%)`);
    }
  });

  const difficulty_breakdown: Record<string, { total: number; correct: number; percentage: number }> = {};
  Object.entries(difficultyTotals).forEach(([diff, stats]) => {
    difficulty_breakdown[diff] = {
      total: stats.total,
      correct: stats.correct,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    };
  });

  return {
    id: 'att_' + Date.now(),
    quiz_id: quiz.id,
    user_id: userId || 'anon',
    score: correctCount,
    total_questions: total,
    percentage,
    correct_answers: correctCount,
    incorrect_answers: total - correctCount,
    credits_earned,
    skill_breakdown,
    difficulty_breakdown,
    answers: answersList,
    strengths: strengths.length > 0 ? strengths : ['Fundamental Programming'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Advanced Edge Cases'],
    user_answers: answersMap,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}
