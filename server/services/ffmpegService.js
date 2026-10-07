import { spawn, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

class FFmpegService {
  constructor() {
    this.ffmpegBinary = config.ffmpegPath;
  }

  /**
   * Run ffmpeg with argument list safely avoiding shell escaping issues
   */
  runFfmpeg(args, onProgress = null) {
    return new Promise((resolve, reject) => {
      // Use execFile or spawn without shell: true to avoid Windows space issues
      const proc = spawn(this.ffmpegBinary, args, { windowsHide: true });
      let stderr = '';
      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;

        if (onProgress) {
          // Parse time=00:00:05.12 to track progress
          const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (timeMatch) {
            const hours = parseFloat(timeMatch[1]);
            const minutes = parseFloat(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            onProgress(currentTime);
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          console.error('FFmpeg process failed. Stderr:', stderr);
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Extract audio from video to 16kHz mono WAV format optimized for Whisper
   */
  async extractAudio(videoPath, outputWavPath) {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      outputWavPath
    ];

    await this.runFfmpeg(args);
    return outputWavPath;
  }

  /**
   * Probe video duration, width, height using ffmpeg
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve) => {
      const proc = spawn(this.ffmpegBinary, ['-i', videoPath], { windowsHide: true });
      let output = '';

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        let duration = 0;
        let width = 1280;
        let height = 720;

        // Parse duration: Duration: 00:01:23.45
        const durMatch = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (durMatch) {
          duration = parseFloat(durMatch[1]) * 3600 + parseFloat(durMatch[2]) * 60 + parseFloat(durMatch[3]);
        }

        // Parse resolution: 1920x1080
        const resMatch = output.match(/Stream #0:.*Video:.*,\s*(\d{3,5})x(\d{3,5})/);
        if (resMatch) {
          width = parseInt(resMatch[1], 10);
          height = parseInt(resMatch[2], 10);
        }

        resolve({ duration, width, height });
      });

      proc.on('error', () => {
        resolve({ duration: 0, width: 1280, height: 720 });
      });
    });
  }

  /**
   * Escape path for FFmpeg subtitles / ass filter on Windows
   */
  formatAssFilterPath(assPath) {
    // FFmpeg's video filter parsing requires special escaping for colons and backslashes
    // Example: C:\path\sub.ass -> C\\:/path/sub.ass or using forward slashes with colon escaped
    let normalized = assPath.replace(/\\/g, '/');
    // Escape colon after drive letter: C:/ -> C\\:/
    normalized = normalized.replace(/^([a-zA-Z]):\//, '$1\\:/');
    // Escape single quotes and brackets
    normalized = normalized.replace(/'/g, "\\'");
    return `ass='${normalized}'`;
  }

  /**
   * Burn-in ASS subtitles into video using FFmpeg
   */
  async burnSubtitles(videoPath, assPath, outputPath, duration = 0, onProgress = null) {
    const filterStr = this.formatAssFilterPath(assPath);

    const args = [
      '-y',
      '-i', videoPath,
      '-vf', filterStr,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '22',
      '-c:a', 'copy',
      outputPath
    ];

    await this.runFfmpeg(args, (currentTime) => {
      if (onProgress && duration > 0) {
        const percent = Math.min(99, Math.round((currentTime / duration) * 100));
        onProgress(percent);
      }
    });

    return outputPath;
  }
}

export const ffmpegService = new FFmpegService();
