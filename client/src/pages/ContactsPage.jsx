import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, Search, X, User, Phone, Mail, Building2, Loader2 } from 'lucide-react';

// ─── Create Contact Modal ───────────────────────────────────────────────────────
function CreateContactModal({ isOpen, onClose, onCreated }) {
    const empty = { name: '', email: '', phone: '', company: '' };
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => { setForm(empty); setError(''); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/contacts', {
                name:    form.name.trim(),
                email:   form.email.trim() || undefined,
                phone:   form.phone.trim() || undefined,
                company: form.company.trim() || undefined,
            });
            onCreated?.(res.data?.data || res.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create contact.');
        } finally {
            setLoading(false);
        }
    };

    const field = (key, label, icon, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
                <input
                    type={type}
                    value={form[key]}
                    onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setError(''); }}
                    placeholder={placeholder}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>
        </div>
    );

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
                                <Dialog.Title className="text-base font-semibold text-gray-900">New contact</Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                                {field('name',    'Full name *',  <User    size={13} />, 'text',  'Jane Smith')}
                                {field('email',   'Email',        <Mail    size={13} />, 'email', 'jane@example.com')}
                                {field('phone',   'Phone',        <Phone   size={13} />, 'tel',   '+91 98765 43210')}
                                {field('company', 'Company',      <Building2 size={13} />, 'text', 'Acme Corp')}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={handleClose} className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={!form.name.trim() || loading} className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {loading ? 'Creating…' : 'Create'}
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

// ─── ContactsPage ───────────────────────────────────────────────────────────────
function initials(name) {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500',
    'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
];

function avatarColor(name) {
    let h = 0;
    for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const fetchContacts = async () => {
        try {
            const res = await axios.get('/api/contacts');
            setContacts(res.data?.data || res.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContacts(); }, []);

    const handleCreated = (contact) => setContacts(c => [contact, ...c]);

    const filtered = contacts.filter(c => {
        const q = search.toLowerCase();
        return !q
            || c.name?.toLowerCase().includes(q)
            || c.email?.toLowerCase().includes(q)
            || c.company?.toLowerCase().includes(q)
            || c.phone?.includes(q);
    });

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                    <Plus size={15} />
                    New contact
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                    <User size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        {search ? 'No contacts match your search' : 'No contacts yet'}
                    </p>
                    {!search && (
                        <p className="text-xs text-gray-400 mb-4">Add your first contact to get started.</p>
                    )}
                    {!search && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                        >
                            <Plus size={14} /> Add contact
                        </button>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {filtered.map(c => (
                        <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.name)}`}>
                                {initials(c.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    {c.company && <span className="text-xs text-gray-500 truncate">{c.company}</span>}
                                    {c.email && <span className="text-xs text-gray-400 truncate">{c.email}</span>}
                                </div>
                            </div>
                            {c.phone && (
                                <a
                                    href={`tel:${c.phone}`}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors shrink-0"
                                >
                                    <Phone size={12} />
                                    {c.phone}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <CreateContactModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    );
}
