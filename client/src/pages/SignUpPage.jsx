import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const STEPS = [
    { n: '1', label: 'Create your account' },
    { n: '2', label: 'Name your workspace' },
    { n: '3', label: 'Invite your team' },
    { n: '4', label: 'Start closing deals' },
];

const PW_RULES = [
    { label: 'At least 8 characters', test: p => p.length >= 8 },
    { label: 'Contains a letter',     test: p => /[a-zA-Z]/.test(p) },
    { label: 'Contains a number',     test: p => /[0-9]/.test(p) },
];

export default function SignUpPage() {
    const { user, signup, loading, GOOGLE_AUTH_ENABLED } = useAuth();
    const navigate = useNavigate();

    const [form, setForm]       = useState({ name: '', email: '', password: '', confirm_password: '' });
    const [showPw, setShowPw]   = useState(false);
    const [showCp, setShowCp]   = useState(false);
    const [submitting, setSub]  = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!loading && user) {
            navigate(user.is_onboarded ? '/app' : '/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Please fill in all required fields.'); return; }
        if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
        setSub(true);
        try {
            const userData = await signup(form);
            toast.success('Account created! Welcome aboard 🎉');
            navigate(userData.is_onboarded ? '/app' : '/onboarding', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
            setError(msg);
        } finally {
            setSub(false);
        }
    };

    const pwStrength = PW_RULES.map(r => ({ ...r, ok: r.test(form.password) }));
    const allPwOk    = pwStrength.every(r => r.ok);

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-gray-900 flex-col justify-between p-12">
                <Link to="/" className="text-xl font-extrabold tracking-tight">
                    <span className="text-red-500">ormmak</span>
                    <span className="text-white">kurippu</span>
                </Link>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">
                            Up and running<br />in 2 minutes.
                        </h2>
                        <p className="text-gray-400 text-sm">No credit card required. Cancel anytime.</p>
                    </div>
                    <div className="relative pl-4">
                        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gray-700" />
                        <ul className="space-y-6">
                            {STEPS.map((s, i) => (
                                <li key={s.n} className="flex items-center gap-4">
                                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-red-600 text-white' : 'bg-gray-800 border border-gray-600 text-gray-400'}`}>
                                        {s.n}
                                    </div>
                                    <span className={`text-sm ${i === 0 ? 'text-white font-medium' : 'text-gray-500'}`}>{s.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Ormmakurippu</p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                <div className="lg:hidden mb-8 text-xl font-extrabold tracking-tight">
                    <span className="text-red-600">ormmak</span>
                    <span className="text-gray-900">kurippu</span>
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                        <p className="text-sm text-gray-500 mt-1.5">Free forever. No credit card required.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Your name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Jane Smith"
                                autoComplete="name"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address <span className="text-red-500">*</span></label>
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
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Password strength hints */}
                            {form.password && (
                                <ul className="mt-2 space-y-0.5">
                                    {pwStrength.map(r => (
                                        <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                                            <Check size={10} className={r.ok ? 'text-green-500' : 'opacity-0'} />
                                            {r.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showCp ? 'text' : 'password'}
                                    value={form.confirm_password}
                                    onChange={e => set('confirm_password', e.target.value)}
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                    required
                                    className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                                        form.confirm_password && form.confirm_password !== form.password
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-200'
                                    }`}
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowCp(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCp ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {form.confirm_password && form.confirm_password !== form.password && (
                                <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !allPwOk || form.password !== form.confirm_password}
                            className="w-full py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            {submitting ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    {/* TODO[google-auth]: Restore Google button when VITE_ENABLE_GOOGLE_AUTH=true */}

                    <p className="mt-5 text-xs text-center text-gray-400">
                        By signing up you agree to our{' '}
                        <Link to="#" className="text-gray-600 hover:text-red-600 underline underline-offset-2">Terms</Link>
                        {' '}and{' '}
                        <Link to="#" className="text-gray-600 hover:text-red-600 underline underline-offset-2">Privacy Policy</Link>.
                    </p>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>

                <Link to="/" className="mt-10 text-xs text-gray-400 hover:text-gray-600 transition-colors">← Back to homepage</Link>
            </div>
        </div>
    );
}
