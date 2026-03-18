import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function ForgotPasswordPage() {
    const [email, setEmail]       = useState('');
    const [status, setStatus]     = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const [emailErr, setEmailErr] = useState('');

    useEffect(() => { document.title = 'Forgot password — Ormmakkurippu'; }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailErr('');
        setErrorMsg('');

        if (!email) { setEmailErr('Email is required.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Enter a valid email address.'); return; }

        setStatus('loading');
        try {
            await axios.post(`${API}/api/auth/forgot-password`, { email });
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                        <span className="text-red-600">ormmak</span>kurippu
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Check your inbox</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your spam folder if you don't see it.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                In development mode, the reset link appears in the server console log.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                ← Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
                                <p className="text-gray-500 text-sm">
                                    Enter your email and we'll send you a reset link. The link expires in 1 hour.
                                </p>
                            </div>

                            {errorMsg && (
                                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        id="email" type="email" autoComplete="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
                                        placeholder="you@example.com"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${emailErr ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {emailErr && <p className="mt-1 text-xs text-red-600">{emailErr}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {status === 'loading' && (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {status === 'loading' ? 'Sending…' : 'Send reset link'}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-gray-500">
                                Remembered your password?{' '}
                                <Link to="/login" className="text-red-600 font-medium hover:text-red-700">Sign in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
