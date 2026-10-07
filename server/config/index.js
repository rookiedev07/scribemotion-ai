import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ffmpegPath from 'ffmpeg-static';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  transcriptionProvider: (process.env.TRANSCRIPTION_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) ? 'openai' : 'local',
  mockTranscription: false,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
  exportDir: path.resolve(rootDir, process.env.EXPORT_DIR || 'exports'),
  ffmpegPath: ffmpegPath || 'ffmpeg'
};
