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
            if (onUpdate) onUpdate(res.data?.data || res.data);
            setShowAssign(false);
            setAssignEmail('');
        } catch (error) {
            console.error("Failed to assign task", error);
            alert("Failed to assign task");
        }
    };

    return (
        <div className={`flex gap-3 mb-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group ${isAssigned ? 'border-l-4 border-l-blue-500' : ''}`}>
            
            {/* Selection & Completion */}
            <div className="flex flex-col items-center gap-3 pt-1">
                <input
                    type="checkbox"
                    checked={task.isSelected || false}
                    onChange={(e) => {
                        e.stopPropagation();
                        if (onUpdate) onUpdate({ ...task, isSelected: !task.isSelected }, true); // special flag for selection
                    }}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
                <button
                    onClick={handleStatusToggle}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    {task.status === 'Completed' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </button>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    {isEditing ? (
                        <div className="flex-1" onClick={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={handleKeyDown}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-base font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        <Link to={`/app/tasks/${task.id}`} className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base text-gray-900 truncate ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                                {task.title || task.description?.substring(0, 30) || 'Untitled'}
                                {!isAssigned && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                        className="inline-block ml-2 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                )}
                            </h3>
                        </Link>
                    )}

                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {task.status || 'Pending'}
                    </span>
                </div>

                <Link to={`/app/tasks/${task.id}`}>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                        {task.priority && (
                            <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                {task.priority} Priority
                            </span>
                        )}
                        {task.category && <span className="text-gray-400">• {task.category}</span>}
                        {isAssigned && <span className="text-blue-600 font-bold tracking-tight">ASSIGNED TO YOU</span>}
                    </div>

                    {task.description && <p className="text-sm text-gray-600 mt-2 line-clamp-1 italic">{task.description}</p>}

                    {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                            {task.attachments.length} Attachment(s)
                        </div>
                    )}

                    <div className="text-[10px] text-gray-400 mt-3 flex justify-between items-center">
                        <span>{new Date(task.createdAt || task.created_at || Date.now()).toLocaleDateString()}</span>

                        {!isAssigned && !task.assigned_to_email && !showAssign && user && (user.id === task.user_id || user.uid === task.user_id || user.id === task.uid) && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowAssign(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Assign
                            </button>
                        )}
                    </div>
                </Link>

                {/* Assignment UI */}
                {(task.assigned_to_email || showAssign) && !isAssigned && user && (user.id === task.user_id || user.uid === task.user_id || user.id === task.uid) && (
                    <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}>
                        {task.assigned_to_email ? (
                            <div className="flex justify-between items-center bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100/50">
                                <span>Assigned to: <span className="font-semibold text-gray-700">{task.assigned_to_email}</span></span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setAssignEmail('');
                                        setShowAssign(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
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
                                    placeholder="Enter colleague's email..."
                                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    autoFocus
                                />
                                <button onClick={handleAssign} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">Assign</button>
                                <button onClick={() => setShowAssign(false)} className="text-gray-400 hover:text-gray-600 px-1 font-medium">Cancel</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
