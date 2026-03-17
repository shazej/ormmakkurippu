import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: 'Perfect for individuals getting started.',
        cta: 'Get started free',
        ctaSecondary: true,
        features: [
            { text: '1 workspace', included: true },
            { text: 'Up to 5 team members', included: true },
            { text: '100 tasks / month', included: true },
            { text: 'Shared task links', included: true },
            { text: 'Call logging (10/month)', included: true },
            { text: 'Email support', included: true },
            { text: 'Unlimited tasks', included: false },
            { text: 'Unlimited members', included: false },
            { text: 'Custom integrations', included: false },
            { text: 'Priority support', included: false },
        ],
    },
    {
        id: 'team',
        name: 'Team',
        monthlyPrice: 399,
        yearlyPrice: 299,
        description: 'For growing teams that need more power.',
        cta: 'Start free trial',
        highlight: true,
        badge: 'Most popular',
        features: [
            { text: 'Unlimited workspaces', included: true },
            { text: 'Unlimited team members', included: true },
            { text: 'Unlimited tasks', included: true },
            { text: 'Shared task links', included: true },
            { text: 'Unlimited call logging', included: true },
            { text: 'Priority support', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'SSO / SAML', included: false },
            { text: 'Dedicated success manager', included: false },
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: null,
        yearlyPrice: null,
        description: 'For large organisations with custom needs.',
        cta: 'Contact sales',
        features: [
            { text: 'Everything in Team', included: true },
            { text: 'SSO / SAML', included: true },
            { text: 'Audit logs', included: true },
            { text: 'SLA guarantee', included: true },
            { text: 'Dedicated success manager', included: true },
            { text: 'Custom data retention', included: true },
            { text: 'On-premise option', included: true },
            { text: 'Custom billing', included: true },
            { text: 'Volume discounts', included: true },
            { text: 'Security review', included: true },
        ],
    },
];

const FAQS = [
    {
        q: 'Can I switch plans later?',
        a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
    },
    {
        q: 'Is there a free trial for paid plans?',
        a: 'Yes — Team plan comes with a 14-day free trial, no credit card required.',
    },
    {
        q: 'How does per-user pricing work?',
        a: 'You pay for each active member in your workspace. Guests (view-only) are free and do not count toward your seat count.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept UPI, all major credit/debit cards (Visa, Mastercard, RuPay), and net banking via Razorpay.',
    },
    {
        q: 'Can I get an invoice for my team?',
        a: 'Absolutely. A GST-compliant invoice is automatically generated for every payment and sent to your billing email.',
    },
    {
        q: 'What happens when I hit the free plan limits?',
        a: 'We will notify you before you hit the limit. You can upgrade at any time; your existing data is never deleted.',
    },
];

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between py-4 text-left gap-4 group"
            >
                <span className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">{q}</span>
                <span className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>}
        </div>
    );
}

export default function PricingPage() {
    const [yearly, setYearly] = useState(false);
    const { user } = useAuth();
    // TODO[google-auth]: Restore login() from useAuth when Google OAuth is re-enabled

    const handleCta = (plan) => {
        if (plan.id === 'enterprise') {
            window.location.href = 'mailto:sales@ormmakurippu.com?subject=Enterprise enquiry';
            return;
        }
        if (user) {
            window.location.href = '/app';
        } else {
            window.location.href = '/signup';
        }
    };

    return (
        <div className="py-20 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">Pricing</p>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">
                        Start free. Upgrade when your team grows. All plans include a 14-day free trial of Team.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-3 mt-8 bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => setYearly(false)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${!yearly ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${yearly ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
                        >
                            Yearly
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">−25%</span>
                        </button>
                    </div>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {PLANS.map(plan => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${
                                plan.highlight ? 'border-red-600 ring-1 ring-red-600 shadow-lg' : 'border-gray-200'
                            }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded-full">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                                <div className="mt-2 flex items-end gap-1">
                                    {plan.monthlyPrice === null ? (
                                        <span className="text-3xl font-extrabold text-gray-900">Custom</span>
                                    ) : plan.monthlyPrice === 0 ? (
                                        <span className="text-3xl font-extrabold text-gray-900">Free</span>
                                    ) : (
                                        <>
                                            <span className="text-xl font-semibold text-gray-500 mb-0.5">₹</span>
                                            <span className="text-3xl font-extrabold text-gray-900">
                                                {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                                            </span>
                                            <span className="text-sm text-gray-400 mb-1">/user/mo</span>
                                        </>
                                    )}
                                </div>
                                {plan.monthlyPrice !== null && plan.monthlyPrice !== 0 && yearly && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Billed ₹{plan.yearlyPrice * 12}/user/year
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                            </div>

                            <button
                                onClick={() => handleCta(plan)}
                                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                    plan.highlight
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : plan.ctaSecondary
                                            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {plan.cta}
                            </button>

                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map(f => (
                                    <li key={f.text} className="flex items-start gap-2">
                                        {f.included ? (
                                            <Check size={14} className="mt-0.5 text-green-500 shrink-0" />
                                        ) : (
                                            <X size={14} className="mt-0.5 text-gray-300 shrink-0" />
                                        )}
                                        <span className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {f.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Feature comparison hint */}
                <div className="text-center mb-20">
                    <p className="text-sm text-gray-400">
                        All plans include SSL, daily backups, and 99.9% uptime SLA.
                    </p>
                </div>

                {/* FAQ */}
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently asked questions</h2>
                    <div>
                        {FAQS.map(f => <FaqItem key={f.q} {...f} />)}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center bg-gray-900 rounded-3xl p-12">
                    <h2 className="text-3xl font-extrabold text-white mb-3">
                        Ready to get started?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Join thousands of teams using Ormmakurippu to close more deals.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                            href="/signup"
                            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                        >
                            Start for free
                        </a>
                        <a
                            href="mailto:sales@ormmakurippu.com"
                            className="px-8 py-3 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Talk to sales
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
