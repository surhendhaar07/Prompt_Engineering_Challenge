import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, FileCode, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { downloadExportReport } from '../services/adminService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successFormat, setSuccessFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: 'word' | 'excel' | 'pdf' | 'csv') => {
    setDownloadingFormat(format);
    try {
      await downloadExportReport(format);
      setSuccessFormat(format);
      setTimeout(() => setSuccessFormat(null), 3000);
    } catch (err) {
      alert(`Failed to export ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const exportOptions = [
    {
      format: 'word' as const,
      title: 'Word Format (.docx)',
      desc: 'Official submission dossier with full 6-part questions, team details, formatted prompt answers, and integrity logs.',
      icon: FileText,
      badge: 'OFFICIAL DOSSIER',
      accent: 'from-blue-600 to-cyan-600',
      border: 'hover:border-cyan-400',
      textColor: 'text-cyan-400',
    },
    {
      format: 'excel' as const,
      title: 'Excel Format (.xlsx)',
      desc: 'Structured multi-sheet workbook with team metrics, duration calculations, word counts, questions, and prompt solutions.',
      icon: FileSpreadsheet,
      badge: 'ANALYTICS SPREADSHEET',
      accent: 'from-emerald-600 to-teal-600',
      border: 'hover:border-emerald-400',
      textColor: 'text-emerald-400',
    },
    {
      format: 'pdf' as const,
      title: 'PDF Format (.pdf)',
      desc: 'Print-ready evaluation scorecard with symposium headers, per-team validation summary, questions, and submitted responses.',
      icon: FileCode,
      badge: 'PRINT SCORECARD',
      accent: 'from-rose-600 to-purple-600',
      border: 'hover:border-purple-400',
      textColor: 'text-purple-400',
    },
    {
      format: 'csv' as const,
      title: 'CSV Format (.csv)',
      desc: 'Standard RFC-4180 comma-separated values file for database pipelines and quick spreadsheet importing.',
      icon: Download,
      badge: 'RAW DATA',
      accent: 'from-slate-700 to-slate-800',
      border: 'hover:border-slate-500',
      textColor: 'text-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase mb-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              CONTEST VALIDATION & REPORTING
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              Export Symposium Results
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Select your desired file format for candidate validation and grading
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            const isDownloading = downloadingFormat === opt.format;
            const isSuccess = successFormat === opt.format;

            return (
              <div
                key={opt.format}
                onClick={() => !isDownloading && handleExport(opt.format)}
                className={`group cursor-pointer p-4 rounded-2xl bg-slate-900/80 border border-slate-800 transition-all duration-200 ${opt.border} hover:bg-slate-900 hover:shadow-lg flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${opt.textColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {opt.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-display mb-1 group-hover:text-cyan-300 transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {opt.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className={`font-semibold ${opt.textColor}`}>
                    {isDownloading ? 'Generating...' : isSuccess ? 'Downloaded!' : 'Download Report'}
                  </span>

                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Reports contain full 6-part questions and submitted prompts.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
