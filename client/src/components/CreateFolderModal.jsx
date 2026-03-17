/**
 * CreateFolderModal
 *
 * Simple modal for creating a folder (group of projects).
 * UI-complete stub — wires to backend when folder API is available.
 */

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, FolderPlus } from 'lucide-react';

export default function CreateFolderModal({ isOpen, onClose, onCreated }) {
    const [name, setName]     = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');

    const handleClose = () => {
        setName('');
        setError('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError('');
        try {
            // TODO: wire to real folder endpoint when available
            await new Promise(r => setTimeout(r, 250));
            onCreated?.({ name: name.trim() });
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create folder.');
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
                    leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"  leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                    <FolderPlus size={17} className="text-gray-500" />
                                    New folder
                                </Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Folder name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={e => { setName(e.target.value); setError(''); }}
                                        placeholder="e.g. Client Projects"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        Folders group related projects together.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!name.trim() || loading}
                                        className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Creating…' : 'Create folder'}
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
