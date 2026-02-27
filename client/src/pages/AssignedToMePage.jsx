import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';
import { UserCheck } from 'lucide-react';

export default function AssignedToMePage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssignedTasks();
    }, []);

    const fetchAssignedTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/tasks/assigned-to-me');
            setTasks(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching assigned tasks:', err);
            setError('Failed to load assigned tasks.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <UserCheck size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Assigned to Me</h1>
                    <p className="text-sm text-gray-500">Tasks assigned to you by others</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tasks assigned to you</h3>
                    <p className="text-gray-500 mt-1">When someone assigns a task to you, it will show up here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} isAssigned={true} onUpdate={fetchAssignedTasks} />
                    ))}
                </div>
            )}
        </div>
    );
}
