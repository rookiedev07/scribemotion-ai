import React, { useState } from 'react';
import { Film, Zap, Menu, X } from 'lucide-react';

export default function Navbar({ onScrollToFeatures, onScrollToHowItWorks }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (fn) => {
    fn?.();
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#090b10]/80 backdrop-blur-xl border-b border-slate-800/80 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Film className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white font-display">
              Scribe<span className="text-indigo-400">Motion</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300 font-semibold uppercase">
              AI MVP
            </span>
          </div>
        </div>

        {/* Desktop Centre Nav */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button onClick={onScrollToFeatures} className="hover:text-white transition-colors">
            Features
          </button>
          <button onClick={onScrollToHowItWorks} className="hover:text-white transition-colors">
            Workflow
          </button>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local FFmpeg Ready</span>
          </div>
        </div>

        {/* Right: Whisper badge + mobile menu toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Whisper STT</span>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#090b10]/95 px-4 pb-4 pt-3 flex flex-col gap-3 text-sm font-semibold text-slate-300">
          <button
            onClick={() => handleNav(onScrollToFeatures)}
            className="text-left hover:text-white transition-colors py-1"
          >
            Features
          </button>
          <button
            onClick={() => handleNav(onScrollToHowItWorks)}
            className="text-left hover:text-white transition-colors py-1"
          >
            Workflow
          </button>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local FFmpeg Ready</span>
          </div>
        </div>
      )}
    </nav>
  );
}
