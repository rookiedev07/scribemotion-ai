import express from 'express';
import {
  getProject,
  updateProject,
  startTranscription,
  streamTranscription,
  exportProject,
  getExportStatus
} from '../controllers/projectController.js';

const router = express.Router();

router.get('/:id', getProject);
router.put('/:id', updateProject);
router.post('/:id/transcribe', startTranscription);
router.get('/:id/transcription/stream', streamTranscription);
router.post('/:id/export', exportProject);
router.get('/:id/export/status', getExportStatus);

export default router;
