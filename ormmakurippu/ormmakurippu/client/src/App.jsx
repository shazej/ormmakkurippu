import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { templates } from './templates'
import TaskDetailsPage from './pages/TaskDetailsPage'
import templates from './templates' // 1. Import templates

function HomePage() {
    const [tasks, setTasks] = useState([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('') // 2. Add category state
    const [priority, setPriority] = useState('Low') // 2. Add priority state

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

    // 3. Add handleTemplateClick function
    const handleTemplateClick = (template) => {
        setCategory(template.category)
        setDescription(template.description)
        setPriority(template.priority)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title) return

        // 6. Update handleSubmit to append category and priority to description
        const fullDescription = `${description}\n\nCategory: ${category}\nPriority: ${priority}`.trim()

        try {
            await axios.post('/api/tasks', { title, description: fullDescription })
            setTitle('')
            setDescription('')
            setCategory('')
            setPriority('Low')
            fetchTasks()
        } catch (error) {
            console.error('Error creating task:', error)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-blue-600">ormmakurippu</h1>
                <p className="text-gray-600">Call Task Logger</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
                {/* 4. Render template buttons above the form fields */}
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

                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter task title"
                        required
                    />
                </div>

                {/* 5. Add inputs for Category and Priority */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                            type="text"
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="General"
                        />
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter task description"
                        rows="3"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                    Add Task
                </button>
            </form>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Tasks</h2>
                {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks found</p>
                ) : (
                    tasks.map(task => (
                        <Link key={task.id} to={`/tasks/${task.id}`} className="block">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
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
                                <div className="text-xs text-gray-400 mt-3">
                                    {new Date(task.created_at).toLocaleString()}
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
