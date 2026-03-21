/**
 * Transcription API Client
 *
 * All calls go through the backend — no provider credentials are sent from the client.
 */

import axios from 'axios';

const BASE = '/api/calls';

/**
 * Upload an audio file and start transcription for a call.
 * @param {string} callLogId
 * @param {File} audioFile
 * @returns {Promise<{status, text, confidence, language, provider, error, completed_at}>}
 */
export async function transcribeCall(callLogId, audioFile) {
    const form = new FormData();
    form.append('audio', audioFile);

    const res = await axios.post(`${BASE}/${callLogId}/transcribe`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
}

/**
 * Get the transcript for a call.
 * @param {string} callLogId
 * @returns {Promise<object|null>}
 */
export async function getTranscript(callLogId) {
    const res = await axios.get(`${BASE}/${callLogId}/transcript`);
    return res.data.data;
}

/**
 * Poll the transcription status for a call.
 * @param {string} callLogId
 * @returns {Promise<{status, text, error, completed_at, provider, confidence, language}>}
 */
export async function getTranscriptionStatus(callLogId) {
    const res = await axios.get(`${BASE}/${callLogId}/transcription-status`);
    return res.data.data;
}

/**
 * Trigger analysis for a call (transcript must be COMPLETED first).
 * @param {string} callLogId
 * @returns {Promise<object>}
 */
export async function analyzeCall(callLogId) {
    const res = await axios.post(`${BASE}/${callLogId}/analyze`);
    return res.data.data;
}

/**
 * Get the analysis results for a call.
 * @param {string} callLogId
 * @returns {Promise<object|null>}
 */
export async function getAnalysis(callLogId) {
    const res = await axios.get(`${BASE}/${callLogId}/analysis`);
    return res.data.data;
}
