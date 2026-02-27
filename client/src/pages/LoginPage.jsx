import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
    { email: 'owner@demo.local', label: 'Demo Owner', description: 'Full admin access — create workspaces, invite members, manage tasks', icon: '👑' },
    { email: 'member@demo.local', label: 'Demo Member', description: 'Standard access — assigned tasks, team collaboration', icon: '👤' },
    { email: 'demo@local.test', label: 'Demo User', description: 'Standard seeded account (Demo123!) — verification ready', icon: '🚀' },
];

const IS_DEMO = import.meta.env.VITE_DEMO_AUTH === 'true';

export default function LoginPage() {
    const { login, demoLogin } = useAuth();
    const [loading, setLoading] = useState(null); // email of the account being logged in

    const handleDemoLogin = async (email) => {
        setLoading(email);
        try {
            await demoLogin(email);
        } finally {
            setLoading(null);
        }
    };

    if (IS_DEMO) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
                <div style={{ maxWidth: 440, width: '100%', padding: '0 16px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>🧪</div>
                        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>DEMO Mode</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 14 }}>
                            Pick a demo account to sign in instantly — no password required.
                        </p>
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(255, 200, 0, 0.15)',
                            border: '1px solid rgba(255,200,0,0.4)',
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontSize: 12,
                            color: '#ffd700',
                            marginTop: 12,
                        }}>
                            ⚠️ Not for production use
                        </div>
                    </div>

                    {/* Account cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {DEMO_ACCOUNTS.map(({ email, label, description, icon }) => (
                            <button
                                key={email}
                                onClick={() => handleDemoLogin(email)}
                                disabled={!!loading}
                                style={{
                                    background: loading === email
                                        ? 'rgba(99, 102, 241, 0.7)'
                                        : 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 14,
                                    padding: '18px 20px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    backdropFilter: 'blur(10px)',
                                    opacity: loading && loading !== email ? 0.5 : 1,
                                }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
                                onMouseLeave={e => { if (!loading || loading !== email) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span style={{ fontSize: 28 }}>{icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{label}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 }}>{description}</div>
                                        <div style={{ color: 'rgba(99,102,241,0.9)', fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>{email}</div>
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>
                                        {loading === email ? '⏳' : '→'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 24 }}>
                        DEMO_AUTH=true · Ormmakkurippu Dev Build
                    </p>
                </div>
            </div>
        );
    }

    // ── Production: Google-only login ────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-xl">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome to Ormmakkurippu
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please sign in to continue
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <button
                        onClick={() => login()}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" viewBox="0 0 24 24" fill="white">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </span>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">
                                Trusted Security
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
