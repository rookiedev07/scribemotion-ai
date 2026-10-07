import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingPage/LandingHero';
import FeaturesSection from './components/LandingPage/FeaturesSection';
import HowItWorks from './components/LandingPage/HowItWorks';
import TranscriptionProgress from './components/TranscriptionView/TranscriptionProgress';
import SubtitleEditor from './components/Editor/SubtitleEditor';
import { useProjectStore } from './store/useProjectStore';

export default function App() {
  const { project } = useProjectStore();

  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // State 3: Project has transcript ready -> Subtitle Editor Screen
  if (project && project.transcript?.segments?.length > 0 && project.status === 'ready') {
    return <SubtitleEditor />;
  }

  // State 2: Project uploaded, transcribing or waiting for transcript -> Transcription Progress Screen
  if (project) {
    return (
      <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col justify-between">
        <Navbar
          onScrollToFeatures={scrollToFeatures}
          onScrollToHowItWorks={scrollToHowItWorks}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <TranscriptionProgress
            onReady={() => {
              // Store will already be marked 'ready', triggering SubtitleEditor render
            }}
          />
        </main>
        <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-800/80">
          ScribeMotion AI • Dynamic Animated Subtitles MVP
        </footer>
      </div>
    );
  }

  // State 1: Landing Page
  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        onScrollToFeatures={scrollToFeatures}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      <main className="flex-1">
        <LandingHero />
        <FeaturesSection refProp={featuresRef} />
        <HowItWorks refProp={howItWorksRef} />
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/80 bg-slate-950/60 text-center text-xs text-slate-500 space-y-2 select-none">
        <div className="flex items-center justify-center gap-4 font-medium text-slate-400">
          <span>Local FFmpeg Processing</span>
          <span>•</span>
          <span>Word-Level Whisper STT</span>
          <span>•</span>
          <span>ASS Vector Burn-In</span>
        </div>
        <p>© {new Date().getFullYear()} ScribeMotion AI. Original UI/UX MVP for Animated Video Subtitles.</p>
      </footer>
    </div>
  );
}
