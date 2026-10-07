import React from 'react';
import {
  Sparkles,
  Zap,
  Sliders,
  Film,
  Type,
  Cpu,
  Layers,
  Clock
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Word-Level Synchronization',
    description: 'Timestamp granularities down to the millisecond highlight each word exactly as it is spoken on screen.',
    badge: 'Whisper Powered'
  },
  {
    icon: Sparkles,
    title: 'Dynamic Motion Animations',
    description: 'Pop, scale bounce, and glowing typography styles maximize viewer attention and watch time on shorts & reels.',
    badge: '5 Presets'
  },
  {
    icon: Sliders,
    title: 'Zero Latency Live Preview',
    description: 'React caption overlay updates instantly on every font, size, or color tweak without waiting to re-render the video.',
    badge: 'Instant Feedback'
  },
  {
    icon: Film,
    title: 'FFmpeg Vector Burn-In',
    description: 'Generates Advanced SubStation Alpha (.ass) files for pixel-perfect embedded captions in high definition MP4.',
    badge: 'Hardware Fast'
  },
  {
    icon: Clock,
    title: 'Interactive Timeline Editor',
    description: 'Click to seek, drag to retime, split segments with keyboard shortcuts (S), or adjust transcripts inline.',
    badge: 'Keyboard Friendly'
  },
  {
    icon: Cpu,
    title: 'Modular Speech Architecture',
    description: 'Seamlessly switch between mock development mode and production OpenAI Whisper STT with zero code changes.',
    badge: 'Flexible Backend'
  }
];

export default function FeaturesSection({ refProp }) {
  return (
    <section ref={refProp} className="py-20 px-4 select-none relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Built for Creators & Developers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            Everything you need for viral subtitles
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            High performance architecture that keeps playback instant and rendering robust.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0d1117]/60 border border-slate-800/80 hover:border-slate-700/90 hover:bg-[#0d1117] transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
