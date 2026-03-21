/**
 * AnalysisPanel
 *
 * Displays call analysis results:
 *   - Sentiment badge
 *   - Key points
 *   - Action items (with optional "Create Task" flow)
 *   - Decisions
 *   - Follow-ups
 *   - Processing / error / disabled states
 */

import { useState, useEffect, useRef } from 'react';
import { analyzeCall, getAnalysis } from '../../api/transcription.js';
import axios from 'axios';

const POLL_INTERVAL_MS = 3000;

const SENTIMENT_MAP = {
    positive: { label: 'Positive', cls: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
    urgent: { label: 'Urgent', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⚡' },
    critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 border-red-200', icon: '🚨' },
    neutral: { label: 'Neutral', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: '➖' }
};

export default function AnalysisPanel({ callLogId, transcriptReady }) {
    const [analysis, setAnalysis] = useState(null);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [creatingTask, setCreatingTask] = useState(null); // action item index
    const [taskCreated, setTaskCreated] = useState({}); // index → true
    const [taskError, setTaskError] = useState(null); // inline error for task creation
    const pollRef = useRef(null);

    useEffect(() => {
        if (!callLogId) return;
        _fetchAnalysis();
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callLogId]);

    useEffect(() => {
        if (status === 'PROCESSING' || status === 'PENDING') {
            clearInterval(pollRef.current);
            pollRef.current = setInterval(_fetchAnalysis, POLL_INTERVAL_MS);
        } else {
            clearInterval(pollRef.current);
        }
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function _fetchAnalysis() {
        try {
            const data = await getAnalysis(callLogId);
            if (!data) return;
            setAnalysis(data);
            setStatus(data.status);
            if (data.error) setError(data.error);
        } catch {
            // ignore
        }
    }

    async function handleAnalyze() {
        setLoading(true);
        setError(null);
        try {
            const data = await analyzeCall(callLogId);
            setAnalysis(data);
            setStatus(data.status);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateTask(item, idx) {
        setCreatingTask(idx);
        setTaskError(null);
        try {
            await axios.post('/api/calls/task', {
                callLogId,
                title: item.title,
                description: item.notes || item.source_excerpt || null
            });
            setTaskCreated(prev => ({ ...prev, [idx]: true }));
        } catch (err) {
            setTaskError(err.response?.data?.message || 'Could not create task. Please try again.');
        } finally {
            setCreatingTask(null);
        }
    }

    const isProcessing = status === 'PROCESSING' || status === 'PENDING';
    const isCompleted = status === 'COMPLETED';
    const isFailed = status === 'FAILED';
    const notStarted = !status;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Analysis</span>
                    {analysis?.sentiment?.label && (
                        <SentimentBadge label={analysis.sentiment.label} compact />
                    )}
                    {isProcessing && <StatusPill label="Processing" color="blue" />}
                    {isFailed && <StatusPill label="Failed" color="red" />}
                </div>
                <ChevronIcon expanded={expanded} />
            </button>

            {expanded && (
                <div className="p-4 space-y-5">
                    {/* Analyze button (when not started or transcript just became ready) */}
                    {(notStarted || isFailed) && (
                        <div className="space-y-3">
                            {isFailed && error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                    ⚠️ {error}
                                </div>
                            )}
                            {!transcriptReady && notStarted && (
                                <p className="text-xs text-gray-400">Transcribe this call first to enable analysis.</p>
                            )}
                            {(transcriptReady || isFailed) && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !transcriptReady}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {loading ? (
                                        <><Spinner className="w-3.5 h-3.5" /> Analyzing…</>
                                    ) : (
                                        <><SparkleIcon className="w-3.5 h-3.5" /> {isFailed ? 'Retry Analysis' : 'Analyze Transcript'}</>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Processing */}
                    {isProcessing && (
                        <div className="flex items-center gap-3 py-3">
                            <Spinner className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Analyzing transcript…</p>
                                <p className="text-xs text-gray-400 mt-0.5">Extracting action items, decisions, and sentiment. This will update shortly.</p>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {isCompleted && analysis && (
                        <div className="space-y-5">

                            {/* Sentiment */}
                            {analysis.sentiment?.label && (
                                <SentimentSection sentiment={analysis.sentiment} />
                            )}

                            {/* Key Points */}
                            {analysis.key_points?.length > 0 && (
                                <Section title="Key Points" icon="📌">
                                    <ul className="space-y-1.5">
                                        {analysis.key_points.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}

                            {/* Action Items */}
                            {analysis.action_items?.length > 0 && (
                                <Section title="Action Items" icon="✅">
                                    {taskError && (
                                        <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                                            ⚠️ {taskError}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {analysis.action_items.map((item, i) => (
                                            <ActionItemCard
                                                key={i}
                                                item={item}
                                                created={taskCreated[i]}
                                                creating={creatingTask === i}
                                                onCreateTask={() => handleCreateTask(item, i)}
                                            />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Decisions */}
                            {analysis.decisions?.length > 0 && (
                                <Section title="Decisions" icon="⚖️">
                                    <div className="space-y-2">
                                        {analysis.decisions.map((d, i) => (
                                            <DecisionCard key={i} decision={d} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Follow-ups */}
                            {analysis.follow_ups?.length > 0 && (
                                <Section title="Follow-ups" icon="🔁">
                                    <ul className="space-y-1.5">
                                        {analysis.follow_ups.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                {f.action || f}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}

                            {/* Warnings */}
                            {analysis.warnings?.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    {analysis.warnings.map((w, i) => (
                                        <p key={i} className="text-xs text-yellow-700">ℹ️ {w}</p>
                                    ))}
                                </div>
                            )}

                            {/* Re-analyze */}
                            <div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="text-xs text-gray-400 hover:text-indigo-600 transition disabled:opacity-50"
                                >
                                    Re-analyze
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
    return (
        <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {icon} {title}
            </h4>
            {children}
        </div>
    );
}

function SentimentSection({ sentiment }) {
    const entry = SENTIMENT_MAP[sentiment.label] || SENTIMENT_MAP.neutral;
    return (
        <div className={`flex items-start gap-3 border rounded-md p-3 ${entry.cls}`}>
            <span className="text-lg leading-none">{entry.icon}</span>
            <div>
                <p className="text-sm font-medium">{entry.label} tone</p>
                {sentiment.rationale && (
                    <p className="text-xs mt-0.5 opacity-80">{sentiment.rationale}</p>
                )}
            </div>
        </div>
    );
}

function SentimentBadge({ label, compact }) {
    const entry = SENTIMENT_MAP[label] || SENTIMENT_MAP.neutral;
    if (compact) {
        return (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${entry.cls}`}>
                {entry.icon} {entry.label}
            </span>
        );
    }
    return null;
}

function ActionItemCard({ item, created, creating, onCreateTask }) {
    return (
        <div className="border border-gray-100 rounded-md p-3 bg-white space-y-1.5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                    {item.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            item.priority === 'High' ? 'bg-red-100 text-red-600' :
                            item.priority === 'Low' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-100 text-yellow-600'
                        }`}>{item.priority}</span>
                    )}
                    {created ? (
                        <span className="text-xs text-green-600 font-medium">✓ Task created</span>
                    ) : (
                        <button
                            onClick={onCreateTask}
                            disabled={creating}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                            {creating ? 'Creating…' : '+ Create task'}
                        </button>
                    )}
                </div>
            </div>
            {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
            {item.due_date_hint && (
                <p className="text-xs text-indigo-600">Due: {item.due_date_hint}</p>
            )}
            {item.source_excerpt && (
                <p className="text-xs text-gray-400 italic border-l-2 border-gray-200 pl-2">
                    "{item.source_excerpt}"
                </p>
            )}
        </div>
    );
}

function DecisionCard({ decision }) {
    return (
        <div className="border border-gray-100 rounded-md p-3 bg-white space-y-1">
            <p className="text-sm text-gray-800">{decision.statement}</p>
            {decision.confidence && decision.confidence !== 'high' && (
                <p className="text-xs text-yellow-600">Confidence: {decision.confidence}</p>
            )}
            {decision.source_excerpt && (
                <p className="text-xs text-gray-400 italic border-l-2 border-gray-200 pl-2">
                    "{decision.source_excerpt}"
                </p>
            )}
        </div>
    );
}

function StatusPill({ label, color }) {
    const cls = {
        blue: 'bg-blue-100 text-blue-700',
        red: 'bg-red-100 text-red-700',
        green: 'bg-green-100 text-green-700'
    }[color] || 'bg-gray-100 text-gray-600';

    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{label}</span>;
}

function Spinner({ className }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function SparkleIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
