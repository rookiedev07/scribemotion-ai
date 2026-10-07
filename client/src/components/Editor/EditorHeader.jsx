import React from 'react';
import {
  ChevronLeft,
  Download,
  Sparkles,
  Command,
  Film,
  Undo2,
  Redo2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

export default function EditorHeader({ onOpenExport, onOpenShortcuts }) {
  const { project, resetProject, undo, redo, history } = useProjectStore();

  const filename = project?.video?.filename || 'video.mp4';
  const duration = project?.video?.duration ? `${project.video.duration.toFixed(1)}s` : '';
  const segmentCount = project?.transcript?.segments?.length || 0;

  const handleBack = () => {
    if (window.confirm('Return to landing page? Any unsaved edits will be cleared.')) {
      resetProject();
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0d1117] px-4 flex items-center justify-between select-none z-40">
      {/* Left: Back & Video info */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 text-xs font-semibold transition-colors"
          title="Return to home"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Film className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 truncate max-w-[220px]">
              {filename}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>{duration}</span>
              <span>•</span>
              <span className="text-indigo-400">{segmentCount} captions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: History & Quick status */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={undo}
          disabled={history.past.length === 0}
          className={`p-1.5 rounded-lg transition-colors ${
            history.past.length > 0 ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={history.future.length === 0}
          className={`p-1.5 rounded-lg transition-colors ${
            history.future.length > 0 ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          <span>Live Preview Active</span>
        </div>
      </div>

      {/* Right: Shortcuts trigger & Export CTA */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Keyboard shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
}
