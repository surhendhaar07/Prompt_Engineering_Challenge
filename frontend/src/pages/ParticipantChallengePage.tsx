import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CountdownTimer } from '../components/CountdownTimer';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { FullscreenEnforcer } from '../components/FullscreenEnforcer';
import { SecurityShield } from '../components/SecurityShield';
import { ViolationModal } from '../components/ViolationModal';
import { AlertBanner } from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import * as challengeService from '../services/challengeService';
import { Challenge, Question } from '../types';
import {
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  Check,
  AlertCircle,
  Maximize2,
  Layers,
  Code2,
  CheckSquare,
  Cpu,
  Target
} from 'lucide-react';

export const ParticipantChallengePage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [autosaveStatus, setAutosaveStatus] = useState<string>('All changes saved');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const warningTimerRef = useRef<any>(null);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const handleWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 9000);
  }, []);

  // Initialize Anti-Cheat & Proctoring Hook
  const {
    isFullscreen,
    isPrivacyShieldActive,
    tabSwitches,
    violationState,
    acknowledgeViolation,
    requestFullscreen,
  } = useAntiCheat({
    challengeId: challenge?.id,
    teamName: user?.teamName || user?.username || 'PARTICIPANT',
    teamNumber: user?.teamNumber || 'XT-00',
    isActive: !!challenge && challenge.status === 'IN_PROGRESS',
    onWarning: handleWarning,
  });

  // Fetch current challenge status
  const fetchChallenge = useCallback(async () => {
    try {
      const data = await challengeService.getCurrentChallenge();
      if (!data || !data.challenge || data.status === 'NOT_STARTED') {
        navigate('/challenge');
        return;
      }

      if (['SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED'].includes(data.challenge.status)) {
        navigate('/challenge/completed');
        return;
      }

      setChallenge(data.challenge);
      if (data.question) setQuestion(data.question);
      if (data.challenge.current_draft) {
        setDraft(data.challenge.current_draft);
      }
    } catch (err) {
      console.error('Error loading challenge:', err);
      navigate('/challenge');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  // Real-time socket events from admin
  useEffect(() => {
    if (!socket) return;

    socket.on('challenge:autoSubmitted', (data: any) => {
      navigate('/challenge/completed');
    });

    socket.on('challenge:reset', () => {
      alert('Your challenge has been reset by the event administrator.');
      navigate('/challenge');
    });

    socket.on('challenge:reassigned', () => {
      alert('Your challenge has been reassigned by the event administrator.');
      fetchChallenge();
    });

    return () => {
      socket.off('challenge:autoSubmitted');
      socket.off('challenge:reset');
      socket.off('challenge:reassigned');
    };
  }, [socket, navigate, fetchChallenge]);

  // Throttled Autosave Draft to server
  useEffect(() => {
    if (!challenge || challenge.status !== 'IN_PROGRESS') return;

    const timer = setTimeout(async () => {
      setAutosaveStatus('Saving draft...');
      try {
        await challengeService.saveDraft(draft);
        setAutosaveStatus('Saved to server');
      } catch (err) {
        setAutosaveStatus('Offline (saved locally)');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [draft, challenge]);

  // Controlled change handler with bulk insertion guard
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const addedCount = newVal.length - draft.length;

    // If an insertion suddenly adds more than 35 characters in a single micro-event
    if (addedCount > 35) {
      setWarningMessage('Bulk text pasting is blocked. Please type your response directly into the workspace.');
      return;
    }
    setDraft(newVal);
  };

  // Handle Manual Submission
  const handleSubmit = async (type: 'MANUAL' | 'AUTO' = 'MANUAL') => {
    setIsSubmitting(true);
    try {
      await challengeService.submitChallenge(draftRef.current, type);
      setIsConfirmOpen(false);
      navigate('/challenge/completed');
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.response?.data?.error || 'Failed to submit response.');
      setIsSubmitting(false);
    }
  };

  // Auto-Submit Handler when timer hits 00:00
  const handleTimerExpire = useCallback(() => {
    console.log('[Timer] Expired. Submitting response automatically...');
    handleSubmit('AUTO');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-wider">LOADING CHALLENGE WORKSPACE...</p>
        </div>
      </div>
    );
  }

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;
  const lineCount = draft.split('\n').length;

  return (
    <div className="min-h-screen bg-[#070b14] bg-cyber-grid flex flex-col text-slate-100 select-none relative">
      {/* Forensic Watermark & Privacy Shutter Shield */}
      <SecurityShield
        isActive={!!challenge && challenge.status === 'IN_PROGRESS'}
        isPrivacyShieldActive={isPrivacyShieldActive}
        teamName={user?.teamName || user?.username || 'PARTICIPANT'}
        teamNumber={user?.teamNumber || 'XT-00'}
      />

      {/* Anti-Cheat Notifications & Enforcers */}
      <AlertBanner
        message={warningMessage}
        onClose={() => setWarningMessage(null)}
        type="warning"
      />

      {/* Proctoring Violation Modal for Alt+Tab / Tab Switch / Window Blur */}
      <ViolationModal
        isOpen={violationState.isOpen}
        violationCount={violationState.count}
        reason={violationState.reason}
        timestamp={violationState.timestamp}
        onAcknowledge={acknowledgeViolation}
      />

      <FullscreenEnforcer
        isFullscreen={isFullscreen}
        onRequestFullscreen={requestFullscreen}
        isActive={!!challenge && challenge.status === 'IN_PROGRESS'}
      />

      {/* Header Navigation with Live Synchronized Timer & Fullscreen Control */}
      <Navbar
        onRequestFullscreen={requestFullscreen}
        isFullscreen={isFullscreen}
        customRightContent={
          challenge && (
            <CountdownTimer
              expiresAt={challenge.expires_at}
              onExpire={handleTimerExpire}
              size="md"
              showLabel={true}
            />
          )
        }
      />

      {/* Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left: 6-Part Question Card (Takes 50% width on desktop for optimal reading) */}
        <section className="lg:w-1/2 flex flex-col glass-panel p-6 rounded-2xl border border-cyan-500/25 relative overflow-y-auto max-h-[82vh] space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                <Target className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Assigned Problem Scenario
              </span>
            </div>

            {question && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider ${
                    question.domain === 'GEN AI APPLICATION'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {question.domain || 'WEB DEVELOPMENT'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300">
                  {question.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Part 1: Title */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              1. Title
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white font-display mt-0.5">
              {question?.title || 'Prompt Engineering Challenge'}
            </h2>
          </div>

          {/* Part 2: Situation */}
          <div className="p-4 rounded-xl bg-[#090e1a]/90 border border-slate-800/90 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Situation</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {question?.situation || question?.question_text}
            </p>
          </div>

          {/* Part 3: Your Task */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-purple-300">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>3. Your Task</span>
            </div>
            <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed font-sans">
              {question?.task || 'Design a comprehensive system prompt that guides an AI coding agent to implement the solution.'}
            </p>
          </div>

          {/* Part 4: Requirements */}
          {question?.requirements && (
            <div className="p-4 rounded-xl bg-[#090e1a]/90 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-emerald-400">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>4. Functional Requirements</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {question.requirements}
              </p>
            </div>
          )}

          {/* Part 5: Technical Requirements */}
          {question?.technical_requirements && (
            <div className="p-4 rounded-xl bg-[#090e1a]/90 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-amber-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>5. Technical Requirements</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {question.technical_requirements}
              </p>
            </div>
          )}

          {/* Part 6: Your Submission */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-1 shadow-[0_0_15px_rgba(0,210,255,0.1)]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-cyan-300">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>6. Your Submission</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white font-mono leading-relaxed">
              "{question?.submission_guideline || 'Write one comprehensive prompt that you would give to an AI coding agent.'}"
            </p>
          </div>
        </section>

        {/* Right: Prompt Editor Workspace (Takes 50% width on desktop) */}
        <section className="lg:w-1/2 flex flex-col glass-panel p-6 rounded-2xl border border-cyan-500/20 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/30">
                <FileText className="w-4 h-4" />
              </span>
              <label htmlFor="prompt-editor" className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Enter Your Prompt
              </label>
            </div>

            {/* Autosave Status */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{autosaveStatus}</span>
            </div>
          </div>

          {/* Textarea Editor Area */}
          <div className="flex-1 flex flex-col min-h-[380px] relative">
            <textarea
              id="prompt-editor"
              value={draft}
              onChange={handleDraftChange}
              placeholder="Write your complete prompt here for the AI coding agent... Include persona instructions, task decomposition, architectural specifications, file structure, test cases, and edge-case guardrails."
              className="flex-1 w-full p-4 rounded-xl bg-[#090e1a] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder-slate-600 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none transition-all shadow-inner"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Bottom Editor Toolbar */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Word, Char, & Tab Switch Counters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Words: <strong className="text-cyan-400">{wordCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Chars: <strong className="text-cyan-400">{charCount}</strong>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                  tabSwitches > 0
                    ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
                title="Monitored by proctoring engine"
              >
                <span>Tab Switches:</span>
                <strong className={tabSwitches > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {tabSwitches}
                </strong>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isFullscreen && (
                <button
                  type="button"
                  onClick={requestFullscreen}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSubmitting || !draft.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold font-display tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_20px_rgba(0,210,255,0.35)] transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT ANSWER</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Manual Submission Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Submit Prompt Solution?"
        message="Are you sure you want to finalize and submit your prompt? Once submitted, your response will be locked and cannot be edited."
        confirmText="Yes, Submit Response"
        cancelText="Keep Editing"
        confirmVariant="primary"
        isLoading={isSubmitting}
        onConfirm={() => handleSubmit('MANUAL')}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
