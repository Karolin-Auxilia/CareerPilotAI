import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Target,
  BarChart3,
  Layers,
  ChevronRight,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSkills, getLatestQuizAttempt, getSkillGaps, saveSkillGaps } from '../services/supabase/database';
import { analyzeSkillGaps } from '../services/ai/skillGapAnalyzer';
import { SkillGapAnalysis, SkillItem, QuizAttempt } from '../types';
import { PremiumFeatureGuard } from '../components/common/PremiumFeatureGuard';

export const SkillGapPage: React.FC = () => {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
      if (!profile) return;
      try {
        const [sk, attempt, existingGaps] = await Promise.all([
          getSkills(profile.id),
          getLatestQuizAttempt(profile.id),
          getSkillGaps(profile.id),
        ]);

        setSkills(sk);

        if (sk.length === 0) {
          setLoading(false);
          return;
        }

        if (existingGaps && existingGaps.length > 0) {
          const calculatedScore = Math.max(40, Math.min(98, Math.round(100 - existingGaps.length * 6)));
          setAnalysis({
            overall_score: calculatedScore,
            gap_level: existingGaps.some(g => g.gap_level === 'High' || g.gap_level === 'Critical') ? 'High' : 'Moderate',
            strong_skills: sk.filter(s => s.proficiency === 'Advanced' || s.proficiency === 'Expert').map(s => s.skill_name),
            moderate_skills: sk.filter(s => s.proficiency === 'Intermediate').map(s => s.skill_name),
            weak_skills: sk.filter(s => s.proficiency === 'Beginner').map(s => s.skill_name),
            missing_skills: [],
            gaps: existingGaps,
          });
        } else {
          // Generate fresh diagnostic analysis from the candidate's actual resume skills
          const fresh = await analyzeSkillGaps({
            skills: sk,
            attempt,
            targetCareer: profile.target_career || 'Software Engineer',
          });
          setAnalysis(fresh);
          if (fresh.gaps && fresh.gaps.length > 0) {
            await saveSkillGaps(profile.id, fresh.gaps);
          }
        }
      } catch (e) {
        console.error('SkillGapPage init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [profile]);

  const handleRegenerate = async () => {
    if (!profile || skills.length === 0) return;
    setRefreshing(true);
    try {
      const attempt = await getLatestQuizAttempt(profile.id);
      const fresh = await analyzeSkillGaps({
        skills,
        attempt,
        targetCareer: profile.target_career || 'Software Engineer',
      });
      setAnalysis(fresh);
      if (fresh.gaps && fresh.gaps.length > 0) {
        await saveSkillGaps(profile.id, fresh.gaps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Analyzing skills extracted from your resume...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto shadow-xs">
        <FileText className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Resume Skills Found</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Skill gap diagnosis is generated exclusively from the skills and content in your uploaded resume. Upload your resume or declare your skills to get a live, personalized analysis.
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
            <span>Evaluated From Your Uploaded Resume Skills</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Diagnostic Skill Gap Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Synthesized by analyzing your {skills.length} extracted resume skills against industry standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Recalculating...' : 'Regenerate from Resume'}</span>
          </button>
          <Link
            to="/career-path"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
          >
            <span>View Career Paths</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overall Score & Level Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Preparedness</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{analysis?.overall_score ?? 75}</span>
            <span className="text-sm font-bold text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Based on {skills.length} validated skills from your uploaded resume.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Overall Gap Severity</div>
          <div className="text-2xl font-black text-emerald-700 capitalize mt-1">
            {analysis?.gap_level ?? 'Moderate'} Severity
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Targeted practice modules can close these gaps within 4-6 weeks.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Extracted Resume Skills</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {skills.length} Skills
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                {s.skill_name}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="text-[10px] text-slate-400 font-semibold">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diagnosed Gaps List */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Prioritized Skill Gap Breakdown
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Specific areas in your tech stack requiring targeted reinforcement before interviewing:
        </p>

        {analysis?.gaps && analysis.gaps.length > 0 ? (
          <div className="space-y-4">
            {analysis.gaps.map((gap, idx) => (
              <div
                key={gap.id || idx}
                className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{gap.skill_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        gap.priority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : gap.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {gap.priority} Priority
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    Target: <strong className="text-emerald-700">{gap.target_level}</strong> (Currently: {gap.current_level})
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  <strong>Diagnosis:</strong> {gap.reason}
                </p>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                  <strong className="text-emerald-700">Action Plan:</strong> {gap.recommendation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No critical skill gaps identified. Your extracted resume skills show strong foundational alignment.
          </div>
        )}
      </div>
    </div>
  );
};
