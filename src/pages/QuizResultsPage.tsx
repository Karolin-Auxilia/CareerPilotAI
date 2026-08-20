import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Coins,
  TrendingDown,
  Route,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuizAttempt, QuizData } from '../types';
import { getLatestQuizAttempt, getQuiz } from '../services/supabase/database';

export const QuizResultsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [celebrationShown, setCelebrationShown] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      if (profile) {
        const latest = await getLatestQuizAttempt(profile.id);
        setAttempt(latest);
        if (latest) {
          setActiveQuiz(await getQuiz(profile.id, latest.quiz_id));
        }
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading your assessment results...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">No Assessment Results Found</h2>
        <p className="text-xs text-slate-500 mb-6">Take a 15-question skill assessment to generate your diagnostic report.</p>
        <Link
          to="/assessment"
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 inline-block"
        >
          Go to Assessment Hub
        </Link>
      </div>
    );
  }

  const performanceTier =
    attempt.percentage >= 90
      ? { label: 'Mastery Level', color: 'text-purple-600 bg-purple-50 border-purple-200' }
      : attempt.percentage >= 80
      ? { label: 'Proficient Level', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
      : attempt.percentage >= 70
      ? { label: 'Competent Level', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
      : attempt.percentage >= 60
      ? { label: 'Foundation Level', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: 'Needs Review', color: 'text-rose-600 bg-rose-50 border-rose-200' };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Celebration Header Card */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
        {celebrationShown && attempt.credits_earned > 0 && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 mb-4 animate-bounce">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>🎉 Congratulations! You earned +{attempt.credits_earned} Premium Credits!</span>
          </div>
        )}

        <div className="max-w-xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border">
            <span className={performanceTier.color.split(' ')[0]}>{performanceTier.label}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Assessment Score: {attempt.score} / {attempt.total_questions} ({attempt.percentage}%)
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            {attempt.percentage >= 80
              ? 'Excellent performance! Your strong conceptual foundations qualify you for accelerated career pathways.'
              : 'Assessment completed. We have diagnosed your specific skill gaps and prepared actionable next steps.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/skill-gap"
              className="px-6 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2"
            >
              <span>View Diagnostic Skill Gaps</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/career-path"
              className="px-6 py-3 rounded-xl font-semibold text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all"
            >
              Explore Career Pathways
            </Link>
            <Link
              to="/assessment"
              className="px-4 py-3 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Performance by Difficulty</h3>
          <div className="space-y-3.5">
            {attempt.difficulty_breakdown &&
              Object.entries(attempt.difficulty_breakdown).map(([diff, stats]: any) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={diff}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{diff} Questions</span>
                      <span>
                        {stats.correct} / {stats.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          diff === 'Easy'
                            ? 'bg-emerald-500'
                            : diff === 'Medium'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Skill-wise Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Competency Breakdown</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {attempt.skill_breakdown &&
              Object.entries(attempt.skill_breakdown).map(([skill, stats]: any) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={skill} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{skill}</div>
                      <div className="text-[10px] text-slate-500">
                        {stats.correct} of {stats.total} correct
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        pct >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : pct >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        

        <div className="space-y-3">
          {attempt.answers.map((ans, idx) => {
            const isExpanded = expandedQuestion === idx;
            const correspondingQ = activeQuiz?.questions.find(
              (q) => q.id === ans.question_id || q.question_number === ans.question_number
            );

            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all ${
                  ans.is_correct
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {ans.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Q{ans.question_number}: {correspondingQ?.question.slice(0, 80) || `Question ${ans.question_number}`}...
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ans.is_correct ? (
                          <span className="text-emerald-700 font-semibold">Correct Answer</span>
                        ) : (
                          <span className="text-rose-700 font-semibold">Incorrect Answer</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {correspondingQ && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {correspondingQ.difficulty}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs space-y-3">
                    {correspondingQ && (
                      <div className="text-slate-800 font-medium whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200/80">
                        {correspondingQ.question}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Your Answer:</span>
                        <span className={`font-semibold ${ans.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {ans.selected_option || '(No answer provided)'}
                        </span>
                      </div>

                      {correspondingQ && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Correct Answer:</span>
                          <span className="font-semibold text-emerald-700">{correspondingQ.correct_answer}</span>
                        </div>
                      )}
                    </div>

                    {correspondingQ?.explanation && (
                      <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-950">
                        <span className="font-bold text-[11px] block mb-1">Explanation:</span>
                        <p className="leading-relaxed text-[11px]">{correspondingQ.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
