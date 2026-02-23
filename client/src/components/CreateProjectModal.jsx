import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createProject } from '../api/projects';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';

const COLORS = [
    { name: 'Gray', value: 'border-gray-500 bg-gray-500' },
    { name: 'Red', value: 'border-red-500 bg-red-500' },
    { name: 'Orange', value: 'border-orange-500 bg-orange-500' },
    { name: 'Yellow', value: 'border-yellow-500 bg-yellow-500' },
    { name: 'Green', value: 'border-green-500 bg-green-500' },
    { name: 'Blue', value: 'border-blue-500 bg-blue-500' },
    { name: 'Purple', value: 'border-purple-500 bg-purple-500' },
    { name: 'Pink', value: 'border-pink-500 bg-pink-500' },
];

export default function CreateProjectModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { refresh } = useProjects();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const workspaceId = user?._dbUser?.default_workspace_id || user?.default_workspace_id;

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError('Project name is required');
        if (name.length > 100) return setError('Project name is too long');

        setLoading(true);
        setError('');

        try {
            await createProject({
                workspaceId,
                name: name.trim(),
                color: selectedColor
            });
            await refresh();
            onClose();
            setName('');
            setSelectedColor(COLORS[0].value);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Add project</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="e.g. Personal Projects"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setSelectedColor(color.value)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedColor === color.value ? 'scale-125 ring-2 ring-offset-1 ring-blue-500' : ''} ${color.value}`}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Add project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
