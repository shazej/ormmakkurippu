import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function InviteTeamStep({ onNext }) {
    const [emails, setEmails] = useState('');
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        // Fetch current workspace (should be the one just created)
        const fetchWorkspace = async () => {
            try {
                const res = await axios.get('http://localhost:4000/api/workspaces/current', {
                    withCredentials: true
                });
                if (res.data.success) {
                    setWorkspaceId(res.data.data.id);
                }
            } catch (err) {
                console.error("Failed to fetch workspace", err);
                // If no workspace, maybe skip this step or show error???
                // For now, let's assume one exists or they can skip.
            } finally {
                setFetching(false);
            }
        };
        fetchWorkspace();
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!workspaceId) {
            setError("No workspace found to invite to.");
            return;
        }

        // Split by comma, space, newline, filter empty
        const emailList = emails.split(/[\s,]+/).filter(e => e.trim().length > 0);

        if (emailList.length === 0) {
            setError("Please enter at least one email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:4000/api/workspaces/${workspaceId}/invite`, {
                emails: emailList
            }, { withCredentials: true });

            if (res.data.success) {
                setSuccessMsg(`Invited ${emailList.length} members!`);
                setTimeout(() => {
                    onNext();
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error?.[0]?.message || err.response?.data?.error || 'Failed to send invites');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center p-4">Loading workspace info...</div>;

    return (
        <div className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Invite your Team</h2>
            <p className="text-gray-600 mb-6">
                Work is better together. Invite your colleagues to join your workspace.
            </p>

            <form onSubmit={handleInvite}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Addresses
                    </label>
                    <textarea
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors h-32"
                        placeholder="colleague@example.com, partner@work.com"
                    />
                    <p className="mt-2 text-xs text-gray-500">Separate multiple emails with commas or new lines.</p>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    {successMsg && <p className="mt-2 text-sm text-green-600">{successMsg}</p>}
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onNext}
                        className="flex-1 py-3 px-4 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !emails.trim()}
                        className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors ${loading || !emails.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {loading ? 'Sending...' : 'Send Invites'}
                    </button>
                </div>
            </form>
        </div>
    );
}
