/**
 * CreateTaskModal — polished quick-add modal
 * Uses existing /api/tasks endpoint.
 */
import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES  = ['General', 'Bug', 'Feature', 'Support', 'Call', 'Meeting', 'Other'];
const RECURRENCE_OPTIONS = [
    { label: 'None', value: '' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
];

const PRIORITY_DOT = { High: 'bg-red-500', Medium: 'bg-amber-500', Low: 'bg-green-500' };

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
    const [title, setTitle]             = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate]         = useState('');
    const [priority, setPriority]       = useState('Medium');
    const [category, setCategory]       = useState('General');
    const [projectId, setProjectId]     = useState('');
    const [recurrenceRule, setRecurrenceRule] = useState('');
    const [projects, setProjects]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);

    const { user } = useAuth();

    useEffect(() => {
        const fetchProjects = async () => {
            if (!isOpen || !user?.default_workspace_id) return;
            try {
                const res = await axios.get(`/api/projects?workspaceId=${user.default_workspace_id}`);
                const list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                setProjects(list);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };
        fetchProjects();
    }, [isOpen, user?.default_workspace_id]);

    const handleClose = () => {
        setTitle(''); setDescription(''); setDueDate('');
        setPriority('Medium'); setCategory('General');
        setProjectId(''); setRecurrenceRule('');
        setError(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                priority,
                category,
                status: 'Pending',
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                projectId: projectId || null,
                recurrenceRule: recurrenceRule || null,
            };

            await axios.post('/api/tasks', payload);
            onTaskCreated();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 bg-white";

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
                        <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <Dialog.Title className="text-base font-bold text-gray-900">Create New Task</Dialog.Title>
                                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
                                )}

                                {/* Title */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Task Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className={`${inputCls} text-base font-medium`}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Add more details here..."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                {/* Main attributes row */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                                        <div className="relative">
                                            <select value={priority} onChange={e => setPriority(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                                                {PRIORITIES.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority]}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Projects & Recurrence row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Project</label>
                                        <select
                                            value={projectId}
                                            onChange={e => setProjectId(e.target.value)}
                                            className={inputCls}
                                        >
                                            <option value="">No Project (Inbox)</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Recurrence</label>
                                        <select
                                            value={recurrenceRule}
                                            onChange={e => setRecurrenceRule(e.target.value)}
                                            className={inputCls}
                                        >
                                            {RECURRENCE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!title.trim() || loading}
                                        className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
                                    >
                                        {loading ? 'Creating...' : 'Create Task'}
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
