import React, { useRef, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
  Plus,
  Undo2,
  Redo2,
  Clock
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';

function formatSeconds(secs) {
  if (isNaN(secs)) return '00:00.0';
  const mins = Math.floor(secs / 60);
  const remSecs = (secs % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${remSecs.padStart(4, '0')}`;
}

export default function Timeline() {
  const rulerRef = useRef(null);

  const {
    project,
    currentTime,
    seekTo,
    isPlaying,
    setIsPlaying,
    selectedSegmentId,
    setSelectedSegmentId,
    splitSegment,
    deleteSegment,
    addSegment,
    undo,
    redo,
    history
  } = useProjectStore();

  const duration = Math.max(1, project?.video?.duration || 10);
  const segments = project?.transcript?.segments || [];

  // Calculate ticks for ruler
  const tickInterval = duration > 60 ? 10 : duration > 20 ? 5 : 2;
  const ticks = [];
  for (let t = 0; t <= Math.ceil(duration); t += tickInterval) {
    ticks.push(t);
  }

  // Handle clicking on ruler / timeline track to seek
  const handleTimelineClick = useCallback(
    (e) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = parseFloat((percentage * duration).toFixed(2));
      seekTo(newTime);
    },
    [duration, seekTo]
  );

  // Playhead position percentage
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      // Space -> Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }

      // Left Arrow -> -1s
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 1));
      }

      // Right Arrow -> +1s
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(Math.min(duration, currentTime + 1));
      }

      // Ctrl+Z or Cmd+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z or Ctrl+Y -> Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ') ||
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY')
      ) {
        e.preventDefault();
        redo();
      }

      // S key -> Split segment at playhead
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Find segment currently under playhead
        const currentSeg = segments.find(
          (s) => currentTime > s.start + 0.2 && currentTime < s.end - 0.2
        );
        if (currentSeg) {
          splitSegment(currentSeg.id, parseFloat(currentTime.toFixed(2)));
        }
      }

      // Delete key -> Delete selected segment
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedSegmentId) {
          e.preventDefault();
          deleteSegment(selectedSegmentId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    seekTo,
    undo,
    redo,
    segments,
    splitSegment,
    selectedSegmentId,
    deleteSegment
  ]);

  return (
    <div className="w-full bg-[#0d1117] border-t border-slate-800/80 p-3 select-none flex flex-col gap-2">
      {/* Top Timeline Toolbar */}
      <div className="flex items-center justify-between text-xs px-2">
        {/* Playback & Seek buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-sm shadow-indigo-600/30"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => seekTo(Math.max(0, currentTime - 1))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Step Back 1s (←)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => seekTo(Math.min(duration, currentTime + 1))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Step Forward 1s (→)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Time display */}
          <div className="flex items-center gap-1 font-mono text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-white font-medium">{formatSeconds(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5">
          {/* Split */}
          <button
            onClick={() => {
              const activeSeg = segments.find(
                (s) => currentTime > s.start + 0.2 && currentTime < s.end - 0.2
              );
              if (activeSeg) {
                splitSegment(activeSeg.id, parseFloat(currentTime.toFixed(2)));
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/50"
            title="Split segment at playhead (S)"
          >
            <Scissors className="w-3 h-3 text-indigo-400" />
            <span>Split (S)</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (selectedSegmentId) deleteSegment(selectedSegmentId);
            }}
            disabled={!selectedSegmentId}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
              selectedSegmentId
                ? 'bg-rose-950/30 border-rose-800/50 text-rose-300 hover:bg-rose-900/40'
                : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Delete selected caption (Del)"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>

          {/* Add */}
          <button
            onClick={() => addSegment(currentTime)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/50"
            title="Add segment at playhead"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Add</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            className={`p-1.5 rounded-lg transition-colors ${
              history.past.length > 0 ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={redo}
            disabled={history.future.length === 0}
            className={`p-1.5 rounded-lg transition-colors ${
              history.future.length > 0 ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Timeline Track & Ruler */}
      <div
        ref={rulerRef}
        onClick={handleTimelineClick}
        className="relative w-full h-24 bg-[#090b10] rounded-xl border border-slate-800/90 overflow-hidden cursor-pointer select-none group"
      >
        {/* Time Tick Marks (Ruler) */}
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-800/70 bg-slate-900/40 flex items-center px-1">
          {ticks.map((t) => {
            const leftPct = (t / duration) * 100;
            return (
              <div
                key={t}
                className="absolute flex flex-col items-center pointer-events-none transform -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
              >
                <div className="w-px h-2 bg-slate-700" />
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">{t}s</span>
              </div>
            );
          })}
        </div>

        {/* Captions Blocks Track */}
        <div className="absolute top-7 bottom-1 left-0 right-0 px-1 py-1">
          {segments.map((seg) => {
            const startPct = Math.max(0, (seg.start / duration) * 100);
            const widthPct = Math.min(100 - startPct, Math.max(1.5, ((seg.end - seg.start) / duration) * 100));

            const isCurrent = currentTime >= seg.start && currentTime <= seg.end;
            const isSelected = selectedSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegmentId(seg.id);
                  seekTo(seg.start);
                }}
                className={`absolute top-1 bottom-1 rounded-lg border text-xs px-2 flex items-center overflow-hidden transition-all duration-100 ${
                  isCurrent
                    ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-md shadow-indigo-600/30 z-10'
                    : isSelected
                    ? 'bg-slate-700/60 border-slate-400 text-slate-100 z-10'
                    : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                }`}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`
                }}
                title={`[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`}
              >
                <span className="truncate text-[11px] font-medium leading-none">
                  {seg.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Vertical Red Playhead Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transform -translate-x-1/2 shadow-lg shadow-rose-500/50"
          style={{ left: `${playheadPercent}%` }}
        >
          {/* Top scrubber badge */}
          <div className="w-2.5 h-3 bg-rose-500 rounded-b-sm -ml-1 -mt-0.5 shadow-sm shadow-rose-500/80" />
        </div>
      </div>
    </div>
  );
}
