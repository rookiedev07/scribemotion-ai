import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import CaptionRenderer from './CaptionRenderer/CaptionRenderer';

function formatSeconds(secs) {
  if (isNaN(secs) || secs === undefined) return '00:00.0';
  const mins = Math.floor(secs / 60);
  const remSecs = (secs % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${remSecs.padStart(4, '0')}`;
}

export default function VideoPlayer() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoWrapperRef = useRef(null); // inner wrapper around the video element — used for font scaling

  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    setVideoElement,
    selectedSegmentId
  } = useProjectStore();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Link video element into Zustand store
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current);
    }
  }, [setVideoElement]);

  // RequestAnimationFrame loop for high-precision time tracking & smooth caption highlighting
  useEffect(() => {
    let animId;
    const updateLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [setCurrentTime]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handlePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Auto-hide controls when mouse is inactive
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const videoUrl = project?.video?.url || '';
  const duration = project?.video?.duration || 0;
  const segments = project?.transcript?.segments || [];
  const captionStyle = project?.captionStyle || {};

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full h-full flex flex-col items-center justify-center bg-[#06080c] select-none overflow-hidden rounded-xl border border-slate-800/80 shadow-2xl group"
    >
      {/* Video Container with Fixed Aspect Ratio fit */}
      <div className="relative max-w-full max-h-[calc(100%-60px)] flex items-center justify-center">
        <div
          ref={videoWrapperRef}
          className="relative inline-flex items-center justify-center max-w-full max-h-[68vh] overflow-hidden rounded-lg"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
            className="max-h-[68vh] max-w-full w-auto object-contain shadow-inner cursor-pointer"
          />

          {/* Real-time Subtitle Overlay — strictly bounded to video box */}
          <CaptionRenderer
            segments={segments}
            currentTime={currentTime}
            captionStyle={captionStyle}
            selectedSegmentId={selectedSegmentId}
            isPaused={!isPlaying}
            containerRef={videoWrapperRef}
          />

          {/* Big Center Play/Pause Indicator on hover/pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              aria-label="Play video"
              className="absolute z-30 p-4 rounded-full bg-indigo-600/90 text-white shadow-xl hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-sm"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div
        className={`w-full px-5 py-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Scrubber */}
        <div className="flex items-center gap-3 w-full">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700/80 rounded-lg cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
        </div>

        {/* Control Buttons & Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Replay 5s */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, currentTime - 5);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Rewind 5s (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Time Display */}
            <div className="font-mono text-slate-300 tracking-wider">
              <span className="text-white font-medium">{formatSeconds(currentTime)}</span>
              <span className="mx-1 text-slate-500">/</span>
              <span className="text-slate-400">{formatSeconds(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 ml-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-lg cursor-pointer accent-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Style Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{captionStyle?.name || captionStyle?.id?.toUpperCase() || 'TIKTOK VIRAL'}</span>
            </div>

            {/* Playback speed */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRate(rate)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
