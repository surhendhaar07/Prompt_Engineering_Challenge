import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import * as adminService from '../services/adminService';
import { AdminAuditLog } from '../types';
import {
  History,
  ShieldCheck,
  Search,
  RefreshCw,
  Lock,
  UserCheck
} from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAudit = useCallback(async () => {
    try {
      const data = await adminService.getAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit trail', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const filteredLogs = logs.filter(
    (l) =>
      l.admin_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  IMMUTABLE AUDIT TRAIL
                </span>
              </div>
              <h1 className="text-2xl font-black text-white font-display mt-1">Admin Audit Logs</h1>
              <p className="text-xs text-slate-400 font-mono">
                Complete forensic ledger of administrative interventions, password modifications, and question lifecycle events
              </p>
            </div>

            <button
              onClick={fetchAudit}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Search */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by admin, action or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="text-xs font-mono text-slate-400">
              Entries: <strong className="text-cyan-400">{filteredLogs.length}</strong>
            </div>
          </div>

          {/* Audit Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-900/50">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Admin Account</th>
                    <th className="py-3.5 px-4">Action Code</th>
                    <th className="py-3.5 px-4">Target Type</th>
                    <th className="py-3.5 px-4">Details / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        No administrative audit logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()} •{' '}
                          <span className="text-[10px] text-slate-600">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white font-sans text-sm">
                          {log.admin_username}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {log.target_type}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 font-sans text-xs max-w-md">
                          {log.details || '—'}
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
    </div>
  );
};
