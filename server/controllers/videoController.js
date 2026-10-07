import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ffmpegService } from '../services/ffmpegService.js';
import { projectStore } from '../services/projectStore.js';
import { config } from '../config/index.js';

export async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const file = req.file;
    const projectId = `proj_${uuidv4().slice(0, 8)}`;
    const originalExt = path.extname(file.originalname).toLowerCase();
    
    // Check supported formats: .mp4, .mov, .webm, .mkv
    const validExtensions = ['.mp4', '.mov', '.webm', '.mkv'];
    if (!validExtensions.includes(originalExt)) {
      // Remove uploaded file if invalid
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: `Unsupported file format (${originalExt}). Supported formats: ${validExtensions.join(', ')}`
      });
    }

    const videoFilename = `${projectId}${originalExt}`;
    const finalVideoPath = path.join(config.uploadDir, videoFilename);
    const audioFilename = `${projectId}.wav`;
    const finalAudioPath = path.join(config.uploadDir, audioFilename);

    // Rename file to organized project name
    fs.renameSync(file.path, finalVideoPath);

    // Probe video metadata (duration, width, height)
    let meta = { duration: 0, width: 1280, height: 720 };
    try {
      meta = await ffmpegService.getVideoMetadata(finalVideoPath);
    } catch (err) {
      console.warn('Warning: Could not probe video metadata:', err.message);
    }

    // Extract audio using FFmpeg without modifying original video
    try {
      await ffmpegService.extractAudio(finalVideoPath, finalAudioPath);
      console.log(`[Audio Extracted] -> ${finalAudioPath}`);
    } catch (err) {
      console.error('Audio extraction failed:', err);
      return res.status(500).json({
        error: 'Failed to extract audio from video. The file may be corrupt or missing audio stream.'
      });
    }

    // Save project in store
    const project = projectStore.createProject(projectId, {
      video: {
        url: `/uploads/${videoFilename}`,
        filename: file.originalname,
        filePath: finalVideoPath,
        audioPath: finalAudioPath,
        duration: meta.duration || 10,
        width: meta.width || 1280,
        height: meta.height || 720,
        size: file.size
      },
      status: 'uploaded'
    });

    console.log(`[Project Created] ID: ${projectId}, Duration: ${meta.duration}s`);

    return res.status(201).json({
      projectId: project.id,
      status: 'uploaded',
      video: project.video
    });
  } catch (error) {
    console.error('Upload video error:', error);
    return res.status(500).json({ error: error.message || 'Server error during video upload' });
  }
}

export async function createSampleProject(req, res) {
  try {
    const projectId = `proj_sample_${uuidv4().slice(0, 6)}`;
    const sampleFilename = 'sample_demo.mp4';
    const sampleVideoPath = path.join(config.uploadDir, sampleFilename);
    const audioFilename = `${projectId}.wav`;
    const finalAudioPath = path.join(config.uploadDir, audioFilename);

    // Prepare project video
    const projectVideoFilename = `${projectId}.mp4`;
    const projectVideoPath = path.join(config.uploadDir, projectVideoFilename);

    if (fs.existsSync(sampleVideoPath)) {
      fs.copyFileSync(sampleVideoPath, projectVideoPath);
    } else {
      // Automatically generate a valid demo clip using FFmpeg if no sample video is on disk
      console.log('[Sample Video] Generating dynamic demo clip with FFmpeg...');
      await ffmpegService.runFfmpeg([
        '-f', 'lavfi', '-i', 'testsrc=duration=8:size=1280x720:rate=30',
        '-f', 'lavfi', '-i', 'sine=frequency=520:duration=8',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-y', projectVideoPath
      ]);
    }

    // Extract audio
    await ffmpegService.extractAudio(projectVideoPath, finalAudioPath);
    const meta = await ffmpegService.getVideoMetadata(projectVideoPath);

    const project = projectStore.createProject(projectId, {
      video: {
        url: `/uploads/${projectVideoFilename}`,
        filename: 'sample_demo.mp4',
        filePath: projectVideoPath,
        audioPath: finalAudioPath,
        duration: meta.duration || 10,
        width: meta.width || 1280,
        height: meta.height || 720,
        size: fs.statSync(projectVideoPath).size
      },
      status: 'uploaded'
    });

    return res.status(201).json({
      projectId: project.id,
      status: 'uploaded',
      video: project.video
    });
  } catch (error) {
    console.error('Sample project error:', error);
    return res.status(500).json({ error: error.message });
  }
}

