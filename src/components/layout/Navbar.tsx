import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Coins,
  Sparkles,
  User,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isConfigured } from '../../services/supabase/client';
import { SupabaseConnectionModal } from '../SupabaseConnectionModal';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  const notifications = [
    { id: 1, text: 'Earn up to 5 credits by taking a skill assessment.', time: 'Today', unread: true },
    { id: 2, text: 'Welcome to CareerPilotAI! Your roadmap is ready.', time: '1d ago', unread: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CareerPilot<span className="text-emerald-600">AI</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Supabase Database Connection Status Pill */}
          <button
            onClick={() => setDbModalOpen(true)}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80'
            }`}
            title={isConfigured ? 'Supabase Database is Connected' : 'Supabase Connection Required'}
          >
            <Database className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{isConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
            <span
              className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
            />
          </button>

          {user && profile ? (
            <>
              {/* Credit Balance Badge */}
              <Link
                to="/premium"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100/80 transition-colors text-amber-800 text-xs font-semibold shadow-2xs"
                title="Your available credits. Click to earn or upgrade."
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{profile.credits} Credits</span>
              </Link>

              {/* Plan Badge */}
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  profile.plan === 'pro' || profile.plan === 'premium'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {profile.plan === 'pro' || profile.plan === 'premium' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>PRO</span>
                  </>
                ) : (
                  <span>FREE</span>
                )}
              </span>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                      <span className="text-xs text-emerald-600 font-medium">Mark all read</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-3 text-xs ${n.unread ? 'bg-emerald-50/40' : ''}`}>
                          <p className="text-slate-800 font-medium">{n.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{profile.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/premium"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Upgrade / Credits</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setDbModalOpen(true);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-emerald-500" />
                        <span>Database Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                          navigate('/');
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      <SupabaseConnectionModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />
    </>
  );
};
