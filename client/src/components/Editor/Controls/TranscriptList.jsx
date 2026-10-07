import React from 'react';
import { Play, Trash2, Scissors, Plus, Clock } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';

function formatTime(s) {
  if (isNaN(s)) return '0.00';
  return parseFloat(s).toFixed(2);
}

export default function TranscriptList() {
  const {
    project,
    currentTime,
    selectedSegmentId,
    setSelectedSegmentId,
    seekTo,
    updateSegment,
    deleteSegment,
    splitSegment,
    addSegment
  } = useProjectStore();

  const segments = project?.transcript?.segments || [];

  return (
    <div className="flex flex-col h-full">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {segments.length} Subtitle Segments
        </div>
        <button
          onClick={() => addSegment(currentTime)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm shadow-indigo-600/30 active:scale-95"
          title="Add caption at current playhead"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add at {currentTime.toFixed(1)}s</span>
        </button>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {segments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No caption segments found. Click "Add" above to create one.
          </div>
        ) : (
          segments.map((seg, idx) => {
            const isActive = currentTime >= seg.start && currentTime <= seg.end;
            const isSelected = selectedSegmentId === seg.id;

            return (
              <div
                key={seg.id || idx}
                onClick={() => setSelectedSegmentId(seg.id)}
                className={`p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${
                  isActive
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-md shadow-indigo-950/20'
                    : isSelected
                    ? 'bg-slate-800/70 border-slate-600'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/40'
                }`}
              >
                {/* Segment Header: Timing & Actions */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(seg.start);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 font-mono text-[11px] transition-colors border border-slate-700/60"
                      title="Seek to start"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{formatTime(seg.start)}s</span>
                    </button>
                    <span className="text-slate-600">→</span>
                    <span className="font-mono text-[11px] text-slate-400">{formatTime(seg.end)}s</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(seg.end - seg.start).toFixed(1)}s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Split button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Split at midpoint or current playhead if within bounds
                        const splitPoint = (currentTime > seg.start + 0.2 && currentTime < seg.end - 0.2)
                          ? parseFloat(currentTime.toFixed(2))
                          : parseFloat(((seg.start + seg.end) / 2).toFixed(2));
                        splitSegment(seg.id, splitPoint);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                      title="Split caption into two"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSegment(seg.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete caption"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Caption Text Input */}
                <textarea
                  value={seg.text}
                  onChange={(e) => updateSegment(seg.id, { text: e.target.value })}
                  rows={2}
                  className="w-full text-sm font-medium bg-slate-950/60 text-slate-100 p-2 rounded-lg border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed transition-all"
                  placeholder="Enter caption text..."
                />

                {/* Timing controls */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Start:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={seg.start}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val < seg.end) {
                          updateSegment(seg.id, { start: val });
                        }
                      }}
                      className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-200 text-center focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">End:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={seg.end}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > seg.start) {
                          updateSegment(seg.id, { end: val });
                        }
                      }}
                      className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-200 text-center focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  {seg.words && (
                    <div className="ml-auto text-[10px] text-slate-500">
                      {seg.words.length} words
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
