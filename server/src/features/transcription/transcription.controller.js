/**
 * Transcription Controller
 *
 * Handles HTTP layer for all transcription and analysis endpoints.
 * Delegates to TranscriptionService and CallAnalysisService.
 *
 * Endpoints:
 *   POST   /api/calls/:id/transcribe            — upload audio + start transcription
 *   GET    /api/calls/:id/transcript            — get transcript
 *   GET    /api/calls/:id/transcription-status  — poll status
 *   POST   /api/calls/:id/analyze              — trigger analysis
 *   GET    /api/calls/:id/analysis             — get analysis
 */

import { TranscriptionService } from './transcription.service.js';
import { CallAnalysisService } from './call-analysis.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class TranscriptionController {
    constructor() {
        this.transcriptionService = new TranscriptionService();
        this.analysisService = new CallAnalysisService();
    }

    /**
     * POST /api/calls/:id/transcribe
     * Accepts multipart/form-data with field "audio".
     */
    transcribe = async (req, res) => {
        try {
            const callLogId = req.params.id;
            const file = req.file; // set by multer

            const transcript = await this.transcriptionService.transcribeCall(
                req.user,
                callLogId,
                file?.buffer || null,
                file?.mimetype || null,
                file?.originalname || 'audio'
            );

            sendSuccess(res, _formatTranscript(transcript), 'Transcription started', 202);
        } catch (error) {
            sendError(res, error);
        }
    };

    /**
     * GET /api/calls/:id/transcript
     */
    getTranscript = async (req, res) => {
        try {
            const transcript = await this.transcriptionService.getTranscript(req.user, req.params.id);

            if (!transcript) {
                return sendSuccess(res, null, 'No transcript found for this call');
            }

            sendSuccess(res, _formatTranscript(transcript));
        } catch (error) {
            sendError(res, error);
        }
    };

    /**
     * GET /api/calls/:id/transcription-status
     */
    getTranscriptionStatus = async (req, res) => {
        try {
            const status = await this.transcriptionService.getTranscriptionStatus(req.user, req.params.id);
            sendSuccess(res, status);
        } catch (error) {
            sendError(res, error);
        }
    };

    /**
     * POST /api/calls/:id/analyze
     */
    analyze = async (req, res) => {
        try {
            const analysis = await this.analysisService.analyzeCall(req.user, req.params.id);
            sendSuccess(res, _formatAnalysis(analysis), 'Analysis started', 202);
        } catch (error) {
            sendError(res, error);
        }
    };

    /**
     * GET /api/calls/:id/analysis
     */
    getAnalysis = async (req, res) => {
        try {
            const analysis = await this.analysisService.getAnalysis(req.user, req.params.id);

            if (!analysis) {
                return sendSuccess(res, null, 'No analysis found for this call');
            }

            sendSuccess(res, _formatAnalysis(analysis));
        } catch (error) {
            sendError(res, error);
        }
    };
}

// ─── Response formatters ──────────────────────────────────────────────────────

function _formatTranscript(t) {
    if (!t) return null;
    return {
        id: t.id,
        call_log_id: t.call_log_id,
        status: t.status,
        text: t.transcript_text || null,
        confidence: t.confidence || null,
        language: t.language || null,
        audio_duration_sec: t.audio_duration_sec || null,
        provider: t.provider || null,
        error: t.error_message || null,
        completed_at: t.completed_at || null,
        created_at: t.created_at,
        updated_at: t.updated_at
    };
}

function _formatAnalysis(a) {
    if (!a) return null;
    return {
        id: a.id,
        call_log_id: a.call_log_id,
        status: a.status,
        key_points: a.key_points || [],
        action_items: a.action_items || [],
        decisions: a.decisions || [],
        follow_ups: a.follow_ups || [],
        sentiment: {
            label: a.sentiment_label || null,
            confidence: a.sentiment_confidence || null,
            rationale: a.sentiment_rationale || null
        },
        warnings: a.warnings || [],
        provider: a.provider || null,
        error: a.error_message || null,
        completed_at: a.completed_at || null,
        created_at: a.created_at,
        updated_at: a.updated_at
    };
}
