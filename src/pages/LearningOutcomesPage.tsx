import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Circle,
  FolderGit2,
  Clock,
  Target,
  ArrowRight,
  Layers,
  Award,
  BookOpen,
  FileText,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSkills, getSkillGaps, getLearningOutcomes, saveLearningOutcomes, toggleLearningOutcomeCompletion } from '../services/supabase/database';
import { generateLearningOutcomes } from '../services/ai/learningOutcomeGenerator';
import { LearningOutcome, SkillGapItem, SkillItem } from '../types';

export const LearningOutcomesPage: React.FC = () => {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hi, I am your adaptive learning coach. What are you working on today?' },
  ]);

  useEffect(() => {
    async function init() {
      if (!profile) return;
      try {
        const [sk, storedGaps, storedOutcomes] = await Promise.all([
          getSkills(profile.id),
          getSkillGaps(profile.id),
          getLearningOutcomes(profile.id),
        ]);

        setSkills(sk);

        if (sk.length === 0) {
          setLoading(false);
          return;
        }

        if (storedOutcomes && storedOutcomes.length > 0) {
          setOutcomes(storedOutcomes);
        } else {
          const fresh = await generateLearningOutcomes({
            gaps: storedGaps,
            skills: sk,
            targetCareerName: profile.target_career || 'Software Engineer',
          });
          setOutcomes(fresh);
          await saveLearningOutcomes(profile.id, fresh);
        }
      } catch (e) {
        console.error('LearningOutcomesPage init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [profile]);

  const handleRefresh = async () => {
    if (!profile || skills.length === 0) return;
    setRefreshing(true);
    try {
      const storedGaps = await getSkillGaps(profile.id);
      const fresh = await generateLearningOutcomes({
        gaps: storedGaps,
        skills,
        targetCareerName: profile.target_career || 'Software Engineer',
      });
      setOutcomes(fresh);
      await saveLearningOutcomes(profile.id, fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!profile) return;
    const updated = outcomes.map((o) => (o.id === id ? { ...o, is_completed: !currentStatus } : o));
    setOutcomes(updated);
    await toggleLearningOutcomeCompletion(profile.id, id, !currentStatus);
  };

  const completedCount = outcomes.filter((o) => o.is_completed).length;

  const sendChatMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading || !profile) return;
    const nextMessages = [...chatMessages, { role: 'user' as const, content: message }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await fetch('/api/ai/learning-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatMessages,
          targetCareer: profile.target_career || 'Software Engineer',
          skills,
          outcomes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to reach the learning coach');
      setChatMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setChatMessages([...nextMessages, { role: 'assistant', content: error instanceof Error ? error.message : 'Unable to reach the learning coach.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Generating measurable learning outcomes from your resume...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto shadow-xs">
        <GraduationCap className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Resume Skills Found</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Measurable learning outcomes and practical tasks are generated strictly from the skills extracted from your resume. Upload your resume or add your technical skills to generate your customized curriculum.
        </p>
        <Link
          to="/resume"
          className="px-6 py-3 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-2"
        >
          <span>Upload Resume & Skills</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Targeting Your Extracted Resume Stack & Gaps</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personalized Measurable Learning Outcomes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Outcome-driven milestones designed to systematically eliminate your diagnosed resume skill gaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Recalculating...' : 'Regenerate Outcomes'}</span>
          </button>
          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {completedCount} of {outcomes.length} Objectives Completed
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
          <span>Curriculum Mastery Progress</span>
          <span>{outcomes.length > 0 ? Math.round((completedCount / outcomes.length) * 100) : 0}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${outcomes.length > 0 ? (completedCount / outcomes.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <section className="bg-slate-950 rounded-2xl p-5 sm:p-6 text-white shadow-2xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300"><GraduationCap className="w-5 h-5" /></div>
          <div>
            <h2 className="font-bold">Learning Coach</h2>
            <p className="text-xs text-slate-400">Ask about your next step, a difficult topic, or a project.</p>
          </div>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
          {chatMessages.map((chat, index) => (
            <div key={`${chat.role}-${index}`} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${chat.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                {chat.content}
              </p>
            </div>
          ))}
          {chatLoading && <p className="text-xs text-slate-400">Thinking...</p>}
        </div>
        <form onSubmit={sendChatMessage} className="flex gap-2">
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask your learning coach..." className="min-w-0 flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500" />
          <button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Send message" className="rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Outcomes Cards List */}
      <div className="space-y-6">
        {outcomes.map((item, index) => (
          <div
            key={item.id || index}
            className={`rounded-2xl border p-6 sm:p-8 transition-all shadow-2xs ${
              item.is_completed
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, item.is_completed)}
                  className="cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </button>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Objective {index + 1} • {item.career_name}
                  </span>
                  <h3 className={`text-base font-bold ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {item.objective}
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                {item.expected_skill_level}
              </span>
            </div>

            {/* Topics Covered */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Topics & Mechanisms</span>
              <div className="flex flex-wrap gap-1.5">
                {item.topics?.map((topic, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Practical Task & Project Idea */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  Practical Hands-On Task:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{item.practical_task}</p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                  Suggested Project Deliverable:
                </span>
                <p className="text-xs text-emerald-950 font-medium">{item.project_idea}</p>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  Outcome: {item.expected_outcome}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
