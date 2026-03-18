import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const EyeIcon = ({ open }) => open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 10.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [form, setForm]           = useState({ newPassword: '', confirmPassword: '' });
    const [showNew, setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors]       = useState({});
    const [status, setStatus]       = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMsg, setErrorMsg]   = useState('');

    useEffect(() => { document.title = 'Reset password — Ormmakkurippu'; }, []);

    const set = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(err => ({ ...err, [field]: null }));
    };

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                            <span className="text-red-600">ormmak</span>kurippu
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Invalid reset link</h2>
                        <p className="text-gray-500 text-sm">This password reset link is invalid or has expired.</p>
                        <Link to="/forgot-password" className="inline-block mt-2 text-sm font-medium text-red-600 hover:text-red-700">
                            Request a new link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const validate = () => {
        const errs = {};
        if (!form.newPassword) errs.newPassword = 'New password is required.';
        else if (form.newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
        else if (!/[A-Z]/.test(form.newPassword)) errs.newPassword = 'Password needs an uppercase letter.';
        else if (!/[a-z]/.test(form.newPassword)) errs.newPassword = 'Password needs a lowercase letter.';
        else if (!/[0-9]/.test(form.newPassword)) errs.newPassword = 'Password needs a number.';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setStatus('loading');
        setErrorMsg('');
        try {
            await axios.post(`${API}/api/auth/reset-password`, {
                token,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword
            });
            setStatus('success');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.message || 'Reset failed. The link may have expired.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                            <span className="text-red-600">ormmak</span>kurippu
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Password reset!</h2>
                        <p className="text-gray-500 text-sm">Your password has been updated. Redirecting you to sign in…</p>
                        <Link to="/login" className="inline-block mt-2 text-sm font-medium text-red-600 hover:text-red-700">
                            Sign in now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                        <span className="text-red-600">ormmak</span>kurippu
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
                        <p className="text-gray-500 text-sm">
                            Choose a strong password. It must be at least 8 characters with uppercase, lowercase, and a number.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {errorMsg}{' '}
                            {errorMsg.includes('expired') && (
                                <Link to="/forgot-password" className="font-medium underline">Request a new link</Link>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                            <div className="relative">
                                <input
                                    id="newPassword" type={showNew ? 'text' : 'password'} autoComplete="new-password"
                                    value={form.newPassword} onChange={set('newPassword')}
                                    placeholder="Enter a new password"
                                    className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                                <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                    <EyeIcon open={showNew} />
                                </button>
                            </div>
                            {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                            <div className="relative">
                                <input
                                    id="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                                    value={form.confirmPassword} onChange={set('confirmPassword')}
                                    placeholder="Repeat your new password"
                                    className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                                <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                    <EyeIcon open={showConfirm} />
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {status === 'loading' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {status === 'loading' ? 'Updating…' : 'Update password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
