import path from 'path';
import fs from 'fs';
import { projectStore } from '../services/projectStore.js';
import { transcriptionService } from '../services/transcription/transcriptionService.js';
import { sseManager } from '../utils/sseManager.js';
import { subtitleService } from '../services/subtitleService.js';
import { ffmpegService } from '../services/ffmpegService.js';
import { config } from '../config/index.js';

export async function getProject(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }
  return res.json(project);
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }

  const { transcript, captionStyle, status } = req.body;
  const updates = {};
  if (transcript) updates.transcript = transcript;
  if (captionStyle) updates.captionStyle = captionStyle;
  if (status) updates.status = status;

  const updated = projectStore.updateProject(id, updates);
  return res.json(updated);
}

export async function streamTranscription(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }

  // Register client for Server-Sent Events
  sseManager.addClient(id, res);

  // If project already has segments and is ready, emit existing segments immediately
  if (project.transcript && project.transcript.segments && project.transcript.segments.length > 0) {
    sseManager.sendEvent(id, 'transcription_started', {
      projectId: id,
      totalSegments: project.transcript.segments.length
    });

    for (let i = 0; i < project.transcript.segments.length; i++) {
      sseManager.sendEvent(id, 'segment_received', {
        segment: project.transcript.segments[i],
        index: i,
        total: project.transcript.segments.length
      });
    }

    sseManager.sendEvent(id, 'transcription_complete', project.transcript);
    return;
  }

  // If not yet transcribed, initiate transcription
  runTranscriptionPipeline(id);
}

export async function startTranscription(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }

  // Trigger background transcription
  runTranscriptionPipeline(id);

  return res.json({
    status: 'transcribing',
    message: 'Transcription process started'
  });
}

/**
 * Shared helper to run transcription and emit SSE events
 */
async function runTranscriptionPipeline(projectId) {
  const project = projectStore.getProject(projectId);
  if (!project) return;

  if (project.status === 'transcribing') {
    // Already in progress
    return;
  }

  projectStore.updateProject(projectId, { status: 'transcribing' });

  try {
    const audioPath = project.video.audioPath;
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    const accumulatedSegments = [];

    await transcriptionService.streamTranscription({
      audioPath,
      onStart: () => {
        sseManager.sendEvent(projectId, 'transcription_started', {
          projectId,
          provider: transcriptionService.providerType
        });
      },
      onSegment: (segment, index, total) => {
        accumulatedSegments.push(segment);
        sseManager.sendEvent(projectId, 'segment_received', {
          segment,
          index,
          total
        });
      },
      onComplete: (result) => {
        projectStore.updateProject(projectId, {
          transcript: {
            language: result.language || 'en',
            segments: accumulatedSegments
          },
          status: 'ready'
        });

        sseManager.sendEvent(projectId, 'transcription_complete', {
          language: result.language || 'en',
          segments: accumulatedSegments
        });
      },
      onError: (err) => {
        console.error(`[Project ${projectId}] Transcription pipeline failed:`, err);
        projectStore.updateProject(projectId, { status: 'error' });
        sseManager.sendEvent(projectId, 'transcription_error', {
          message: err.message || 'Transcription failed'
        });
        sseManager.sendEvent(projectId, 'error', {
          message: err.message || 'Transcription failed'
        });
      }
    });
  } catch (err) {
    console.error(`Transcription pipeline failed for ${projectId}:`, err);
    projectStore.updateProject(projectId, { status: 'error' });
    sseManager.sendEvent(projectId, 'error', {
      message: err.message || 'Transcription error occurred'
    });
  }
}

export async function exportProject(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }

  // Accept optional overrides from export request body
  const { transcript, captionStyle } = req.body || {};
  if (transcript) projectStore.updateProject(id, { transcript });
  if (captionStyle) projectStore.updateProject(id, { captionStyle });

  const currentProject = projectStore.getProject(id);
  const segments = currentProject.transcript?.segments || [];
  const style = currentProject.captionStyle;

  if (segments.length === 0) {
    return res.status(400).json({ error: 'Cannot export video without subtitle segments' });
  }

  // Start export asynchronously
  runExportPipeline(id);

  return res.json({
    status: 'preparing',
    message: 'Preparing subtitles...'
  });
}

export async function getExportStatus(req, res) {
  const { id } = req.params;
  const project = projectStore.getProject(id);
  if (!project) {
    return res.status(404).json({ error: `Project '${id}' not found` });
  }

  return res.json(project.export);
}

/**
 * Background export pipeline using ASS generation and FFmpeg burning
 */
async function runExportPipeline(projectId) {
  const project = projectStore.getProject(projectId);
  if (!project) return;

  const updateExport = (updates) => {
    projectStore.updateProject(projectId, {
      export: {
        ...projectStore.getProject(projectId).export,
        ...updates
      }
    });
    // Broadcast progress over SSE as well!
    sseManager.sendEvent(projectId, 'export_progress', projectStore.getProject(projectId).export);
  };

  try {
    // 1. Preparing subtitles...
    updateExport({
      status: 'preparing',
      progress: 10,
      message: 'Preparing subtitles...',
      error: null
    });

    const assFilename = `${projectId}_subs.ass`;
    const assPath = path.join(config.exportDir, assFilename);

    subtitleService.generateAssFile({
      segments: project.transcript.segments,
      captionStyle: project.captionStyle,
      width: project.video.width,
      height: project.video.height,
      outputPath: assPath
    });

    // 2. Rendering video...
    await new Promise(r => setTimeout(r, 400));
    updateExport({
      status: 'rendering',
      progress: 25,
      message: 'Rendering video...'
    });

    // 3. Encoding with FFmpeg...
    const exportedFilename = `${projectId}_subtitled.mp4`;
    const exportPath = path.join(config.exportDir, exportedFilename);

    updateExport({
      status: 'encoding',
      progress: 35,
      message: 'Encoding video with burned-in subtitles...'
    });

    await ffmpegService.burnSubtitles(
      project.video.filePath,
      assPath,
      exportPath,
      project.video.duration,
      (percent) => {
        // Map 0-100% of burn progress to 35-90% overall progress
        const overallProgress = Math.min(90, Math.round(35 + (percent * 0.55)));
        updateExport({
          status: 'encoding',
          progress: overallProgress,
          message: `Encoding: ${percent}%`
        });
      }
    );

    // 4. Finishing...
    updateExport({
      status: 'finishing',
      progress: 95,
      message: 'Finishing...'
    });

    await new Promise(r => setTimeout(r, 300));

    // 5. Complete!
    const downloadUrl = `/exports/${exportedFilename}`;
    updateExport({
      status: 'complete',
      progress: 100,
      message: 'Export complete',
      url: downloadUrl,
      filename: exportedFilename
    });

    console.log(`[Export Complete] Project ${projectId} -> ${downloadUrl}`);
  } catch (err) {
    console.error(`Export failed for project ${projectId}:`, err);
    updateExport({
      status: 'error',
      progress: 0,
      message: 'Export failed',
      error: err.message || 'An error occurred during video export'
    });
  }
}
