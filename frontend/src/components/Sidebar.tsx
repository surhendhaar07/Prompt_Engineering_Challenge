import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Clock,
  FileCheck,
  Activity,
  Settings,
  History,
  Download,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ExportModal } from './ExportModal';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/teams', label: 'Teams', icon: Users },
    { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
    { to: '/admin/challenges', label: 'Challenges', icon: Clock },
    { to: '/admin/submissions', label: 'Submissions', icon: FileCheck },
    { to: '/admin/activity', label: 'Activity Monitor', icon: Activity },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <>
      <aside className="w-64 shrink-0 bg-[#0a0f1d] border-r border-slate-800/80 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Control Center
            </p>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,210,255,0.15)] font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-cyan-400/80" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              onClick={() => setIsExportOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/20 border border-slate-800/60 hover:border-emerald-500/30 transition-all duration-200 mt-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Results</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/30 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Multi-Format Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
