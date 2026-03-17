import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    User, Building2, Bell, Shield, CreditCard,
    ChevronRight, Check, X, Loader2, Globe, Trash2,
    Mail, Crown, UserCog, Eye, Users
} from 'lucide-react';

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'workspace',     label: 'Workspace',     icon: Building2 },
    { id: 'team',          label: 'Team',          icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security',      label: 'Security',      icon: Shield },
    { id: 'billing',       label: 'Billing',       icon: CreditCard },
];

const ROLES = [
    { value: 'OWNER',  label: 'Owner',  icon: Crown,   desc: 'Full access, can delete workspace' },
    { value: 'ADMIN',  label: 'Admin',  icon: UserCog, desc: 'Manage members and settings' },
    { value: 'MEMBER', label: 'Member', icon: User,    desc: 'Create and edit tasks' },
    { value: 'GUEST',  label: 'Viewer', icon: Eye,     desc: 'Read-only access' },
];

// ─── Shared helpers ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
    return <h2 className="text-base font-semibold text-gray-900 mb-4">{children}</h2>;
}

function SaveButton({ loading, saved, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {loading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
                <Check size={14} />
            ) : null}
            {loading ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
    );
}

function Toggle({ checked, onChange, label, description }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <div
                onClick={() => onChange(!checked)}
                className={`relative mt-0.5 w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-red-600' : 'bg-gray-200'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
        </label>
    );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({ display_name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                display_name: user.display_name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.patch('/api/users/me', form);
            await refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    const initials = (user?.display_name || user?.email || '?')
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="space-y-6 max-w-lg">
            <SectionTitle>Profile</SectionTitle>

            {/* Avatar */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg select-none">
                    {user?.photo_url
                        ? <img src={user.photo_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        : initials}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.display_name || '—'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Display name</label>
                    <input
                        type="text"
                        value={form.display_name}
                        onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">Your login email — cannot be changed here.</p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone (optional)</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>

            <SaveButton loading={loading} saved={saved} onClick={handleSave} />
        </div>
    );
}

// ─── Workspace Tab ──────────────────────────────────────────────────────────────
function WorkspaceTab() {
    const [workspace, setWorkspace] = useState(null);
    const [form, setForm] = useState({ name: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/workspaces/current')
            .then(res => {
                const ws = res.data?.data || res.data;
                setWorkspace(ws);
                setForm({ name: ws?.name || '' });
            })
            .catch(() => setError('Could not load workspace.'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await axios.patch(`/api/workspaces/${workspace.id}`, form);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-lg">
            <SectionTitle>Workspace settings</SectionTitle>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Workspace name</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>

            {workspace && (
                <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Plan</span>
                        <span className="font-medium text-gray-800 capitalize">{workspace.plan || 'Free'}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Members</span>
                        <span className="font-medium text-gray-800">{workspace._count?.members ?? '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Created</span>
                        <span className="font-medium text-gray-800">
                            {workspace.created_at
                                ? new Date(workspace.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                        </span>
                    </div>
                </div>
            )}

            <SaveButton loading={saving} saved={saved} onClick={handleSave} disabled={!form.name.trim()} />
        </div>
    );
}

// ─── Team Tab ───────────────────────────────────────────────────────────────────
function TeamTab() {
    const [workspace, setWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteSent, setInviteSent] = useState(false);

    const fetchWorkspace = useCallback(async () => {
        try {
            const res = await axios.get('/api/workspaces/current');
            const ws = res.data?.data || res.data;
            setWorkspace(ws);
            setMembers(ws?.members || []);
        } catch {
            // silently fail — workspace tab shows same error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !workspace?.id) return;
        setInviting(true);
        setInviteError('');
        try {
            await axios.post(`/api/workspaces/${workspace.id}/invite`, {
                email: inviteEmail.trim(),
                role: inviteRole,
            });
            setInviteEmail('');
            setInviteRole('MEMBER');
            setInviteSent(true);
            setTimeout(() => setInviteSent(false), 3000);
            fetchWorkspace();
        } catch (err) {
            setInviteError(err.response?.data?.message || 'Failed to send invite.');
        } finally {
            setInviting(false);
        }
    };

    const roleLabel = (role) => ROLES.find(r => r.value === role)?.label ?? role;

    const statusChip = (status) => {
        const map = {
            ACTIVE:   'bg-green-50 text-green-700',
            PENDING:  'bg-amber-50 text-amber-700',
            DECLINED: 'bg-red-50 text-red-600',
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>
                {status?.charAt(0) + status?.slice(1).toLowerCase()}
            </span>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-8 max-w-xl">
            {/* Invite form */}
            <div>
                <SectionTitle>Invite a team member</SectionTitle>
                <form onSubmit={handleInvite} className="space-y-3">
                    {inviteError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{inviteError}</p>}
                    {inviteSent && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2"><Check size={14} /> Invite sent!</p>}

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                                placeholder="colleague@company.com"
                                required
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        >
                            {ROLES.filter(r => r.value !== 'OWNER').map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role descriptions */}
                    <div className="grid grid-cols-3 gap-2">
                        {ROLES.filter(r => r.value !== 'OWNER').map(r => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setInviteRole(r.value)}
                                className={`p-2.5 rounded-xl border text-left transition-colors ${
                                    inviteRole === r.value
                                        ? 'border-red-600 bg-red-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <r.icon size={13} className={inviteRole === r.value ? 'text-red-600' : 'text-gray-400'} />
                                <p className="text-xs font-medium text-gray-800 mt-1">{r.label}</p>
                                <p className="text-[11px] text-gray-400 leading-snug">{r.desc}</p>
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={!inviteEmail.trim() || inviting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {inviting ? <Loader2 size={14} className="animate-spin" /> : null}
                        {inviting ? 'Sending…' : 'Send invite'}
                    </button>
                </form>
            </div>

            {/* Members list */}
            <div>
                <SectionTitle>Members ({members.length})</SectionTitle>
                {members.length === 0 ? (
                    <p className="text-sm text-gray-400">No members yet.</p>
                ) : (
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                        {(m.user?.display_name || m.user?.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {m.user?.display_name || m.user?.email}
                                        </p>
                                        {m.user?.display_name && (
                                            <p className="text-xs text-gray-400 truncate">{m.user?.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    {statusChip(m.status)}
                                    <span className="text-xs text-gray-500">{roleLabel(m.role)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
    const [prefs, setPrefs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/settings/notifications')
            .then(res => setPrefs(res.data?.data || res.data))
            .catch(() => setError('Could not load notification settings.'))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await axios.put('/api/settings/notifications', {
                new_signin_alert:          prefs.new_signin_alert,
                third_party_access_alert:  prefs.third_party_access_alert,
                newsletter_subscription:   prefs.newsletter_subscription,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-lg">
            <SectionTitle>Notification preferences</SectionTitle>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {prefs && (
                <div className="space-y-5">
                    <Toggle
                        checked={!!prefs.new_signin_alert}
                        onChange={() => toggle('new_signin_alert')}
                        label="New sign-in alert"
                        description="Get notified when a new device signs into your account."
                    />
                    <Toggle
                        checked={!!prefs.third_party_access_alert}
                        onChange={() => toggle('third_party_access_alert')}
                        label="Third-party access alert"
                        description="Get notified when a third-party app accesses your data."
                    />
                    <Toggle
                        checked={!!prefs.newsletter_subscription}
                        onChange={() => toggle('newsletter_subscription')}
                        label="Newsletter & product updates"
                        description="Occasional emails about new features and tips."
                    />
                </div>
            )}

            <SaveButton loading={saving} saved={saved} onClick={handleSave} disabled={!prefs} />
        </div>
    );
}

// ─── Security Tab ───────────────────────────────────────────────────────────────
function SecurityTab() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(null);
    const [error, setError] = useState('');

    const fetchSites = useCallback(async () => {
        try {
            const res = await axios.get('/api/settings/authorized-websites');
            setSites(res.data?.data || res.data || []);
        } catch {
            setError('Could not load authorized websites.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSites(); }, [fetchSites]);

    const handleRevoke = async (id) => {
        setRevoking(id);
        try {
            await axios.post(`/api/settings/authorized-websites/${id}/revoke`);
            setSites(s => s.filter(site => site.id !== id));
        } catch {
            setError('Failed to revoke access.');
        } finally {
            setRevoking(null);
        }
    };

    return (
        <div className="space-y-6 max-w-lg">
            <SectionTitle>Security</SectionTitle>

            {/* Auth method */}
            <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Authentication</p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <Shield size={16} className="text-gray-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Email &amp; Password</p>
                        <p className="text-xs text-gray-500">Your account is secured with email and password.</p>
                    </div>
                    <span className="ml-auto text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                </div>
            </div>

            {/* Authorized websites */}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Authorized websites</p>
                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                    </div>
                ) : sites.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                        <Globe size={20} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No authorized websites.</p>
                        <p className="text-xs text-gray-400 mt-1">Websites that access your tasks via shared links will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                        {sites.map(site => (
                            <div key={site.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Globe size={14} className="text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-800 truncate">{site.domain || site.origin}</p>
                                        {site.last_accessed_at && (
                                            <p className="text-xs text-gray-400">
                                                Last used {new Date(site.last_accessed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRevoke(site.id)}
                                    disabled={revoking === site.id}
                                    className="ml-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Revoke access"
                                >
                                    {revoking === site.id
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <Trash2 size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────────
const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: '₹0',
        period: 'Free forever',
        features: ['1 workspace', 'Up to 5 members', '100 tasks', 'Shared task links', 'Email support'],
        current: true,
        cta: 'Current plan',
    },
    {
        id: 'team',
        name: 'Team',
        price: '₹399',
        period: 'per user / month',
        features: ['Unlimited workspaces', 'Unlimited members', 'Unlimited tasks', 'Call logging', 'Priority support', 'Custom integrations'],
        current: false,
        cta: 'Upgrade to Team',
        highlight: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        period: 'Contact us',
        features: ['Everything in Team', 'SSO / SAML', 'Audit logs', 'SLA guarantee', 'Dedicated success manager'],
        current: false,
        cta: 'Contact sales',
    },
];

function BillingTab() {
    return (
        <div className="space-y-6">
            <SectionTitle>Billing & plan</SectionTitle>

            {/* Current plan banner */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Current plan</p>
                    <p className="text-sm font-semibold text-gray-900">Starter — Free</p>
                    <p className="text-xs text-gray-500 mt-0.5">No billing cycle. Free forever.</p>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">Active</span>
            </div>

            {/* Stripe not yet available notice */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <span className="text-amber-600 shrink-0 mt-0.5">ℹ</span>
                <p className="text-amber-800">
                    Paid plans are coming soon. Upgrade buttons are disabled until the billing portal is ready.
                </p>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                    <div key={plan.id} className={`rounded-xl border p-5 flex flex-col gap-4 ${plan.highlight ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-200'}`}>
                        {plan.highlight && (
                            <span className="self-start text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Most popular</span>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</p>
                            <p className="text-xs text-gray-500">{plan.period}</p>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                            {plan.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                                    <Check size={12} className="mt-0.5 text-green-500 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={plan.current || plan.id !== 'enterprise'}
                            className={`py-2 text-sm font-semibold rounded-xl transition-colors ${
                                plan.current
                                    ? 'bg-gray-100 text-gray-400 cursor-default'
                                    : plan.highlight
                                        ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {plan.current ? (
                                <span className="flex items-center justify-center gap-1"><Check size={13} /> {plan.cta}</span>
                            ) : plan.cta}
                        </button>
                    </div>
                ))}
            </div>

            {/* Invoices placeholder */}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Invoices</p>
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                    <CreditCard size={20} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No invoices yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Invoices will appear here once you upgrade to a paid plan.</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main SettingsPage ──────────────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    const tabContent = {
        profile:       <ProfileTab />,
        workspace:     <WorkspaceTab />,
        team:          <TeamTab />,
        notifications: <NotificationsTab />,
        security:      <SecurityTab />,
        billing:       <BillingTab />,
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <nav className="w-44 shrink-0 space-y-0.5">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                activeTab === tab.id
                                    ? 'bg-red-50 text-red-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <tab.icon size={15} className={activeTab === tab.id ? 'text-red-600' : 'text-gray-400'} />
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight size={13} className="ml-auto text-red-400" />}
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0 border-l border-gray-100 pl-6">
                    {tabContent[activeTab]}
                </div>
            </div>
        </div>
    );
}
