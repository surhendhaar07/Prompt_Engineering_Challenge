import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import * as challengeService from '../services/challengeService';
import {
  Clock,
  ShieldAlert,
  Sparkles,
  Maximize2,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

export const ParticipantInstructionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCurrentState = async () => {
      try {
        const current = await challengeService.getCurrentChallenge();
        const ch = current?.challenge;
        if (ch) {
          if (ch.status === 'IN_PROGRESS') {
            setHasActiveChallenge(true);
            navigate('/challenge/workspace');
            return;
          } else if (['SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED'].includes(ch.status)) {
            navigate('/challenge/completed');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check challenge state', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentState();
  }, [navigate]);

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // Request Fullscreen
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsErr) {
        console.warn('Fullscreen request bypassed by user agent:', fsErr);
      }

      await challengeService.startChallenge();
      navigate('/challenge/workspace');
    } catch (err: any) {
      console.error('Error starting challenge:', err);
      setError(err.response?.data?.error || err.message || 'Failed to start challenge');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] bg-cyber-grid bg-radial-gradient flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-cyan-500/20 shadow-2xl relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                OFFICIAL COMPETITION RULES
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
                Prompt Engineering Challenge
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-mono">
                Team: <span className="text-cyan-400 font-bold">{user?.teamName || user?.username}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 border border-cyan-500/30 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
              <Clock className="w-6 h-6 text-cyan-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">DURATION</p>
                <p className="text-lg font-bold font-mono text-cyan-300">30 MINUTES</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Rules Checklist */}
          <div className="my-8 space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Contest Guidelines & Proctoring Instructions:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  You will receive a <strong>randomly assigned challenge</strong> from the official symposium question bank.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  You have exactly <strong>30 minutes</strong>. The server timer starts the second you click <em>Start Challenge</em>.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Maximize2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  <strong>Fullscreen mode</strong> is required. Exiting fullscreen mode is recorded in the admin telemetry log.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  <strong>Do not switch browser tabs</strong> or minimize the window. Tab changes are tracked in real-time.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Lock className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  <strong>Copying & Pasting</strong> is restricted. You must compose your prompt directly in the challenge workspace.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">
                  The challenge will <strong>automatically submit</strong> when the 30-minute server timer expires.
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-mono text-center sm:text-left">
              Ensure you have a steady internet connection before launching.
            </p>

            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-white tracking-widest bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_30px_rgba(0,210,255,0.4)] transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isStarting ? (
                <span className="inline-flex items-center gap-2 font-mono text-sm">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  INITIALIZING CHALLENGE...
                </span>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>{hasActiveChallenge ? 'RESUME CHALLENGE' : 'START CHALLENGE'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
