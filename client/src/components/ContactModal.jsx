/**
 * ContactModal — create or edit a contact
 * Reuses the same Dialog/Transition pattern as CreateTaskModal.
 */
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import axios from 'axios';

const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400';

export default function ContactModal({ isOpen, onClose, onSaved, contact = null }) {
    const isEdit = !!contact;

    const [name, setName]     = useState('');
    const [phone, setPhone]   = useState('');
    const [email, setEmail]   = useState('');
    const [notes, setNotes]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState(null);

    // Pre-fill when editing
    useEffect(() => {
        if (contact) {
            setName(contact.name || '');
            setPhone(contact.phone_e164 || '');
            setEmail(contact.email || '');
            setNotes(contact.notes || '');
        } else {
            setName(''); setPhone(''); setEmail(''); setNotes('');
        }
        setError(null);
    }, [contact, isOpen]);

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() && !phone.trim()) {
            setError('Name or phone is required.');
            return;
        }
        setLoading(true);
        setError(null);

        const payload = {
            name: name.trim() || undefined,
            phone: phone.trim(),
            email: email.trim() || undefined,
            notes: notes.trim() || undefined
        };

        try {
            if (isEdit) {
                await axios.patch(`/api/contacts/${contact.id}`, payload);
            } else {
                await axios.post('/api/contacts', payload);
            }
            onSaved();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save contact.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <Dialog.Title className="text-sm font-semibold text-gray-900">
                                    {isEdit ? 'Edit contact' : 'New contact'}
                                </Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                                    <X size={17} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                        {error}
                                    </p>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Full name"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+97455170700"
                                        required
                                        className={inputCls}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="contact@example.com"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Any notes about this contact…"
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!phone.trim() || loading}
                                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save changes' : 'Add contact')}
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
