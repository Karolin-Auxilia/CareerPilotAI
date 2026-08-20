import React, { useState } from 'react';
import {
  User,
  Mail,
  Briefcase,
  Crown,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/supabase/auth';
import { isConfigured, getSupabaseConfig } from '../services/supabase/client';
import { SupabaseConnectionModal } from '../components/SupabaseConnectionModal';

export const ProfilePage: React.FC = () => {
  const { profile, user, refreshProfile, resetPassword, upgradePlan } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [targetCareer, setTargetCareer] = useState(profile?.target_career || 'Full Stack Developer');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  const supabaseConfig = getSupabaseConfig();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await updateProfile(profile.id, {
        full_name: fullName,
        target_career: targetCareer,
      });

      if (res.profile) {
        await refreshProfile();
        setMessage({ type: 'success', text: 'Profile preferences updated successfully in database!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update profile in database.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    await resetPassword(profile.email);
    setResetSent(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account & Database Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, career target preferences, and Supabase database connection.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Database Connection Card */}
      

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-6">Personal Details</h2>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Career Goal</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="e.g. Full Stack Developer, DevOps Engineer"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Plan & Security Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <h2 className="text-base font-bold text-slate-900">Subscription & Security</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase">Current Tier: {profile?.plan || 'Free'}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Credits available in database: <strong>{profile?.credits ?? 5}</strong>
            </div>
          </div>

          {profile?.plan === 'free' && (
            <button
              onClick={() => upgradePlan('pro')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Password & Security</div>
            <div className="text-xs text-slate-500">Send a password reset email to your registered address via Supabase Auth.</div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={resetSent}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            {resetSent ? 'Reset Link Sent!' : 'Send Reset Link'}
          </button>
        </div>
      </div>

      <SupabaseConnectionModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />
    </div>
  );
};
