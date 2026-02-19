
import React, { useState } from 'react';
import axios from 'axios';

export default function StepWorkspace({ onNext }) {
    const [workspaceName, setWorkspaceName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (workspaceName.length < 3) {
            setError('Workspace name must be at least 3 characters');
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:4000/api/onboard/workspace', {
                name: workspaceName
            }, { withCredentials: true });

            // API handles DB step update, so we just move UI forward
            // Pass true to skip generic step update if parent supports it, 
            // but default handleNext makes an API call. 
            // We might just let it make the redundant call or update parent.
            onNext();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create workspace');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create your Workspace</h2>
            <p className="text-gray-600 mb-6">
                Give your team a home. You can always change this later.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workspace Name
                    </label>
                    <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="e.g. Acme Corp, My Design Studio"
                        autoFocus
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading || !workspaceName.trim()}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${loading || !workspaceName.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {loading ? 'Creating...' : 'Create Workspace'}
                </button>
            </form>
        </div>
    );
}
