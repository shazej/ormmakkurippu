/**
 * SharedTaskPage
 *
 * Fully public page — no authentication required.
 * Resolves a share token from the URL and displays the safe projection
 * of the task (title, description, status, priority, due date).
 *
 * Route: /shared/task/:token
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Status badge colour map ───────────────────────────────────────────────────
const STATUS_STYLES = {
    'Pending':     'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed':   'bg-green-100 text-green-800',
};

// ── Priority dot colour map ───────────────────────────────────────────────────
const PRIORITY_COLOURS = {
    'High':   'text-red-500',
    'Medium': 'text-yellow-500',
    'Low':    'text-green-500',
};

// ── Error types ───────────────────────────────────────────────────────────────
const ERROR_CONFIGS = {
    NOT_FOUND: {
        icon: '🔗',
        title: 'Link unavailable',
        message: 'This share link has expired, been revoked, or never existed.'
    },
    INVALID: {
        icon: '⚠️',
        title: 'Invalid link',
        message: 'This link appears to be malformed. Please check the URL and try again.'
    },
    SERVER: {
        icon: '⚡',
        title: 'Something went wrong',
        message: 'We could not load this task right now. Please try again in a moment.'
    },
    NETWORK: {
        icon: '📡',
        title: 'Connection error',
        message: 'Could not reach the server. Please check your connection and try again.'
    }
};

function classifyError(err) {
    if (!err.response) return 'NETWORK';
    const status = err.response.status;
    if (status === 404) return 'NOT_FOUND';
    if (status === 400) return 'INVALID';
    return 'SERVER';
}

function formatDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function isPast(iso) {
    return iso && new Date(iso) < new Date();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SharedTaskPage() {
    const { token } = useParams();

    const [task, setTask]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [errorType, setErrorType] = useState(null);  // key of ERROR_CONFIGS

    useEffect(() => {
        let cancelled = false;

        async function fetchTask() {
            try {
                // URL-encode the token to safely handle any edge-case characters
                // in the URL path before sending to the server.
                const safeToken = encodeURIComponent(token);
                const { data } = await axios.get(
                    `${API_BASE}/api/shared/tasks/${safeToken}`
                );
                if (!cancelled) setTask(data.data ?? data);
            } catch (err) {
                if (!cancelled) setErrorType(classifyError(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchTask();
        return () => { cancelled = true; };
    }, [token]);

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-400 text-sm">Loading task…</div>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────
    if (errorType) {
        const cfg = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.SERVER;
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="text-5xl" role="img" aria-label={cfg.title}>{cfg.icon}</div>
                    <h1 className="text-xl font-semibold text-gray-800">{cfg.title}</h1>
                    <p className="text-gray-500 text-sm">{cfg.message}</p>
                    <Link
                        to="/"
                        className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                    >
                        Go to Ormmakkurippu
                    </Link>
                </div>
            </div>
        );
    }

    // ── Task view ─────────────────────────────────────────────────────────
    if (!task) return null;  // shouldn't happen, but safety guard

    const duePast      = isPast(task.due_date);
    const statusStyle  = STATUS_STYLES[task.status] || 'bg-gray-100 text-gray-700';
    const priorityColour = PRIORITY_COLOURS[task.priority] || 'text-gray-400';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Header bar */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                <Link to="/" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                    Ormmakkurippu
                </Link>
                <span className="text-xs text-gray-400">Shared task</span>
            </header>

            {/* Card */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full p-6 sm:p-8 space-y-6">

                    {/* Title + status */}
                    <div className="space-y-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                            {task.title}
                        </h1>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}>
                                {task.status}
                            </span>
                            {task.priority && (
                                <span className={`text-xs font-medium flex items-center gap-1 ${priorityColour}`}>
                                    <span aria-hidden="true">●</span> {task.priority} priority
                                </span>
                            )}
                            {task.category && task.category !== 'General' && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {task.category}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {task.description}
                        </p>
                    )}

                    {/* Due date */}
                    {task.due_date && (
                        <div className={`flex items-center gap-2 text-sm ${duePast ? 'text-red-600' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                                Due {formatDate(task.due_date)}
                                {duePast && <span className="ml-1 text-red-500 font-medium">· Overdue</span>}
                            </span>
                        </div>
                    )}

                    {/* Expiry notice */}
                    {task.share?.expires_at && (
                        <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
                            This link expires on {formatDate(task.share.expires_at)}.
                        </p>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="pb-8 text-center text-xs text-gray-300">
                Powered by Ormmakkurippu
            </footer>
        </div>
    );
}
