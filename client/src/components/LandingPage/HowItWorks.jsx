import React from 'react';
import { UploadCloud, Mic, Sliders, Download, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: UploadCloud,
    title: 'Upload Video',
    desc: 'Drag and drop your MP4, MOV, WEBM, or MKV file. Backend extracts audio automatically.'
  },
  {
    step: '02',
    icon: Mic,
    title: 'AI Transcription',
    desc: 'Audio is processed to generate accurate segments with word-by-word timing.'
  },
  {
    step: '03',
    icon: Sliders,
    title: 'Style & Preview',
    desc: 'Pick from clean, bold, or highlight templates. Edit text, reposition captions, and test live playback.'
  },
  {
    step: '04',
    icon: Download,
    title: 'Export with FFmpeg',
    desc: 'Burn subtitles into your original video using hardware-accelerated FFmpeg and download the MP4.'
  }
];

export default function HowItWorks({ refProp }) {
  return (
    <section ref={refProp} className="py-20 px-4 border-t border-slate-800/80 bg-slate-950/40 select-none">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            How ScribeMotion Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            From raw footage to published viral content in under two minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-[#0d1117]/80 border border-slate-800/80 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-indigo-500/30">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {s.desc}
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
