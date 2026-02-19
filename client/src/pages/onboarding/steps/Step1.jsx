import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

export default function Step1({ onNext }) {
    const { user, refreshUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.display_name || user.name || '');
            setAvatarUrl(user.avatar_url || user.picture || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Update profile
            await axios.patch('http://localhost:4000/api/users/me', {
                display_name: displayName,
                avatar_url: avatarUrl
            }, {
                withCredentials: true
            });

            // Refresh user context
            await refreshUser();

            // Store step completion (optional here if OnboardingWizard handles it, but good to be safe)
            // Actually OnboardingWizard handles the step increment, we just call onNext
            onNext();
        } catch (err) {
            console.error("Failed to update profile", err);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Welcome to Ormmakurippu!</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Let's get your profile set up. Confirm your details below.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                        {avatarUrl ? (
                            <img
                                className="h-24 w-24 object-cover rounded-full border border-gray-200"
                                src={avatarUrl}
                                alt="Current profile"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        ) : (
                            <span className="inline-block h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Profile Photo
                        </label>
                        <div className="mt-1 flex items-center">
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Paste a URL for your avatar (Upload coming soon)
                        </p>
                    </div>
                </div>

                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Display Name
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
}
