import React, { useEffect, useState } from 'react';
import { ShieldAlert, EyeOff, Lock } from 'lucide-react';

interface SecurityShieldProps {
  isActive: boolean;
  isPrivacyShieldActive: boolean;
  teamName?: string;
  teamNumber?: string;
}

export const SecurityShield: React.FC<SecurityShieldProps> = ({
  isActive,
  isPrivacyShieldActive,
  teamName = 'PARTICIPANT',
  teamNumber = 'XT-00',
}) => {
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* 1. Forensic Traceable Watermark Background Grid */}
      <div
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none opacity-[0.035] dark:opacity-[0.045]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex flex-wrap gap-x-20 gap-y-16 -rotate-12 scale-125 transform justify-around content-around">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 whitespace-nowrap"
            >
              XENTRIX'26 • {teamName} ({teamNumber}) • {timestamp} • PROCTORED
            </div>
          ))}
        </div>
      </div>

      {/* 2. Privacy Shutter / Screen-Capture Blur Shield */}
      {isPrivacyShieldActive && (
        <div className="fixed inset-0 z-50 bg-[#050811]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)] max-w-md w-full space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <EyeOff className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold">
                PROCTORING PROTOCOL ENFORCED
              </span>
              <h2 className="text-xl font-black text-white font-display">
                Screen Capture / Focus Lost
              </h2>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Challenge workspace is shielded to prevent unauthorized screen captures, AI extensions, or background tabs.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300">
              Return cursor focus to the challenge to continue.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
