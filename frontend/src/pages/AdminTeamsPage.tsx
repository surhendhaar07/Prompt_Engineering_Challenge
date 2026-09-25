import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import * as adminService from '../services/adminService';
import { Team, ChallengeDomain } from '../types';
import {
  Users,
  Plus,
  Search,
  Key,
  Edit2,
  Trash2,
  Eye,
  X,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';

export const AdminTeamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get('view');

  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingDomainId, setUpdatingDomainId] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Team & Forms
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamDetails, setTeamDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create/Edit Form Data (Domain removed from Create modal as requested)
  const [formTeamName, setFormTeamName] = useState('');
  const [formTeamNumber, setFormTeamNumber] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await adminService.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to fetch teams', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Load team details drawer when viewId is in query params
  useEffect(() => {
    if (viewId) {
      setDetailsLoading(true);
      adminService
        .getTeamDetails(viewId)
        .then((details) => setTeamDetails(details))
        .catch((err) => console.error(err))
        .finally(() => setDetailsLoading(false));
    } else {
      setTeamDetails(null);
    }
  }, [viewId]);

  // Direct Inline Domain Selection Handler for each team in the table
  const handleDomainChange = async (teamId: string, newDomain: ChallengeDomain) => {
    setUpdatingDomainId(teamId);
    // Optimistic UI update
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, domain: newDomain } : t))
    );

    try {
      await adminService.updateTeam(teamId, { domain: newDomain });
    } catch (err) {
      alert('Failed to update team domain');
      fetchTeams();
    } finally {
      setUpdatingDomainId(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeamName.trim() || !formPassword) {
      setFormError('Team name and password are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminService.createTeam({
        team_name: formTeamName.trim(),
        password: formPassword,
        team_number: formTeamNumber.trim(),
        domain: 'WEB DEVELOPMENT', // Default domain, can be changed directly in table
      });
      setIsCreateOpen(false);
      setFormTeamName('');
      setFormTeamNumber('');
      setFormPassword('');
      await fetchTeams();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminService.updateTeam(selectedTeam.id, {
        team_name: formTeamName.trim(),
        team_number: formTeamNumber.trim(),
        is_active: formIsActive,
      });
      setIsEditOpen(false);
      setSelectedTeam(null);
      await fetchTeams();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    if (formPassword !== formConfirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formPassword.length < 4) {
      setFormError('Password must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminService.changeTeamPassword(selectedTeam.id, formPassword);
      setIsPasswordOpen(false);
      setSelectedTeam(null);
      setFormPassword('');
      setFormConfirmPassword('');
      alert('Password updated successfully');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setIsSubmitting(true);
    try {
      await adminService.deleteTeam(selectedTeam.id);
      setIsDeleteOpen(false);
      setSelectedTeam(null);
      await fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.team_number && t.team_number.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (domainFilter === 'ALL') return true;
    return t.domain === domainFilter;
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
              <h1 className="text-2xl font-black text-white font-display">Participant Team Management</h1>
              <p className="text-xs text-slate-400 font-mono">
                Select domain for each team directly below, manage credentials, and inspect submission dossiers
              </p>
            </div>

            <button
              onClick={() => {
                setFormTeamName('');
                setFormTeamNumber('');
                setFormPassword('');
                setFormError(null);
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Team</span>
            </button>
          </div>

          {/* Search bar & Domain Filter */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by team name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Domains</option>
                <option value="WEB DEVELOPMENT">WEB DEVELOPMENT</option>
                <option value="GEN AI APPLICATION">GEN AI APPLICATION</option>
              </select>

              <div className="text-xs font-mono text-slate-400 shrink-0">
                Total: <strong className="text-cyan-400">{filteredTeams.length}</strong> teams
              </div>
            </div>
          </div>

          {/* Teams Table with Direct Inline Domain Selector */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-900/50">
                    <th className="py-3.5 px-4">Team Name</th>
                    <th className="py-3.5 px-4 min-w-[220px]">
                      Domain Assigned <span className="text-[10px] text-cyan-400 font-normal lowercase">(select here)</span>
                    </th>
                    <th className="py-3.5 px-4">Team Number</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Account</th>
                    <th className="py-3.5 px-4">Challenge Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        No participant teams found.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white font-sans text-sm">
                          {team.team_name}
                        </td>

                        {/* Direct Inline Domain Selector for each team */}
                        <td className="py-3.5 px-4">
                          <div className="relative inline-block w-full max-w-[210px]">
                            <select
                              value={team.domain || 'WEB DEVELOPMENT'}
                              onChange={(e) => handleDomainChange(team.id, e.target.value as ChallengeDomain)}
                              className={`w-full py-1.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider outline-none transition-all cursor-pointer border ${
                                team.domain === 'GEN AI APPLICATION'
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 hover:border-purple-400 focus:ring-1 focus:ring-purple-400'
                                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                              }`}
                            >
                              <option value="WEB DEVELOPMENT" className="bg-slate-900 text-cyan-300 font-bold">
                                1. WEB DEVELOPMENT
                              </option>
                              <option value="GEN AI APPLICATION" className="bg-slate-900 text-purple-300 font-bold">
                                2. GEN AI APPLICATION
                              </option>
                            </select>
                            {updatingDomainId === team.id && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {team.team_number || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {team.is_online ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="text-slate-500">Offline</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {team.is_active ? (
                            <span className="text-emerald-400 text-[11px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-red-400 text-[11px] bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={team.challenge_status || 'NOT_STARTED'} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Team Details */}
                            <button
                              onClick={() => setSearchParams({ view: team.id })}
                              title="View Team Details & Submissions"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-800"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Password */}
                            <button
                              onClick={() => {
                                setSelectedTeam(team);
                                setFormPassword('');
                                setFormConfirmPassword('');
                                setFormError(null);
                                setIsPasswordOpen(true);
                              }}
                              title="Edit Password"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors border border-slate-800"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Team */}
                            <button
                              onClick={() => {
                                setSelectedTeam(team);
                                setFormTeamName(team.team_name);
                                setFormTeamNumber(team.team_number || '');
                                setFormIsActive(!!team.is_active);
                                setFormError(null);
                                setIsEditOpen(true);
                              }}
                              title="Edit Team"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors border border-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Team */}
                            <button
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsDeleteOpen(true);
                              }}
                              title="Delete Team"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 transition-colors border border-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Team Details Modal / Drawer */}
      {teamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Team Dossier
                </span>
                <h2 className="text-2xl font-black text-white font-display">
                  {teamDetails.team_name}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Domain: <strong className="text-cyan-300">{teamDetails.domain || 'WEB DEVELOPMENT'}</strong> • ID: {teamDetails.team_number || 'N/A'} • Created: {new Date(teamDetails.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSearchParams({})}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Online Status</span>
                <p className="font-bold text-white mt-1">
                  {teamDetails.is_online ? <span className="text-emerald-400">Online</span> : <span className="text-slate-500">Offline</span>}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Challenge Status</span>
                <p className="font-bold text-cyan-400 mt-1">
                  {teamDetails.challenge?.status || 'NOT_STARTED'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Tab Switches</span>
                <p className="font-bold text-amber-400 mt-1">
                  {teamDetails.challenge?.tab_switch_count || 0}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Fullscreen Exits</span>
                <p className="font-bold text-rose-400 mt-1">
                  {teamDetails.challenge?.fullscreen_exit_count || 0}
                </p>
              </div>
            </div>

            {/* Assigned Question 6 Parts */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Assigned Challenge Question:
              </h3>
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {teamDetails.challenge?.question_text || 'No question assigned yet (Challenge not started).'}
              </div>
            </div>

            {/* Submitted Answer / Draft */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                {teamDetails.submission ? 'Final Submitted Prompt Answer:' : 'Current Live Draft / Response:'}
              </h3>
              <div className="p-4 rounded-xl bg-[#080d1a] border border-cyan-500/20 text-xs font-mono text-cyan-100 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {teamDetails.submission?.answer || teamDetails.challenge?.current_draft || 'No answer submitted or recorded yet.'}
              </div>
            </div>

            {/* Chronological Activity Log Trail */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Contest Activity Timeline ({teamDetails.activity_logs?.length || 0} events):
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                {(!teamDetails.activity_logs || teamDetails.activity_logs.length === 0) ? (
                  <p className="text-slate-500 text-center py-2">No activity recorded.</p>
                ) : (
                  teamDetails.activity_logs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2 text-slate-300 py-1 border-b border-slate-900 last:border-0">
                      <span className="text-slate-500 text-[10px] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-cyan-400 font-semibold">{log.event_type}</span>
                      <span className="text-slate-400 font-sans text-[11px] truncate">{log.details}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal (Domain field removed as requested - set directly in table) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white font-display">Create Participant Team</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Team Name / Login Username *</label>
                <input
                  type="text"
                  required
                  value={formTeamName}
                  onChange={(e) => setFormTeamName(e.target.value)}
                  placeholder="e.g. TEAM_SIGMA"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Team ID / Number (Optional)</label>
                <input
                  type="text"
                  value={formTeamNumber}
                  onChange={(e) => setFormTeamNumber(e.target.value)}
                  placeholder="e.g. XT-09"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Secure participant key"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400"
                >
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {isPasswordOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Edit / Reset Password</h2>
                <p className="text-xs text-slate-400 font-mono">Team: {selectedTeam.team_name}</p>
              </div>
              <button onClick={() => setIsPasswordOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:from-amber-400"
                >
                  {isSubmitting ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {isEditOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white font-display">Edit Team Details</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateTeam} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={formTeamName}
                  onChange={(e) => setFormTeamName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Team ID / Number</label>
                <input
                  type="text"
                  value={formTeamNumber}
                  onChange={(e) => setFormTeamNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="isActive" className="text-slate-300">Account Active / Enabled</label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        title={`Delete Team: ${selectedTeam?.team_name}`}
        message="Are you sure you want to permanently delete this team, their challenge, and all submitted answers? This action cannot be undone."
        confirmText="Yes, Delete Team"
        confirmVariant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteTeam}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedTeam(null);
        }}
      />
    </div>
  );
};
