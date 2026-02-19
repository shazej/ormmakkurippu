import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function WelcomeStep() {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:4000/api/onboarding/complete', {}, {
                withCredentials: true
            });
            await refreshUser(); // Update context to reflect completed status
            navigate('/app');
        } catch (error) {
            console.error("Failed to complete onboarding", error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Ormmakurippu!</h1>
                    <p className="text-gray-600">You're all set to get started.</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
                    <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">Your Setup Checklist</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center text-blue-800">
                            <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Create first task
                        </li>
                        <li className="flex items-center text-blue-800">
                            <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Invite people
                        </li>
                        <li className="flex items-center text-blue-800">
                            <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Complete profile
                        </li>
                    </ul>
                </div>

                <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                >
                    {loading ? 'Setting up...' : "Let's go"}
                </button>
            </div>
        </div>
    );
}
