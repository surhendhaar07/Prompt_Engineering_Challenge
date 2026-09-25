import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import * as adminService from '../services/adminService';
import { ActivityLog } from '../types';
import {
  Activity,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Radio
} from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const { latestAlert } = useSocket();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await adminService.getActivityLogs({
        eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
        limit: 150,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventTypeFilter]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Real-time socket alert prepend
  useEffect(() => {
    if (latestAlert) {
      setLogs((prev) => [latestAlert, ...prev]);
      setTotal((prev) => prev + 1);
    }
  }, [latestAlert]);

  const filteredLogs = logs.filter((l) =>
    l.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  LIVE SURVEILLANCE & PROCTORING
                </span>
              </div>
              <h1 className="text-2xl font-black text-white font-display mt-1">Anti-Cheat & Activity Monitor</h1>
              <p className="text-xs text-slate-400 font-mono">
                Real-time forensic audit of tab-switches, window blur events, fullscreen changes, and clipboard attempts
              </p>
            </div>

            <button
              onClick={fetchLogs}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Filters */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by team or event details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Event Types</option>
                <option value="TAB_SWITCH">Tab Switches</option>
                <option value="FULLSCREEN_EXIT">Fullscreen Exits</option>
                <option value="WINDOW_BLUR">Window Blur</option>
                <option value="COPY_ATTEMPT">Copy Attempts</option>
                <option value="PASTE_ATTEMPT">Paste Attempts</option>
                <option value="RIGHT_CLICK">Right Click Context Menu</option>
                <option value="START">Challenge Start</option>
                <option value="SUBMIT_MANUAL">Manual Submissions</option>
                <option value="SUBMIT_AUTO">Auto Submissions</option>
                <option value="LOGIN">Team Logins</option>
              </select>

              <span className="text-xs font-mono text-slate-400 shrink-0">
                Events: <strong className="text-cyan-400">{filteredLogs.length}</strong>
              </span>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-900/50">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">Event Type</th>
                    <th className="py-3.5 px-4">Security Classification</th>
                    <th className="py-3.5 px-4">Details / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        No activity events recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSecurityAlert = [
                        'TAB_SWITCH',
                        'FULLSCREEN_EXIT',
                        'COPY_ATTEMPT',
                        'PASTE_ATTEMPT',
                        'CUT_ATTEMPT',
                        'RIGHT_CLICK',
                        'WINDOW_BLUR',
                      ].includes(log.event_type);

                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-slate-900/40 transition-colors ${
                            isSecurityAlert ? 'bg-red-950/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()} •{' '}
                            <span className="text-[10px] text-slate-600">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white font-sans text-sm">
                            {log.team_name}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase font-mono ${
                                isSecurityAlert
                                  ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {log.event_type.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isSecurityAlert ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Flagged Action
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">Standard Action</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 font-sans text-xs">
                            {log.details || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
