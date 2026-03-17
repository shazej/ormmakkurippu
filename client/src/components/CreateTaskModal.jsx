/**
 * CreateTaskModal — polished quick-add modal
 * Uses existing /api/tasks endpoint.
 */
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import axios from 'axios';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES  = ['General', 'Bug', 'Feature', 'Support', 'Call', 'Meeting', 'Other'];

const PRIORITY_DOT = { High: 'bg-red-500', Medium: 'bg-amber-500', Low: 'bg-green-500' };

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
    const [title, setTitle]         = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate]     = useState('');
    const [priority, setPriority]   = useState('Medium');
    const [category, setCategory]   = useState('General');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);

    const handleClose = () => {
        setTitle(''); setDescription(''); setDueDate('');
        setPriority('Medium'); setCategory('General'); setError(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/tasks', {
                title,
                description,
                priority,
                category,
                status: 'Pending',
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            });
            onTaskCreated();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400";

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
                        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <Dialog.Title className="text-sm font-semibold text-gray-900">New task</Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                                    <X size={17} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
                                )}

                                {/* Title */}
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Task name"
                                    className={`${inputCls} text-base font-medium`}
                                />

                                {/* Description */}
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Description (optional)"
                                    className={`${inputCls} resize-none`}
                                />

                                {/* Row: due date + priority + category */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Due date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Priority</label>
                                        <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                                            {PRIORITIES.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Priority visual indicator */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority]}`} />
                                    {priority} priority · {category}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={!title.trim() || loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {loading ? 'Adding…' : 'Add task'}
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
