import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { ConfirmationModal } from '../components/ConfirmationModal';
import * as adminService from '../services/adminService';
import { Team, Question } from '../types';
import {
  Clock,
  RotateCcw,
  RefreshCw,
  Search,
  AlertTriangle,
  HelpCircle,
  X
} from 'lucide-react';

export const AdminChallengesPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [modalAction, setModalAction] = useState<'RESET' | 'REASSIGN' | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [teamsData, questionsData] = await Promise.all([
        adminService.getTeams(),
        adminService.getQuestions(),
      ]);
      setTeams(teamsData);
      setQuestions(questionsData.filter((q) => q.is_active));
    } catch (err) {
      console.error('Failed to load challenges data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleConfirmAction = async () => {
    if (!selectedTeam || !modalAction) return;

    setIsProcessing(true);
    try {
      if (modalAction === 'RESET') {
        await adminService.resetChallenge(selectedTeam.id);
      } else if (modalAction === 'REASSIGN') {
        await adminService.reassignChallenge(selectedTeam.id, {
          questionId: selectedQuestionId || undefined,
          durationMinutes: customDuration || 30,
        });
      }
      setModalAction(null);
      setSelectedTeam(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = t.team_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_PROGRESS') return t.challenge_status === 'IN_PROGRESS';
    if (statusFilter === 'SUBMITTED') return ['SUBMITTED', 'AUTO_SUBMITTED'].includes(t.challenge_status || '');
    if (statusFilter === 'NOT_STARTED') return t.challenge_status === 'NOT_STARTED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white font-display">Challenge State Control</h1>
              <p className="text-xs text-slate-400 font-mono">
                Manage live attempt timers, question reassignments, and emergency reset controls
              </p>
            </div>

            <button
              onClick={fetchData}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Filters */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by team name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>

          {/* Challenges Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-900/50">
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Live Timer</th>
                    <th className="py-3.5 px-4">Assigned Question</th>
                    <th className="py-3.5 px-4 text-center">Violations</th>
                    <th className="py-3.5 px-4 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No team challenges matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const violations =
                        (team.challenge?.tab_switch_count || 0) +
                        (team.challenge?.fullscreen_exit_count || 0) +
                        (team.challenge?.copy_attempt_count || 0) +
                        (team.challenge?.paste_attempt_count || 0);

                      return (
                        <tr key={team.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white font-sans text-sm">{team.team_name}</div>
                            <div className="text-[10px] text-slate-400">{team.team_number || 'Team'}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={team.challenge_status || 'NOT_STARTED'} />
                          </td>

                          <td className="py-3.5 px-4">
                            {team.challenge_status === 'IN_PROGRESS' && team.challenge?.expires_at ? (
                              <CountdownTimer expiresAt={team.challenge.expires_at} size="sm" showLabel={false} />
                            ) : (
                              <span className="text-slate-500 font-mono">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="truncate font-sans text-slate-300">
                              {team.challenge?.question_text || <span className="text-slate-500 font-mono italic">Not assigned yet</span>}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {violations > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-bold">
                                {violations}
                              </span>
                            ) : (
                              <span className="text-slate-600">0</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setSelectedQuestionId(team.challenge?.question_id || '');
                                  setCustomDuration(30);
                                  setModalAction('REASSIGN');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reassign</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setModalAction('RESET');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
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
        </main>
      </div>

      {/* Reassign / Reset Modal */}
      {modalAction === 'REASSIGN' && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Reassign Challenge Quiz</h2>
                <p className="text-xs text-slate-400 font-mono">Team: {selectedTeam.team_name}</p>
              </div>
              <button onClick={() => setModalAction(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Reassigning will cancel the existing challenge assignment and start a fresh timer for this team.
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Question (Leave empty for random)</label>
                <select
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans"
                >
                  <option value="">-- Random Assignment from Active Pool --</option>
                  {questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      #{idx + 1} [{q.domain || 'WEB DEV'}] - {q.title || q.question_text.slice(0, 65)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Challenge Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value, 10) || 30)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmAction}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold"
                >
                  {isProcessing ? 'Reassigning...' : 'Confirm Reassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {modalAction === 'RESET' && (
        <ConfirmationModal
          isOpen={true}
          title={`Reset Challenge: ${selectedTeam?.team_name}`}
          message="Are you sure you want to reset this team's challenge back to NOT_STARTED? Any submitted answer and timer will be permanently cleared."
          confirmText="Yes, Reset Challenge"
          confirmVariant="danger"
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setModalAction(null);
            setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
};
