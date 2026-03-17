import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const BENEFITS = [
    { icon: '📞', text: 'Log calls in seconds, auto-link to contacts' },
    { icon: '✅', text: 'Turn every conversation into an actionable task' },
    { icon: '🔗', text: 'Share tasks securely with one-click links' },
    { icon: '👥', text: 'Collaborate with your team in real time' },
];

export default function LoginPage() {
    const { user, login, loading, GOOGLE_AUTH_ENABLED } = useAuth();
    const navigate = useNavigate();

    const [form, setForm]         = useState({ email: '', password: '' });
    const [showPw, setShowPw]     = useState(false);
    const [submitting, setSub]    = useState(false);
    const [error, setError]       = useState('');

    // Redirect already-authenticated users
    useEffect(() => {
        if (!loading && user) {
            navigate(user.is_onboarded ? '/app' : '/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
        setSub(true);
        try {
            const userData = await login({ email: form.email, password: form.password });
            toast.success('Welcome back!');
            navigate(userData.is_onboarded ? '/app' : '/onboarding', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setSub(false);
        }
    };

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
                <div className="lg:hidden mb-8 text-xl font-extrabold tracking-tight">
                    <span className="text-red-600">ormmak</span>
                    <span className="text-gray-900">kurippu</span>
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                        <p className="text-sm text-gray-500 mt-1.5">Sign in to your account to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="email"
                                required
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
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
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {/* TODO[google-auth]: un-comment the block below when GOOGLE_AUTH_ENABLED=true */}
                    {GOOGLE_AUTH_ENABLED && (
                        <div className="mt-4">
                            <div className="relative flex items-center my-4">
                                <div className="flex-1 border-t border-gray-200" />
                                <span className="mx-3 text-xs text-gray-400">or</span>
                                <div className="flex-1 border-t border-gray-200" />
                            </div>
                            <button
                                className="w-full flex items-center justify-center gap-3 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                onClick={() => { /* TODO[google-auth]: call googleLogin() */ }}
                            >
                                Continue with Google
                            </button>
                        </div>
                    )}

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
