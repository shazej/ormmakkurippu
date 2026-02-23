import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task, isAssigned, onUpdate }) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title || '');
    const [loading, setLoading] = useState(false);

    const handleStatusToggle = async (e) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await axios.patch(`/api/tasks/${task.id}`, { status: newStatus });
            if (onUpdate) onUpdate({ ...task, status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleTitleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!title.trim() || title === task.title) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await axios.patch(`/api/tasks/${task.id}`, { title });
            if (onUpdate) onUpdate({ ...task, title });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update title", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleTitleSave(e);
        if (e.key === 'Escape') {
            setTitle(task.title || '');
            setIsEditing(false);
        }
    };

    const [showAssign, setShowAssign] = useState(false);
    const [assignEmail, setAssignEmail] = useState('');

    const handleAssign = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await axios.post(`/api/tasks/${task.id}/assign`, { email: assignEmail });
            if (onUpdate) onUpdate(res.data);
            setShowAssign(false);
            setAssignEmail('');
        } catch (error) {
            console.error("Failed to assign task", error);
            alert("Failed to assign task");
        }
    };

    return (
        <div className={`block mb-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition ${isAssigned ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start gap-3">
                {/* Completion Toggle */}
                <button
                    onClick={handleStatusToggle}
                    className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    {task.status === 'Completed' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </button>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        {isEditing ? (
                            <div className="flex-1 mr-2" onClick={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleTitleSave}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-2 py-1 border rounded text-lg font-semibold"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <Link to={`/tasks/${task.id}`} className="flex-1">
                                <h3 className={`font-semibold text-lg text-gray-900 group ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                                    {task.title || task.description?.substring(0, 30) || 'Untitled'}
                                    {!isAssigned && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsEditing(true);
                                            }}
                                            className="ml-2 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                        </button>
                                    )}
                                </h3>
                            </Link>
                        )}

                        <span className={`px-2 py-1 text-xs rounded-full ml-auto ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                                    'bg-blue-100 text-blue-800'
                            }`}>
                            {task.status || 'Pending'}
                        </span>
                    </div>

                    <Link to={`/tasks/${task.id}`}>
                        <div className="mt-1 flex gap-2 text-sm text-gray-600">
                            {task.priority && <span className="font-medium text-gray-500">{task.priority} Priority</span>}
                            {task.category && <span>• {task.category}</span>}
                            {isAssigned && <span className="text-blue-600 ml-auto text-xs font-bold">ASSIGNED TO YOU</span>}
                        </div>
                        {task.description && <p className="text-gray-600 mt-2 line-clamp-2">{task.description}</p>}

                        {task.attachments && task.attachments.length > 0 && (
                            <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                {task.attachments.length} Attachment(s)
                            </div>
                        )}

                        <div className="text-xs text-gray-400 mt-3 flex justify-between items-end">
                            <span>{new Date(task.createdAt || task.created_at || Date.now()).toLocaleString()}</span>

                            {!isAssigned && !task.assigned_to_email && !showAssign && user && (user.id === task.user_id || user.uid === task.user_id || user.id === task.uid) && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowAssign(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                    Assign to email
                                </button>
                            )}
                        </div>
                    </Link>

                    {/* Assignment UI */}
                    {(task.assigned_to_email || showAssign) && !isAssigned && user && (user.id === task.user_id || user.uid === task.user_id || user.id === task.uid) && (
                        <div className="mt-2 text-xs text-gray-500 border-t pt-2" onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}>
                            {task.assigned_to_email ? (
                                <div className="flex justify-between items-center">
                                    <span>Assigned to: <span className="font-medium">{task.assigned_to_email}</span></span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Stop Link
                                            setAssignEmail(''); // Clear logic if needed
                                            setShowAssign(true); // Re-open to change
                                        }}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={assignEmail}
                                        onChange={(e) => setAssignEmail(e.target.value)}
                                        placeholder="Enter email..."
                                        className="flex-1 px-2 py-1 text-xs border rounded"
                                        autoFocus
                                    />
                                    <button onClick={handleAssign} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Assign</button>
                                    <button onClick={() => setShowAssign(false)} className="text-gray-500 hover:text-gray-700 px-1">Cancel</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
