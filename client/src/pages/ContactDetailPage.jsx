/**
 * ContactDetailPage — contact details + interaction history
 * Shows contact info, related calls, and related tasks in a timeline.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Phone, Mail, FileText, Pencil, Trash2,
    PhoneCall, CheckSquare, Clock, Building2
} from 'lucide-react';
import ContactModal from '../components/ContactModal';

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDuration(sec) {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function InfoRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 mt-0.5 break-words">{value}</p>
            </div>
        </div>
    );
}

function CallItem({ call }) {
    const isIncoming = call.direction === 'INCOMING';
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isIncoming ? 'bg-green-100' : 'bg-blue-100'}`}>
                <PhoneCall size={14} className={isIncoming ? 'text-green-600' : 'text-blue-600'} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">
                        {isIncoming ? 'Incoming' : 'Outgoing'} call
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(call.call_time)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    {call.duration_sec && (
                        <span className="text-xs text-gray-500">{formatDuration(call.duration_sec)}</span>
                    )}
                    {call.notes && (
                        <span className="text-xs text-gray-400 truncate">{call.notes}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function TaskItem({ task }) {
    const statusColor = {
        'Pending': 'bg-amber-100 text-amber-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Completed': 'bg-green-100 text-green-700',
    }[task.status] || 'bg-gray-100 text-gray-600';

    const priorityColor = {
        'High': 'text-red-500',
        'Medium': 'text-amber-500',
        'Low': 'text-green-500',
    }[task.priority] || '';

    return (
        <Link
            to={`/app/tasks/${task.id}`}
            className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
        >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <CheckSquare size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium ${statusColor}`}>
                        {task.status}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <span className={`text-xs font-medium ${priorityColor}`}>{task.priority}</span>
                    {task.due_date && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(task.due_date).toLocaleDateString()}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(task.created_at)}</span>
                </div>
            </div>
        </Link>
    );
}

function DeleteConfirmDialog({ contact, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Delete contact?</h3>
                <p className="text-sm text-gray-500 mb-5">
                    <strong>{contact.name || contact.phone_e164}</strong> will be removed. Linked calls and tasks will remain but the contact link will be preserved for history.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ContactDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contact, setContact]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [editOpen, setEditOpen]       = useState(false);
    const [showDelete, setShowDelete]   = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchContact = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/api/contacts/${id}`);
            setContact(res.data?.data || res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load contact.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContact();
    }, [id]);

    const handleDeleted = async () => {
        setDeleteLoading(true);
        try {
            await axios.delete(`/api/contacts/${id}`);
            navigate('/app/contacts');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete contact.');
            setShowDelete(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                <span className="text-sm">Loading contact…</span>
            </div>
        );
    }

    if (error || !contact) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-600 text-sm mb-4">{error || 'Contact not found.'}</p>
                <button onClick={() => navigate('/app/contacts')} className="text-sm text-red-600 hover:underline">
                    ← Back to contacts
                </button>
            </div>
        );
    }

    const initials = contact.name
        ? contact.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : contact.phone_e164?.slice(-2) || '?';

    const calls = contact.call_logs || [];
    const tasks = contact.tasks || [];

    // Merged timeline sorted by date desc
    const timeline = [
        ...calls.map(c => ({ type: 'call', date: c.call_time, data: c })),
        ...tasks.map(t => ({ type: 'task', date: t.created_at, data: t })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div>
            {/* Back nav */}
            <button
                onClick={() => navigate('/app/contacts')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
            >
                <ArrowLeft size={15} />
                Contacts
            </button>

            {/* Contact card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {contact.name || <span className="text-gray-400 italic font-normal">No name</span>}
                            </h1>
                            {contact.company && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Building2 size={12} />
                                    {contact.company}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setEditOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Pencil size={13} />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowDelete(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={13} />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Contact details */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                    <InfoRow icon={Phone} label="Phone" value={contact.phone_e164} />
                    <InfoRow icon={Mail} label="Email" value={contact.email} />
                    <InfoRow icon={FileText} label="Notes" value={contact.notes} />
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{calls.length}</p>
                        <p className="text-xs text-gray-400">Calls</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{tasks.length}</p>
                        <p className="text-xs text-gray-400">Tasks</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400">Added</p>
                        <p className="text-xs text-gray-600 mt-0.5">{new Date(contact.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* History */}
            {timeline.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-gray-400 text-sm">No activity yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Calls and tasks linked to this contact will appear here.</p>
                </div>
            ) : (
                <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Activity history</h2>

                    {/* Calls section */}
                    {calls.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <PhoneCall size={12} />
                                Calls ({calls.length})
                            </h3>
                            {calls.map(call => (
                                <CallItem key={call.id} call={call} />
                            ))}
                        </div>
                    )}

                    {/* Tasks section */}
                    {tasks.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <CheckSquare size={12} />
                                Tasks ({tasks.length})
                            </h3>
                            {tasks.map(task => (
                                <TaskItem key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit modal */}
            <ContactModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                onSaved={fetchContact}
                contact={contact}
            />

            {/* Delete confirm */}
            {showDelete && (
                <DeleteConfirmDialog
                    contact={contact}
                    onConfirm={handleDeleted}
                    onCancel={() => setShowDelete(false)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
}
