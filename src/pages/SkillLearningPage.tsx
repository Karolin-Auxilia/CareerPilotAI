import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Youtube,
  ExternalLink,
  Code2,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Clock,
  Layers,
  Play,
  FolderGit2,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateSkillLesson, SkillLesson } from '../services/ai/skillLearner';
import { askLearningPlanAgent, CareerAgentMessage } from '../services/ai/careerAgent';
import { getSkills, getSkillGaps } from '../services/supabase/database';
import { SkillItem, SkillGapSummary } from '../types';

// ---------------------------------------------------------------------------
// Simple markdown-to-JSX renderer (handles bold, code, links, line breaks)
// ---------------------------------------------------------------------------
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Parse inline: **bold**, `code`, [text](url)
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    while (remaining.length > 0) {
      // Link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }
      // Bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-bold text-slate-900">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={key++} className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-[0.82em] font-mono font-medium">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      // Normal char
      const nextSpecial = remaining.search(/\[|\*\*|`/);
      if (nextSpecial === -1) {
        parts.push(<span key={key++}>{remaining}</span>);
        remaining = '';
      } else {
        parts.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      }
    }
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && '\n'}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
    Advanced: 'bg-rose-100 text-rose-800 border-rose-200',
    Expert: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colors[level] || colors.Beginner}`}>
      {level}
    </span>
  );
}

function ResourceCard({ youtubeUrl, gfgUrl, gfgSearchUrl, topic }: {
  youtubeUrl: string; gfgUrl: string; gfgSearchUrl: string; topic: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Learning Resources</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* YouTube */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-red-900">YouTube</div>
            <div className="text-[11px] text-red-700 truncate">Full course tutorial for {topic}</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-red-500 ml-auto shrink-0 group-hover:scale-110 transition-transform" />
        </a>
        {/* GeeksforGeeks */}
        <a
          href={gfgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0 text-white font-black text-xs">
            GFG
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-green-900">GeeksforGeeks</div>
            <div className="text-[11px] text-green-700 truncate">{topic} — Article</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-green-500 ml-auto shrink-0 group-hover:scale-110 transition-transform" />
        </a>
        {/* GFG Search fallback */}
        <a
          href={gfgSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group sm:col-span-2"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-400 flex items-center justify-center shrink-0 text-white font-black text-[10px]">
            GFG
          </div>
          <div className="text-xs text-slate-600">
            Can't find the article? <span className="font-semibold text-slate-800 underline">Search all {topic} articles on GeeksforGeeks →</span>
          </div>
        </a>
      </div>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <span className="text-xs font-mono font-semibold text-slate-400 uppercase">{language}</span>
        <button onClick={copy} className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer">
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const SkillLearningPage: React.FC = () => {
  const { skillName } = useParams<{ skillName: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const decodedSkill = decodeURIComponent(skillName || '');

  const [lesson, setLesson] = useState<SkillLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);

  const [messages, setMessages] = useState<CareerAgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [skillGap, setSkillGap] = useState<SkillGapSummary | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the proficiency of this skill from user skills
  const matchedSkill = skills.find(
    (s) => s.skill_name.toLowerCase() === decodedSkill.toLowerCase()
  );
  const proficiency = matchedSkill?.proficiency || 'Beginner';

  // Load lesson
  useEffect(() => {
    if (!decodedSkill) return;
    setLessonLoading(true);
    setLessonError(null);
    generateSkillLesson(decodedSkill, proficiency, profile?.target_career || 'Software Engineer')
      .then(setLesson)
      .catch((err: Error) => setLessonError(err.message))
      .finally(() => setLessonLoading(false));
  }, [decodedSkill, proficiency, profile?.target_career]);

  // Load user context
  useEffect(() => {
    if (!profile) return;
    Promise.all([getSkills(profile.id), getSkillGaps(profile.id)]).then(([sk, gaps]) => {
      setSkills(sk);
      if (gaps.length > 0) {
        setSkillGap({
          overall_score: 0,
          gap_level: 'Moderate',
          gaps,
          strong_skills: [],
          moderate_skills: [],
          weak_skills: [],
          missing_skills: [],
        });
      }
    }).catch(console.error);
  }, [profile]);

  // Auto-seed first message when lesson loads
  useEffect(() => {
    if (!lesson || messages.length > 0) return;
    const seedMsg: CareerAgentMessage = {
      role: 'user',
      content: `Teach me ${decodedSkill} step by step. I am at ${proficiency} level.`,
    };
    setMessages([seedMsg]);
    setSending(true);
    askLearningPlanAgent(seedMsg.content, {
      profile: profile!,
      skills,
      skillGap,
      careers: [],
      learningOutcomes: [],
    }, [])
      .then((reply) => {
        setMessages([seedMsg, { role: 'assistant', content: reply }]);
      })
      .catch(() => {
        setMessages([seedMsg, {
          role: 'assistant',
          content: `Let's start learning **${decodedSkill}**! Check the lesson panel on the left for structured content, code examples, and resource links. Feel free to ask me anything!`,
        }]);
      })
      .finally(() => setSending(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending || !profile) return;
    const userMsg: CareerAgentMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
    try {
      const reply = await askLearningPlanAgent(userMsg.content, {
        profile,
        skills,
        skillGap,
        careers: [],
        learningOutcomes: [],
      }, messages);
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...history, {
        role: 'assistant',
        content: 'The learning agent is temporarily unavailable. Please try again in a moment.',
      }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, profile, messages, skills, skillGap]);

  const reloadLesson = () => {
    setLessonLoading(true);
    setLessonError(null);
    generateSkillLesson(decodedSkill, proficiency, profile?.target_career || 'Software Engineer')
      .then(setLesson)
      .catch((err: Error) => setLessonError(err.message))
      .finally(() => setLessonLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 truncate">{decodedSkill}</span>
          <DifficultyBadge level={proficiency} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
            <Sparkles className="w-3 h-3" />
            AI-Powered Learning
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ═══════════════════════════════════════════════
            LEFT — LESSON PANEL
        ═══════════════════════════════════════════════ */}
        <div className="space-y-5">
          {lessonLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center gap-4 shadow-sm min-h-[400px]">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">Generating your lesson on <span className="text-emerald-600">{decodedSkill}</span></p>
                <p className="text-xs text-slate-500 mt-1">Powered by Gemini AI · Personalised for your level</p>
              </div>
            </div>
          ) : lessonError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 flex flex-col items-center gap-3 shadow-sm">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-semibold text-slate-700">Could not load lesson</p>
              <p className="text-xs text-slate-500 text-center">{lessonError}</p>
              <button onClick={reloadLesson} className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : lesson ? (
            <>
              {/* Lesson Header Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">AI-Generated Lesson</div>
                    <h1 className="text-xl font-extrabold leading-tight">{lesson.topic}</h1>
                  </div>
                  <div className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-bold shrink-0">{lesson.difficulty_level}</div>
                </div>
                <p className="text-sm text-emerald-50 leading-relaxed">{lesson.learning_outcome}</p>
                <div className="flex items-center gap-4 mt-4 text-emerald-200">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" /> {lesson.estimated_time}
                  </span>
                  {lesson.prerequisites?.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <Layers className="w-3.5 h-3.5" /> {lesson.prerequisites.length} prerequisites
                    </span>
                  )}
                </div>
              </div>

              {/* Prerequisites */}
              {lesson.prerequisites?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Prerequisites
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.prerequisites.map((p, i) => (
                      <Link
                        key={i}
                        to={`/learning/skill/${encodeURIComponent(p)}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-all flex items-center gap-1"
                      >
                        {p} <ChevronRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Concept */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Concept
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lesson.concept}</p>
              </div>

              {/* Real-world analogy */}
              {lesson.real_world_analogy && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" /> Real-World Analogy
                  </h3>
                  <p className="text-sm text-amber-900 leading-relaxed">{lesson.real_world_analogy}</p>
                </div>
              )}

              {/* Key Points */}
              {lesson.key_points?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" /> Key Points
                  </h3>
                  <ul className="space-y-2">
                    {lesson.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Example */}
              {lesson.code_example && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5" /> Code Example
                  </h3>
                  <CodeBlock code={lesson.code_example} language={lesson.code_language || 'code'} />
                  {lesson.code_explanation && (
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{lesson.code_explanation}</p>
                  )}
                </div>
              )}

              {/* Common Mistakes */}
              {lesson.common_mistakes?.length > 0 && (
                <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Common Mistakes
                  </h3>
                  <ul className="space-y-2">
                    {lesson.common_mistakes.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-rose-800">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-rose-200 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice + Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-500" /> Practice Task
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{lesson.practice_task}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FolderGit2 className="w-3.5 h-3.5" /> Mini Project
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">{lesson.mini_project}</p>
                </div>
              </div>

              {/* Resource Links */}
              <ResourceCard
                youtubeUrl={lesson.youtube_url}
                gfgUrl={lesson.gfg_url}
                gfgSearchUrl={lesson.gfg_search_url}
                topic={lesson.topic}
              />

              {/* Next Topics */}
              {lesson.next_topics?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Learn Next</h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.next_topics.map((t, i) => (
                      <Link
                        key={i}
                        to={`/learning/skill/${encodeURIComponent(t)}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all"
                      >
                        {t} <ChevronRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ═══════════════════════════════════════════════
            RIGHT — CHAT PANEL
        ═══════════════════════════════════════════════ */}
        <div className="xl:sticky xl:top-20">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '82vh', minHeight: 520 }}>
            {/* Chat header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AI Learning Coach</div>
                <div className="text-[11px] text-emerald-100">Gemini-powered · Ask anything about {decodedSkill}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[11px] text-emerald-100 font-medium">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 && !sending && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Your AI tutor is ready</p>
                    <p className="text-xs text-slate-500 mt-1">Ask anything about {decodedSkill}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-xs mt-2">
                    {[
                      `Explain ${decodedSkill} with a simple example`,
                      `Give me a practice problem for ${decodedSkill}`,
                      `What are the most common ${decodedSkill} interview questions?`,
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="text-left text-[11px] font-medium text-slate-600 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5" />
                      : <Bot className="w-3.5 h-3.5" />
                    }
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                  placeholder={`Ask about ${decodedSkill}...`}
                  disabled={sending}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60 bg-slate-50"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Press Enter to send · Powered by Gemini AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
