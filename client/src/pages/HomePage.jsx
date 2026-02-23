import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { useOutletContext } from 'react-router-dom'
import { templates } from '../templates'
import TaskForm from '../components/TaskForm'
import TaskCard from '../components/TaskCard'
import BulkToolbar from '../components/BulkToolbar'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([])
    const [selectedTaskIds, setSelectedTaskIds] = useState([])
    const [formInitialData, setFormInitialData] = useState(null)
    const [createTaskError, setCreateTaskError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    const { pathname } = useLocation();

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch on path or search change
    useEffect(() => {
        fetchTasks(debouncedSearch)
        if (!debouncedSearch) setSelectedTaskIds([]) // Clear selection on path change if not searching
    }, [pathname, debouncedSearch])

    const fetchTasks = async (query = '') => {
        try {
            let endpoint = '/api/tasks';
            const params = new URLSearchParams();

            if (pathname === '/app/today') endpoint = '/api/tasks/today';
            else if (pathname === '/app/upcoming') endpoint = '/api/tasks/upcoming';
            else if (pathname === '/app/completed') params.append('status', 'Completed');
            else if (pathname.startsWith('/app/projects/')) {
                params.append('project_id', pathname.split('/').pop());
            }

            if (query) params.append('search', query);

            const queryString = params.toString();
            const finalUrl = queryString ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}` : endpoint;

            const response = await axios.get(finalUrl)
            setTasks(response.data.data || response.data)
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const handleTaskUpdate = (updatedTask, isSelectionOnly = false) => {
        if (isSelectionOnly) {
            setSelectedTaskIds(prev =>
                updatedTask.isSelected
                    ? [...prev, updatedTask.id]
                    : prev.filter(id => id !== updatedTask.id)
            );
            return;
        }

        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const groupTasksByDate = (tasks) => {
        const groups = {};
        tasks.forEach(task => {
            let dateKey = 'No Due Date';
            if (task.due_date) {
                const date = new Date(task.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const taskDate = new Date(date);
                taskDate.setHours(0, 0, 0, 0);

                if (taskDate.getTime() === today.getTime()) dateKey = 'Today';
                else if (taskDate.getTime() === tomorrow.getTime()) dateKey = 'Tomorrow';
                else dateKey = taskDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            }
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push({
                ...task,
                isSelected: selectedTaskIds.includes(task.id)
            });
        });
        return groups;
    };

    const taskGroups = groupTasksByDate(tasks);
    const getPageTitle = () => {
        if (pathname === '/app/today') return 'Today';
        if (pathname === '/app/upcoming') return 'Upcoming';
        if (pathname === '/app/completed') return 'Completed';
        if (pathname.startsWith('/app/projects/')) return 'Project Tasks';
        return 'Inbox';
    };

    const handleTemplateClick = (template) => {
        setCreateTaskError(null);
        setFormInitialData({
            category: template.category,
            description: template.description,
            priority: template.priority,
        });
    }

    const handleSubmit = async (formData) => {
        setCreateTaskError(null);
        try {
            await axios.post('/api/tasks', formData)
            setFormInitialData(null)
            fetchTasks()
            // Optional: toast success
        } catch (error) {
            console.error('Error creating task:', error);

            let errorMessage = 'Error creating task';
            if (error.response?.data) {
                const { message, errors } = error.response.data;
                if (message) errorMessage = message;
                if (errors && Array.isArray(errors)) {
                    const validationMessages = errors.map(e => `• ${e.message}`).join('\n');
                    errorMessage += `:\n${validationMessages}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            setCreateTaskError(errorMessage);
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{getPageTitle()}</h1>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search tasks..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-300 focus:ring focus:ring-blue-200 sm:text-sm transition duration-150 ease-in-out"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="mb-8">
                {/* Templates */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                    <div className="flex flex-wrap gap-2">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => handleTemplateClick(template)}
                                className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-3 py-1 rounded-full text-sm transition-colors border border-gray-200"
                            >
                                {template.label}
                            </button>
                        ))}
                    </div>
                </div>

                <TaskForm
                    initialData={formInitialData}
                    onSubmit={handleSubmit}
                    buttonText="Add Task"
                    error={createTaskError}
                />
            </div>

            <div className="space-y-8">
                {Object.keys(taskGroups).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 italic">No tasks found here.</p>
                    </div>
                ) : (
                    Object.entries(taskGroups).map(([date, groupTasks]) => (
                        <section key={date}>
                            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center justify-between">
                                <span>{date}</span>
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{groupTasks.length}</span>
                            </h2>
                            <div className="space-y-3">
                                {groupTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        isAssigned={task.assigned_to_user_id === (user?.uid || user?.id) || task.assigned_to_email === user?.email}
                                        onUpdate={handleTaskUpdate}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
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
    )
}
