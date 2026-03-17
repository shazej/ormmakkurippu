import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

// ─── Left-panel benefit list ──────────────────────────────────────────────────
const BENEFITS = [
    { icon: '📞', text: 'Log calls in seconds, auto-link to contacts' },
    { icon: '✅', text: 'Turn every conversation into an actionable task' },
    { icon: '🔗', text: 'Share tasks securely with one-click links' },
    { icon: '👥', text: 'Collaborate with your team in real time' },
];

// ─── Email validity helper ─────────────────────────────────────────────────────
const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Google icon SVG (inline, no external dep) ────────────────────────────────
function GoogleIcon() {
    return (
        <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
    );
}

// ─── Login state machine ───────────────────────────────────────────────────────
//
//  idle            – initial; email field only, no password section
//  checking        – debounce expired, API call in flight
//  password        – account found with password_hash → show password form
//  google          – account found with google_uid only → show Google CTA
//  unknown         – email not in system → default to password form + signup hint
//  submitting      – login POST in flight
//
const STATES = {
    IDLE:       'idle',
    CHECKING:   'checking',
    PASSWORD:   'password',
    GOOGLE:     'google',
    UNKNOWN:    'unknown',
    SUBMITTING: 'submitting',
};

const DEBOUNCE_MS = 600;

export default function LoginPage() {
    const { user, login, loading, GOOGLE_AUTH_ENABLED } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [loginState, setState]  = useState(STATES.IDLE);
    const [error, setError]       = useState('');

    const debounceRef = useRef(null);

    // Redirect already-authenticated users
    useEffect(() => {
        if (!loading && user) {
            navigate(user.is_onboarded ? '/app' : '/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    // ── Provider check ───────────────────────────────────────────────────────
    const checkProvider = useCallback(async (emailVal) => {
        setState(STATES.CHECKING);
        setError('');
        try {
            const res = await axios.post('/api/auth/check-provider', { email: emailVal });
            const provider = res.data?.provider;
            if (provider === 'google') {
                setState(STATES.GOOGLE);
            } else if (provider === 'none') {
                setState(STATES.UNKNOWN);
            } else {
                setState(STATES.PASSWORD);
            }
        } catch {
            // On API failure, fall back to showing the password form
            setState(STATES.PASSWORD);
        }
    }, []);

    // ── Email field change handler ────────────────────────────────────────────
    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setError('');
        setState(STATES.IDLE);
        setPassword('');

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (BASIC_EMAIL_RE.test(val.trim())) {
            debounceRef.current = setTimeout(() => checkProvider(val.trim()), DEBOUNCE_MS);
        }
    };

    // ── Password login submit ─────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Guard: never attempt password login for Google accounts
        if (loginState === STATES.GOOGLE) return;

        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setState(STATES.SUBMITTING);
        setError('');
        try {
            const userData = await login({ email, password });
            toast.success('Welcome back!');
            navigate(userData.is_onboarded ? '/app' : '/onboarding', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(msg);
            // If backend reports Google account (edge case), switch state
            if (msg.toLowerCase().includes('google')) {
                setState(STATES.GOOGLE);
            } else {
                setState(loginState === STATES.SUBMITTING ? STATES.PASSWORD : loginState);
            }
        }
    };

    // ── Derived booleans ──────────────────────────────────────────────────────
    const isChecking   = loginState === STATES.CHECKING;
    const isGoogle     = loginState === STATES.GOOGLE;
    const showPassword = loginState === STATES.PASSWORD ||
                         loginState === STATES.UNKNOWN  ||
                         loginState === STATES.SUBMITTING;
    const isSubmitting = loginState === STATES.SUBMITTING;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-gray-900 flex-col justify-between p-12">
                <Link to="/" className="text-xl font-extrabold tracking-tight">
                    <span className="text-red-500">ormmak</span>
                    <span className="text-white">kurippu</span>
                </Link>
                <div className="space-y-8">
                    <h2 className="text-4xl font-extrabold text-white leading-tight">
                        Every call becomes<br />a closed deal.
                    </h2>
                    <ul className="space-y-4">
                        {BENEFITS.map(b => (
                            <li key={b.text} className="flex items-start gap-3 text-gray-300 text-sm">
                                <span className="text-lg leading-none mt-0.5">{b.icon}</span>
                                <span>{b.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Ormmakurippu</p>
            </div>

            {/* Right sign-in panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                {/* Mobile logo */}
                <div className="lg:hidden mb-8 text-xl font-extrabold tracking-tight">
                    <span className="text-red-600">ormmak</span>
                    <span className="text-gray-900">kurippu</span>
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                        <p className="text-sm text-gray-500 mt-1.5">Sign in to your account to continue.</p>
                    </div>

                    {/* ── Error banner ── */}
                    {error && !isGoogle && (
                        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Email field — always visible */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    required
                                    className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                {/* Spinner while checking */}
                                {isChecking && (
                                    <Loader2
                                        size={14}
                                        className="animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    />
                                )}
                            </div>
                        </div>

                        {/* ── STATE: google — hide password, show Google CTA ── */}
                        {isGoogle && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2.5 rounded-xl">
                                    <span className="mt-0.5 shrink-0">ℹ️</span>
                                    <p>
                                        This account uses <strong>Google sign-in</strong>.
                                        Please continue with Google to access your account.
                                    </p>
                                </div>

                                {GOOGLE_AUTH_ENABLED ? (
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                        onClick={() => { /* TODO[google-auth]: call googleLogin() */ }}
                                    >
                                        <GoogleIcon />
                                        Continue with Google
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-400 bg-gray-50 cursor-not-allowed"
                                        title="Google sign-in is temporarily unavailable"
                                    >
                                        <GoogleIcon />
                                        Continue with Google
                                        <span className="ml-auto text-[11px] font-normal text-gray-400">(coming soon)</span>
                                    </button>
                                )}

                                <p className="text-xs text-center text-gray-400">
                                    Wrong email?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setEmail(''); setState(STATES.IDLE); setError(''); }}
                                        className="text-red-600 hover:underline font-medium"
                                    >
                                        Change email
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* ── STATE: password / unknown / submitting — show password form ── */}
                        {showPassword && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            autoFocus
                                            required
                                            className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw(s => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {loginState === STATES.UNKNOWN && (
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            No account found.{' '}
                                            <Link to="/signup" className="text-red-600 hover:underline font-medium">
                                                Create one for free →
                                            </Link>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                                </button>
                            </>
                        )}

                        {/* ── STATE: idle — prompt to enter email ── */}
                        {loginState === STATES.IDLE && email === '' && (
                            <p className="text-xs text-gray-400 text-center">Enter your email to continue.</p>
                        )}
                    </form>

                    {/* TODO[google-auth]: Google divider+button (always visible) can be restored here when GOOGLE_AUTH_ENABLED=true */}

                    <p className="mt-6 text-xs text-center text-gray-400">
                        By signing in you agree to our{' '}
                        <Link to="#" className="text-gray-600 hover:text-red-600 underline underline-offset-2">Terms</Link>
                        {' '}and{' '}
                        <Link to="#" className="text-gray-600 hover:text-red-600 underline underline-offset-2">Privacy Policy</Link>.
                    </p>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-red-600 font-semibold hover:underline">Sign up free</Link>
                        </p>
                    </div>
                </div>

                <Link to="/" className="mt-10 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Back to homepage
                </Link>
            </div>
        </div>
    );
}
