import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause video playback' },
  { key: '← / →', desc: 'Step backward / forward by 1 second' },
  { key: 'S', desc: 'Split caption segment at playhead position' },
  { key: 'Delete', desc: 'Delete currently selected caption segment' },
  { key: 'Ctrl + Z', desc: 'Undo previous caption or style edit' },
  { key: 'Ctrl + Shift + Z', desc: 'Redo previously undone edit' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-2.5">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
            >
              <span className="text-slate-300 font-medium">{item.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-indigo-300 font-bold shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
