import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuizData, QuizQuestion, UserAnswer } from '../types';
import { evaluateQuizSubmission } from '../services/ai/quizEvaluator';
import { saveQuizAttempt, getQuiz, getQuizProgress, saveQuizProgress, clearQuizProgress, getSkills } from '../services/supabase/database';
import { generate15QuestionQuiz } from '../services/ai/quizGenerator';

export const QuizPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize quiz from session or fallback
  useEffect(() => {
    async function init() {
      if (profile && quizId) {
        const storedQuiz = await getQuiz(profile.id, quizId);
        if (storedQuiz) {
          setQuiz(storedQuiz);
          const progress = await getQuizProgress(profile.id, quizId);
          if (progress) {
            setAnswers(progress.answers);
            setCurrentIndex(progress.currentIndex);
          }
        }
      }
      setLoading(false);
    }
    init();
  }, [profile]);

  const handleSelectOption = (option: string) => {
    const updated = { ...answers, [currentIndex]: option };
    setAnswers(updated);
    if (profile && quizId) void saveQuizProgress(profile.id, quizId, updated, currentIndex);
  };

  const handleClearSelection = () => {
    const updated = { ...answers };
    delete updated[currentIndex];
    setAnswers(updated);
    if (profile && quizId) void saveQuizProgress(profile.id, quizId, updated, currentIndex);
  };

  const goToIndex = (idx: number) => {
    setCurrentIndex(idx);
    if (profile && quizId) void saveQuizProgress(profile.id, quizId, answers, idx);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions.length || 15;
  const currentQuestion: QuizQuestion | undefined = quiz?.questions[currentIndex];

  const handleSubmit = async () => {
    if (!quiz || !profile) return;
    setSubmitting(true);
    setConfirmModalOpen(false);

    try {
      const userAnswers: UserAnswer[] = quiz.questions.map((q, idx) => ({
        question_id: q.id,
        question_number: q.question_number,
        selected_option: answers[idx] || '',
        is_correct: answers[idx] === q.correct_answer,
        time_spent_seconds: 15,
      }));

      // Evaluate attempt and calculate earned credits
      const attempt = await evaluateQuizSubmission(quiz, userAnswers, profile.id);

      // Preserve the saved quiz foreign key while the persistence layer normalizes the attempt ID.
      await saveQuizAttempt(profile.id, { ...attempt, quiz_id: quiz.id });

      // Refresh profile to reflect newly credited balance
      await refreshProfile();

      if (quizId) await clearQuizProgress(profile.id, quizId);

      navigate('/results');
    } catch (err) {
      console.error('Quiz submission error:', err);
      alert('An error occurred submitting the quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Preparing your 15-question assessment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Progress */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              CareerPilotAI Technical Assessment
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Question {currentIndex + 1} of {totalQuestions}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Answered: <strong className="text-slate-900">{answeredCount}</strong> / {totalQuestions}
            </span>
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Submit Assessment</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  currentQuestion.difficulty === 'Easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentQuestion.difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Skill: {currentQuestion.skill}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              disabled={!answers[currentIndex]}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear selection</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
            {currentQuestion.question}
          </div>

          {/* 4 Options Grid */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, oIdx) => {
              const isSelected = answers[currentIndex] === opt;
              const optionLetter = String.fromCharCode(65 + oIdx);

              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {optionLetter}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed pt-0.5">
                    {opt}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Previous / Next Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => goToIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Question {currentIndex + 1} / {totalQuestions}
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => goToIndex(currentIndex + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Review & Submit</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1-15 Question Grid Jumper */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Question Jumper</span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-normal">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Unanswered
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-15 gap-2">
          {quiz.questions.map((_, idx) => {
            const isAnswered = Boolean(answers[idx]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-indigo-600 ring-offset-2 bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Submission Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Ready to submit your assessment?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              You have answered <strong className="text-slate-900">{answeredCount} of {totalQuestions}</strong> questions.
              {answeredCount < totalQuestions && (
                <span className="text-rose-600 block mt-1 font-semibold">
                  Warning: You have {totalQuestions - answeredCount} unanswered question(s).
                </span>
              )}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Submit</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
