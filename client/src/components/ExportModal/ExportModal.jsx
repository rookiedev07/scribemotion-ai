import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProjectStore } from '../../store/useProjectStore';

const PHASES = [
  { id: 'preparing', label: 'Preparing subtitles...' },
  { id: 'rendering', label: 'Rendering video...' },
  { id: 'encoding', label: 'Encoding with FFmpeg...' },
  { id: 'finishing', label: 'Finishing...' },
  { id: 'complete', label: 'Export complete' }
];

export default function ExportModal({ isOpen, onClose }) {
  const { project, setExportState } = useProjectStore();

  const [status, setStatus] = useState('idle'); // idle | loading | complete | error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pollingRef = useRef(null);

  // Trigger export when modal opens
  useEffect(() => {
    if (!isOpen || !project) return;

    startExport();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen]);

  const startExport = async () => {
    if (!project) return;

    setStatus('loading');
    setProgress(5);
    setMessage('Initializing export...');
    setErrorMessage('');
    setDownloadUrl(null);

    try {
      // 1. Send export request to backend
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: project.transcript,
          captionStyle: project.captionStyle
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed with status ${res.status}`);
      }

      // 2. Poll export status
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/projects/${project.id}/export/status`);
          if (!statusRes.ok) return;

          const data = await statusRes.json();
          setProgress(data.progress || 10);
          setMessage(data.message || 'Processing...');

          if (data.status === 'complete') {
            clearInterval(pollingRef.current);
            setStatus('complete');
            setProgress(100);
            setMessage('Export complete');
            setDownloadUrl(data.url);
            setExportState(data);

            // Celebrate with confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch (e) {}
          } else if (data.status === 'error') {
            clearInterval(pollingRef.current);
            setStatus('error');
            setErrorMessage(data.error || 'FFmpeg export encountered an error');
          }
        } catch (err) {
          console.error('Export status polling error:', err);
        }
      }, 600);
    } catch (err) {
      console.error('Failed to initiate export:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Network or server error while exporting');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {status === 'complete' ? 'Video Ready to Download' : 'Exporting Subtitled Video'}
              </h2>
              <p className="text-xs text-slate-400">
                {status === 'complete' ? 'Burned-in subtitles rendered with FFmpeg' : 'Processing MP4 with high-resolution captions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 space-y-6">
          {/* Phase 1 & 2: Loading & Progress */}
          {status === 'loading' && (
            <div className="space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {message}
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 shadow-sm shadow-indigo-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Progress Phase Checklist */}
              <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                {PHASES.map((phase, idx) => {
                  const phaseThreshold = (idx + 1) * 20;
                  const isDone = progress >= phaseThreshold;
                  const isCurrent = progress < phaseThreshold && progress >= idx * 20;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-2.5 text-xs transition-colors ${
                        isDone ? 'text-emerald-400 font-medium' : isCurrent ? 'text-indigo-300 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                      )}
                      <span>{phase.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phase 3: Complete */}
          {status === 'complete' && (
            <div className="text-center space-y-5 animate-slide-up">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Subtitles Successfully Burned!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your video has been rendered with full word-level animation and synced captions.
                </p>
              </div>

              {/* Video Preview If Available */}
              {downloadUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/60 max-h-48 flex items-center justify-center">
                  <video
                    src={downloadUrl}
                    controls
                    playsInline
                    className="max-h-48 w-auto mx-auto rounded-lg"
                  />
                </div>
              )}

              {/* Download CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
                <a
                  href={downloadUrl}
                  download={project?.video?.filename ? `subtitled_${project.video.filename}` : 'subtitled_video.mp4'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download MP4 Video</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: Error */}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">Export Encountered an Issue</h3>
                <p className="text-xs text-rose-400 mt-1 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50 font-mono text-left break-all">
                  {errorMessage || 'Unknown error occurred during video rendering.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={startExport}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Retry Export
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
