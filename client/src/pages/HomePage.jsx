import { useState, useEffect } from 'react'
import axios from 'axios'
import { templates } from '../templates'
import TaskForm from '../components/TaskForm'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([])
    const [formInitialData, setFormInitialData] = useState(null)
    const [createTaskError, setCreateTaskError] = useState(null)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const response = await axios.get('/api/tasks')
            setTasks(response.data)
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {user?.name}</h1>

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

            <div className="grid md:grid-cols-2 gap-8">
                {/* My Tasks */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        My Tasks
                    </h2>
                    {tasks.filter(t => t.uid === (user?.uid || user?.id)).length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No tasks created yet.</p>
                    ) : (
                        tasks.filter(t => t.uid === (user?.uid || user?.id)).map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </section>

                {/* Assigned to Me */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Assigned to Me
                    </h2>
                    {tasks.filter(t => t.assigned_to_user_id === (user?.uid || user?.id) || t.assigned_to_email === user?.email).length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No tasks assigned to you.</p>
                    ) : (
                        tasks.filter(t => t.assigned_to_user_id === (user?.uid || user?.id) || t.assigned_to_email === user?.email).map(task => (
                            <TaskCard key={task.id} task={task} isAssigned={true} />
                        ))
                    )}
                </section>
            </div>
        </div>
    )
}
