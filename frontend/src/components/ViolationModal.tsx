import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Lock } from 'lucide-react';

interface ViolationModalProps {
  isOpen: boolean;
  violationCount: number;
  reason: string;
  timestamp: string;
  onAcknowledge: () => void;
}

export const ViolationModal: React.FC<ViolationModalProps> = ({
  isOpen,
  violationCount,
  reason,
  timestamp,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-lg w-full bg-[#0a0505] p-6 sm:p-8 rounded-2xl border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] text-center space-y-5 relative overflow-hidden">
        {/* Glowing Top Warning Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

        {/* Pulsing Siren Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-600/30 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-red-950/90 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.6)]">
            <ShieldAlert className="w-9 h-9 text-red-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-mono font-bold tracking-widest uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>SECURITY VIOLATION DETECTED</span>
          </div>
          <h2 className="text-2xl font-black text-white font-display tracking-wide mt-2">
            TAB SWITCH / ALT+TAB RECORDED
          </h2>
        </div>

        {/* Violation Details Box */}
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-left space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
            <span className="text-slate-400 uppercase">Violation Incident:</span>
            <span className="text-red-400 font-bold text-sm bg-red-950/80 px-2.5 py-0.5 rounded border border-red-500/50">
              #{violationCount}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
            <span className="text-slate-400 uppercase">Trigger Event:</span>
            <span className="text-amber-300 font-semibold text-right max-w-[240px] truncate">
              {reason || 'Window Focus Lost / Alt+Tab'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase">Forensic Timestamp:</span>
            <span className="text-slate-200">{timestamp || new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Warning Explanation */}
        <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-1.5">
          <p>
            Leaving the challenge workspace, opening external tabs, or using <strong className="text-red-400">Alt+Tab</strong> is strictly prohibited during the XenTriX'26 Prompt Engineering Challenge.
          </p>
          <p className="text-[11px] text-red-300 font-mono flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            All proctoring anomalies are automatically logged to the Invigilator Dashboard.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold font-mono text-sm tracking-wider text-white bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:to-orange-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>I UNDERSTAND • RESUME WORKSPACE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
