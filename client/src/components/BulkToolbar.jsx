import { useState } from 'react';
import axios from 'axios';

export default function BulkToolbar({ taskIds, onActionComplete, onClearSelection }) {
    const [loading, setLoading] = useState(false);
    const [showAssignInput, setShowAssignInput] = useState(false);
    const [assignEmail, setAssignEmail] = useState('');

    const handleBulkAction = async (action) => {
        if (action === 'assign' && !showAssignInput) {
            setShowAssignInput(true);
            return;
        }

        if (action === 'assign' && !assignEmail) {
            alert('Please enter an email to assign tasks to.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/tasks/bulk', {
                action,
                taskIds,
                email: action === 'assign' ? assignEmail : undefined
            });

            const { successCount, failed } = response.data.data;
            let message = `Successfully updated ${successCount} task(s).`;
            if (failed.length > 0) {
                message += `\nFailed to update ${failed.length} task(s).`;
                console.error('Bulk action failures:', failed);
            }
            alert(message);

            setShowAssignInput(false);
            setAssignEmail('');
            onActionComplete();
        } catch (error) {
            console.error(`Bulk ${action} failed`, error);
            alert('An error occurred while performing the bulk action.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {taskIds.length}
                </span>
                <span className="text-sm font-medium">Selected</span>
            </div>

            <div className="flex items-center gap-2">
                {showAssignInput && (
                    <div className="flex items-center gap-2 mr-2">
                        <input
                            type="email"
                            placeholder="Assignee email..."
                            value={assignEmail}
                            onChange={(e) => setAssignEmail(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            onClick={() => handleBulkAction('assign')}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => setShowAssignInput(false)}
                            className="text-gray-400 hover:text-white px-2 py-1 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {!showAssignInput && (
                    <>
                        <button
                            onClick={() => handleBulkAction('complete')}
                            disabled={loading}
                            className="hover:bg-gray-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Complete
                        </button>
                        <button
                            onClick={() => handleBulkAction('reopen')}
                            disabled={loading}
                            className="hover:bg-gray-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Reopen
                        </button>
                        <button
                            onClick={() => handleBulkAction('assign')}
                            disabled={loading}
                            className="hover:bg-gray-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            Assign
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
                                    handleBulkAction('delete');
                                }
                            }}
                            disabled={loading}
                            className="hover:bg-red-900/50 hover:text-red-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Delete
                        </button>
                    </>
                )}
            </div>

            <button
                onClick={onClearSelection}
                className="ml-4 text-gray-400 hover:text-white transition-colors"
                title="Clear selection"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18"></path></svg>
            </button>
        </div>
    );
}
