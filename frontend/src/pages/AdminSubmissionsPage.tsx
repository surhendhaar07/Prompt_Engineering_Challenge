import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ExportModal } from '../components/ExportModal';
import * as adminService from '../services/adminService';
import { Submission } from '../types';
import {
  FileCheck2,
  Search,
  Download,
  Eye,
  X,
  Clock,
  ShieldAlert,
  Sparkles,
  FileText,
  Target,
  CheckSquare,
  Cpu,
  Code2
} from 'lucide-react';

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await adminService.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      (s.team_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.question_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.answer || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (domainFilter !== 'ALL' && s.team_domain !== domainFilter) return false;
    if (typeFilter === 'MANUAL' && s.submission_type !== 'MANUAL') return false;
    if (typeFilter === 'AUTO' && s.submission_type !== 'AUTO') return false;

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
              <h1 className="text-2xl font-black text-white font-display">Contest Submissions Review</h1>
              <p className="text-xs text-slate-400 font-mono">
                Validate engineered prompts against 6-part question specifications and export reports
              </p>
            </div>

            <button
              onClick={() => setIsExportOpen(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Export as Word / Excel / PDF</span>
            </button>
          </div>

          {/* Filters */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by team or prompt text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Domains</option>
                <option value="WEB DEVELOPMENT">WEB DEVELOPMENT</option>
                <option value="GEN AI APPLICATION">GEN AI APPLICATION</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Types</option>
                <option value="MANUAL">Manual Submissions</option>
                <option value="AUTO">Auto (Timeout)</option>
              </select>

              <span className="text-xs font-mono text-slate-400 shrink-0">
                Total: <strong className="text-cyan-400">{filtered.length}</strong>
              </span>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-900/50">
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">Domain</th>
                    <th className="py-3.5 px-4">Question Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Words</th>
                    <th className="py-3.5 px-4 text-center">Violations</th>
                    <th className="py-3.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const words = (s.answer || '').trim().split(/\s+/).filter(Boolean).length;
                      const mins = Math.floor((s.duration_used_seconds || 0) / 60);
                      const secs = (s.duration_used_seconds || 0) % 60;
                      const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                      const totalViolations = (s.tab_switch_count || 0) + (s.fullscreen_exit_count || 0) + (s.copy_attempt_count || 0) + (s.paste_attempt_count || 0);

                      return (
                        <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white font-sans text-sm">{s.team_name}</div>
                            <div className="text-[10px] text-slate-400">{s.team_number || 'Team'}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                s.team_domain === 'GEN AI APPLICATION'
                                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {s.team_domain || 'WEB DEVELOPMENT'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs font-sans text-slate-200 truncate">
                            {s.question_title || 'Prompt Challenge'}
                          </td>

                          <td className="py-3.5 px-4">
                            {s.submission_type === 'MANUAL' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                                MANUAL
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                                AUTO (TIMEOUT)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-300">
                            {formattedDuration}
                          </td>

                          <td className="py-3.5 px-4 text-cyan-400 font-bold">
                            {words}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {totalViolations > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-bold">
                                {totalViolations}
                              </span>
                            ) : (
                              <span className="text-slate-600">0</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedSubmission(s)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
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

      {/* Multi-Format Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />

      {/* Submission Inspector Modal (With 6-Part Question & Answer) */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Submission Assessment & Validation Inspector
                </span>
                <h2 className="text-2xl font-black text-white font-display">
                  Team: {selectedSubmission.team_name} [{selectedSubmission.team_domain || 'WEB DEVELOPMENT'}]
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Type: <strong className="text-white">{selectedSubmission.submission_type}</strong> • Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6-Part Question Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  Assigned Question (6 Parts)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  {selectedSubmission.question_domain}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white font-display">
                  1. Title: {selectedSubmission.question_title}
                </h3>
              </div>

              {selectedSubmission.question_situation && (
                <div className="text-xs space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400">2. Situation:</span>
                  <p className="text-slate-200 leading-relaxed font-sans">{selectedSubmission.question_situation}</p>
                </div>
              )}

              {selectedSubmission.question_task && (
                <div className="text-xs space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-purple-300">3. Your Task:</span>
                  <p className="text-purple-100 font-medium leading-relaxed font-sans">{selectedSubmission.question_task}</p>
                </div>
              )}

              {selectedSubmission.question_requirements && (
                <div className="text-xs space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">4. Functional Requirements:</span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{selectedSubmission.question_requirements}</p>
                </div>
              )}

              {selectedSubmission.question_technical_requirements && (
                <div className="text-xs space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400">5. Technical Requirements:</span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{selectedSubmission.question_technical_requirements}</p>
                </div>
              )}

              <div className="text-xs space-y-1 pt-1 border-t border-slate-800">
                <span className="font-mono text-[10px] uppercase font-bold text-cyan-300">6. Your Submission:</span>
                <p className="text-cyan-200 font-mono">{selectedSubmission.question_submission_guideline || 'Write one comprehensive prompt that you would give to an AI coding agent.'}</p>
              </div>
            </div>

            {/* Answer Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Submitted Prompt Solution for AI Coding Agent:
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Length: <strong>{(selectedSubmission.answer || '').length}</strong> chars •{' '}
                  <strong>{(selectedSubmission.answer || '').trim().split(/\s+/).filter(Boolean).length}</strong> words
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/25 text-xs font-mono text-cyan-100 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedSubmission.answer || '(Empty Response)'}
              </div>
            </div>

            {/* Integrity Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Tab Switches</span>
                <p className="font-bold text-amber-400 mt-1">{selectedSubmission.tab_switch_count || 0}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Fullscreen Exits</span>
                <p className="font-bold text-rose-400 mt-1">{selectedSubmission.fullscreen_exit_count || 0}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Copy Attempts</span>
                <p className="font-bold text-slate-300 mt-1">{selectedSubmission.copy_attempt_count || 0}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Paste Attempts</span>
                <p className="font-bold text-slate-300 mt-1">{selectedSubmission.paste_attempt_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
