import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import * as challengeService from '../services/challengeService';
import { CheckCircle, Award, Clock, ShieldCheck, FileCheck2, Sparkles } from 'lucide-react';

export const ParticipantCompletionPage: React.FC = () => {
  const { user } = useAuth();
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);

  useEffect(() => {
    // Trigger celebratory confetti on completion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00d2ff', '#c026d3', '#ff5722', '#10b981'],
    });

    const fetchDetails = async () => {
      try {
        const data = await challengeService.getCurrentChallenge();
        if (data && data.challenge) {
          setSubmissionDetails(data.challenge);
        }
      } catch (err) {
        console.error('Failed to load submission receipt', err);
      }
    };

    fetchDetails();
  }, []);

  const submittedDate = submissionDetails?.submitted_at
    ? new Date(submissionDetails.submitted_at).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  const submissionType = submissionDetails?.submission_type || 'MANUAL';

  return (
    <div className="min-h-screen bg-[#070b14] bg-cyber-grid bg-radial-gradient flex flex-col text-slate-100">
      <Navbar hideLogout={false} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-cyan-500/30 shadow-2xl text-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 mx-auto mb-6 shadow-[0_0_30px_rgba(0,210,255,0.4)]">
            <div className="w-full h-full bg-[#090e1a] rounded-[22px] flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-cyan-400 animate-in zoom-in" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            CHALLENGE CONCLUDED
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white font-display uppercase tracking-wider mb-2">
            Submission Successful
          </h1>

          <p className="text-sm text-slate-300 max-w-md mx-auto mb-8">
            Your engineered prompt has been recorded securely in the symposium database. Evaluation is underway.
          </p>

          {/* Receipt Card */}
          <div className="bg-[#090e1a]/90 border border-slate-800 rounded-2xl p-6 text-left space-y-4 mb-8 font-mono text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Team</span>
              <span className="text-cyan-300 font-bold">{user?.teamName || user?.username}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Submission Type</span>
              <span className="text-emerald-400 font-semibold uppercase">{submissionType}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Submitted At</span>
              <span className="text-slate-200">{submittedDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Contest Integrity</span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Logged & Verified
              </span>
            </div>
          </div>

          {/* Symposium Outro Banner */}
          <div className="pt-6 border-t border-slate-800">
            <p className="text-sm font-semibold text-slate-200 font-display">
              Thank you for participating in <span className="text-cyan-400 font-bold">XenTriX'26</span>
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Innovate • Inspire • Elevate
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
