import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import TaskForm from '../components/TaskForm';

function TaskDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            const response = await axios.get(`/api/tasks/${id}`);
            setTask(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching task:', err);
            setError('Failed to load task details');
            setLoading(false);
        }
    };

    const handleUpdate = async (updatedData) => {
        try {
            await axios.patch(`/api/tasks/${id}`, updatedData);
            alert('Task updated successfully');
            fetchTask(); // Refresh data
        } catch (err) {
            console.error('Error updating task:', err);
            alert('Failed to update task');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await axios.delete(`/api/tasks/${id}`);
            navigate('/');
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading task details...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!task) return <div className="p-8 text-center">Task not found</div>;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <Link to="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">← Back to Home</Link>
                        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
                        <p className="text-gray-500 text-sm">ID: {task.id}</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition"
                    >
                        Delete Task
                    </button>
                </header>

                <TaskForm
                    initialData={task}
                    onSubmit={handleUpdate}
                    buttonText="Update Task"
                />

                <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-sm text-gray-500">
                    <p>Created At: {new Date(task.createdAt || task.created_at).toLocaleString()}</p>
                    {(task.updatedAt || task.updated_at) && <p>Last Updated: {new Date(task.updatedAt || task.updated_at).toLocaleString()}</p>}
                </div>
            </div>
        </div>
    );
}

export default TaskDetailsPage;
