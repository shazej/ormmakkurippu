import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Users, Loader2, Crown, UserCog, User, Eye, CheckCircle2 } from 'lucide-react';

const ROLE_ICON = {
    OWNER:  Crown,
    ADMIN:  UserCog,
    MEMBER: User,
    GUEST:  Eye,
};

const ROLE_LABEL = {
    OWNER:  'Owner',
    ADMIN:  'Admin',
    MEMBER: 'Member',
    GUEST:  'Viewer',
};

const STATUS_STYLE = {
    ACTIVE:   'bg-green-50 text-green-700',
    PENDING:  'bg-amber-50 text-amber-700',
    DECLINED: 'bg-red-50 text-red-600',
};

function initials(name) {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function WorkspacesPage() {
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/workspaces/current')
            .then(res => setWorkspace(res.data?.data || res.data))
            .catch(() => setError('Could not load workspace.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
    );

    if (error) return (
        <div className="text-center py-20 text-sm text-red-600">{error}</div>
    );

    const members = workspace?.members || [];

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-900 mb-6">Workspace</h1>

            {/* Workspace card */}
            <div className="rounded-2xl border border-gray-200 p-5 mb-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                    <Building2 size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{workspace?.name || 'My Workspace'}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users size={11} />
                            {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                            Plan: <span className="font-medium text-gray-700">{workspace?.plan || 'Free'}</span>
                        </span>
                        {workspace?.created_at && (
                            <span className="text-xs text-gray-400">
                                Created {new Date(workspace.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Members */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Members</h3>
                    <span className="text-xs text-gray-400">{members.length} total</span>
                </div>

                {members.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
                        <Users size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No members yet. Invite someone from Settings → Team.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                        {members.map(m => {
                            const RoleIcon = ROLE_ICON[m.role] ?? User;
                            return (
                                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                        {initials(m.user?.display_name || m.user?.email)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {m.user?.display_name || m.user?.email}
                                        </p>
                                        {m.user?.display_name && (
                                            <p className="text-xs text-gray-400 truncate">{m.user?.email}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {m.status?.charAt(0) + (m.status?.slice(1) || '').toLowerCase()}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <RoleIcon size={11} />
                                            {ROLE_LABEL[m.role] ?? m.role}
                                        </span>
                                        {m.status === 'ACTIVE' && <CheckCircle2 size={13} className="text-green-500" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <p className="mt-6 text-xs text-gray-400">
                To invite new members or change roles, go to{' '}
                <a href="/app/settings" className="text-red-600 hover:underline">Settings → Team</a>.
            </p>
        </div>
    );
}
