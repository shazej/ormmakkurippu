/**
 * Transcription Routes
 *
 * Mounted at: /api/calls (extending the existing call router)
 * All routes are auth-protected via verifyFirebaseToken applied in index.js.
 *
 * Audio upload config:
 *   - Field name: "audio"
 *   - Max size: 25 MB (Whisper API limit)
 *   - Allowed MIME types: audio/*
 */

import express from 'express';
import multer from 'multer';
import { TranscriptionController } from './transcription.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new TranscriptionController();

// Audio upload middleware — only for the transcribe endpoint
const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
            'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/ogg',
            'audio/webm', 'video/webm'
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(
                `Unsupported audio format "${file.mimetype}". ` +
                'Supported formats: mp3, wav, m4a, ogg, webm.'
            ));
        }
    }
});

router.use(verifyFirebaseToken);

// Transcription
router.post('/:id/transcribe', audioUpload.single('audio'), controller.transcribe);
router.get('/:id/transcript', controller.getTranscript);
router.get('/:id/transcription-status', controller.getTranscriptionStatus);

// Analysis
router.post('/:id/analyze', controller.analyze);
router.get('/:id/analysis', controller.getAnalysis);

// Scoped error handler: converts multer file-type and size errors into proper 400 responses.
// Without this, multer passes a raw Error to Express which would return 500 in production.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
    // Multer LIMIT_FILE_SIZE is thrown when the file exceeds limits.fileSize
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            status: 'error',
            message: 'Audio file is too large. Maximum size is 25 MB.'
        });
    }
    // fileFilter rejects unsupported types with a plain Error
    if (err.message && err.message.includes('Unsupported audio format')) {
        return res.status(400).json({
            success: false,
            status: 'error',
            message: err.message
        });
    }
    // Any other multer error (unexpected field, etc.)
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            status: 'error',
            message: `Upload error: ${err.message}`
        });
    }
    // Pass unknown errors to the global error handler
    next(err);
});

export default router;
