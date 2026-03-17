import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Phone, User, Clock, FileText } from 'lucide-react';
import axios from 'axios';

const DIRECTIONS = [
    { value: 'INCOMING', label: 'Incoming', icon: '↙' },
    { value: 'OUTGOING', label: 'Outgoing', icon: '↗' },
];

const OUTCOMES = [
    { value: 'ANSWERED',    label: 'Answered' },
    { value: 'NO_ANSWER',   label: 'No answer' },
    { value: 'VOICEMAIL',   label: 'Voicemail' },
    { value: 'BUSY',        label: 'Busy' },
];

export default function LogCallModal({ isOpen, onClose, onLogged }) {
    const empty = {
        caller_name:      '',
        caller_phone_e164: '',
        direction:        'OUTGOING',
        outcome:          'ANSWERED',
        duration_sec:     '',
        notes:            '',
        call_time:        new Date().toISOString().slice(0, 16),
    };
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => { setForm(empty); setError(''); onClose(); };

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                caller_name:       form.caller_name.trim() || undefined,
                caller_phone_e164: form.caller_phone_e164.trim() || undefined,
                direction:         form.direction,
                outcome:           form.outcome,
                duration_sec:      form.duration_sec ? parseInt(form.duration_sec, 10) : undefined,
                notes:             form.notes.trim() || undefined,
                call_time:         form.call_time ? new Date(form.call_time).toISOString() : undefined,
            };
            const res = await axios.post('/api/calls', payload);
            onLogged?.(res.data?.data || res.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log call.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                    <Phone size={16} className="text-gray-500" />
                                    Log a call
                                </Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                                {/* Direction */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Direction</label>
                                    <div className="flex gap-2">
                                        {DIRECTIONS.map(d => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => set('direction', d.value)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                                    form.direction === d.value
                                                        ? 'border-red-600 bg-red-50 text-red-700'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                            >
                                                {d.icon} {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Caller name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Contact name</label>
                                    <div className="relative">
                                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.caller_name}
                                            onChange={e => set('caller_name', e.target.value)}
                                            placeholder="Jane Smith"
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number</label>
                                    <div className="relative">
                                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={form.caller_phone_e164}
                                            onChange={e => set('caller_phone_e164', e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Outcome + Duration row */}
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Outcome</label>
                                        <select
                                            value={form.outcome}
                                            onChange={e => set('outcome', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                        >
                                            {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration (sec)</label>
                                        <div className="relative">
                                            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.duration_sec}
                                                onChange={e => set('duration_sec', e.target.value)}
                                                placeholder="120"
                                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Date/time */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Date & time</label>
                                    <input
                                        type="datetime-local"
                                        value={form.call_time}
                                        onChange={e => set('call_time', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                                    <div className="relative">
                                        <FileText size={13} className="absolute left-3 top-3 text-gray-400" />
                                        <textarea
                                            value={form.notes}
                                            onChange={e => set('notes', e.target.value)}
                                            placeholder="What was discussed…"
                                            rows={3}
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={handleClose} className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {loading ? 'Saving…' : 'Log call'}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
