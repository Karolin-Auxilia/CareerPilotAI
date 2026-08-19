import React, { useState, useEffect } from 'react';
import {
  Crown,
  Coins,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  CreditCard,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  PREMIUM_FEATURES_CATALOG,
  CREDIT_TIERS,
  PAYMENT_PLANS,
  PaymentPlan,
  paymentService,
} from '../services/premium/creditService';
import {
  getCreditTransactions,
  unlockFeatureWithCredits,
  getUserUnlockedFeatures,
} from '../services/supabase/database';
import { CreditTransaction } from '../types';

export const PremiumPage: React.FC = () => {
  const { profile, refreshProfile, upgradePlan, setLocalCredits } = useAuth();

  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [unlockingFeature, setUnlockingFeature] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      try {
        const [txs, unlocked] = await Promise.all([
          getCreditTransactions(profile.id),
          getUserUnlockedFeatures(profile.id),
        ]);
        setTransactions(txs);
        setUnlockedFeatures(unlocked);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [profile]);

  const handleUnlockDirectly = async (featureId: string, cost: number, name: string) => {
    if (!profile) return;
    if (profile.credits < cost) {
      setNotification({
        type: 'error',
        text: `Insufficient credits! You need ${cost} credits. Take a skill quiz to earn credits or purchase a pack below.`,
      });
      return;
    }

    setUnlockingFeature(featureId);
    setNotification(null);

    try {
      const res = await unlockFeatureWithCredits(profile.id, featureId, name, cost);
      if (res.success) {
        setUnlockedFeatures((prev) => [...prev, featureId]);
        await refreshProfile();
        setNotification({ type: 'success', text: `Successfully unlocked "${name}" with ${cost} credits!` });
      } else {
        setNotification({ type: 'error', text: res.error || 'Failed to unlock feature.' });
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message || 'Error occurred.' });
    } finally {
      setUnlockingFeature(null);
    }
  };

  const handleSimulatedCheckout = async () => {
    if (!selectedPlan || !profile) return;
    setProcessingPayment(true);

    try {
      await paymentService.initiateCheckout(selectedPlan.id, profile.id);

      if (selectedPlan.id === 'starter_credits') {
        const newTotal = (profile.credits || 0) + 15;
        setLocalCredits(newTotal);
        setNotification({ type: 'success', text: '15 Credits successfully added to your balance!' });
      } else if (selectedPlan.id === 'premium_pro' || selectedPlan.id === 'annual_pass') {
        await upgradePlan('pro');
        setNotification({ type: 'success', text: 'Congratulations! Your account is upgraded to CareerPilot Pro!' });
      }

      setCheckoutModalOpen(false);
      await refreshProfile();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Payment simulation failed' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const isPro = profile?.plan === 'pro' || profile?.plan === 'premium';

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Performance Credits & Premium Upgrades
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Unlock advanced career diagnostics with earned skill assessment credits or subscribe for unlimited Pro access.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Credit Balance & Current Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-6 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-4xl font-black text-amber-900">{profile?.credits ?? 5}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Redeem credits below to unlock individual deep-dive analyses.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-6 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Plan</span>
            <Crown className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 uppercase">{profile?.plan || 'Free'} Plan</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isPro
              ? 'All advanced features & assessments are fully unlocked!'
              : 'Upgrade to Pro for unlimited AI career roadmap analyses.'}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-6 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Earn Rate</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950">Up to +5 Credits</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Score ≥ 80% on any 15-question skill quiz to earn instant bonus credits.
          </p>
        </div>
      </div>

      {/* Credit Earnings Tier Table (Section 20) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Quiz Performance Reward System</h3>
            <p className="text-xs text-slate-500">Every 15-question assessment automatically credits your balance</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Quiz Score Tier</th>
                <th className="p-3">Performance Classification</th>
                <th className="p-3">Credits Awarded</th>
                <th className="p-3">Feature Unlocks Equivalent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CREDIT_TIERS.map((tier, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="p-3 font-extrabold text-slate-900">{tier.range}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-700">
                      {tier.label}
                    </span>
                  </td>
                  <td className="p-3 font-black text-amber-600 text-sm">+{tier.credits} Credits</td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {tier.credits >= 3
                      ? 'Unlocks multiple career comparisons or deep dive'
                      : tier.credits > 0
                      ? 'Unlocks advanced skill gap deep dive'
                      : 'Review recommendations and retry'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Unlock Catalog (Section 21, 24) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Available Diagnostic Feature Unlocks</h3>
            <p className="text-xs text-slate-500">Redeem your credits or use your Pro plan to unlock instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PREMIUM_FEATURES_CATALOG).map(([featId, feat]) => {
            const isUnlocked = isPro || unlockedFeatures.includes(featId);
            const isPendingThis = unlockingFeature === featId;

            return (
              <div
                key={featId}
                className={`rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{feat.feature_name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {feat.credit_cost} Credits
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Unlocked & Ready</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUnlockDirectly(featId, feat.credit_cost, feat.feature_name)}
                      disabled={isPendingThis}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPendingThis ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock ({feat.credit_cost} Credits)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Subscription Plans (Section 22) */}
      <div className="space-y-6 pt-4 border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Upgrade or Purchase Credit Packs</h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose a plan tailored to your career transition timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAYMENT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 sm:p-7 border-2 flex flex-col justify-between relative transition-all ${
                plan.popular
                  ? 'border-indigo-600 bg-white shadow-lg'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/{plan.billingPeriod}</span>
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-4">{plan.creditsIncluded}</div>

                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setCheckoutModalOpen(true);
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Transaction History (Section 23) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Credit Activity History</h3>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500">No credit transactions recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{tx.description}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString()} {tx.balance_after !== undefined ? `• Balance: ${tx.balance_after}` : ''}
                  </div>
                </div>
                <span
                  className={`font-black text-xs ${
                    tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Checkout Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-2.5 mb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Secure Checkout</h3>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl mb-4 text-xs">
              <div className="flex justify-between font-bold text-slate-900 mb-1">
                <span>{selectedPlan.name}</span>
                <span>{selectedPlan.price}</span>
              </div>
              <p className="text-slate-500 text-[11px]">{selectedPlan.creditsIncluded}</p>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              In this preview environment, transactions are securely authorized in Instant Sandbox Mode.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatedCheckout}
                disabled={processingPayment}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Activate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
