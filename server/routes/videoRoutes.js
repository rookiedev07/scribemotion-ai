import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadVideo, createSampleProject } from '../controllers/videoController.js';
import { config } from '../config/index.js';

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `raw_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max for local MVP
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.mp4', '.mov', '.webm', '.mkv'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Supported formats: ${allowed.join(', ')}`));
    }
  }
});

router.post('/', upload.single('video'), uploadVideo);
router.post('/sample', createSampleProject);

export default router;

