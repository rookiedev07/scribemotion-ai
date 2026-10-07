import React, { useState } from 'react';
import EditorHeader from './EditorHeader';
import CaptionControls from './Controls/CaptionControls';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline/Timeline';
import ExportModal from '../ExportModal/ExportModal';
import KeyboardShortcutsModal from '../Common/KeyboardShortcutsModal';
import { Sparkles, Play } from 'lucide-react';

export default function SubtitleEditor() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  // On mobile: toggle between 'preview' and 'style' panels
  const [mobileTab, setMobileTab] = useState('preview');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090b10] text-slate-100 overflow-hidden select-none">
      {/* 1. Header */}
      <EditorHeader
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Mobile Tab Bar — only visible on small screens */}
      <div className="flex md:hidden border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            mobileTab === 'preview'
              ? 'text-white border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => setMobileTab('style')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            mobileTab === 'style'
              ? 'text-white border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Style & Captions
        </button>
      </div>

      {/* 2. Middle Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left Column: Caption Controls
            — hidden on mobile unless 'style' tab active
            — always visible on md+ */}
        <div className={`
          flex-shrink-0 h-full border-r border-slate-800/80 bg-[#0d1117] flex flex-col
          w-full md:w-80 lg:w-96
          ${mobileTab === 'style' ? 'flex' : 'hidden'} md:flex
        `}>
          <CaptionControls />
        </div>

        {/* Right Column: Video Preview
            — hidden on mobile unless 'preview' tab active
            — always visible on md+ */}
        <div className={`
          flex-1 h-full p-2 sm:p-4 flex items-center justify-center bg-[#090b10] overflow-hidden
          ${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex
        `}>
          <VideoPlayer />
        </div>
      </div>

      {/* 3. Timeline — shrinks on mobile */}
      <div className="flex-shrink-0">
        <Timeline />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
