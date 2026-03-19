import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Users, Save, Trash2, Clock, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Profile State
    const [displayName, setDisplayName] = useState('');

    // Workspace State
    const [workspaceName, setWorkspaceName] = useState('');

    useEffect(() => {
        fetchWorkspaceData();
        if (user) {
            setDisplayName(user.display_name || user.name || '');
        }
    }, [user]);

    const fetchWorkspaceData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/workspaces/current');
            setWorkspace(response.data.data);
            setWorkspaceName(response.data.data.name);
        } catch (err) {
            console.error('Error fetching workspace:', err);
            setError('Failed to load workspace settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            await axios.patch('/api/me', { display_name: displayName });
            setMessage('Profile updated successfully');
            await refreshUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateWorkspace = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            await axios.patch('/api/workspaces/current', { name: workspaceName });
            setMessage('Workspace renamed successfully');
            fetchWorkspaceData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to rename workspace');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        setMessage(null);
        setError(null);
        try {
            await axios.delete(`/api/workspaces/current/members/${memberId}`);
            setMessage('Member removed successfully');
            fetchWorkspaceData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    const isOwner = workspace?.owner_user_id === (user?.uid || user?.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <User size={18} /> Profile
                </button>
                <button
                    onClick={() => setActiveTab('workspace')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'workspace' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Shield size={18} /> Workspace
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={18} /> Members
                </button>
            </div>

            {/* Notifications */}
            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                    <Save size={18} /> {message}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Tab Content */}
            <div className="bg-white rounded-xl">
                {activeTab === 'profile' && (
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Your display name"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">This is how other members will see you.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                )}

                {activeTab === 'workspace' && (
                    <div className="space-y-8">
                        {isOwner ? (
                            <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                                    <input
                                        type="text"
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="Workspace name"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save size={18} /> {saving ? 'Saving...' : 'Rename Workspace'}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-600">You must be the owner of this workspace to change its settings.</p>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Workspace Info</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">ID</span>
                                    <span className="font-mono text-gray-700">{workspace?.id}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Owner</span>
                                    <span className="text-gray-700">{workspace?.owner?.primary_email_id || 'System'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Created At</span>
                                    <span className="text-gray-700">{new Date(workspace?.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Workspace Members</h3>
                            {isOwner && (
                                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">Owner Access</span>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                            {workspace?.members?.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                            {member.email?.[0].toUpperCase() || 'M'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.user?.display_name || member.email}</p>
                                            <p className="text-sm text-gray-500">{member.role} • {member.status}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.status === 'PENDING' && (
                                            <span className="p-1 px-2 bg-yellow-50 text-yellow-600 text-xs rounded-full border border-yellow-200 flex items-center gap-1">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                        {isOwner && member.user_id !== (user?.uid || user?.id) && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id || member.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove member"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {member.user_id === (user?.uid || user?.id) && (
                                            <span className="text-xs text-gray-400 italic">It's you</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
