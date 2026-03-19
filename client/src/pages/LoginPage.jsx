import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

const BENEFITS = [
    { icon: '📞', text: 'Log calls as tasks in seconds' },
    { icon: '🤝', text: 'Delegate across your team' },
    { icon: '🔗', text: 'Share tasks with secure links' },
    { icon: '⚡', text: 'Real-time updates for everyone' },
];

const DEMO_ACCOUNTS = [
    { email: 'owner@demo.local', label: 'Demo Owner', description: 'Full admin access — create workspaces, invite members, manage tasks', icon: '👑' },
    { email: 'member@demo.local', label: 'Demo Member', description: 'Standard access — assigned tasks, team collaboration', icon: '👤' },
    { email: 'demo@local.test', label: 'Demo User', description: 'Standard seeded account (Demo123!) — verification ready', icon: '🚀' },
];

const IS_DEMO = import.meta.env.VITE_DEMO_AUTH === 'true';

export default function LoginPage() {
    const { login, demoLogin, user, loading, authLoading } = useAuth();
    const navigate = useNavigate();
    const [demoLoginLoading, setDemoLoginLoading] = useState(null); // email of the account being logged in for demo

    // If already authenticated, bounce to the app
    useEffect(() => {
        if (!loading && user) {
            navigate(user.is_onboarded ? '/app' : '/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        document.title = 'Sign in — Ormmakkurippu';
    }, []);


    const handleDemoLogin = async (email) => {
        setDemoLoginLoading(email);
        try {
            await demoLogin(email);
        } finally {
            setDemoLoginLoading(null);
        }
    };

    if (loading || authLoading) return <AuthLoadingScreen />;

    if (IS_DEMO) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
                <div className="max-w-md w-full px-4">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-2">🧪</div>
                        <h1 className="text-white text-3xl font-bold">DEMO Mode</h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            Pick a demo account to sign in instantly — no password required.
                        </p>
                        <div className="inline-block bg-yellow-400/20 border border-yellow-400/40 rounded-lg px-4 py-1.5 text-xs text-yellow-500 mt-4">
                            ⚠️ Not for production use
                        </div>
                    </div>

                    {/* Account cards */}
                    <div className="flex flex-col gap-4">
                        {DEMO_ACCOUNTS.map(({ email, label, description, icon }) => (
                            <button
                                key={email}
                                onClick={() => handleDemoLogin(email)}
                                disabled={!!demoLoginLoading}
                                className={`bg-white/10 border border-white/10 rounded-2xl p-5 text-left transition-all backdrop-blur-md flex items-center gap-4 hover:bg-white/20 ${
                                    demoLoginLoading && demoLoginLoading !== email ? 'opacity-50' : 'opacity-100'
                                } ${demoLoginLoading === email ? 'bg-indigo-600/50' : ''}`}
                            >
                                <span className="text-3xl">{icon}</span>
                                <div className="flex-1">
                                    <div className="text-white font-semibold text-base">{label}</div>
                                    <div className="text-gray-400 text-xs mt-1">{description}</div>
                                    <div className="text-indigo-400 text-[10px] mt-1 font-mono">{email}</div>
                                </div>
                                <div className="text-white/30 text-xl font-bold">
                                    {demoLoginLoading === email ? '⏳' : '→'}
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-gray-600 text-[10px] mt-8">
                        DEMO_AUTH=true · Ormmakkurippu Dev Build
                    </p>
                </div>
            </div>
        );
    }

    // ── Production: Google-only login ────────────────────────────────────────
    return (
        <div className="min-h-screen flex bg-white">

            {/* ── Left panel (branding) — hidden on mobile ─────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12 relative overflow-hidden">
                {/* Decorative blobs */}
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

            {/* ── Right panel (sign-in form) ──────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 bg-gray-50 lg:bg-white">
                <div className="w-full max-w-md">

                    {/* Mobile-only logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
                            <span className="text-red-600">ormmak</span>kurippu
                        </Link>
                    </div>

                    <div className="mb-8 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500 text-sm">Sign in to your workspace</p>
                    </div>

                    {/* Google sign-in */}
                    <button
                        onClick={() => login()}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm font-medium text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        {/* Google logo */}
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-400">
                                Secure · Private · Fast
                            </span>
                        </div>
                    </div>

                    {/* Trust line */}
                    <p className="text-center text-[11px] text-gray-400 leading-relaxed px-4">
                        By continuing, you agree to our{' '}
                        <Link to="#" className="text-gray-600 underline hover:text-gray-900">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="#" className="text-gray-600 underline hover:text-gray-900">Privacy Policy</Link>.
                    </p>

                    {/* Back to landing */}
                    <div className="mt-8 text-center">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            ← Back to homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
