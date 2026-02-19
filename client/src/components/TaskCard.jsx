import { Link } from 'react-router-dom';

export default function TaskCard({ task, isAssigned }) {
    return (
        <Link to={`/tasks/${task.id}`} className="block mb-3">
            <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition ${isAssigned ? 'border-l-4 border-l-blue-500' : ''}`}>
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
                    {isAssigned && <span className="text-blue-600 ml-auto text-xs font-bold">ASSIGNED TO YOU</span>}
                </div>
                {task.description && <p className="text-gray-600 mt-2 line-clamp-2">{task.description}</p>}

                {task.assigned_to_email && !isAssigned && (
                    <div className="mt-2 text-xs text-gray-500">
                        Assigned to: {task.assigned_to_email}
                    </div>
                )}

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
    );
}
