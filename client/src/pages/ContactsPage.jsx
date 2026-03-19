/**
 * ContactsPage — CRM-lite contact management workspace
 * Features: list, search, create, edit, delete, view detail
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Users, Phone, Mail, Pencil, Trash2, ChevronRight, X } from 'lucide-react';
import ContactModal from '../components/ContactModal';

function ContactAvatar({ name, phone }) {
    const label = name ? name[0].toUpperCase() : (phone ? phone.slice(-2) : '?');
    const colors = [
        'bg-red-100 text-red-700',
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-purple-100 text-purple-700',
        'bg-amber-100 text-amber-700',
        'bg-teal-100 text-teal-700',
    ];
    const idx = (name || phone || '').charCodeAt(0) % colors.length;
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors[idx]}`}>
            {label}
        </div>
    );
}

function ContactCard({ contact, onEdit, onDelete, onView }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
            <div className="flex items-start gap-3">
                <ContactAvatar name={contact.name} phone={contact.phone_e164} />

                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => onView(contact)}
                        className="block text-left w-full"
                    >
                        <p className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                            {contact.name || <span className="text-gray-400 font-normal italic">No name</span>}
                        </p>
                        <div className="mt-1 space-y-0.5">
                            {contact.phone_e164 && (
                                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Phone size={11} className="shrink-0" />
                                    <span className="truncate">{contact.phone_e164}</span>
                                </p>
                            )}
                            {contact.email && (
                                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Mail size={11} className="shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                </p>
                            )}
                        </div>
                        {(contact._count?.call_logs > 0 || contact._count?.tasks > 0) && (
                            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                                {contact._count.call_logs > 0 && (
                                    <span>{contact._count.call_logs} call{contact._count.call_logs !== 1 ? 's' : ''}</span>
                                )}
                                {contact._count.tasks > 0 && (
                                    <span>{contact._count.tasks} task{contact._count.tasks !== 1 ? 's' : ''}</span>
                                )}
                            </div>
                        )}
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        onClick={() => onView(contact)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View details"
                    >
                        <ChevronRight size={15} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onEdit(contact); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(contact); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmDialog({ contact, onConfirm, onCancel, loading }) {
    if (!contact) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Delete contact?</h3>
                <p className="text-sm text-gray-500 mb-5">
                    <strong>{contact.name || contact.phone_e164}</strong> will be removed. Linked calls and tasks will remain but the contact link will be preserved for history.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ContactsPage() {
    const navigate = useNavigate();
    const [contacts, setContacts]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [search, setSearch]           = useState('');
    const [modalOpen, setModalOpen]     = useState(false);
    const [editContact, setEditContact] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const debounceRef = useRef(null);

    const fetchContacts = useCallback(async (q = '') => {
        try {
            setLoading(true);
            setError(null);
            const params = q ? { search: q } : {};
            const res = await axios.get('/api/contacts', { params });
            setContacts(res.data?.data || res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load contacts.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Debounced search
    const handleSearch = (value) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchContacts(value);
        }, 300);
    };

    const handleEdit = (contact) => {
        setEditContact(contact);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditContact(null);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditContact(null);
    };

    const handleSaved = () => {
        fetchContacts(search);
    };

    const handleView = (contact) => {
        navigate(`/app/contacts/${contact.id}`);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`/api/contacts/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchContacts(search);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete contact.');
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {!loading && `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                    <Plus size={16} />
                    Add contact
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by name, phone, or email…"
                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400"
                />
                {search && (
                    <button
                        onClick={() => handleSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading contacts…</span>
                </div>
            ) : contacts.length === 0 ? (
                /* Empty state */
                <div className="py-16 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users size={24} className="text-gray-400" />
                    </div>
                    {search ? (
                        <>
                            <p className="text-gray-500 font-medium">No contacts found</p>
                            <p className="text-sm text-gray-400">Try a different name, phone, or email.</p>
                            <button
                                onClick={() => handleSearch('')}
                                className="text-sm text-red-600 hover:underline"
                            >
                                Clear search
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-500 font-medium">No contacts yet</p>
                            <p className="text-sm text-gray-400">Add your first contact to get started.</p>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <Plus size={15} />
                                Add contact
                            </button>
                        </>
                    )}
                </div>
            ) : (
                /* Contact grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={handleEdit}
                            onDelete={setDeleteTarget}
                            onView={handleView}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <ContactModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onSaved={handleSaved}
                contact={editContact}
            />

            {/* Delete Confirm */}
            {deleteTarget && (
                <DeleteConfirmDialog
                    contact={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
}
