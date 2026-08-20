import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  TrendingDown,
  Route,
  Coins,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getSkills,
  getLatestQuizAttempt,
  getSkillGaps,
  getCareerRecommendations,
  getLearningOutcomes,
} from '../services/supabase/database';
import { fetchDailyTechNews } from '../services/news/technologyNews';
import { SkillItem, QuizAttempt, SkillGapItem, CareerRecommendation, LearningOutcome, TechNewsArticle } from '../types';

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [news, setNews] = useState<TechNewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      try {
        const [sk, att, gaps, car, out, techNews] = await Promise.all([
          getSkills(profile.id),
          getLatestQuizAttempt(profile.id),
          getSkillGaps(profile.id),
          getCareerRecommendations(profile.id),
          getLearningOutcomes(profile.id),
          fetchDailyTechNews(),
        ]);

        setSkills(sk);
        setLatestAttempt(att);
        setSkillGaps(gaps);
        setCareers(car);
        setOutcomes(out);
        setNews(techNews.slice(0, 3));
      } catch (err) {
        console.error('Failed loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  const skillCount = skills.length;
  const latestScore = latestAttempt ? `${latestAttempt.percentage}%` : 'Not Taken';
  const primaryCareer = careers[0];
  const careerReadiness = latestAttempt
    ? Math.min(94, Math.max(45, Math.round(latestAttempt.percentage * 0.9 + 10)))
    : null;

  let gapSeverity = 'Moderate';
  if (skillGaps.length === 0) gapSeverity = 'Pending Assessment';
  else {
    const hasCritical = skillGaps.some((g) => g.gap_level === 'Critical' || g.gap_level === 'High');
    gapSeverity = hasCritical ? 'High' : 'Moderate';
  }

  // Category counts for quick visual distribution
  const categoryCounts: Record<string, number> = {};
  skills.forEach((s) => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Navigator Ready</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Navigator'}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {skillCount === 0
              ? 'Start by uploading your resume or declaring your skills to generate your calibrated 15-question assessment.'
              : `Your profile tracks ${skillCount} verified competencies. ${
                  latestAttempt
                    ? `Latest assessment score: ${latestAttempt.score}/15.`
                    : 'Take your technical quiz to pinpoint skill gaps.'
                }`}
          </p>

          <div className="flex flex-wrap gap-3">
            {skillCount === 0 ? (
              <Link
                to="/resume"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs flex items-center gap-2"
              >
                <span>Upload Resume & Extract Skills</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : !latestAttempt ? (
              <Link
                to="/assessment"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs flex items-center gap-2"
              >
                <span>Take 15-Question Skill Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/career-path"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs flex items-center gap-2"
              >
                <span>View Career Roadmap ({primaryCareer?.career_name || 'Full Stack'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              to="/premium"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile?.credits ?? 5} Credits Available</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards (Section 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1: Skills */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Skills Identified</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{skillCount}</div>
          <Link to="/resume" className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 inline-block">
            {skillCount > 0 ? 'Manage skills →' : 'Add skills →'}
          </Link>
        </div>

        {/* Metric 2: Assessment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Latest Score</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{latestScore}</div>
          <Link to="/assessment" className="text-[11px] font-semibold text-indigo-600 hover:underline mt-1 inline-block">
            {latestAttempt ? 'Retake or review →' : 'Take quiz →'}
          </Link>
        </div>

        {/* Metric 3: Skill Gap */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Skill Gap Level</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">{gapSeverity}</div>
          <Link to="/skill-gap" className="text-[11px] font-semibold text-rose-600 hover:underline mt-1 inline-block">
            View diagnosis →
          </Link>
        </div>

        {/* Metric 4: Career Readiness */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Career Readiness</span>
            <Route className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {careerReadiness === null ? 'Not Assessed' : `${careerReadiness}%`}
          </div>
          <Link to="/career-path" className="text-[11px] font-semibold text-emerald-600 hover:underline mt-1 inline-block">
            Explore paths →
          </Link>
        </div>

        {/* Metric 5: Credits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Premium Credits</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{profile?.credits ?? 5}</div>
          <Link to="/premium" className="text-[11px] font-semibold text-amber-700 hover:underline mt-1 inline-block">
            Earn or unlock →
          </Link>
        </div>
      </div>

      {/* Main Grid: Skill Distribution & Roadmaps + Today's Tech */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Skills Overview & Career Recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Distribution Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Skill Competency Distribution</h3>
                <p className="text-xs text-slate-500">Categories extracted from your profile evidence</p>
              </div>
              <Link
                to="/resume"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Edit Skills</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium mb-3">No skills extracted yet.</p>
                <Link
                  to="/resume"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 inline-block"
                >
                  Upload Resume or Add Skills
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 truncate">{cat}</div>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">{count} skills</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {skills.slice(0, 10).map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/60"
                    >
                      {s.skill_name}
                      <span className="ml-1 text-[10px] text-indigo-600 font-bold">({s.proficiency})</span>
                    </span>
                  ))}
                  {skills.length > 10 && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 bg-slate-50">
                      +{skills.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Primary Career Recommendation Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recommended Career Path</h3>
                <p className="text-xs text-slate-500">AI match based on your validated competencies</p>
              </div>
              <Link
                to="/career-path"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>All Career Paths</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {primaryCareer ? (
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Top Match</div>
                    <h4 className="text-xl font-extrabold text-slate-900">{primaryCareer.career_name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {primaryCareer.match_percentage}% Match
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{primaryCareer.avg_salary}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{primaryCareer.reasoning}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="bg-white/80 p-3 rounded-lg border border-slate-200/60">
                    <span className="font-bold text-emerald-700 block mb-1">Your Key Strengths</span>
                    <ul className="text-slate-600 space-y-1 text-[11px]">
                      {primaryCareer.strong_skills?.slice(0, 3).map((st, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/80 p-3 rounded-lg border border-slate-200/60">
                    <span className="font-bold text-rose-700 block mb-1">Key Missing Gaps</span>
                    <ul className="text-slate-600 space-y-1 text-[11px]">
                      {primaryCareer.missing_skills?.slice(0, 3).map((ms, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{ms}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  to="/career-path"
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View 6-Phase Transition Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Route className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium mb-3">
                  Upload skills & complete a quiz to generate career recommendations.
                </p>
                <Link
                  to="/assessment"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 inline-block"
                >
                  Start Assessment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Tech Widget & Performance Credit Box */}
        <div className="space-y-6">
          {/* Today's Tech Widget (Section 25) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">Today's Tech</h3>
              </div>
              <Link to="/todays-tech" className="text-xs font-semibold text-cyan-600 hover:underline">
                View all →
              </Link>
            </div>

            <div className="space-y-3.5">
              {news.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                      {item.category}
                    </span>
                    <span>{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Earn With Your Skills Banner */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/60 to-white p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm mb-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Earn Credits with Your Skills</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Take our 15-question assessments. Scoring 80%+ awards up to 5 credits to unlock advanced roadmaps.
            </p>

            <div className="space-y-1.5 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-amber-200/70 mb-4">
              <div className="flex justify-between font-medium">
                <span>Score ≥ 90%</span>
                <span className="font-bold text-amber-700">+5 Credits</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Score 80% – 89%</span>
                <span className="font-bold text-amber-700">+3 Credits</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Score 70% – 79%</span>
                <span className="font-bold text-amber-700">+2 Credits</span>
              </div>
            </div>

            <Link
              to="/assessment"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white text-center block shadow-2xs transition-colors"
            >
              Take Assessment & Earn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
