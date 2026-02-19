import React, { useState } from 'react';
import axios from 'axios';

export default function WorkspaceStep({ onNext }) {
    const [workspaceName, setWorkspaceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!workspaceName.trim() || workspaceName.trim().length < 2) {
            setError('Workspace name must be at least 2 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:4000/api/onboarding/workspace',
                { name: workspaceName },
                { withCredentials: true }
            );

            if (res.data.success) {
                onNext();
            } else {
                setError(res.data.error || 'Failed to create workspace');
            }
        } catch (err) {
            console.error('Error creating workspace:', err);
            setError(err.response?.data?.error || 'Failed to create workspace. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">What’s your workspace name?</h1>
            <p className="text-gray-600 mb-8">
                This is the name of your organization, team, or project. You can always change it later.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-1">
                        Workspace Name
                    </label>
                    <input
                        type="text"
                        id="workspaceName"
                        value={workspaceName}
                        onChange={(e) => {
                            setWorkspaceName(e.target.value);
                            if (error) setError('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="e.g. Acme Corp, My Design Studio"
                        autoFocus
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading || workspaceName.trim().length < 2}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${loading || workspaceName.trim().length < 2
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {loading ? 'Creating...' : 'Continue'}
                </button>
            </form>
        </div>
    );
}
