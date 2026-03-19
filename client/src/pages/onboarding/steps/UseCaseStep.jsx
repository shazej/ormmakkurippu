import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const OPTIONS = [
    {
        value: 'myself',
        label: 'For myself',
        desc: 'Manage personal tasks, calls, and contacts.',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        value: 'team',
        label: 'With my team',
        desc: 'Collaborate, delegate tasks, and share updates.',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

export default function UseCaseStep({ onNext }) {
    const { refreshUser } = useAuth();
    const [selected, setSelected] = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        setError('');
        try {
            await axios.patch('/api/users/me', {
                use_case: selected
            }, { withCredentials: true });
            await refreshUser();
            onNext();
        } catch (err) {
            console.error('Failed to update use case', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">How will you use it?</h3>
                <p className="text-gray-500 text-sm">We'll tailor your experience accordingly.</p>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {OPTIONS.map(opt => {
                    const active = selected === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelected(opt.value)}
                            className={`text-left p-5 rounded-xl border-2 transition-all duration-150 ${
                                active
                                    ? 'border-red-600 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`mb-3 ${active ? 'text-red-600' : 'text-gray-400'}`}>
                                {opt.icon}
                            </div>
                            <div className={`font-semibold text-base mb-1 ${active ? 'text-red-800' : 'text-gray-900'}`}>
                                {opt.label}
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed">{opt.desc}</div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={!selected || loading}
                    className={`inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold transition-colors ${
                        !selected || loading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                    {loading ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving…
                        </>
                    ) : 'Continue'}
                </button>
            </div>
        </div>
    );
}
