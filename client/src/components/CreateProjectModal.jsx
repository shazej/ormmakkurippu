/**
 * CreateProjectModal
 *
 * Simple modal for creating a new project.
 * Currently UI-complete; wires to /api/workspaces when that endpoint
 * is ready to serve project-level entities.
 */

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

const COLORS = [
    { name: 'Red',    value: '#ef4444', cls: 'bg-red-500'    },
    { name: 'Blue',   value: '#3b82f6', cls: 'bg-blue-500'   },
    { name: 'Green',  value: '#22c55e', cls: 'bg-green-500'  },
    { name: 'Amber',  value: '#f59e0b', cls: 'bg-amber-500'  },
    { name: 'Purple', value: '#a855f7', cls: 'bg-purple-500' },
    { name: 'Gray',   value: '#6b7280', cls: 'bg-gray-500'   },
];

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
    const [name, setName]     = useState('');
    const [color, setColor]   = useState(COLORS[0].value);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');

    const handleClose = () => {
        setName('');
        setColor(COLORS[0].value);
        setError('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError('');
        try {
            // TODO: wire to real project endpoint once available
            // await axios.post('/api/projects', { name: name.trim(), color });
            await new Promise(r => setTimeout(r, 300)); // simulate
            onCreated?.({ name: name.trim(), color });
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create project.');
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
                                <Dialog.Title className="text-base font-semibold text-gray-900">
                                    New project
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
                                        Project name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={e => { setName(e.target.value); setError(''); }}
                                        placeholder="e.g. Q3 Follow-ups"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">
                                        Colour
                                    </label>
                                    <div className="flex gap-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`w-7 h-7 rounded-full ${c.cls} transition-transform ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
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
