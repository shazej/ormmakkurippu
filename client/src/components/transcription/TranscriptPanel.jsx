/**
 * TranscriptPanel
 *
 * Displays the transcription state for a call:
 *   - Upload audio + Transcribe button
 *   - Processing/pending state with spinner
 *   - Completed: full transcript text
 *   - Failed: error message + retry
 *   - Disabled: clear messaging
 */

import { useState, useEffect, useRef } from 'react';
import { transcribeCall, getTranscriptionStatus } from '../../api/transcription.js';

const POLL_INTERVAL_MS = 3000;

const ACCEPTED_AUDIO = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/ogg',
    'audio/webm', 'video/webm'
].join(',');

export default function TranscriptPanel({ callLogId, onTranscriptReady }) {
    const [status, setStatus] = useState(null);   // NOT_STARTED | PENDING | PROCESSING | COMPLETED | FAILED
    const [transcript, setTranscript] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const pollRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load initial state
    useEffect(() => {
        if (!callLogId) return;
        _fetchStatus();
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callLogId]);

    // Start polling when in PROCESSING state
    useEffect(() => {
        if (status === 'PROCESSING' || status === 'PENDING') {
            clearInterval(pollRef.current);
            pollRef.current = setInterval(_fetchStatus, POLL_INTERVAL_MS);
        } else {
            clearInterval(pollRef.current);
        }
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function _fetchStatus() {
        try {
            const data = await getTranscriptionStatus(callLogId);
            setStatus(data.status);
            if (data.status === 'COMPLETED') {
                setTranscript(data.text);
                onTranscriptReady?.(data.text);
            }
            if (data.status === 'FAILED') {
                setError(data.error || 'Transcription failed');
            }
        } catch {
            // Silently ignore poll errors
        }
    }

    async function handleTranscribe() {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);
        try {
            const result = await transcribeCall(callLogId, selectedFile);
            setStatus(result.status);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Upload failed';
            setError(msg);
        } finally {
            setUploading(false);
        }
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setError(null);
    }

    const isProcessing = status === 'PROCESSING' || status === 'PENDING';
    const isCompleted = status === 'COMPLETED';
    const isFailed = status === 'FAILED';
    const notStarted = !status || status === 'NOT_STARTED';

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="flex items-center gap-2">
                    <MicIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Transcript</span>
                    <StatusBadge status={status} />
                </div>
                <ChevronIcon expanded={expanded} />
            </button>

            {expanded && (
                <div className="p-4 space-y-4">
                    {/* Upload section (shown when not started or failed) */}
                    {(notStarted || isFailed) && (
                        <div className="space-y-3">
                            {isFailed && (
                                <ErrorBanner message={error || 'Transcription failed. You can retry below.'} />
                            )}
                            <p className="text-xs text-gray-500">
                                Upload an audio recording to generate a transcript. Supported formats: mp3, wav, m4a, ogg, webm (max 25 MB).
                            </p>
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPTED_AUDIO}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 transition">
                                        <UploadIcon className="w-3.5 h-3.5" />
                                        {selectedFile ? selectedFile.name : 'Choose file'}
                                    </span>
                                </label>
                                <button
                                    onClick={handleTranscribe}
                                    disabled={!selectedFile || uploading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {uploading ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5" />
                                            Uploading…
                                        </>
                                    ) : (
                                        <>
                                            <MicIcon className="w-3.5 h-3.5" />
                                            Transcribe
                                        </>
                                    )}
                                </button>
                            </div>
                            {error && !isFailed && (
                                <p className="text-xs text-red-600">{error}</p>
                            )}
                        </div>
                    )}

                    {/* Processing state */}
                    {isProcessing && (
                        <div className="flex items-center gap-3 py-4">
                            <Spinner className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Transcribing audio…</p>
                                <p className="text-xs text-gray-400 mt-0.5">This may take a moment. The page will update automatically.</p>
                            </div>
                        </div>
                    )}

                    {/* Completed: transcript text */}
                    {isCompleted && transcript && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                                {transcript}
                            </div>
                            {/* Re-transcribe option */}
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPTED_AUDIO}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition">
                                        <UploadIcon className="w-3 h-3" />
                                        Re-transcribe with new file
                                    </span>
                                </label>
                                {selectedFile && (
                                    <button
                                        onClick={handleTranscribe}
                                        disabled={uploading}
                                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        {uploading ? 'Uploading…' : `Transcribe "${selectedFile.name}"`}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    if (!status || status === 'NOT_STARTED') return null;

    const map = {
        PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
        PROCESSING: { label: 'Processing', cls: 'bg-blue-100 text-blue-700' },
        COMPLETED: { label: 'Done', cls: 'bg-green-100 text-green-700' },
        FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-700' }
    };

    const entry = map[status];
    if (!entry) return null;

    return (
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${entry.cls}`}>
            {entry.label}
        </span>
    );
}

function ErrorBanner({ message }) {
    return (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            <span className="mt-0.5">⚠️</span>
            <span>{message}</span>
        </div>
    );
}

function Spinner({ className }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function MicIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    );
}

function UploadIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    );
}

function ChevronIcon({ expanded }) {
    return (
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}
