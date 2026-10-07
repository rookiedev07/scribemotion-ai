import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_PATH = path.resolve(__dirname, 'transcribe_local.py');

class LocalWhisperProvider {
  /**
   * Transcribe audio dynamically using the local Whisper AI model or SpeechRecognition
   */
  async transcribeAudio(audioPath) {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    const ffmpegDir = path.dirname(config.ffmpegPath);
    console.log(`[LocalWhisperProvider] Transcribing: ${audioPath}`);

    return new Promise((resolve, reject) => {
      // Execute Python transcription worker
      const pythonProc = spawn('python', [SCRIPT_PATH, audioPath, ffmpegDir], {
        windowsHide: true
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProc.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      pythonProc.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      pythonProc.on('close', (code) => {
        // Find JSON line from stdout (ignoring any library warnings)
        const lines = stdoutData.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let parsedResult = null;

        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            if (lines[i].startsWith('{') && lines[i].endsWith('}')) {
              parsedResult = JSON.parse(lines[i]);
              break;
            }
          } catch (_) {}
        }

        if (parsedResult && parsedResult.segments && parsedResult.segments.length > 0) {
          console.log(`[LocalWhisperProvider] Transcribed ${parsedResult.segments.length} dynamic segments successfully!`);
          resolve(parsedResult);
        } else if (parsedResult && parsedResult.error) {
          reject(new Error(`Transcription error: ${parsedResult.error}`));
        } else {
          console.error('[LocalWhisperProvider] Python output:', stdoutData);
          console.error('[LocalWhisperProvider] Python stderr:', stderrData);
          reject(new Error(`Local transcription failed (exit code ${code}): ${stderrData.slice(-300) || 'Unknown error'}`));
        }
      });

      pythonProc.on('error', (err) => {
        console.error('[LocalWhisperProvider] Spawn error:', err);
        reject(err);
      });
    });
  }
}

export const localWhisperProvider = new LocalWhisperProvider();
