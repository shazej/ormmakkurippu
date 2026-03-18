import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

const BENEFITS = [
    { icon: '📞', text: 'Log calls as tasks in seconds' },
    { icon: '🤝', text: 'Delegate across your team' },
    { icon: '🔗', text: 'Share tasks with secure links' },
    { icon: '⚡', text: 'Real-time updates for everyone' },
];

const EyeIcon = ({ open }) => open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export default function LoginPage() {
    const { login, loginWithPassword, checkProvider, user, loading, authLoading, authError, setAuthError } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode]               = useState('choice'); // 'choice' | 'email'
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors]           = useState({});
    const [providerHint, setProviderHint] = useState(null); // 'GOOGLE' | 'PASSWORD' | 'BOTH' | null
    const [submitting, setSubmitting]   = useState(false);
    const [checkingProvider, setCheckingProvider] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            navigate(user.is_onboarded ? '/app' : '/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        document.title = 'Sign in — Ormmakkurippu';
    }, []);

    useEffect(() => {
        if (authError) {
            setErrors(e => ({ ...e, form: authError }));
        }
    }, [authError]);

    if (loading) return <AuthLoadingScreen />;

    const validateEmail = (val) => {
        if (!val) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
        return null;
    };

    const handleEmailContinue = async (e) => {
        e.preventDefault();
        const emailErr = validateEmail(email);
        if (emailErr) { setErrors({ email: emailErr }); return; }

        setErrors({});
        setCheckingProvider(true);
        const result = await checkProvider(email);
        setCheckingProvider(false);

        if (result.provider === 'GOOGLE') {
            setProviderHint('GOOGLE');
            setErrors({ form: 'This email is registered with Google. Use "Continue with Google" below.' });
        } else {
            setProviderHint(result.provider);
            setMode('email');
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        const emailErr = validateEmail(email);
        if (emailErr) { setErrors(err => ({ ...err, email: emailErr })); return; }
        if (!password) { setErrors(err => ({ ...err, password: 'Password is required.' })); return; }

        setErrors({});
        setAuthError(null);
        setSubmitting(true);
        const result = await loginWithPassword(email, password);
        setSubmitting(false);

        if (!result.success) {
            if (result.code === 'PROVIDER_MISMATCH_GOOGLE_ONLY') {
                setErrors({ form: result.message });
                setProviderHint('GOOGLE');
            } else {
                setErrors({ form: result.message });
            }
        }
    };

    const isLoading = authLoading || submitting || checkingProvider;

    if (isLoading && mode === 'choice') return <AuthLoadingScreen />;

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12 relative overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-red-900/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-red-800/20 blur-3xl" />
                <div className="relative">
                    <Link to="/" className="text-white text-2xl font-extrabold tracking-tight">
                        <span className="text-red-500">ormmak</span>kurippu
                    </Link>
                </div>
                <div className="relative space-y-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white leading-snug mb-4">
                            Never miss a<br />follow-up again.
                        </h2>
                        <p className="text-gray-400 text-base leading-relaxed">
                            The task manager built for teams that handle high call volumes. Log, assign, and close every call — faster.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {BENEFITS.map(b => (
                            <li key={b.text} className="flex items-center gap-3">
                                <span className="text-xl">{b.icon}</span>
                                <span className="text-gray-300 text-sm">{b.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-gray-600 text-xs">
                    &copy; {new Date().getFullYear()} Ormmakkurippu. All rights reserved.
                </p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 bg-gray-50 lg:bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                            <span className="text-red-600">ormmak</span>kurippu
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500 text-sm">Sign in to your workspace</p>
                    </div>

                    {/* Google button */}
                    <button
                        onClick={() => { setAuthError(null); setErrors({}); login(); }}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm font-medium text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {authLoading ? 'Signing in…' : 'Continue with Google'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-400">or sign in with email</span>
                        </div>
                    </div>

                    {/* Google-only provider hint */}
                    {providerHint === 'GOOGLE' && (
                        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                            This account uses Google Sign-In. Click <strong>Continue with Google</strong> above to sign in.
                        </div>
                    )}

                    {/* Form error */}
                    {errors.form && providerHint !== 'GOOGLE' && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {errors.form}
                        </div>
                    )}

                    {mode === 'choice' ? (
                        /* Step 1: Email entry */
                        <form onSubmit={handleEmailContinue} noValidate className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setErrors({}); setProviderHint(null); setAuthError(null); }}
                                    placeholder="you@example.com"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={checkingProvider}
                                className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {checkingProvider ? 'Checking…' : 'Continue with email'}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Password entry */
                        <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <div className="flex items-center gap-2">
                                    <span className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 truncate">
                                        {email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('choice'); setPassword(''); setErrors({}); setProviderHint(null); setAuthError(null); }}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium shrink-0"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setErrors(err => ({ ...err, password: null, form: null })); setAuthError(null); }}
                                        placeholder="Your password"
                                        className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        tabIndex={-1}
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                <div className="mt-1 text-right">
                                    <Link to="/forgot-password" className="text-xs text-red-600 hover:text-red-700 font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || authLoading}
                                className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {(submitting || authLoading) && (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                {submitting || authLoading ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-red-600 font-medium hover:text-red-700">
                            Sign up
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
                        By continuing, you agree to our{' '}
                        <Link to="#" className="text-gray-600 underline hover:text-gray-900">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="#" className="text-gray-600 underline hover:text-gray-900">Privacy Policy</Link>.
                    </p>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            ← Back to homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
