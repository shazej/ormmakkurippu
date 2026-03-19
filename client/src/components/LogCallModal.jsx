/**
 * LogCallModal — Create or edit a call log entry.
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onSaved      (callLog) => void
 *   initialData  object | null  — if set, runs in edit mode
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Phone, PhoneIncoming, PhoneOutgoing, Search, CheckCircle2 } from 'lucide-react';

function formatDurationDisplay(totalSec) {
    if (!totalSec && totalSec !== 0) return '';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
}

function parseDurationToSec(mins, secs) {
    const m = parseInt(mins, 10) || 0;
    const s = parseInt(secs, 10) || 0;
    return m * 60 + s;
}

export default function LogCallModal({ isOpen, onClose, onSaved, initialData }) {
    const isEdit = Boolean(initialData?.id);

    const [form, setForm] = useState({
        caller_phone_e164: '',
        caller_name: '',
        direction: 'INCOMING',
        dur_min: '',
        dur_sec: '',
        notes: '',
        call_time: '',
        contact_id: null
    });

    const [contacts, setContacts] = useState([]);
    const [contactSearch, setContactSearch] = useState('');
    const [showContactDrop, setShowContactDrop] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const contactDropRef = useRef(null);

    // Populate form in edit mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const dur_min = initialData.duration_sec != null ? String(Math.floor(initialData.duration_sec / 60)) : '';
                const dur_sec = initialData.duration_sec != null ? String(initialData.duration_sec % 60) : '';
                // Format call_time for datetime-local input
                let call_time = '';
                if (initialData.call_time) {
                    const d = new Date(initialData.call_time);
                    call_time = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16);
                }
                setForm({
                    caller_phone_e164: initialData.caller_phone_e164 || '',
                    caller_name: initialData.caller_name || '',
                    direction: initialData.direction || 'INCOMING',
                    dur_min,
                    dur_sec,
                    notes: initialData.notes || '',
                    call_time,
                    contact_id: initialData.contact_id || null
                });
                setSelectedContact(initialData.contact || null);
                setContactSearch(initialData.contact?.name || initialData.contact?.phone_e164 || '');
            } else {
                const now = new Date();
                const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16);
                setForm({
                    caller_phone_e164: '',
                    caller_name: '',
                    direction: 'INCOMING',
                    dur_min: '',
                    dur_sec: '',
                    notes: '',
                    call_time: localIso,
                    contact_id: null
                });
                setSelectedContact(null);
                setContactSearch('');
            }
            setError('');
        }
    }, [isOpen, initialData]);

    // Fetch contacts for selector
    useEffect(() => {
        if (!isOpen) return;
        axios.get('/api/contacts').then(res => {
            const data = res.data?.data || res.data || [];
            setContacts(Array.isArray(data) ? data : []);
        }).catch(() => setContacts([]));
    }, [isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (contactDropRef.current && !contactDropRef.current.contains(e.target)) {
                setShowContactDrop(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredContacts = contacts.filter(c => {
        if (!contactSearch) return true;
        const q = contactSearch.toLowerCase();
        return (
            c.name?.toLowerCase().includes(q) ||
            c.phone_e164?.includes(contactSearch) ||
            c.email?.toLowerCase().includes(q)
        );
    });

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setForm(f => ({
            ...f,
            contact_id: contact.id,
            caller_phone_e164: f.caller_phone_e164 || contact.phone_e164 || '',
            caller_name: f.caller_name || contact.name || ''
        }));
        setContactSearch(contact.name || contact.phone_e164);
        setShowContactDrop(false);
    };

    const handleClearContact = () => {
        setSelectedContact(null);
        setForm(f => ({ ...f, contact_id: null }));
        setContactSearch('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.caller_phone_e164.trim()) {
            setError('Phone number is required.');
            return;
        }

        const duration_sec = (form.dur_min || form.dur_sec)
            ? parseDurationToSec(form.dur_min, form.dur_sec)
            : undefined;

        const payload = {
            caller_phone_e164: form.caller_phone_e164.trim(),
            caller_name: form.caller_name.trim() || undefined,
            direction: form.direction,
            notes: form.notes.trim() || undefined,
            call_time: form.call_time ? new Date(form.call_time).toISOString() : undefined,
            contact_id: form.contact_id || undefined
        };
        if (duration_sec !== undefined) payload.duration_sec = duration_sec;

        setLoading(true);
        try {
            let res;
            if (isEdit) {
                res = await axios.patch(`/api/calls/${initialData.id}`, payload);
            } else {
                res = await axios.post('/api/calls', payload);
            }
            const saved = res.data?.data || res.data;
            onSaved(saved);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save call log.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Phone size={15} className="text-blue-600" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">
                            {isEdit ? 'Edit Call' : 'Log a Call'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form id="log-call-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Direction toggle */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Direction</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'INCOMING', label: 'Incoming', Icon: PhoneIncoming, color: 'green' },
                                { value: 'OUTGOING', label: 'Outgoing', Icon: PhoneOutgoing, color: 'blue' }
                            ].map(({ value, label, Icon, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, direction: value }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                        form.direction === value
                                            ? color === 'green'
                                                ? 'bg-green-50 border-green-300 text-green-700'
                                                : 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={form.caller_phone_e164}
                            onChange={e => setForm(f => ({ ...f, caller_phone_e164: e.target.value }))}
                            placeholder="+974 5000 0000"
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Caller Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Caller Name</label>
                        <input
                            type="text"
                            value={form.caller_name}
                            onChange={e => setForm(f => ({ ...f, caller_name: e.target.value }))}
                            placeholder="John Doe"
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Contact link */}
                    <div ref={contactDropRef}>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Link to Contact</label>
                        {selectedContact ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                                <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                                <span className="text-sm text-blue-800 font-medium flex-1 truncate">
                                    {selectedContact.name || selectedContact.phone_e164}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleClearContact}
                                    className="text-blue-400 hover:text-blue-600"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={contactSearch}
                                    onChange={e => { setContactSearch(e.target.value); setShowContactDrop(true); }}
                                    onFocus={() => setShowContactDrop(true)}
                                    placeholder="Search contacts…"
                                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                />
                                {showContactDrop && filteredContacts.length > 0 && (
                                    <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                                        {filteredContacts.slice(0, 10).map(c => (
                                            <li key={c.id}>
                                                <button
                                                    type="button"
                                                    onMouseDown={() => handleSelectContact(c)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                                                        {(c.name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{c.name || 'No name'}</div>
                                                        <div className="text-xs text-gray-400 truncate">{c.phone_e164}</div>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration</label>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-1.5 flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    value={form.dur_min}
                                    onChange={e => setForm(f => ({ ...f, dur_min: e.target.value }))}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-center"
                                />
                                <span className="text-xs text-gray-400 shrink-0">min</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={form.dur_sec}
                                    onChange={e => setForm(f => ({ ...f, dur_sec: e.target.value }))}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-center"
                                />
                                <span className="text-xs text-gray-400 shrink-0">sec</span>
                            </div>
                        </div>
                    </div>

                    {/* Call date/time */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date &amp; Time</label>
                        <input
                            type="datetime-local"
                            value={form.call_time}
                            onChange={e => setForm(f => ({ ...f, call_time: e.target.value }))}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="What was discussed…"
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="log-call-form"
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
                    >
                        {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Call'}
                    </button>
                </div>
            </div>
        </div>
    );
}
