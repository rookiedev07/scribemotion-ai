import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/index.js';
import videoRoutes from './routes/videoRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Ensure directories exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
if (!fs.existsSync(config.exportDir)) {
  fs.mkdirSync(config.exportDir, { recursive: true });
}

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for video playback & exported video downloads
app.use('/uploads', express.static(config.uploadDir));
app.use('/exports', express.static(config.exportDir));

// API routes
app.use('/api/videos', videoRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: config.transcriptionProvider,
    mockMode: config.mockTranscription,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Start server
app.listen(config.port, () => {
  const providerLabel = config.transcriptionProvider === 'openai'
    ? 'OpenAI Whisper API'
    : 'Local Whisper AI (HuggingFace transformers — dynamic real audio transcription)';

  console.log(`\n======================================================`);
  console.log(`🚀 ScribeMotion AI Server running on port ${config.port}`);
  console.log(`🎙️  Transcription Engine: ${providerLabel}`);
  console.log(`📂 Uploads directory: ${config.uploadDir}`);
  console.log(`🎬 Exports directory: ${config.exportDir}`);
  console.log(`🎥 FFmpeg binary: ${config.ffmpegPath}`);
  console.log(`======================================================`);
  console.log(`ℹ️  Subtitles are generated from the ACTUAL audio of each uploaded video.`);
  console.log(`   No hardcoded/mock text will be shown as captions.\n`);
});
