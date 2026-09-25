import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ConfirmationModal } from '../components/ConfirmationModal';
import * as adminService from '../services/adminService';
import { Question, ChallengeDomain } from '../types';
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Sparkles,
  FileCode,
  Globe
} from 'lucide-react';

const DEFAULT_SUBMISSION_GUIDELINE = 'Write one comprehensive prompt that you would give to an AI coding agent.';

export const AdminQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // 6-Part Form Fields
  const [formDomain, setFormDomain] = useState<ChallengeDomain>('WEB DEVELOPMENT');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formTitle, setFormTitle] = useState('');
  const [formSituation, setFormSituation] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formTechnicalRequirements, setFormTechnicalRequirements] = useState('');
  const [formSubmissionGuideline, setFormSubmissionGuideline] = useState(DEFAULT_SUBMISSION_GUIDELINE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await adminService.getQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSituation.trim() || !formTask.trim()) {
      setFormError('Title, Situation, and Task fields are required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminService.createQuestion({
        domain: formDomain,
        title: formTitle.trim(),
        situation: formSituation.trim(),
        task: formTask.trim(),
        requirements: formRequirements.trim(),
        technical_requirements: formTechnicalRequirements.trim(),
        submission_guideline: formSubmissionGuideline.trim() || DEFAULT_SUBMISSION_GUIDELINE,
        category: formDomain,
        difficulty: formDifficulty,
      });
      setIsCreateOpen(false);
      resetForm();
      await fetchQuestions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminService.updateQuestion(selectedQuestion.id, {
        domain: formDomain,
        title: formTitle.trim(),
        situation: formSituation.trim(),
        task: formTask.trim(),
        requirements: formRequirements.trim(),
        technical_requirements: formTechnicalRequirements.trim(),
        submission_guideline: formSubmissionGuideline.trim() || DEFAULT_SUBMISSION_GUIDELINE,
        category: formDomain,
        difficulty: formDifficulty,
      });
      setIsEditOpen(false);
      setSelectedQuestion(null);
      await fetchQuestions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormDomain('WEB DEVELOPMENT');
    setFormDifficulty('Medium');
    setFormTitle('');
    setFormSituation('');
    setFormTask('');
    setFormRequirements('');
    setFormTechnicalRequirements('');
    setFormSubmissionGuideline(DEFAULT_SUBMISSION_GUIDELINE);
    setFormError(null);
  };

  const handleToggleActive = async (q: Question) => {
    try {
      await adminService.toggleQuestion(q.id);
      await fetchQuestions();
    } catch (err) {
      alert('Failed to update question status');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    setIsSubmitting(true);
    try {
      await adminService.deleteQuestion(selectedQuestion.id);
      setIsDeleteOpen(false);
      setSelectedQuestion(null);
      await fetchQuestions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.question_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'ALL' || q.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const webDevCount = questions.filter((q) => q.domain === 'WEB DEVELOPMENT').length;
  const genAiCount = questions.filter((q) => q.domain === 'GEN AI APPLICATION').length;

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white font-display">6-Part Challenge Question Bank</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Domain 1: <strong className="text-cyan-400">Web Development ({webDevCount})</strong> • Domain 2: <strong className="text-purple-400">Gen AI Application ({genAiCount})</strong>
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create 6-Part Question</span>
            </button>
          </div>

          {/* Domain and Search Filters */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by question title or scenario..."
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
                <option value="ALL">All Domains (Both)</option>
                <option value="WEB DEVELOPMENT">1. WEB DEVELOPMENT</option>
                <option value="GEN AI APPLICATION">2. GEN AI APPLICATION</option>
              </select>

              <span className="text-xs font-mono text-slate-400 shrink-0">
                Questions: <strong className="text-cyan-400">{filteredQuestions.length}</strong>
              </span>
            </div>
          </div>

          {/* Question List rendering 6 structured parts */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-500 font-mono text-xs rounded-2xl">
                No questions found matching your domain filter.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`glass-panel p-6 rounded-2xl border transition-all ${
                    q.is_active ? 'border-slate-800 hover:border-cyan-500/40' : 'border-red-950/40 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider ${
                            q.domain === 'GEN AI APPLICATION'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {q.domain || 'WEB DEVELOPMENT'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                          {q.difficulty}
                        </span>
                        {q.is_active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                            DISABLED
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white font-display pt-1">
                        1. Title: {q.title || 'Challenge Question'}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => handleToggleActive(q)}
                        title={q.is_active ? 'Disable Question' : 'Enable Question'}
                        className={`p-2 rounded-xl text-xs font-mono border transition-colors ${
                          q.is_active
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-red-950/40 hover:text-red-300'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-emerald-950/40 hover:text-emerald-300'
                        }`}
                      >
                        {q.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setFormDomain(q.domain || 'WEB DEVELOPMENT');
                          setFormDifficulty(q.difficulty);
                          setFormTitle(q.title || '');
                          setFormSituation(q.situation || '');
                          setFormTask(q.task || '');
                          setFormRequirements(q.requirements || '');
                          setFormTechnicalRequirements(q.technical_requirements || '');
                          setFormSubmissionGuideline(q.submission_guideline || DEFAULT_SUBMISSION_GUIDELINE);
                          setFormError(null);
                          setIsEditOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 6 Parts Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs font-sans">
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="font-mono text-[10px] uppercase font-bold text-cyan-400">2. Situation</span>
                      <p className="text-slate-300 leading-relaxed">{q.situation || '—'}</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="font-mono text-[10px] uppercase font-bold text-purple-400">3. Your Task</span>
                      <p className="text-slate-300 leading-relaxed">{q.task || '—'}</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">4. Requirements</span>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{q.requirements || '—'}</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="font-mono text-[10px] uppercase font-bold text-amber-400">5. Technical Requirements</span>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{q.technical_requirements || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-[#080d1a] border border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center justify-between">
                    <span><strong>6. Your Submission:</strong> {q.submission_guideline || DEFAULT_SUBMISSION_GUIDELINE}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Create 6-Part Question Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white font-display">Create 6-Part Challenge Question</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Domain *</label>
                  <select
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value as ChallengeDomain)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-bold outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="WEB DEVELOPMENT">1. WEB DEVELOPMENT</option>
                    <option value="GEN AI APPLICATION">2. GEN AI APPLICATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">1. Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Real-Time Collaborative Whiteboard & Kanban Workspace"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans text-sm"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">2. Situation *</label>
                <textarea
                  required
                  rows={3}
                  value={formSituation}
                  onChange={(e) => setFormSituation(e.target.value)}
                  placeholder="Describe the real-world engineering context, team scenario, and problem background..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">3. Your Task *</label>
                <textarea
                  required
                  rows={2}
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  placeholder="State the core objective the prompt engineer must command the AI coding agent to execute..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">4. Requirements</label>
                <textarea
                  rows={3}
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  placeholder="Bullet points of functional user stories and UI expectations..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">5. Technical Requirements</label>
                <textarea
                  rows={3}
                  value={formTechnicalRequirements}
                  onChange={(e) => setFormTechnicalRequirements(e.target.value)}
                  placeholder="Tech stack, libraries, state management, latency constraints, database schema, security..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">6. Your Submission (Standardized Directive)</label>
                <input
                  type="text"
                  required
                  value={formSubmissionGuideline}
                  onChange={(e) => setFormSubmissionGuideline(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-mono text-xs"
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400"
                >
                  {isSubmitting ? 'Saving...' : 'Save 6-Part Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit 6-Part Question Modal */}
      {isEditOpen && selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white font-display">Edit 6-Part Challenge Question</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateQuestion} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Domain *</label>
                  <select
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value as ChallengeDomain)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-bold outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="WEB DEVELOPMENT">1. WEB DEVELOPMENT</option>
                    <option value="GEN AI APPLICATION">2. GEN AI APPLICATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">1. Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans text-sm"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">2. Situation *</label>
                <textarea
                  required
                  rows={3}
                  value={formSituation}
                  onChange={(e) => setFormSituation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">3. Your Task *</label>
                <textarea
                  required
                  rows={2}
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">4. Requirements</label>
                <textarea
                  rows={3}
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">5. Technical Requirements</label>
                <textarea
                  rows={3}
                  value={formTechnicalRequirements}
                  onChange={(e) => setFormTechnicalRequirements(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-sans leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-1 font-bold">6. Your Submission</label>
                <input
                  type="text"
                  required
                  value={formSubmissionGuideline}
                  onChange={(e) => setFormSubmissionGuideline(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400 font-mono text-xs"
                />
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Update 6-Part Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        title="Delete Question Prompt"
        message="Are you sure you want to delete this 6-part question from the bank?"
        confirmText="Yes, Delete Question"
        confirmVariant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteQuestion}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedQuestion(null);
        }}
      />
    </div>
  );
};
