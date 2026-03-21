import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TranscriptPanel from '../components/transcription/TranscriptPanel.jsx';
import AnalysisPanel from '../components/transcription/AnalysisPanel.jsx';

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCallId, setSelectedCallId] = useState(null);
    const [transcriptReady, setTranscriptReady] = useState(false);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        setError(null);
        try {
            const res = await axios.get('/api/calls');
            setCalls(res.data.data || res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load calls');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCall = useCallback((callId) => {
        if (selectedCallId === callId) {
            setSelectedCallId(null);
            setTranscriptReady(false);
        } else {
            setSelectedCallId(callId);
            setTranscriptReady(false);
        }
    }, [selectedCallId]);

    const handleTranscriptReady = useCallback((text) => {
        if (text && text.length > 0) setTranscriptReady(true);
    }, []);

    const selectedCall = calls.find(c => c.id === selectedCallId);

    return (
        <div className="px-4 py-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Call Log</h1>
                <button
                    onClick={() => alert('Manual entry modal coming soon')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                    Log Call
                </button>
            </header>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading calls…</div>
            ) : calls.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-2">No calls logged yet.</p>
                    <p className="text-xs text-gray-400">Calls will appear here when you log them or sync via API.</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Call list */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {calls.map(call => (
                                    <li key={call.id}>
                                        <button
                                            onClick={() => handleSelectCall(call.id)}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition flex items-center justify-between ${
                                                selectedCallId === call.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                    call.direction === 'INCOMING'
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {call.direction === 'INCOMING' ? '↙️' : '↗️'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {call.contact?.name || call.caller_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {call.caller_phone_e164} · {new Date(call.call_time).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-3">
                                                {call.duration_sec && (
                                                    <span className="text-xs text-gray-400 hidden sm:block">
                                                        {Math.floor(call.duration_sec / 60)}m {call.duration_sec % 60}s
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400 hidden sm:block">
                                                    {call.tasks?.length > 0 ? `${call.tasks.length} task${call.tasks.length > 1 ? 's' : ''}` : ''}
                                                </span>
                                                <svg
                                                    className={`w-4 h-4 text-gray-300 transition-transform ${selectedCallId === call.id ? 'rotate-90' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Detail panel — shown when a call is selected */}
                    {selectedCall && (
                        <div className="w-full lg:w-96 shrink-0">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                {/* Call summary header */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">
                                                {selectedCall.contact?.name || selectedCall.caller_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-500">{selectedCall.caller_phone_e164}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(selectedCall.call_time).toLocaleString()} ·{' '}
                                                {selectedCall.direction === 'INCOMING' ? 'Incoming' : 'Outgoing'}
                                                {selectedCall.duration_sec ? ` · ${Math.floor(selectedCall.duration_sec / 60)}m ${selectedCall.duration_sec % 60}s` : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedCallId(null); setTranscriptReady(false); }}
                                            className="text-gray-300 hover:text-gray-500 transition shrink-0"
                                            title="Close"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {selectedCall.notes && (
                                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{selectedCall.notes}</p>
                                    )}
                                </div>

                                {/* Transcription + Analysis */}
                                <div className="p-4 space-y-3">
                                    <TranscriptPanel
                                        callLogId={selectedCallId}
                                        onTranscriptReady={handleTranscriptReady}
                                    />
                                    <AnalysisPanel
                                        callLogId={selectedCallId}
                                        transcriptReady={transcriptReady}
                                    />
                                </div>

                                {/* Tasks linked to this call */}
                                {selectedCall.tasks?.length > 0 && (
                                    <div className="px-4 pb-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Linked Tasks
                                        </h4>
                                        <ul className="space-y-1">
                                            {selectedCall.tasks.map(task => (
                                                <li key={task.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                                                    <span className="truncate text-gray-700">{task.title}</span>
                                                    <span className={`text-xs ml-2 shrink-0 ${
                                                        task.status === 'Done' ? 'text-green-600' :
                                                        task.status === 'In Progress' ? 'text-blue-600' :
                                                        'text-gray-400'
                                                    }`}>{task.status}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
