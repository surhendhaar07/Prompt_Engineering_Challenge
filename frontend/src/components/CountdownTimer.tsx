import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | null;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  size = 'md',
  showLabel = true,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      return diff;
    };

    setRemainingSeconds(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Visual state classes based on requirement:
  // > 10m: Cyan / normal
  // 5m - 10m: Amber warning
  // < 5m: Orange-red strong warning
  // < 1m: Urgent blinking red
  let stateClass = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]';
  let iconColor = 'text-cyan-400';
  let labelText = 'TIME REMAINING';

  if (remainingSeconds <= 60 && remainingSeconds > 0) {
    stateClass = 'text-red-400 bg-red-950/70 border-red-500/80 border-glow-red animate-pulse';
    iconColor = 'text-red-400 animate-bounce';
    labelText = 'URGENT: TIME RUNNING OUT';
  } else if (remainingSeconds <= 300 && remainingSeconds > 60) {
    stateClass = 'text-orange-400 bg-orange-950/50 border-orange-500/60 shadow-[0_0_20px_rgba(255,87,34,0.3)]';
    iconColor = 'text-orange-400 animate-pulse';
    labelText = 'FINAL 5 MINUTES';
  } else if (remainingSeconds <= 600 && remainingSeconds > 300) {
    stateClass = 'text-amber-400 bg-amber-950/40 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    iconColor = 'text-amber-400';
    labelText = '10 MINUTES REMAINING';
  } else if (remainingSeconds === 0) {
    stateClass = 'text-slate-400 bg-slate-900/60 border-slate-700';
    iconColor = 'text-slate-400';
    labelText = "TIME EXPIRED";
  }

  const sizeClasses = {
    sm: 'text-base font-mono px-3 py-1',
    md: 'text-xl font-mono px-4 py-2 font-bold tracking-wider',
    lg: 'text-3xl font-mono px-6 py-3 font-extrabold tracking-widest',
    hero: 'text-5xl md:text-6xl font-mono px-8 py-4 font-black tracking-widest',
  };

  return (
    <div className="flex flex-col items-center">
      {showLabel && size !== 'sm' && (
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-1 font-semibold flex items-center gap-1">
          {remainingSeconds <= 300 && remainingSeconds > 0 ? (
            <AlertTriangle className="w-3 h-3 text-orange-400 animate-pulse" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {labelText}
        </span>
      )}
      <div
        className={`inline-flex items-center gap-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${stateClass} ${sizeClasses[size]}`}
      >
        <Clock className={`${size === 'hero' ? 'w-10 h-10' : size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} ${iconColor}`} />
        <span className="tabular-nums select-none">{formattedTime}</span>
      </div>
    </div>
  );
};
