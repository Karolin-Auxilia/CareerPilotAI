import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lock, Coins, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

interface PremiumFeatureGuardProps {
  featureId: string;
  creditCost?: number;
  title?: string;
  description?: string;
  children: React.ReactNode;
  fallbackSnippet?: React.ReactNode;
}

export const PremiumFeatureGuard: React.FC<PremiumFeatureGuardProps> = ({
  featureId,
  creditCost,
  title,
  description,
  children,
  fallbackSnippet,
}) => {
  const {
    isUnlocked,
    loading,
    unlocking,
    creditCost: actualCost,
    hasEnoughCredits,
    currentCredits,
    featureMeta,
    unlock,
  } = useFeatureAccess(featureId, creditCost);

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl p-6 border border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  const featureTitle = title || featureMeta?.feature_name || 'Advanced Feature';
  const featureDesc = description || featureMeta?.description || 'Unlock advanced insights, prioritized career roadmaps, and detailed project guidelines.';

  return (
    <div className="relative rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 p-6 md:p-8 overflow-hidden shadow-sm">
      {/* Background Accent Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      {fallbackSnippet && (
        <div className="relative mb-6 opacity-75 blur-[1.5px] select-none pointer-events-none">
          {fallbackSnippet}
        </div>
      )}

      <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Premium Feature</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{featureTitle}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{featureDesc}</p>

        <div className="w-full bg-white/90 border border-amber-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-medium">Unlock Requirement</div>
              <div className="text-sm font-bold text-slate-900">
                {actualCost} Credits <span className="font-normal text-slate-500 text-xs">(You have {currentCredits})</span>
              </div>
            </div>
          </div>

          {hasEnoughCredits ? (
            <button
              onClick={() => unlock()}
              disabled={unlocking}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {unlocking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <span>Unlock with {actualCost} Credits</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/assessment"
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-center"
              >
                Earn Credits
              </Link>
              <Link
                to="/premium"
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors text-center flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Upgrade</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {!hasEnoughCredits && (
          <p className="text-xs text-slate-500">
            Tip: Complete a 15-question skill assessment with 80%+ score to earn 3–5 free premium credits instantly!
          </p>
        )}
      </div>
    </div>
  );
};
