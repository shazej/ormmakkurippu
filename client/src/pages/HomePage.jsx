import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import BulkToolbar from '../components/BulkToolbar';

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
    const { user } = useAuth();
    const { tasks, fetchTasks, loading } = useOutletContext();
    const { pathname } = useLocation();

    const [selectedTaskIds, setSelectedTaskIds] = useState([]);

    const myTasks       = (tasks || []).filter(t => !t.deleted_at);
    const pending       = myTasks.filter(t => t.status !== 'Completed');
    const completed     = myTasks.filter(t => t.status === 'Completed');

    const getPageTitle = () => {
        if (pathname === '/app/today') return 'Today';
        if (pathname === '/app/upcoming') return 'Upcoming';
        if (pathname === '/app/completed') return 'Completed';
        if (pathname.startsWith('/app/projects/')) return 'Project Tasks';
        return 'Inbox';
    };

    const handleTaskUpdate = (updatedTask, isSelectionOnly = false) => {
        if (isSelectionOnly) {
            setSelectedTaskIds(prev =>
                prev.includes(updatedTask.id)
                    ? prev.filter(id => id !== updatedTask.id)
                    : [...prev, updatedTask.id]
            );
            return;
        }
        // For other updates, we refresh from server to ensure consistency
        fetchTasks();
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page heading */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">
                        {pending.length} task{pending.length !== 1 ? 's' : ''} remaining
                    </p>
                </div>
            </div>

            {/* Task list */}
            <div className="space-y-4">
                {loading && tasks.length === 0 ? (
                    <div className="space-y-3 py-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <>
                        {pending.length === 0 && completed.length === 0 && (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="text-5xl mb-4">✨</div>
                                <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                                <p className="text-sm text-gray-500 mt-1">Enjoy your "Inbox Zero" moment.</p>
                            </div>
                        )}

                        <div className="grid gap-3">
                            {pending.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={{ ...task, isSelected: selectedTaskIds.includes(task.id) }}
                                    isAssigned={task.assigned_to_user_id === (user?.uid || user?.id) || task.assigned_to_email === user?.email}
                                    onUpdate={handleTaskUpdate}
                                />
                            ))}
                        </div>

                        {/* Completed section */}
                        {completed.length > 0 && (
                            <div className="mt-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-px bg-gray-100 flex-1" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2">
                                        Completed · {completed.length}
                                    </span>
                                    <div className="h-px bg-gray-100 flex-1" />
                                </div>
                                <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                    {completed.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={{ ...task, isSelected: selectedTaskIds.includes(task.id) }}
                                            isAssigned={task.assigned_to_user_id === (user?.uid || user?.id) || task.assigned_to_email === user?.email}
                                            onUpdate={handleTaskUpdate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedTaskIds.length > 0 && (
                <BulkToolbar
                    taskIds={selectedTaskIds}
                    onActionComplete={() => {
                        setSelectedTaskIds([]);
                        fetchTasks();
                    }}
                    onClearSelection={() => setSelectedTaskIds([])}
                />
            )}
        </div>
    );
}
