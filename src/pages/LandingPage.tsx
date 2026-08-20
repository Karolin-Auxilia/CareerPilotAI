import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  FileText,
  CheckCircle2,
  TrendingDown,
  Route,
  GraduationCap,
  Newspaper,
  Coins,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'AI Resume Analysis',
      description: 'Semantically extracts technical stacks, proficiency levels, and evidence directly from your uploaded resume.',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      icon: CheckCircle2,
      title: '15-Question Skill Assessment',
      description: 'Custom-generated assessment matching your exact skills with calibrated Easy, Medium, and Hard questions.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      icon: TrendingDown,
      title: 'Personalized Skill Gap Analysis',
      description: 'Pinpoints critical blindspots by cross-referencing your resume, declared skills, and quiz performance.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      icon: Route,
      title: 'AI Career Path Recommendations',
      description: 'Calculates career match percentages, explains your exact fit, and charts a 6-phase transition roadmap.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      icon: GraduationCap,
      title: 'Personalized Learning Outcomes',
      description: 'Measurable, outcome-driven learning objectives complete with real-world practical tasks and project specs.',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      icon: Newspaper,
      title: 'Daily Technology Updates',
      description: 'Curated daily summaries on AI advancements, modern frameworks, and developer tool breakthroughs.',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      icon: Coins,
      title: 'Performance-Based Premium Credits',
      description: 'Score 80%+ on your technical skill assessments to earn premium credits and unlock advanced deep dives for free.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  const steps = [
    { num: '01', title: 'Upload Resume or Enter Skills', desc: 'Upload your PDF/DOCX resume or enter your current technical toolkit manually.' },
    { num: '02', title: 'AI Skill Extraction', desc: 'Our AI model structures your competencies with estimated proficiency and confidence metrics.' },
    { num: '03', title: 'Take 15-Question AI Quiz', desc: 'Answer a calibrated 15-question technical quiz tailored specifically to your toolkit.' },
    { num: '04', title: 'Discover Skill Gaps', desc: 'Receive a diagnostic gap score highlighting high-priority blindspots and actionable fixes.' },
    { num: '05', title: 'Choose Career Path', desc: 'Select from recommended career matches backed by explainable fit metrics.' },
    { num: '06', title: 'Follow Learning Roadmap', desc: 'Execute measurable project deliverables and build a production-grade developer portfolio.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CareerPilot<span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">AI-Powered Career Navigator</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Analyze your skills. Discover your gaps. Build your career.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight md:leading-[1.15] mb-6">
            Your AI-Powered <span className="text-indigo-600">Career Navigator</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Upload your resume, discover your real skills, identify your gaps, and get a personalized career roadmap backed by calibrated skill assessments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all flex items-center justify-center"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Comprehensive Platform</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Navigate Your Tech Career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Step-by-Step Guidance</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">How CareerPilotAI Works</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                <div className="text-2xl font-black text-indigo-600 mb-3">{s.num}</div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Premium Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Transparent Plans</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Free vs. Premium Capabilities</p>
            <p className="text-sm text-slate-500 mt-2">
              Earn premium credits on quizzes or upgrade anytime for unlimited deep-dive access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Entry Tier</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Plan</h3>
                <div className="text-3xl font-extrabold text-slate-900 mb-6">$0 <span className="text-xs font-normal text-slate-500">forever</span></div>

                <div className="space-y-3 mb-8">
                  {[
                    'Account creation & profile',
                    'Resume upload (PDF, DOC, DOCX)',
                    'Basic skill extraction & chips',
                    'One 15-question skill assessment',
                    'Assessment score & percentage',
                    'Basic skill-gap summary',
                    'Primary career recommendation',
                    "Daily technology updates (Today's Tech)",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-xl text-center text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan Card */}
            <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-lg flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Full Navigator
              </div>

              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Advanced Tier</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium & Pro</h3>
                <div className="text-3xl font-extrabold text-slate-900 mb-6">Earn or Upgrade</div>

                <div className="space-y-3 mb-8">
                  {[
                    'Everything in Free plan',
                    'Advanced multi-dimension skill gap analysis',
                    'Multiple career path comparisons (5+ roles)',
                    'Detailed 6-phase career roadmaps',
                    'Measurable personalized learning outcomes',
                    'Project deliverable specs & rubrics',
                    'Specialized technical assessments',
                    'Earn credits automatically by scoring ≥80%',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-900 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-xl text-center text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                Start with 5 Free Bonus Credits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Start Building Your Future Today
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-8">
            Join developers, engineers, and tech professionals charting their growth with CareerPilotAI.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 text-slate-500 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">CareerPilotAI</span>
            <span>— Analyze. Discover. Build.</span>
          </div>
          <div>© {new Date().getFullYear()} CareerPilotAI Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
