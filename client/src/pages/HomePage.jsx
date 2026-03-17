/**
 * HomePage — Inbox view
 *
 * Clean task list modelled after Todoist's inbox:
 *  - Inline "Add task" row at the top
 *  - Flat list of task items with priority indicator + completion toggle
 *  - Minimal metadata: due date, category, priority
 *  - No inline TaskForm — quick-add goes to CreateTaskModal via sidebar
 */

import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Calendar, CheckCircle2, Circle } from 'lucide-react';

const PRIORITY_COLOR = {
    High:   'text-red-500',
    Medium: 'text-amber-500',
    Low:    'text-blue-400',
};

const STATUS_BADGE = {
    Completed:   'bg-green-50 text-green-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    Pending:     'bg-gray-100 text-gray-500',
};

function formatDue(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isPast  = d < now && !isToday;
    const label   = isToday ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { label, isPast };
}

// ── Single task row ───────────────────────────────────────────────────────────
function TaskRow({ task, onUpdate }) {
    const [toggling, setToggling] = useState(false);

    const handleToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (toggling) return;
        setToggling(true);
        const next = task.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await axios.patch(`/api/tasks/${task.id}`, { status: next });
            onUpdate();
        } catch (err) {
            console.error('Toggle failed', err);
        } finally {
            setToggling(false);
        }
    };

    const due = formatDue(task.due_date || task.dueDate);
    const done = task.status === 'Completed';

    return (
        <Link
            to={`/app/tasks/${task.id}`}
            className="group flex items-start gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
            {/* Completion circle */}
            <button
                onClick={handleToggle}
                className={`mt-0.5 shrink-0 transition-colors ${
                    done
                        ? 'text-green-500 hover:text-gray-400'
                        : `${PRIORITY_COLOR[task.priority] || 'text-gray-300'} hover:text-gray-500`
                }`}
                aria-label={done ? 'Mark pending' : 'Mark complete'}
            >
                {done
                    ? <CheckCircle2 size={18} />
                    : <Circle size={18} />
                }
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title || task.description?.substring(0, 60) || 'Untitled'}
                </p>

                {/* Metadata chips */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {due && (
                        <span className={`flex items-center gap-1 text-[11px] ${due.isPast ? 'text-red-500' : 'text-gray-400'}`}>
                            <Calendar size={11} />
                            {due.label}
                        </span>
                    )}
                    {task.category && task.category !== 'General' && (
                        <span className="text-[11px] text-gray-400">{task.category}</span>
                    )}
                    {task.assigned_to_email && (
                        <span className="text-[11px] text-blue-500">→ {task.assigned_to_email}</span>
                    )}
                </div>
            </div>

            {/* Status badge (only for non-pending) */}
            {task.status !== 'Pending' && (
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full self-start mt-0.5 ${STATUS_BADGE[task.status] || STATUS_BADGE.Pending}`}>
                    {task.status}
                </span>
            )}
        </Link>
    );
}

// ── Quick-add row ─────────────────────────────────────────────────────────────
function QuickAdd({ onCreated }) {
    const [open, setOpen]     = useState(false);
    const [title, setTitle]   = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            await axios.post('/api/tasks', { title: title.trim(), priority: 'Medium', status: 'Pending' });
            setTitle('');
            setOpen(false);
            onCreated();
        } catch (err) {
            console.error('Quick add failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-2 py-2.5 w-full text-sm text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors group"
            >
                <Plus size={16} className="shrink-0 group-hover:text-red-600" />
                Add task
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="border border-gray-200 rounded-xl p-3 space-y-2">
            <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                placeholder="Task name"
                className="w-full text-sm text-gray-900 placeholder-gray-400 border-0 focus:outline-none"
            />
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={() => { setOpen(false); setTitle(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!title.trim() || loading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Adding…' : 'Add task'}
                </button>
            </div>
        </form>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
    const { user } = useAuth();
    const { tasks, fetchTasks, loading } = useOutletContext();

    const myTasks       = (tasks || []).filter(t => !t.deleted_at);
    const pending       = myTasks.filter(t => t.status !== 'Completed');
    const completed     = myTasks.filter(t => t.status === 'Completed');

    return (
        <div>
            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {pending.length} task{pending.length !== 1 ? 's' : ''} remaining
                </p>
            </div>

            {/* Task list */}
            <div className="space-y-0">
                {loading ? (
                    <div className="space-y-3 py-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 px-2 py-3">
                                <div className="w-[18px] h-[18px] rounded-full bg-gray-100 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-2 bg-gray-100 rounded-full w-1/4 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {pending.length === 0 && completed.length === 0 && (
                            <div className="text-center py-16 text-gray-400">
                                <div className="text-4xl mb-3">✅</div>
                                <p className="text-sm font-medium text-gray-500">Inbox zero!</p>
                                <p className="text-xs mt-1">Add a task below to get started.</p>
                            </div>
                        )}

                        {pending.map(task => (
                            <TaskRow key={task.id} task={task} onUpdate={fetchTasks} />
                        ))}

                        {/* Inline quick-add */}
                        <div className="pt-2">
                            <QuickAdd onCreated={fetchTasks} />
                        </div>

                        {/* Completed section */}
                        {completed.length > 0 && (
                            <details className="mt-6">
                                <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2 cursor-pointer hover:text-gray-600 select-none">
                                    Completed · {completed.length}
                                </summary>
                                <div className="mt-1 opacity-60">
                                    {completed.map(task => (
                                        <TaskRow key={task.id} task={task} onUpdate={fetchTasks} />
                                    ))}
                                </div>
                            </details>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
