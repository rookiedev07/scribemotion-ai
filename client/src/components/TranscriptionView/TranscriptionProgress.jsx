import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Activity as WaveIcon
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

export default function TranscriptionProgress({ onReady }) {
  const { project, setProject } = useProjectStore();
  const [segments, setSegments] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | streaming | complete | error
  const [errorText, setErrorText] = useState('');
  const [currentWordCount, setCurrentWordCount] = useState(0);

  const scrollRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!project?.id) return;

    setStatus('connecting');
    const sseUrl = `/api/projects/${project.id}/transcription/stream`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener('transcription_started', (e) => {
      setStatus('streaming');
    });

    es.addEventListener('segment_received', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const newSeg = payload.segment;

        setSegments((prev) => {
          // Avoid duplicate ids
          if (prev.some(s => s.id === newSeg.id)) return prev;
          const next = [...prev, newSeg];
          return next;
        });

        setCurrentWordCount((prev) => prev + (newSeg.words?.length || 0));

        // Auto-scroll feed down as new chunks stream in
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } catch (err) {
        console.error('Error parsing SSE segment:', err);
      }
    });

    es.addEventListener('transcription_complete', (e) => {
      try {
        const fullTranscript = JSON.parse(e.data);
        setStatus('complete');
        es.close();

        // Update Zustand store
        setProject({
          ...project,
          transcript: fullTranscript,
          status: 'ready'
        });

        // Smooth transition into editor
        setTimeout(() => {
          if (onReady) onReady();
        }, 800);
      } catch (err) {
        console.error('Error on transcription complete:', err);
      }
    });

    es.addEventListener('error', (e) => {
      // If error event contains data
      if (e.data) {
        try {
          const errObj = JSON.parse(e.data);
          setErrorText(errObj.message || 'Transcription error occurred');
        } catch (_) {
          setErrorText('Transcription connection interrupted');
        }
      }
      es.close();
    });

    es.onerror = () => {
      // SSE connection error fallback
      if (status !== 'complete') {
        // es.close();
      }
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [project?.id]);

  return (
    <div className="w-full max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[70vh] select-none">
      <div className="w-full bg-[#0d1117] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>AI Speech-to-Text Transcription</span>
                {status === 'streaming' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Extracting word-level timestamps with Whisper STT engine
              </p>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-indigo-400 font-bold">{segments.length}</span> segments
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-emerald-400 font-bold">{currentWordCount}</span> words
            </div>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer Animation */}
        <div className="flex items-center justify-center gap-1.5 h-12 py-2">
          {[40, 75, 90, 60, 100, 45, 80, 65, 95, 50, 85, 40, 70, 90, 60, 80, 50, 30].map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                status === 'complete'
                  ? 'bg-emerald-500 h-6'
                  : 'bg-indigo-500 animate-pulse'
              }`}
              style={{
                height: status === 'streaming' ? `${Math.max(12, h * 0.4)}px` : '10px',
                animationDelay: `${(i * 0.08).toFixed(2)}s`
              }}
            />
          ))}
        </div>

        {/* Live Streaming Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Live Transcript Stream
            </span>
            <span className="text-[11px] font-mono text-indigo-400">
              {status === 'complete' ? 'Transcription Finished' : 'Streaming incoming segments...'}
            </span>
          </div>

          <div
            ref={scrollRef}
            className="h-64 overflow-y-auto bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2.5 font-sans"
          >
            {segments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Extracting audio and initializing Whisper model...</span>
              </div>
            ) : (
              segments.map((seg, idx) => (
                <div
                  key={seg.id || idx}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs animate-slide-up flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="text-indigo-400 font-medium">Segment #{idx + 1}</span>
                    <span>
                      {seg.start.toFixed(2)}s → {seg.end.toFixed(2)}s
                    </span>
                  </div>

                  <p className="text-slate-100 font-medium text-sm leading-relaxed">
                    {seg.text}
                  </p>

                  {/* Word tokens breakdown */}
                  {seg.words && seg.words.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {seg.words.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px] border border-slate-700/50"
                          title={`${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s`}
                        >
                          {w.word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer / Transition Button */}
        {status === 'complete' && (
          <div className="pt-2 flex items-center justify-end animate-fade-in">
            <button
              onClick={onReady}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <span>Open Subtitle Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorText || 'Failed to stream transcription'}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded-lg bg-rose-800 text-white font-medium hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
