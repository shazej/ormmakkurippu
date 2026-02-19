import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

export default function UseCaseStep({ onNext }) {
    const { refreshUser } = useAuth();
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSelect = (option) => {
        setSelected(option);
    };

    const handleSubmit = async () => {
        if (!selected) return;

        setLoading(true);
        try {
            await axios.patch('http://localhost:4000/api/users/me', {
                use_case: selected
            }, { withCredentials: true });

            await refreshUser();
            onNext();
        } catch (error) {
            console.error("Failed to update use case", error);
            // Ideally show a toast or error message here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">How are you planning to use Ormmakurippu?</h3>
                <p className="mt-2 text-gray-600">
                    We'll customize your experience based on your choice.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: For Myself */}
                <div
                    onClick={() => handleSelect('myself')}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 ${selected === 'myself'
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-opacity-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-3 rounded-full ${selected === 'myself' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                            <svg className={`w-8 h-8 ${selected === 'myself' ? 'text-indigo-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">For myself</h4>
                            <p className="mt-1 text-sm text-gray-500">
                                Maintain my personal tasks, notes, and contacts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 2: With my team */}
                <div
                    onClick={() => handleSelect('team')}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 ${selected === 'team'
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-opacity-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-3 rounded-full ${selected === 'team' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                            <svg className={`w-8 h-8 ${selected === 'team' ? 'text-indigo-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">With my team</h4>
                            <p className="mt-1 text-sm text-gray-500">
                                Collaborate on shared projects and tasks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSubmit}
                    disabled={!selected || loading}
                    className={`inline-flex justify-center py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!selected || loading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </div>
        </div>
    );
}
