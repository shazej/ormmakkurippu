import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import TaskCard from '../components/TaskCard';
import { Hash, Archive, Trash2, ArrowLeft } from 'lucide-react';

export default function ProjectPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects, refresh } = useProjects();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const project = projects.find(p => p.id === id);

    useEffect(() => {
        if (id) {
            fetchTasks();
        }
    }, [id]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/tasks?project_id=${id}`);
            setTasks(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching tasks for project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!window.confirm('Are you sure you want to archive this project?')) return;
        try {
            await axios.post(`/api/projects/${id}/archive`);
            await refresh();
            navigate('/app');
        } catch (error) {
            alert('Failed to archive project');
        }
    };

    if (!project && !loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">Project not found.</p>
                <button onClick={() => navigate('/app')} className="mt-4 text-blue-600 hover:underline">Go back to Inbox</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${project?.color || 'bg-gray-400 border-gray-400'}`}>
                            <Hash size={20} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{project?.name || 'Project'}</h1>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleArchive}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Archive Project"
                    >
                        <Archive size={18} />
                        Archive
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 italic">No tasks in this project yet.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isAssigned={task.assigned_to_user_id === user?.uid || task.assigned_to_email === user?.email}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
