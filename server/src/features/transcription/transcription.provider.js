/**
 * Transcription Provider
 *
 * Wraps the external audio-to-text provider (OpenAI Whisper or mock).
 * Provider credentials never leave this module — all env vars are read here.
 *
 * Env vars required when TRANSCRIPTION_PROVIDER=openai:
 *   TRANSCRIPTION_API_KEY  — OpenAI API key
 *   TRANSCRIPTION_MODEL    — model name (default: whisper-1)
 */

// Node 18+ native fetch and FormData are used — no extra packages needed.

const ENABLED = process.env.TRANSCRIPTION_ENABLED !== 'false'; // default on
const PROVIDER = (process.env.TRANSCRIPTION_PROVIDER || 'mock').toLowerCase();
const API_KEY = process.env.TRANSCRIPTION_API_KEY || '';
const MODEL = process.env.TRANSCRIPTION_MODEL || 'whisper-1';

// Fail fast at startup if provider is configured but key is missing
if (ENABLED && PROVIDER === 'openai' && !API_KEY) {
    console.error(
        '[Transcription] FATAL: TRANSCRIPTION_PROVIDER=openai but TRANSCRIPTION_API_KEY is not set.'
    );
    process.exit(1);
}

/**
 * Transcribes an audio buffer.
 *
 * @param {Buffer} audioBuffer  - raw audio bytes
 * @param {string} mimetype     - MIME type of the audio (e.g. 'audio/mpeg')
 * @param {string} filename     - original filename (used to infer extension)
 * @returns {Promise<{text: string, language: string|null, duration: number|null, confidence: number|null}>}
 */
export async function transcribeAudio(audioBuffer, mimetype, filename = 'audio.mp3') {
    if (!ENABLED) {
        throw new TranscriptionDisabledError();
    }

    switch (PROVIDER) {
        case 'openai':
            return _transcribeOpenAI(audioBuffer, mimetype, filename);
        case 'mock':
            return _transcribeMock(audioBuffer);
        default:
            throw new Error(`Unknown transcription provider: "${PROVIDER}"`);
    }
}

export function isTranscriptionEnabled() {
    return ENABLED;
}

export function getProviderName() {
    return ENABLED ? PROVIDER : 'disabled';
}

// ─── OpenAI Whisper ──────────────────────────────────────────────────────────

async function _transcribeOpenAI(audioBuffer, mimetype, filename) {
    // Use native FormData + Blob (available in Node 18+)
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: mimetype });
    form.append('file', blob, filename);
    form.append('model', MODEL);
    form.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${API_KEY}`
            // Content-Type is set automatically by fetch when using FormData
        },
        body: form
    });

    if (!response.ok) {
        const errBody = await response.text();
        const err = new Error(`OpenAI Whisper API error ${response.status}: ${errBody}`);
        err.statusCode = response.status;
        err.isOperational = true;
        throw err;
    }

    const json = await response.json();

    return {
        text: json.text || '',
        language: json.language || null,
        duration: json.duration ? Math.round(json.duration) : null,
        confidence: _deriveConfidence(json)
    };
}

function _deriveConfidence(verboseJson) {
    // Average segment-level avg_logprob if available (Whisper verbose_json)
    try {
        const segs = verboseJson.segments;
        if (!Array.isArray(segs) || segs.length === 0) return null;
        const avg = segs.reduce((sum, s) => sum + (s.avg_logprob || 0), 0) / segs.length;
        // Convert log-prob to a 0-1 range (rough: -0.2 ≈ 0.82, -1.0 ≈ 0.37)
        const conf = Math.max(0, Math.min(1, Math.exp(avg)));
        return Math.round(conf * 100) / 100;
    } catch {
        return null;
    }
}

// ─── Mock provider (local dev / disabled mode) ───────────────────────────────

async function _transcribeMock(_audioBuffer) {
    // Simulate realistic async delay
    await new Promise(r => setTimeout(r, 800));
    return {
        text: `[Mock transcript] This is a simulated transcription for local development.
The call discussed project timelines and next steps.
John agreed to send the updated proposal by Friday.
Sarah will schedule a follow-up call next week.
The team decided to go with the new vendor after reviewing the quotes.
Action item: Review the contract and confirm delivery dates.
There is an urgent issue with the payment deadline — we need to resolve this by end of month.`,
        language: 'en',
        duration: 180,
        confidence: 0.95
    };
}

// ─── Error types ─────────────────────────────────────────────────────────────

export class TranscriptionDisabledError extends Error {
    constructor() {
        super('Transcription is disabled. Set TRANSCRIPTION_ENABLED=true to enable.');
        this.statusCode = 503;
        this.isOperational = true;
        this.errorCode = 'TRANSCRIPTION_DISABLED';
    }
}
