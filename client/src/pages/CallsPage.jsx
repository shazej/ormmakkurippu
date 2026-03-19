/**
 * CallsPage — Timeline-style call history with full CRUD + task conversion.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Phone, PhoneIncoming, PhoneOutgoing, Plus, Search,
    Pencil, Trash2, ClipboardList, X, ChevronDown,
    AlertCircle, UserCheck, CheckCircle2
} from 'lucide-react';
import LogCallModal from '../components/LogCallModal';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDuration(secs) {
    if (secs == null) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function formatCallTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(calls) {
    const groups = {};
    calls.forEach(call => {
        const d = new Date(call.call_time);
        const key = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(call);
    });
    return Object.entries(groups); // [ [dateLabel, [calls...]], ... ]
}

function isToday(iso) {
    return new Date(iso).toDateString() === new Date().toDateString();
}

function isYesterday(iso) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return new Date(iso).toDateString() === y.toDateString();
}

function friendlyDateLabel(dateLabel, isoSample) {
    if (isToday(isoSample)) return 'Today';
    if (isYesterday(isoSample)) return 'Yesterday';
    return dateLabel;
}

// ── Delete confirmation dialog ─────────────────────────────────────────────────
function DeleteConfirm({ call, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={18} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Delete call?</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            This will delete the call from <span className="font-medium">
                                {call.contact?.name || call.caller_name || call.caller_phone_e164}
                            </span>. This cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors"
                    >
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Single Call Item ───────────────────────────────────────────────────────────
function CallItem({ call, onEdit, onDelete, onConvertToTask, convertingId }) {
    const liveTasks = (call.tasks || []).filter(t => !t.deleted_at);
    const hasTask = liveTasks.length > 0;
    const isConverting = convertingId === call.id;

    const displayName = call.contact?.name || call.caller_name || 'Unknown';
    const duration = formatDuration(call.duration_sec);
    const timeStr = formatCallTime(call.call_time);

    return (
        <div className="group flex items-start gap-3 py-3 px-1">
            {/* Direction icon */}
            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                call.direction === 'INCOMING'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-blue-50 text-blue-600'
            }`}>
                {call.direction === 'INCOMING'
                    ? <PhoneIncoming size={14} />
                    : <PhoneOutgoing size={14} />
                }
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        {/* Name + phone */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-gray-900 truncate">
                                {displayName}
                            </span>
                            {call.contact && (
                                <span title="Linked to contact">
                                    <UserCheck size={12} className="text-blue-500 shrink-0" />
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400">{call.caller_phone_e164}</span>
                            {timeStr && (
                                <>
                                    <span className="text-gray-200 text-xs">·</span>
                                    <span className="text-xs text-gray-400">{timeStr}</span>
                                </>
                            )}
                            {duration && (
                                <>
                                    <span className="text-gray-200 text-xs">·</span>
                                    <span className="text-xs text-gray-500 font-medium">{duration}</span>
                                </>
                            )}
                            {call.source !== 'MANUAL' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                                    {call.source}
                                </span>
                            )}
                        </div>

                        {/* Notes preview */}
                        {call.notes && (
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {call.notes}
                            </p>
                        )}

                        {/* Linked task badge */}
                        {hasTask && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <CheckCircle2 size={11} className="text-green-500" />
                                <span className="text-[11px] text-green-700 font-medium">
                                    Task: {liveTasks[0].title}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!hasTask && (
                            <button
                                onClick={() => onConvertToTask(call)}
                                disabled={isConverting}
                                title="Convert to task"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ClipboardList size={14} />
                            </button>
                        )}
                        <button
                            onClick={() => onEdit(call)}
                            title="Edit call"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => onDelete(call)}
                            title="Delete call"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Filter bar ─────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange }) {
    return (
        <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={filters.search}
                    onChange={e => onChange({ ...filters, search: e.target.value })}
                    placeholder="Search calls…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-gray-50"
                />
            </div>

            {/* Direction */}
            <select
                value={filters.direction}
                onChange={e => onChange({ ...filters, direction: e.target.value })}
                className="py-2 pl-3 pr-7 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-gray-50 appearance-none cursor-pointer"
            >
                <option value="">All directions</option>
                <option value="INCOMING">Incoming</option>
                <option value="OUTGOING">Outgoing</option>
            </select>

            {/* Linked */}
            <select
                value={filters.linked}
                onChange={e => onChange({ ...filters, linked: e.target.value })}
                className="py-2 pl-3 pr-7 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-gray-50 appearance-none cursor-pointer"
            >
                <option value="">All contacts</option>
                <option value="true">Linked</option>
                <option value="false">Unlinked</option>
            </select>

            {/* Clear */}
            {(filters.search || filters.direction || filters.linked) && (
                <button
                    onClick={() => onChange({ search: '', direction: '', linked: '' })}
                    className="flex items-center gap-1 py-2 px-3 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <X size={12} />
                    Clear
                </button>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', direction: '', linked: '' });

    const [logModalOpen, setLogModalOpen] = useState(false);
    const [editingCall, setEditingCall] = useState(null);
    const [deletingCall, setDeletingCall] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [convertingId, setConvertingId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCalls = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.direction) params.direction = filters.direction;
            if (filters.linked) params.linked = filters.linked;
            const res = await axios.get('/api/calls', { params });
            const data = res.data?.data || res.data;
            setCalls(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load calls. Please try again.');
            console.error('fetchCalls error:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    const handleSaved = (savedCall) => {
        if (editingCall) {
            setCalls(prev => prev.map(c => c.id === savedCall.id ? savedCall : c));
            showToast('Call updated.');
        } else {
            setCalls(prev => [savedCall, ...prev]);
            showToast('Call logged.');
        }
        setEditingCall(null);
    };

    const handleEdit = (call) => {
        setEditingCall(call);
        setLogModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingCall) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`/api/calls/${deletingCall.id}`);
            setCalls(prev => prev.filter(c => c.id !== deletingCall.id));
            showToast('Call deleted.');
        } catch (err) {
            showToast('Failed to delete call.', 'error');
        } finally {
            setDeleteLoading(false);
            setDeletingCall(null);
        }
    };

    const handleConvertToTask = async (call) => {
        setConvertingId(call.id);
        try {
            const res = await axios.post('/api/calls/task', { callLogId: call.id });
            const task = res.data?.data || res.data;
            // Update call in list to show linked task
            setCalls(prev => prev.map(c => {
                if (c.id !== call.id) return c;
                return {
                    ...c,
                    tasks: [...(c.tasks || []), { id: task.id, title: task.title, status: task.status, deleted_at: null }]
                };
            }));
            showToast('Task created from call.');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create task.';
            showToast(msg, 'error');
        } finally {
            setConvertingId(null);
        }
    };

    const grouped = groupByDate(calls);

    const statsIncoming = calls.filter(c => c.direction === 'INCOMING').length;
    const statsOutgoing = calls.filter(c => c.direction === 'OUTGOING').length;

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Phone size={18} className="text-blue-600" />
                        Call Log
                    </h1>
                    {!loading && calls.length > 0 && (
                        <p className="text-sm text-gray-400 mt-0.5">
                            {calls.length} call{calls.length !== 1 ? 's' : ''} ·{' '}
                            <span className="text-green-600">{statsIncoming} in</span>{' '}·{' '}
                            <span className="text-blue-600">{statsOutgoing} out</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => { setEditingCall(null); setLogModalOpen(true); }}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={15} />
                    Log Call
                </button>
            </div>

            {/* Filter bar */}
            <div className="mb-5">
                <FilterBar filters={filters} onChange={setFilters} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-start gap-3 py-3 px-1 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
                                <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <AlertCircle size={18} className="text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600">{error}</p>
                    <button
                        onClick={fetchCalls}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            ) : calls.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <Phone size={24} className="text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                        {filters.search || filters.direction || filters.linked
                            ? 'No calls match your filters'
                            : 'No calls logged yet'
                        }
                    </p>
                    <p className="text-xs text-gray-400 max-w-xs">
                        {filters.search || filters.direction || filters.linked
                            ? 'Try adjusting or clearing your filters.'
                            : 'Start by logging your first call using the button above.'
                        }
                    </p>
                    {!(filters.search || filters.direction || filters.linked) && (
                        <button
                            onClick={() => { setEditingCall(null); setLogModalOpen(true); }}
                            className="mt-4 flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors"
                        >
                            <Plus size={14} />
                            Log your first call
                        </button>
                    )}
                </div>
            ) : (
                /* Timeline grouped by date */
                <div className="space-y-6">
                    {grouped.map(([dateLabel, dayCalls]) => (
                        <div key={dateLabel}>
                            {/* Date header */}
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {friendlyDateLabel(dateLabel, dayCalls[0].call_time)}
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs text-gray-300">{dayCalls.length}</span>
                            </div>

                            {/* Call items */}
                            <div className="divide-y divide-gray-50">
                                {dayCalls.map(call => (
                                    <CallItem
                                        key={call.id}
                                        call={call}
                                        onEdit={handleEdit}
                                        onDelete={setDeletingCall}
                                        onConvertToTask={handleConvertToTask}
                                        convertingId={convertingId}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log / Edit modal */}
            <LogCallModal
                isOpen={logModalOpen}
                onClose={() => { setLogModalOpen(false); setEditingCall(null); }}
                onSaved={handleSaved}
                initialData={editingCall}
            />

            {/* Delete confirm */}
            {deletingCall && (
                <DeleteConfirm
                    call={deletingCall}
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingCall(null)}
                    loading={deleteLoading}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
                    toast.type === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-900 text-white'
                }`}>
                    {toast.type === 'error'
                        ? <AlertCircle size={14} />
                        : <CheckCircle2 size={14} />
                    }
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
