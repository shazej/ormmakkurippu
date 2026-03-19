/**
 * CreateProjectModal — polished project creation modal
 */
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { createProject } from '../api/projects';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';

const COLORS = [
    { name: 'Red',    value: 'border-red-500 bg-red-500',    cls: 'bg-red-500'    },
    { name: 'Blue',   value: 'border-blue-500 bg-blue-500',   cls: 'bg-blue-500'   },
    { name: 'Green',  value: 'border-green-500 bg-green-500',  cls: 'bg-green-500'  },
    { name: 'Amber',  value: 'border-amber-500 bg-amber-500',  cls: 'bg-amber-500'  },
    { name: 'Purple', value: 'border-purple-500 bg-purple-500', cls: 'bg-purple-500' },
    { name: 'Gray',   value: 'border-gray-500 bg-gray-500',   cls: 'bg-gray-500'   },
];

export default function CreateProjectModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { refresh } = useProjects();
    const [name, setName]     = useState('');
    const [color, setColor]   = useState(COLORS[0].value);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');

    const workspaceId = user?._dbUser?.default_workspace_id || user?.default_workspace_id;

    const handleClose = () => {
        setName('');
        setColor(COLORS[0].value);
        setError('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError('Project name is required');
        setLoading(true);
        setError('');
        try {
            await createProject({
                workspaceId,
                name: name.trim(),
                color: color
            });
            await refresh();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project.');
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
                                <Dialog.Title className="text-base font-bold text-gray-900">
                                    New Project
                                </Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
                                )}

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                        Project Name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={e => { setName(e.target.value); setError(''); }}
                                        placeholder="e.g. Marketing Launch"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                                        Color Tag
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`w-7 h-7 rounded-full ${c.cls} transition-all border-2 ${color === c.value ? 'ring-2 ring-offset-2 ring-red-500 scale-110 border-white shadow-md' : 'border-transparent hover:scale-110'}`}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-50">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!name.trim() || loading}
                                        className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/10"
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
