import React, { useState, useEffect, useCallback } from 'react';

import { Plus, Download } from 'lucide-react';
import { TaskList } from './components/TaskList';
import { Filters } from './components/Filters';
import { TaskForm } from './components/TaskForm';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Switch } from './components/ui/Switch';
import { NotificationBell } from './components/NotificationBell';

import api from './api';

function App() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        priority: '',
        status: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [isCallLogMode, setIsCallLogMode] = useState(false);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.status) params.append('status', filters.status);
            if (filters.includeDeleted) params.append('includeDeleted', 'true');

            const response = await api.get(`/tasks?${params.toString()}`);
            setTasks(response.data.data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch tasks');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchTasks();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTasks]);

    const handleCreate = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const isPermanent = filters.includeDeleted;
        if (!window.confirm(isPermanent ? "This will permanently delete the task. Are you sure?" : "Move to trash?")) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks(); // Refresh
        } catch (err) {
            alert("Failed to delete task");
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/tasks/${id}/restore`);
            fetchTasks();
        } catch (err) {
            alert("Failed to restore task");
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, data);
            } else {
                await api.post('/tasks', data);
            }

            if (!isCallLogMode) {
                setIsModalOpen(false);
            }
            fetchTasks(); // Refresh list
        } catch (err) {
            console.error(err);
            // If server returns validation errors, they should be handled here if not caught by UI
            alert("Failed to save task: " + (err.response?.data?.error || err.message));
            throw err;
        }
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            category: '',
            priority: '',
            status: '',
            includeDeleted: false,
        });
    };

    const handleExport = () => {
        window.location.href = "/api/export";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Ormmakkurippu</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                        <NotificationBell />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 pb-4 flex items-center gap-2">
                    <Switch
                        checked={isCallLogMode}
                        onCheckedChange={setIsCallLogMode}
                        label="Call Log Mode"
                    />
                    <span className="text-sm text-gray-700 font-medium cursor-pointer" onClick={() => setIsCallLogMode(!isCallLogMode)}>
                        Call Log Mode
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                <Filters filters={filters} setFilters={setFilters} onReset={handleResetFilters} />
                <TaskList
                    tasks={tasks}
                    isLoading={isLoading}
                    error={error}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRestore={filters.includeDeleted ? handleRestore : null}
                    onViewDetail={setViewingTask}
                />
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? "Edit Task" : "Log New Task"}
            >
                <TaskForm
                    initialData={editingTask}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    isCallLogMode={isCallLogMode}
                />
            </Modal>

            <TaskDetailModal
                task={viewingTask}
                isOpen={!!viewingTask}
                onClose={() => setViewingTask(null)}
            />
        </div>
    );
}

export default App;
