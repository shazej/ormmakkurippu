import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { templates } from './templates'
import TaskDetailsPage from './pages/TaskDetailsPage'
import TaskForm from './components/TaskForm'
import { useAuth } from './context/AuthContext'

function HomePage() {
    const { user, login, logout } = useAuth();
    const [tasks, setTasks] = useState([])
    const [formInitialData, setFormInitialData] = useState(null)

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
        setFormInitialData({
            category: template.category,
            description: template.description,
            priority: template.priority,
            // Reset others if needed or keep existing not straightforward with this pattern, 
            // but TaskForm useEffect handles spread.
        });
    }

    const handleSubmit = async (formData) => {
        // Append Category/Priority to description if needed? 
        // The original code did that because there were no separate fields in the backend/form for them?
        // Wait, the original code DID have separate inputs but appended them to description logic:
        // "const fullDescription = `${description}\n\nCategory: ${category}\nPriority: ${priority}`.trim()"
        // BUT the backend now HAS separate fields (category, priority).
        // I updated the backend schema/migrations (well, sqlite schema was there, Firestore is dynamic).
        // So I should send them as separate fields.
        // TaskForm sends them as separate fields in formData.

        try {
            await axios.post('/api/tasks', formData)
            setFormInitialData(null) // Reset form via initialData? No, TaskForm handles reset? 
            // TaskForm doesn't auto-reset on submit unless we tell it. 
            // Ideally TaskForm should handle its own reset or we force remount.
            // For now, assume success.
            fetchTasks()
            window.location.reload(); // Simple clear for now or simple re-fetch
        } catch (error) {
            console.error('Error creating task:', error)
            alert('Error creating task');
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-blue-600">ormmakurippu</h1>
                    <p className="text-gray-600">Call Task Logger</p>
                </div>
                <div>
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Hi, {user.name}</span>
                            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => login()}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-4 h-4" />
                            Sign in with Google
                        </button>
                    )}
                </div>
            </header>

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
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Tasks</h2>
                {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks found</p>
                ) : (
                    tasks.map(task => (
                        <Link key={task.id} to={`/tasks/${task.id}`} className="block">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg text-gray-900">{task.title || task.description?.substring(0, 30) || 'Untitled'}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                            task.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {task.status || 'Pending'}
                                    </span>
                                </div>
                                <div className="mt-1 flex gap-2 text-sm text-gray-600">
                                    {task.priority && <span className="font-medium text-gray-500">{task.priority} Priority</span>}
                                    {task.category && <span>• {task.category}</span>}
                                </div>
                                {task.description && <p className="text-gray-600 mt-2 line-clamp-2">{task.description}</p>}

                                {task.attachments && task.attachments.length > 0 && (
                                    <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                        {task.attachments.length} Attachment(s)
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 mt-3">
                                    {new Date(task.createdAt || task.created_at || Date.now()).toLocaleString()}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

function App() {
    return (
        <Router>
            <div className="min-h-screen p-8 bg-gray-50">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tasks/:id" element={<TaskDetailsPage />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
