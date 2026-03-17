import { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, PhoneIncoming, PhoneOutgoing, Plus, Loader2, ClipboardList } from 'lucide-react';
import LogCallModal from '../components/LogCallModal';

const DIRECTION_ICON = { INCOMING: PhoneIncoming, OUTGOING: PhoneOutgoing };
const DIRECTION_STYLE = { INCOMING: 'bg-green-50 text-green-600', OUTGOING: 'bg-blue-50 text-blue-600' };
const OUTCOME_STYLE = {
    ANSWERED:  'text-green-700 bg-green-50',
    NO_ANSWER: 'text-amber-700 bg-amber-50',
    VOICEMAIL: 'text-purple-700 bg-purple-50',
    BUSY:      'text-red-700 bg-red-50',
};

function formatDuration(sec) {
    if (!sec) return null;
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso), now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchCalls = async () => {
        try {
            const res = await axios.get('/api/calls');
            setCalls(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Error fetching calls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCalls(); }, []);

    const handleLogged = (call) => setCalls(c => [call, ...c]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Call log</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                    <Plus size={15} /> Log call
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
            ) : calls.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                    <Phone size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500 mb-1">No calls logged yet</p>
                    <p className="text-xs text-gray-400 mb-4">Log your first call to keep track of conversations.</p>
                    <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                        <Plus size={14} /> Log a call
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {calls.map(call => {
                        const DirIcon = DIRECTION_ICON[call.direction] ?? Phone;
                        const dur = formatDuration(call.duration_sec);
                        return (
                            <div key={call.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${DIRECTION_STYLE[call.direction] || 'bg-gray-100 text-gray-500'}`}>
                                    <DirIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {call.contact?.name || call.caller_name || 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {call.caller_phone_e164 && <span className="text-xs text-gray-500">{call.caller_phone_e164}</span>}
                                        {dur && <span className="text-xs text-gray-400">· {dur}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {call.outcome && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_STYLE[call.outcome] || 'bg-gray-100 text-gray-500'}`}>
                                            {call.outcome.replace('_', ' ').charAt(0) + call.outcome.replace('_', ' ').slice(1).toLowerCase()}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">{formatTime(call.call_time)}</span>
                                    {call.notes && <span title={call.notes}><ClipboardList size={13} className="text-gray-300" /></span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <LogCallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onLogged={handleLogged} />
        </div>
    );
}
