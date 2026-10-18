import React, { useState } from 'react';
import { Archive, Download, FileCode, CheckCircle2, Shield, FolderGit2, X, Sparkles } from 'lucide-react';
import { QrItem } from '../types';
import { exportAllCodesToZip } from '../utils/zipExporter';

interface ZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: QrItem[];
}

export const ZipExportModal: React.FC<ZipExportModalProps> = ({ isOpen, onClose, items }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setIsComplete(false);
    try {
      await exportAllCodesToZip(items, (status) => {
        setProgressStatus(status);
      });
      setIsComplete(true);
    } catch (err) {
      console.error('ZIP export error:', err);
      alert('Failed to generate ZIP archive. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export All Codes to ZIP</h3>
              <p className="text-xs text-slate-400">Complete source codebase & high-res QR bundle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contents Checklist */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300">
            The generated <code className="text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono">.zip</code> archive contains everything you requested:
          </p>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <FileCode className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Full Application Source Code</span>
                <span className="text-[11px] text-slate-400 block">
                  All React components, TypeScript files, utils, Tailwind config, and Vite setup
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Firebase Security & Database Blueprint</span>
                <span className="text-[11px] text-slate-400 block">
                  <code className="text-slate-300 font-mono">firestore.rules</code> and <code className="text-slate-300 font-mono">firebase-blueprint.json</code>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Standalone Offline Cinema Player</span>
                <span className="text-[11px] text-slate-400 block">
                  A self-contained HTML player that plays your videos anywhere with zero dependencies
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <FolderGit2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  High-Resolution QR Bundle ({items.length} Projects)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  1024x1024 PNGs + Manifest JSON for all your customized QR codes
                </span>
              </div>
            </div>
          </div>

          {progressStatus && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <span className="text-xs font-medium text-indigo-300 animate-pulse">{progressStatus}</span>
            </div>
          )}

          {isComplete && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold py-1">
              <CheckCircle2 className="w-4 h-4" /> Download started successfully!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Compiling ZIP Package...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Project & Codes ZIP
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
