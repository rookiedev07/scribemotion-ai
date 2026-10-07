import React, { useState } from 'react';
import {
  Sparkles,
  Type,
  Palette,
  Layout,
  Sliders,
  AlignVerticalSpaceAround,
  FileText,
  SlidersHorizontal,
  Flame,
  Check
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { CAPTION_STYLES, AVAILABLE_FONTS, COLOR_PRESETS } from '../CaptionRenderer/styles';
import TranscriptList from './TranscriptList';

export default function CaptionControls() {
  const { project, updateCaptionStyle, applyTemplate } = useProjectStore();
  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'transcript'

  const captionStyle = project?.captionStyle || CAPTION_STYLES.tiktok;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-slate-800/80 overflow-hidden select-none">
      {/* Tab Switcher Header */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 p-2 gap-1.5">
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'style'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Style & Animation</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'transcript'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Edit Captions</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'transcript' ? (
          <TranscriptList />
        ) : (
          <div className="p-4 space-y-6">
            {/* 1. Preset Style Templates */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-indigo-400" />
                  Preset Templates
                </label>
                <span className="text-[11px] text-slate-500">One-click style</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(CAPTION_STYLES).map((tpl) => {
                  const isSelected = captionStyle.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-sm shadow-indigo-500/20'
                          : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{tpl.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {tpl.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Typography: Font Family & Size */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                Typography
              </label>

              {/* Font Family */}
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Font Family</span>
                <select
                  value={captionStyle.fontFamily || 'Outfit'}
                  onChange={(e) => updateCaptionStyle({ fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Font Size</span>
                  <span className="font-mono text-indigo-300 font-semibold">{captionStyle.fontSize || 26}px <span className="text-slate-500 text-[9px]">(base)</span></span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="48"
                  value={captionStyle.fontSize || 26}
                  onChange={(e) => updateCaptionStyle({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-800 rounded cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Text Transform */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Letter Casing</span>
                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button
                    onClick={() => updateCaptionStyle({ textTransform: 'uppercase' })}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      captionStyle.textTransform === 'uppercase'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    UPPERCASE
                  </button>
                  <button
                    onClick={() => updateCaptionStyle({ textTransform: 'none' })}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      captionStyle.textTransform !== 'uppercase'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Natural
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Color Customization */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Colors & Highlights
              </label>

              {/* Active Spoken Word Highlight Color */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Word Highlight Color</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: captionStyle.highlightColor || '#FACC15' }}
                    />
                    <span className="font-mono text-xs uppercase text-slate-300">
                      {captionStyle.highlightColor || '#FACC15'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateCaptionStyle({ highlightColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                        captionStyle.highlightColor === color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={captionStyle.highlightColor || '#FACC15'}
                    onChange={(e) => updateCaptionStyle({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Primary Text Color */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Primary Text Color</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: captionStyle.color || '#FFFFFF' }}
                    />
                    <span className="font-mono text-xs uppercase text-slate-300">
                      {captionStyle.color || '#FFFFFF'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateCaptionStyle({ color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                        captionStyle.color === color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={captionStyle.color || '#FFFFFF'}
                    onChange={(e) => updateCaptionStyle({ color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                    title="Custom color"
                  />
                </div>
              </div>
            </div>

            {/* 4. Position & Placement */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlignVerticalSpaceAround className="w-3.5 h-3.5 text-indigo-400" />
                Position & Alignment
              </label>

              {/* Position Top / Center / Bottom */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['top', 'center', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateCaptionStyle({ position: pos })}
                    className={`py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      captionStyle.position === pos
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Vertical Offset Slider */}
              {captionStyle.position !== 'center' && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Edge Offset</span>
                    <span className="font-mono text-indigo-300">{captionStyle.verticalOffset || 12}%</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="35"
                    value={captionStyle.verticalOffset || 12}
                    onChange={(e) => updateCaptionStyle({ verticalOffset: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-800 rounded cursor-pointer accent-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 5. Animation Style */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Spoken Word Animation
              </label>

              <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-center">
                {[
                  { id: 'pop', label: 'Pop' },
                  { id: 'bounce', label: 'Bounce' },
                  { id: 'fade', label: 'Fade' },
                  { id: 'none', label: 'Static' }
                ].map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => updateCaptionStyle({ animation: anim.id })}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      captionStyle.animation === anim.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
