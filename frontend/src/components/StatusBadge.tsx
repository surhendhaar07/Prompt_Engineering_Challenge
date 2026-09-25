import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || 'NOT_STARTED').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let label = normalized;

  switch (normalized) {
    case 'ONLINE':
      colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      dotColor = 'bg-emerald-400 animate-pulse';
      label = 'Online';
      break;
    case 'OFFLINE':
      colorClasses = 'bg-slate-900/60 text-slate-400 border-slate-700/60';
      dotColor = 'bg-slate-500';
      label = 'Offline';
      break;
    case 'NOT_STARTED':
      colorClasses = 'bg-blue-950/60 text-blue-300 border-blue-500/30';
      dotColor = 'bg-blue-400';
      label = 'Not Started';
      break;
    case 'IN_PROGRESS':
      colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      dotColor = 'bg-amber-400 animate-ping';
      label = 'In Progress';
      break;
    case 'SUBMITTED':
      colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(0,210,255,0.2)]';
      dotColor = 'bg-cyan-400';
      label = 'Submitted (Manual)';
      break;
    case 'AUTO_SUBMITTED':
      colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(192,38,211,0.2)]';
      dotColor = 'bg-purple-400';
      label = 'Auto Submitted';
      break;
    case 'EXPIRED':
      colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      dotColor = 'bg-rose-400';
      label = 'Expired';
      break;
    case 'RESET':
      colorClasses = 'bg-orange-950/60 text-orange-300 border-orange-500/40';
      dotColor = 'bg-orange-400';
      label = 'Reset';
      break;
    default:
      label = normalized;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
