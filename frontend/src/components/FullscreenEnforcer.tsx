import React, { useState } from 'react';
import { Maximize2, AlertTriangle, Monitor } from 'lucide-react';

interface FullscreenEnforcerProps {
  isFullscreen: boolean;
  onRequestFullscreen: () => void;
  isActive: boolean;
}

export const FullscreenEnforcer: React.FC<FullscreenEnforcerProps> = ({
  isFullscreen,
  onRequestFullscreen,
  isActive,
}) => {
  const [isTemporarilyDismissed, setIsTemporarilyDismissed] = useState(false);

  if (!isActive || isFullscreen || isTemporarilyDismissed) return null;

  const handleFullscreenClick = () => {
    try {
      onRequestFullscreen();
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border-2 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.3)] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 animate-pulse">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
            PROCTORING PROTOCOL
          </span>
          <h3 className="text-xl font-bold text-white font-display tracking-wide mt-1">
            FULLSCREEN MODE REQUIRED
          </h3>
        </div>

        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          To maintain symposium integrity, the Prompt Engineering Challenge must run in full screen mode. Click below or press <strong className="text-cyan-400">F11</strong> on your keyboard.
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleFullscreenClick}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs font-mono tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Maximize2 className="w-4 h-4" />
            <span>ENABLE FULLSCREEN MODE (OR PRESS F11)</span>
          </button>

          <button
            onClick={() => setIsTemporarilyDismissed(true)}
            className="w-full py-2.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            Continue in Current Window (Dismiss Alert)
          </button>
        </div>
      </div>
    </div>
  );
};
