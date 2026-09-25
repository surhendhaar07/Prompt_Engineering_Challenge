import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useSocket } from '../context/SocketContext';
import * as adminService from '../services/adminService';
import { DashboardStats, Team, ActivityLog } from '../types';
import {
  Users,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  Search,
  Filter,
  Eye,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { socket, latestAlert } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Reassign / Reset Modal States
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [modalAction, setModalAction] = useState<'RESET' | 'REASSIGN' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset Live Activity Stream Modal State
  const [isResetStreamOpen, setIsResetStreamOpen] = useState(false);
  const [isResettingStream, setIsResettingStream] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
      if (data.recentActivity) {
        setActivityFeed(data.recentActivity);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    // Auto refresh telemetry every 8 seconds
    const interval = setInterval(fetchDashboard, 8000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    socket.on('team:online', (data: any) => {
      fetchDashboard();
    });

    socket.on('team:offline', (data: any) => {
      fetchDashboard();
    });

    socket.on('challenge:started', (data: any) => {
      fetchDashboard();
    });

    socket.on('challenge:submitted', (data: any) => {
      fetchDashboard();
    });

    return () => {
      socket.off('team:online');
      socket.off('team:offline');
      socket.off('challenge:started');
      socket.off('challenge:submitted');
    };
  }, [socket, fetchDashboard]);

  // Add real-time activity alert to top of feed
  useEffect(() => {
    if (latestAlert) {
      setActivityFeed((prev) => [latestAlert, ...prev.slice(0, 19)]);
    }
  }, [latestAlert]);

  const handleConfirmAction = async () => {
    if (!selectedTeam || !modalAction) return;

    setIsProcessing(true);
    try {
      if (modalAction === 'RESET') {
        await adminService.resetChallenge(selectedTeam.id);
      } else if (modalAction === 'REASSIGN') {
        await adminService.reassignChallenge(selectedTeam.id);
      }
      setModalAction(null);
      setSelectedTeam(null);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetStream = async () => {
    setIsResettingStream(true);
    try {
      await adminService.resetActivityLogs();
      setActivityFeed([]);
      setIsResetStreamOpen(false);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset activity stream');
    } finally {
      setIsResettingStream(false);
    }
  };

  const filteredTeams = (stats?.teams || []).filter((team) => {
    const matchesSearch = team.team_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ONLINE') return team.is_online;
    if (statusFilter === 'OFFLINE') return !team.is_online;
    if (statusFilter === 'IN_PROGRESS') return team.challenge_status === 'IN_PROGRESS';
    if (statusFilter === 'SUBMITTED') return ['SUBMITTED', 'AUTO_SUBMITTED'].includes(team.challenge_status || '');
    if (statusFilter === 'ALERTS') {
      const alertTotal = (team.challenge?.tab_switch_count || 0) + (team.challenge?.fullscreen_exit_count || 0) + (team.challenge?.copy_attempt_count || 0) + (team.challenge?.paste_attempt_count || 0);
      return alertTotal > 0;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/20 p-5 rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  EVENT LIVE TELEMETRY
                </span>
              </div>
              <h1 className="text-2xl font-black text-white font-display mt-1">
                Prompt Engineering Challenge Control Center
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                XenTriX'26 • Real-time Proctoring & Evaluation Suite
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Teams</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white font-mono mt-2">
                {stats?.totalTeams || 0}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Online</span>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-3xl font-black text-emerald-300 font-mono mt-2">
                {stats?.onlineTeams || 0}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">In Progress</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-300 font-mono mt-2">
                {stats?.inProgressTeams || 0}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-cyan-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-cyan-300 font-mono mt-2">
                {stats?.completedTeams || 0}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-red-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-red-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Alerts</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-3xl font-black text-red-400 font-mono mt-2">
                {stats?.alertCount || 0}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Active Qs</span>
                <HelpCircle className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-purple-300 font-mono mt-2">
                {stats?.activeQuestions || 0}
              </p>
            </div>
          </div>

          {/* Real-time Monitoring & Live Feed Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Teams Monitoring Table (2 Cols) */}
            <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">Live Team Monitoring</h2>
                  <p className="text-xs text-slate-400 font-mono">Real-time status, active timers & security violations</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search team..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400 w-36 sm:w-44"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ONLINE">Online Only</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ALERTS">With Alerts</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-2">Team</th>
                      <th className="py-3 px-2">Online</th>
                      <th className="py-3 px-2">Challenge Status</th>
                      <th className="py-3 px-2">Remaining</th>
                      <th className="py-3 px-2 text-center">Alerts</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No teams matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((t) => {
                        const totalViolations =
                          (t.challenge?.tab_switch_count || 0) +
                          (t.challenge?.fullscreen_exit_count || 0) +
                          (t.challenge?.copy_attempt_count || 0) +
                          (t.challenge?.paste_attempt_count || 0);

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-2">
                              <div className="font-semibold text-white font-sans">{t.team_name}</div>
                              <div className="text-[10px] text-slate-400">{t.team_number || 'Team'}</div>
                            </td>

                            <td className="py-3 px-2">
                              {t.is_online ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  Online
                                </span>
                              ) : (
                                <span className="text-slate-500">Offline</span>
                              )}
                            </td>

                            <td className="py-3 px-2">
                              <StatusBadge status={t.challenge_status || 'NOT_STARTED'} />
                            </td>

                            <td className="py-3 px-2">
                              {t.challenge_status === 'IN_PROGRESS' && t.challenge?.expires_at ? (
                                <CountdownTimer
                                  expiresAt={t.challenge.expires_at}
                                  size="sm"
                                  showLabel={false}
                                />
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center">
                              {totalViolations > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-bold">
                                  {totalViolations}
                                </span>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>

                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => navigate(`/admin/teams?view=${t.id}`)}
                                  title="View Team Details"
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-800"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedTeam(t);
                                    setModalAction('REASSIGN');
                                  }}
                                  title="Reassign Question"
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors border border-slate-800"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedTeam(t);
                                    setModalAction('RESET');
                                  }}
                                  title="Reset Challenge"
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors border border-slate-800"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Real-time Activity Feed (1 Col) */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-bold text-white font-display">Live Activity Stream</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    REAL-TIME
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsResetStreamOpen(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-all"
                    title="Reset Live Activity Stream"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                {activityFeed.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 font-mono">
                    Awaiting participant activity events...
                  </p>
                ) : (
                  activityFeed.map((log) => {
                    const isSecurity = [
                      'TAB_SWITCH',
                      'FULLSCREEN_EXIT',
                      'COPY_ATTEMPT',
                      'PASTE_ATTEMPT',
                      'CUT_ATTEMPT',
                      'RIGHT_CLICK',
                    ].includes(log.event_type);

                    const timeStr = new Date(log.timestamp).toLocaleTimeString();

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 transition-all ${
                          isSecurity
                            ? 'bg-red-950/30 border-red-500/30 text-red-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{timeStr}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {log.team_name}{' '}
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ml-1 ${
                                isSecurity ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-cyan-300'
                              }`}
                            >
                              {log.event_type.replace('_', ' ')}
                            </span>
                          </p>
                          {log.details && (
                            <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-tight">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal for Reset/Reassign */}
      <ConfirmationModal
        isOpen={!!modalAction}
        title={modalAction === 'RESET' ? `Reset Challenge: ${selectedTeam?.team_name}` : `Reassign Challenge: ${selectedTeam?.team_name}`}
        message={
          modalAction === 'RESET'
            ? 'Are you sure you want to reset this team\'s challenge back to NOT_STARTED? Any submitted answer and timer will be permanently cleared.'
            : 'Reassigning this challenge will allocate a new question and restart the 30-minute timer for this team. Continue?'
        }
        confirmText={modalAction === 'RESET' ? 'Yes, Reset Challenge' : 'Yes, Reassign Challenge'}
        confirmVariant={modalAction === 'RESET' ? 'danger' : 'warning'}
        isLoading={isProcessing}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setModalAction(null);
          setSelectedTeam(null);
        }}
      />

      {/* Confirmation Modal for Reset Live Activity Stream */}
      <ConfirmationModal
        isOpen={isResetStreamOpen}
        title="Reset Live Activity Stream?"
        message="Are you sure you want to permanently clear all live activity events and proctoring logs from the dashboard? This will purge the stream for all teams."
        confirmText="Yes, Reset Activity Stream"
        confirmVariant="danger"
        isLoading={isResettingStream}
        onConfirm={handleResetStream}
        onCancel={() => setIsResetStreamOpen(false)}
      />
    </div>
  );
};
