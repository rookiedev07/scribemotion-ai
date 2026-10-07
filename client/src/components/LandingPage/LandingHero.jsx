import React from 'react';
import { Sparkles, Zap, ShieldCheck, Video } from 'lucide-react';
import VideoUploader from './VideoUploader';

export default function LandingHero({ onUploaded }) {
  return (
    <section className="relative pt-12 pb-16 px-4 overflow-hidden select-none">
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Top Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Word-Synchronized Subtitles</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-display leading-[1.15]">
          Turn spoken audio into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            dynamic motion captions
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload any video, transcribe audio with word-level timestamps, preview animated captions in real time, customize typography, and export high-definition MP4s using FFmpeg.
        </p>

        {/* Key Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 font-medium pt-1 pb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Word-Level Precision</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Real-Time Overlay</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local FFmpeg Burn-In</span>
          </div>
        </div>

        {/* Main Video Uploader Dropzone */}
        <div className="pt-2">
          <VideoUploader onUploaded={onUploaded} />
        </div>
      </div>
    </section>
  );
}
