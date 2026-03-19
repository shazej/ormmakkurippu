import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
    {
        q: 'What is Ormmakkurippu?',
        a: 'Ormmakkurippu (Malayalam for "Memory Note") is a CRM-style task manager built for teams that handle high call volumes. It converts phone calls into structured, trackable tasks — so nothing slips through the cracks.'
    },
    {
        q: 'How does the call-to-task workflow work?',
        a: 'When a call comes in, you log the caller details, assign a category and priority, and it becomes a tracked task. Your whole team sees it in real time. No more sticky notes or missed follow-ups.'
    },
    {
        q: 'Can I use Ormmakkurippu for free?',
        a: 'Yes. The Free plan lets you create up to 50 tasks per month, manage one workspace, and invite up to 3 team members — with no credit card required.'
    },
    {
        q: 'Is my data secure?',
        a: 'All data is encrypted at rest and in transit. We use Google OAuth for authentication and never store passwords. Share links use cryptographically secure tokens with optional expiry.'
    },
    {
        q: 'Can I share tasks with people outside my team?',
        a: 'Yes. You can generate secure, expiring share links for any task. Recipients can view the task without needing an account.'
    },
    {
        q: 'What happens when I cancel my subscription?',
        a: "Your account downgrades to the Free plan at the end of your billing period. All your data is preserved — you won't lose anything."
    }
];

// ── Pricing plans ─────────────────────────────────────────────────────────────
const PLANS = [
    {
        name: 'Free',
        price: '₹0',
        period: 'forever',
        description: 'Perfect for individuals getting started.',
        features: [
            '50 tasks / month',
            '1 workspace',
            'Up to 3 team members',
            'Call logging',
            'Secure share links',
            'Google sign-in',
        ],
        cta: 'Start for free',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: '₹399',
        period: 'per user / month',
        description: 'For growing teams that need more power.',
        features: [
            'Unlimited tasks',
            'Unlimited workspaces',
            'Unlimited team members',
            'Priority & category analytics',
            'Task assignment & delegation',
            'Export to CSV',
            'Priority support',
        ],
        cta: 'Start free trial',
        highlighted: true,
    },
    {
        name: 'Business',
        price: '₹999',
        period: 'per user / month',
        description: 'Advanced controls for larger organisations.',
        features: [
            'Everything in Pro',
            'SSO / SAML',
            'Audit logs',
            'Custom data retention',
            'Dedicated account manager',
            'SLA guarantee',
            'GDPR data processing addendum',
        ],
        cta: 'Contact sales',
        highlighted: false,
    },
];

// ── Accordion item ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 last:border-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex justify-between items-start gap-4 py-5 text-left"
                aria-expanded={open}
            >
                <span className="text-base font-medium text-gray-900">{q}</span>
                <span className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </span>
            </button>
            {open && (
                <div className="pb-5 text-gray-600 text-sm leading-relaxed pr-8">
                    {a}
                </div>
            )}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
    const { user } = useAuth();

    useEffect(() => {
        document.title = 'Ormmakkurippu — Turn every call into a tracked task';
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.content =
            'Ormmakkurippu converts phone calls into structured tasks. Built for teams that live on the phone — never miss a follow-up again.';
    }, []);

    const handleCta = () => login();

    return (
        <div className="bg-white text-gray-900 font-sans">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
                {/* Background blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-red-50 opacity-60 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-50 opacity-50 blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                        {/* Copy */}
                        <div className="lg:col-span-6 text-center lg:text-left mb-12 lg:mb-0">
                            <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Built for call-driven teams
                            </span>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                                Turn every call into a{' '}
                                <span className="text-red-600">tracked task.</span>
                            </h1>
                            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                                Ormmakkurippu converts phone conversations into structured, delegatable tasks — with priorities, deadlines, and real-time team visibility. Nothing falls through the cracks.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {user ? (
                                    <Link
                                        to="/app"
                                        className="bg-red-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block text-center"
                                    >
                                        Go to app →
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="bg-red-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                                        >
                                            Start for free
                                        </Link>
                                        <Link
                                            to="/login"
                                            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold hover:border-gray-400 hover:text-gray-900 transition-all text-center"
                                        >
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </div>

                            <p className="mt-4 text-xs text-gray-400">Free forever · No credit card required · Google sign-in</p>
                        </div>

                        {/* App mockup */}
                        <div className="lg:col-span-6 relative">
                            <div className="relative rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                {/* Window chrome */}
                                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="ml-4 flex-1 h-2 bg-gray-100 rounded-full max-w-[160px]" />
                                </div>

                                <div className="p-5 space-y-3">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's tasks</div>
                                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                                            <span className="text-red-600 font-bold text-sm">+</span>
                                        </div>
                                    </div>

                                    {/* Mock tasks */}
                                    {[
                                        { label: 'Follow up: John re invoice', tag: 'High', color: 'bg-red-100 text-red-600' },
                                        { label: 'Send proposal to Arun Nair', tag: 'Medium', color: 'bg-amber-100 text-amber-600' },
                                        { label: 'Call Meena — insurance renewal', tag: 'Low', color: 'bg-green-100 text-green-600' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-colors">
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-800 truncate">{item.label}</div>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${item.color}`}>
                                                {item.tag}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Divider & incoming call */}
                                    <div className="border-t border-gray-100 pt-3 flex items-center gap-3 bg-red-50 rounded-xl p-3">
                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-red-800">Incoming call logged</div>
                                            <div className="text-xs text-red-600">+91 98765 43210 · just now</div>
                                        </div>
                                        <div className="ml-auto">
                                            <div className="text-[10px] font-semibold text-red-600 border border-red-200 rounded-md px-2 py-1 bg-white">
                                                Create task
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Trust strip ──────────────────────────────────────────────── */}
            <section className="bg-gray-50 border-y border-gray-100 py-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Trusted by teams at</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
                        {['Technica', 'GlobalSoft', 'ACME Corp', 'Innovate', 'FutureLab'].map(name => (
                            <span key={name} className="text-lg font-bold text-gray-600">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────────── */}
            <section id="features" className="py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything your team needs</h2>
                        <p className="text-lg text-gray-500">Built specifically for teams that live on the phone and need tasks to actually get done.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '📞',
                                color: 'bg-red-50 text-red-600',
                                title: 'Call-first task creation',
                                desc: 'Log a call and convert it into a structured task in seconds. Caller details, category, priority — all in one place.'
                            },
                            {
                                icon: '🤝',
                                color: 'bg-blue-50 text-blue-600',
                                title: 'Delegate instantly',
                                desc: 'Assign tasks to teammates with a tap. They get notified, you stay in the loop. No more "I thought you were handling it."'
                            },
                            {
                                icon: '🔗',
                                color: 'bg-purple-50 text-purple-600',
                                title: 'Secure share links',
                                desc: 'Share any task via a secure, expiring link. External contacts see only what you choose — no account required.'
                            },
                            {
                                icon: '⚡',
                                color: 'bg-amber-50 text-amber-600',
                                title: 'Real-time updates',
                                desc: 'Your team sees changes as they happen. Status updates, comments, and completions sync instantly across devices.'
                            },
                            {
                                icon: '🗂️',
                                color: 'bg-green-50 text-green-600',
                                title: 'Smart prioritisation',
                                desc: 'High, Medium, Low — plus due dates and categories. Filter by anything. Always know what to tackle next.'
                            },
                            {
                                icon: '🔒',
                                color: 'bg-slate-50 text-slate-600',
                                title: 'Enterprise-grade security',
                                desc: 'Google OAuth, optional MFA, WebAuthn passkeys, and full audit logs. Your data is yours, always encrypted.'
                            },
                        ].map(f => (
                            <div key={f.title} className="rounded-2xl border border-gray-100 p-8 hover:border-gray-200 hover:shadow-md transition-all">
                                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-2xl mb-5`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ─────────────────────────────────────────────── */}
            <section id="how-it-works" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
                        <p className="text-lg text-gray-500">From incoming call to completed task — in three steps.</p>
                    </div>

                    <div className="relative">
                        {/* Connector line (desktop) */}
                        <div className="hidden lg:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gray-200" />

                        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
                            {[
                                {
                                    step: '1',
                                    title: 'Log the call',
                                    desc: "A call comes in. You enter the caller's name, phone number, reason for calling, and urgency. Takes under 30 seconds."
                                },
                                {
                                    step: '2',
                                    title: 'Assign & prioritise',
                                    desc: 'Set a due date, pick a category, assign it to yourself or a teammate. The task appears in your team\'s inbox immediately.'
                                },
                                {
                                    step: '3',
                                    title: 'Track to completion',
                                    desc: 'Move tasks through Pending → In Progress → Done. Nothing ages out. Nothing gets forgotten.'
                                },
                            ].map((s) => (
                                <div key={s.step} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                                    <div className="relative w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
                                        <span className="text-2xl font-extrabold text-red-600">{s.step}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <section id="pricing" className="py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
                        <p className="text-lg text-gray-500">Start free, upgrade when you're ready. No hidden fees.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {PLANS.map(plan => (
                            <div
                                key={plan.name}
                                className={`rounded-2xl p-8 border transition-shadow ${
                                    plan.highlighted
                                        ? 'bg-gray-900 border-gray-900 text-white shadow-2xl'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                                        Most popular
                                    </div>
                                )}
                                <div className="mb-6">
                                    <div className={`text-sm font-semibold mb-1 ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {plan.name}
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                                            {plan.price}
                                        </span>
                                        <span className={`text-sm mb-1.5 ${plan.highlighted ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {plan.period}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-3 text-sm">
                                            <svg
                                                className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-red-400' : 'text-red-500'}`}
                                                fill="currentColor" viewBox="0 0 20 20"
                                            >
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className={plan.highlighted ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={plan.name === 'Business' ? undefined : handleCta}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                                        plan.highlighted
                                            ? 'bg-red-600 text-white hover:bg-red-500'
                                            : 'bg-gray-900 text-white hover:bg-gray-700'
                                    }`}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-8">
                        All prices exclude GST. Billed monthly or annually (save 20% annually).
                    </p>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────────── */}
            <section id="faq" className="py-24 bg-gray-50 border-t border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
                        <p className="text-gray-500">Can't find what you're looking for? <a href="mailto:hello@ormmakkurippu.com" className="text-red-600 hover:underline">Email us.</a></p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 px-6">
                        {FAQ_ITEMS.map(item => (
                            <FaqItem key={item.q} q={item.q} a={item.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ───────────────────────────────────────────────── */}
            <section className="py-24 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                        Ready to stop missing follow-ups?
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Join thousands of teams who use Ormmakkurippu to close the loop on every call.
                    </p>
                    {user ? (
                        <Link
                            to="/app"
                            className="bg-red-600 text-white px-10 py-4 rounded-xl text-base font-bold hover:bg-red-500 transition-colors inline-block"
                        >
                            Go to app →
                        </Link>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/login"
                                className="bg-red-600 text-white px-10 py-4 rounded-xl text-base font-bold hover:bg-red-500 transition-colors text-center"
                            >
                                Start for free
                            </Link>
                            <Link
                                to="/login"
                                className="border border-gray-700 text-gray-300 px-10 py-4 rounded-xl text-base font-semibold hover:border-gray-400 hover:text-white transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    )}
                    <p className="text-gray-600 text-xs mt-6">Free plan · No credit card · Cancel anytime</p>
                </div>
            </section>
        </div>
    );
}
