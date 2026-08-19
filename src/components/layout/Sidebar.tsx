import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  TrendingDown,
  Route,
  GraduationCap,
  Newspaper,
  Crown,
  User,
  LogOut,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume & Skills', path: '/resume', icon: FileText },
    { name: 'Skill Assessment', path: '/assessment', icon: CheckSquare },
    { name: 'Skill Gap', path: '/skill-gap', icon: TrendingDown },
    { name: 'Career Path', path: '/career-path', icon: Route },
    { name: 'Learning Outcomes', path: '/learning', icon: GraduationCap },
    { name: "Today's Tech", path: '/todays-tech', icon: Newspaper },
    { name: 'Premium', path: '/premium', icon: Crown, highlight: true },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
              CP
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              CareerPilot<span className="text-indigo-400">AI</span>
            </span>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : item.highlight
                      ? 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.highlight ? 'text-amber-400' : ''}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    NEW
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800">
          <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-300">Credits Available</span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {profile?.credits ?? 5}
              </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, ((profile?.credits ?? 5) / 15) * 100)}%` }}
              />
            </div>
            <NavLink
              to="/premium"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className="mt-2.5 block text-center py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-2xs"
            >
              Get More Credits
            </NavLink>
          </div>

          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
