import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import * as adminService from '../services/adminService';
import { SystemSettings } from '../types';
import {
  Settings,
  Save,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    challenge_duration_minutes: 30,
    active_questions_count: 12,
    random_assignment_enabled: true,
    unique_questions_enabled: true,
    copy_paste_monitoring_enabled: true,
    tab_switch_monitoring_enabled: true,
    fullscreen_monitoring_enabled: true,
    right_click_prevention_enabled: true,
    allow_manual_reassign: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const updated = await adminService.updateSettings(settings);
      setSettings(updated.settings);
      setSuccessMessage('Symposium contest settings updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-black text-white font-display">Challenge Configuration</h1>
              <p className="text-xs text-slate-400 font-mono">
                Symposium duration, question distribution policies, and proctoring parameters
              </p>
            </div>

            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
            {/* Contest Timing Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold font-display text-sm">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Timer & Duration Controls</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Challenge Duration (Minutes)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2 font-sans">
                    Default: 30 minutes. Server enforces auto-submit strictly upon expiry.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={settings.challenge_duration_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        challenge_duration_minutes: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Number of Active Questions to Use from Pool
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2 font-sans">
                    Restricts question allocation to the first N active questions.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.active_questions_count}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        active_questions_count: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Question Allocation Policy */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold font-display text-sm">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Question Allocation Policy</span>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.random_assignment_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, random_assignment_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div>
                    <strong className="text-white">Random Question Assignment</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Randomly select from the active question bank upon team challenge initialization.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.unique_questions_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, unique_questions_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div>
                    <strong className="text-white">Unique Question Per Team (Prevent Duplicates)</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ensures each team receives a distinct challenge question until the active pool is exhausted.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Anti-Cheat & Proctoring Policy */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold font-display text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anti-Cheat & Proctoring Sensitivity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tab_switch_monitoring_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, tab_switch_monitoring_enabled: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-200">Tab Switch / Blur Detection</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.fullscreen_monitoring_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, fullscreen_monitoring_enabled: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-200">Fullscreen Exit Monitoring</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.copy_paste_monitoring_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, copy_paste_monitoring_enabled: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-200">Copy / Paste Restriction</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.right_click_prevention_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, right_click_prevention_enabled: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-200">Right-Click Prevention</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 rounded-xl font-bold font-display tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 shadow-[0_0_25px_rgba(0,210,255,0.4)] transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'SAVING CONFIGURATION...' : 'SAVE SETTINGS'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
