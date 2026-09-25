import React from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

interface AlertBannerProps {
  message: string | null;
  onClose: () => void;
  type?: 'warning' | 'error' | 'info';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  onClose,
  type = 'warning',
}) => {
  if (!message) return null;

  const typeStyles = {
    warning: 'bg-gradient-to-r from-red-950/95 via-amber-950/95 to-red-950/95 border-red-500/80 text-white shadow-[0_0_35px_rgba(239,68,68,0.4)]',
    error: 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_35px_rgba(239,68,68,0.5)]',
    info: 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200 shadow-[0_0_25px_rgba(0,210,255,0.3)]',
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] animate-in slide-in-from-top-6 duration-300">
      <div className={`p-4 rounded-2xl border-2 backdrop-blur-xl flex items-center justify-between gap-3.5 ${typeStyles[type]}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-900/60 border border-red-500/40 text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-xs sm:text-sm font-mono font-bold leading-snug">
            {message}
          </div>
        </div>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
