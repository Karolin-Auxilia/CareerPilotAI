import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Shield, ExternalLink } from 'lucide-react';
import { isConfigured, updateSupabaseCredentials, clearSupabaseCredentials, getSupabaseConfig } from '../services/supabase/client';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url || '');
  const [anonKey, setAnonKey] = useState(current.key || '');
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim().startsWith('https://')) {
      setStatusMessage({ type: 'error', text: 'Supabase URL must start with https://' });
      return;
    }
    if (!anonKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Supabase Anon Key is required.' });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    try {
      const success = updateSupabaseCredentials(url.trim(), anonKey.trim());
      if (!success) {
        throw new Error('Invalid URL or Key format.');
      }

      setStatusMessage({
        type: 'success',
        text: 'Connected successfully to your Supabase project! Registration & records will save directly to your database.',
      });

      if (onConnected) onConnected();

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to initialize Supabase client.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setStatusMessage({ type: 'error', text: 'Supabase credentials cleared.' });
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Supabase Database Connection</h2>
              <p className="text-xs text-slate-500">Connect your PostgreSQL database for live auth and records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {isConfigured ? (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-emerald-900">Database Connected & Active</div>
              <div className="text-emerald-700 mt-0.5 font-mono text-[11px] truncate max-w-xs">
                {current.url}
              </div>
              <p className="text-emerald-800 text-[11px] mt-1">
                New user sign-ups, skill inventories, assessments, and learning paths are saved directly into your Supabase tables.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-amber-900">Supabase Connection Required</div>
              <p className="text-amber-800 text-[11px] mt-0.5">
                To store registrations in your database, enter your Supabase Project URL and Public Anon Key below.
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Project URL (VITE_SUPABASE_URL)
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-normal text-emerald-600 hover:underline flex items-center gap-1"
              >
                Find in dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzprojectid.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              Anon Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Safe to use: This is your public browser client key protected by Row Level Security.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={testing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isConfigured ? 'Update Connection' : 'Connect Supabase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
