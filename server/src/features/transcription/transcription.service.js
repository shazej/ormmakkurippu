/**
 * Transcription Service
 *
 * Handles the full lifecycle of call audio transcription:
 *   - ownership verification
 *   - audio validation
 *   - provider invocation
 *   - status management (PENDING → PROCESSING → COMPLETED / FAILED)
 *   - DB persistence of structured transcript
 *
 * Separates business logic from the HTTP layer (controller) and the provider.
 */

import { PrismaClient } from '@prisma/client';
import { transcribeAudio, isTranscriptionEnabled, getProviderName } from './transcription.provider.js';
import { AppError } from '../../utils/app-error.js';

const prisma = new PrismaClient();

// Max audio file size: 25 MB (OpenAI Whisper limit)
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIMETYPES = new Set([
    'audio/mpeg',       // mp3
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp4',        // m4a
    'audio/x-m4a',
    'audio/ogg',
    'audio/webm',
    'video/webm'        // browsers often record as webm
]);

export class TranscriptionService {

    /**
     * Start or re-trigger transcription for a call log.
     *
     * If an audio buffer is provided (new upload), it is transcribed.
     * If the call already has a transcript record, re-transcription is allowed.
     *
     * @param {object} user        - req.user from auth middleware
     * @param {string} callLogId   - target CallLog id
     * @param {Buffer} audioBuffer - raw audio bytes (may be null if re-running)
     * @param {string} mimetype    - MIME type
     * @param {string} filename    - original filename
     * @returns {Promise<CallTranscript>}
     */
    async transcribeCall(user, callLogId, audioBuffer, mimetype, filename) {
        // 1. Verify ownership
        const callLog = await prisma.callLog.findUnique({
            where: { id: callLogId },
            include: { transcript: true }
        });
        if (!callLog || callLog.owner_user_id !== user.uid) {
            throw new AppError('Call not found or access denied', 404, 'RESOURCE_NOT_FOUND');
        }

        // 2. Validate file if provided
        if (audioBuffer) {
            if (audioBuffer.length > MAX_AUDIO_BYTES) {
                throw new AppError(
                    `Audio file is too large. Maximum size is ${MAX_AUDIO_BYTES / 1024 / 1024} MB.`,
                    400, 'VALIDATION_ERROR'
                );
            }
            if (!ALLOWED_MIMETYPES.has(mimetype)) {
                throw new AppError(
                    `Unsupported audio format "${mimetype}". Supported: mp3, wav, m4a, ogg, webm.`,
                    400, 'VALIDATION_ERROR'
                );
            }
        }

        // 3. Check if transcription is enabled
        if (!isTranscriptionEnabled()) {
            // Upsert a disabled-state record so the UI has something to show
            return this._upsertTranscript(callLog, user.uid, {
                status: 'FAILED',
                error_message: 'Transcription is disabled on this server. Set TRANSCRIPTION_ENABLED=true to enable.',
                provider: 'disabled'
            });
        }

        if (!audioBuffer) {
            throw new AppError(
                'No audio file provided. Upload an audio file to transcribe.',
                400, 'VALIDATION_ERROR'
            );
        }

        // 4. Mark as PROCESSING immediately (so client can poll)
        const transcript = await this._upsertTranscript(callLog, user.uid, {
            status: 'PROCESSING',
            error_message: null,
            provider: getProviderName()
        });

        // 5. Run transcription asynchronously — do not block the HTTP response
        setImmediate(() => {
            this._runTranscription(transcript.id, audioBuffer, mimetype, filename)
                .catch(err => console.error(`[Transcription] Job failed for transcript ${transcript.id}:`, err.message));
        });

        return transcript;
    }

    /**
     * Retrieve the transcript record for a call.
     */
    async getTranscript(user, callLogId) {
        const callLog = await prisma.callLog.findUnique({ where: { id: callLogId } });
        if (!callLog || callLog.owner_user_id !== user.uid) {
            throw new AppError('Call not found or access denied', 404, 'RESOURCE_NOT_FOUND');
        }

        const transcript = await prisma.callTranscript.findUnique({
            where: { call_log_id: callLogId }
        });

        return transcript || null;
    }

    /**
     * Poll transcription status.
     */
    async getTranscriptionStatus(user, callLogId) {
        const transcript = await this.getTranscript(user, callLogId);
        if (!transcript) return { status: 'NOT_STARTED', text: null };

        return {
            status: transcript.status,
            text: transcript.status === 'COMPLETED' ? transcript.transcript_text : null,
            error: transcript.error_message || null,
            completed_at: transcript.completed_at || null,
            provider: transcript.provider || null,
            confidence: transcript.confidence || null,
            language: transcript.language || null
        };
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    async _upsertTranscript(callLog, ownerUserId, fields) {
        const existing = await prisma.callTranscript.findUnique({
            where: { call_log_id: callLog.id }
        });

        if (existing) {
            return prisma.callTranscript.update({
                where: { id: existing.id },
                data: { ...fields, completed_at: null }
            });
        }

        return prisma.callTranscript.create({
            data: {
                call_log_id: callLog.id,
                owner_user_id: ownerUserId,
                ...fields
            }
        });
    }

    async _runTranscription(transcriptId, audioBuffer, mimetype, filename) {
        const startTime = Date.now();
        try {
            const result = await transcribeAudio(audioBuffer, mimetype, filename);

            await prisma.callTranscript.update({
                where: { id: transcriptId },
                data: {
                    status: 'COMPLETED',
                    transcript_text: result.text,
                    confidence: result.confidence,
                    language: result.language,
                    audio_duration_sec: result.duration,
                    completed_at: new Date(),
                    error_message: null
                }
            });

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[Transcription] Completed transcript ${transcriptId} in ${elapsed}s (provider: ${getProviderName()})`);

        } catch (err) {
            await prisma.callTranscript.update({
                where: { id: transcriptId },
                data: {
                    status: 'FAILED',
                    error_message: err.message || 'Transcription failed',
                    completed_at: new Date()
                }
            }).catch(() => {});

            console.error(`[Transcription] Failed transcript ${transcriptId}:`, err.message);
        }
    }
}
