import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Shield, Users, Radio, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  customRightContent?: React.ReactNode;
  hideLogout?: boolean;
  onRequestFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  customRightContent,
  hideLogout = false,
  onRequestFullscreen,
  isFullscreen = true,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/15 bg-[#070b14]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-2 flex items-center justify-between">
        {/* Left: XenTriX'26 Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/challenge')}>
            <img
              src="/xentrix-logo.png"
              alt="XenTriX'26 Logo"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent font-display">
                XenTriX'26
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-medium">
                CHALLENGE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Innovate • Inspire • Elevate
            </p>
          </div>
        </div>

        {/* Custom Middle / Right Content (e.g. Timer) */}
        {customRightContent && (
          <div className="flex-1 max-w-xs mx-4 flex justify-center">
            {customRightContent}
          </div>
        )}

        {/* Right User Status & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Fullscreen Toggle Button */}
          {onRequestFullscreen && (
            <button
              onClick={onRequestFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                !isFullscreen
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode (F11)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'FULLSCREEN' : 'GO FULLSCREEN (F11)'}</span>
            </button>
          )}

          {/* Live Socket Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={isConnected ? 'text-emerald-400 font-mono text-[11px]' : 'text-slate-500 font-mono text-[11px]'}>
              {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="p-1 rounded-lg bg-cyan-950/60 text-cyan-400">
                {isAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white font-mono leading-none">
                  {user.teamName || user.username}
                </p>
                <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider mt-0.5">
                  {isAdmin ? 'ADMINISTRATOR' : (user.teamNumber || 'TEAM')}
                </p>
              </div>
            </div>
          )}

          {!hideLogout && user && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/30 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
