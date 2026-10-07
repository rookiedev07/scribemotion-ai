import { create } from 'zustand';
import { CAPTION_STYLES } from '../components/Editor/CaptionRenderer/styles';

const MAX_HISTORY_STEPS = 25;

export const useProjectStore = create((set, get) => ({
  // Core Project State
  project: null,
  
  // Playback & Interactive State
  currentTime: 0,
  isPlaying: false,
  selectedSegmentId: null,
  videoElement: null,

  // Undo / Redo History
  history: {
    past: [],
    future: []
  },

  // Set Video Element reference for accurate seeking
  setVideoElement: (element) => set({ videoElement: element }),

  // Set Project Data
  setProject: (projectData) => {
    // Default to 'tiktok' preset if no style is stored with this project
    const initialStyle = {
      ...CAPTION_STYLES.tiktok,
      ...(projectData.captionStyle || {})
    };

    set({
      project: {
        ...projectData,
        captionStyle: initialStyle
      },
      currentTime: 0,
      isPlaying: false,
      selectedSegmentId: projectData.transcript?.segments?.[0]?.id || null,
      history: { past: [], future: [] }
    });
  },

  // Update playback time
  setCurrentTime: (time) => set({ currentTime: time }),

  // Set play / pause
  setIsPlaying: (isPlaying) => {
    const { videoElement } = get();
    if (videoElement) {
      if (isPlaying && videoElement.paused) {
        videoElement.play().catch(() => {});
      } else if (!isPlaying && !videoElement.paused) {
        videoElement.pause();
      }
    }
    set({ isPlaying });
  },

  // Seek video directly
  seekTo: (time) => {
    const { videoElement } = get();
    const safeTime = Math.max(0, time);
    if (videoElement) {
      videoElement.currentTime = safeTime;
    }
    set({ currentTime: safeTime });
  },

  // Select segment
  setSelectedSegmentId: (id) => set({ selectedSegmentId: id }),

  // Update Caption Style (real-time overlay update without re-encoding)
  updateCaptionStyle: (partialStyle) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        captionStyle: {
          ...project.captionStyle,
          ...partialStyle
        }
      }
    });
  },

  // Apply a predefined caption style template
  applyTemplate: (templateId) => {
    const { project } = get();
    if (!project) return;

    const baseStyle = CAPTION_STYLES[templateId] || CAPTION_STYLES.tiktok;
    // baseStyle already contains the `id` field — no need for separate `template` key
    set({
      project: {
        ...project,
        captionStyle: { ...baseStyle }
      }
    });
  },

  // Push state to history for undo
  _recordHistory: () => {
    const { project, history } = get();
    if (!project || !project.transcript) return;

    const currentState = {
      segments: JSON.parse(JSON.stringify(project.transcript.segments || [])),
      captionStyle: { ...project.captionStyle }
    };

    const newPast = [...history.past, currentState];
    if (newPast.length > MAX_HISTORY_STEPS) {
      newPast.shift();
    }

    set({
      history: {
        past: newPast,
        future: [] // Clear future redo on new change
      }
    });
  },

  // Update a specific segment's text or timing
  updateSegment: (segmentId, updates) => {
    const { project, _recordHistory } = get();
    if (!project || !project.transcript) return;

    _recordHistory();

    const segments = project.transcript.segments.map(seg => {
      if (seg.id === segmentId) {
        const updatedSeg = { ...seg, ...updates };

        // If text was modified directly and words exist, keep words in sync
        if (updates.text !== undefined && updates.words === undefined) {
          const newWords = updates.text.trim().split(/\s+/).filter(Boolean);
          const duration = Math.max(0.1, updatedSeg.end - updatedSeg.start);
          const wordDur = duration / Math.max(1, newWords.length);

          updatedSeg.words = newWords.map((w, idx) => ({
            word: w,
            start: parseFloat((updatedSeg.start + idx * wordDur).toFixed(2)),
            end: parseFloat((updatedSeg.start + (idx + 1) * wordDur).toFixed(2))
          }));
        }

        return updatedSeg;
      }
      return seg;
    });

    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments
        }
      }
    });
  },

  // Split segment at given time
  splitSegment: (segmentId, splitTime) => {
    const { project, _recordHistory } = get();
    if (!project || !project.transcript) return;

    const segments = [...project.transcript.segments];
    const index = segments.findIndex(s => s.id === segmentId);
    if (index === -1) return;

    const seg = segments[index];
    if (splitTime <= seg.start + 0.2 || splitTime >= seg.end - 0.2) return;

    _recordHistory();

    // Split words
    const wordsPart1 = (seg.words || []).filter(w => w.start < splitTime);
    const wordsPart2 = (seg.words || []).filter(w => w.start >= splitTime);

    const seg1 = {
      ...seg,
      end: splitTime,
      text: wordsPart1.map(w => w.word).join(' ') || seg.text.slice(0, Math.floor(seg.text.length / 2)),
      words: wordsPart1
    };

    const seg2 = {
      id: `seg_${Date.now()}_${Math.round(Math.random() * 1000)}`,
      start: splitTime,
      end: seg.end,
      text: wordsPart2.map(w => w.word).join(' ') || seg.text.slice(Math.floor(seg.text.length / 2)),
      words: wordsPart2
    };

    segments.splice(index, 1, seg1, seg2);

    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments
        }
      },
      selectedSegmentId: seg2.id
    });
  },

  // Delete segment
  deleteSegment: (segmentId) => {
    const { project, _recordHistory } = get();
    if (!project || !project.transcript) return;

    _recordHistory();

    const segments = project.transcript.segments.filter(s => s.id !== segmentId);
    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments
        }
      },
      selectedSegmentId: segments[0]?.id || null
    });
  },

  // Add a new caption segment
  addSegment: (startTime) => {
    const { project, _recordHistory } = get();
    if (!project || !project.transcript) return;

    _recordHistory();

    const start = parseFloat(startTime.toFixed(2));
    const end = parseFloat((start + 2.0).toFixed(2));
    const newId = `seg_${Date.now()}`;

    const newSeg = {
      id: newId,
      start,
      end,
      text: "New subtitle segment",
      words: [
        { word: "New", start: start, end: start + 0.5 },
        { word: "subtitle", start: start + 0.5, end: start + 1.2 },
        { word: "segment", start: start + 1.2, end: end }
      ]
    };

    const segments = [...project.transcript.segments, newSeg].sort((a, b) => a.start - b.start);

    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments
        }
      },
      selectedSegmentId: newId
    });
  },

  // Undo
  undo: () => {
    const { project, history } = get();
    if (!project || history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    const currentSnapshot = {
      segments: JSON.parse(JSON.stringify(project.transcript.segments || [])),
      captionStyle: { ...project.captionStyle }
    };

    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments: previous.segments
        },
        captionStyle: previous.captionStyle
      },
      history: {
        past: newPast,
        future: [currentSnapshot, ...history.future]
      }
    });
  },

  // Redo
  redo: () => {
    const { project, history } = get();
    if (!project || history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    const currentSnapshot = {
      segments: JSON.parse(JSON.stringify(project.transcript.segments || [])),
      captionStyle: { ...project.captionStyle }
    };

    set({
      project: {
        ...project,
        transcript: {
          ...project.transcript,
          segments: next.segments
        },
        captionStyle: next.captionStyle
      },
      history: {
        past: [...history.past, currentSnapshot],
        future: newFuture
      }
    });
  },

  // Update Export state
  setExportState: (exportData) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        export: {
          ...project.export,
          ...exportData
        }
      }
    });
  },

  // Reset Project to return to landing
  resetProject: () => {
    set({
      project: null,
      currentTime: 0,
      isPlaying: false,
      selectedSegmentId: null,
      history: { past: [], future: [] }
    });
  }
}));
