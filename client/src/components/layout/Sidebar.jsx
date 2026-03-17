import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Inbox, Calendar, CalendarDays, CheckCircle2,
    Phone, Users, Building2, Settings, LogOut,
    Plus, Search, Hash, ChevronDown, ChevronRight,
    FolderPlus, UserCheck, X
} from 'lucide-react';

function SectionLabel({ children }) {
    return (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            {children}
        </p>
    );
}

function NavItem({ to, icon, label, badge, exact, onClick }) {
    return (
        <NavLink
            to={to}
            end={exact}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                        ? 'bg-gray-700/70 text-white font-medium'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
            }
        >
            <span className="shrink-0">{icon}</span>
            <span className="flex-1 truncate">{label}</span>
            {badge != null && (
                <span className="text-[11px] text-gray-500 tabular-nums">{badge}</span>
            )}
        </NavLink>
    );
}

export default function Sidebar({
    isOpen, onClose,
    onOpenCreateTask, onOpenCreateProject, onOpenCreateFolder,
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projectsOpen, setProjectsOpen] = useState(true);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const close = () => { if (window.innerWidth < 1024) onClose(); };

    const initials = (user?.display_name || user?.name || user?.email || 'U')
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30 w-60 bg-gray-900
                flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* User header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {user?.photo_url || user?.picture ? (
                            <img
                                src={user.photo_url || user.picture}
                                alt="avatar"
                                className="w-7 h-7 rounded-full shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate leading-tight">
                                {user?.display_name || user?.name || 'You'}
                            </p>
                            <p className="text-[10px] text-gray-500">Free plan</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-600 hover:text-gray-400 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>

                {/* Quick actions */}
                <div className="px-3 py-2 border-b border-gray-800 space-y-1">
                    <button
                        onClick={() => { onOpenCreateTask?.(); close(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                    >
                        <div className="w-4 h-4 rounded-full border border-dashed border-gray-500 flex items-center justify-center">
                            <Plus size={10} />
                        </div>
                        <span className="flex-1 text-left">Add task</span>
                    </button>

                    {searchExpanded ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                            <Search size={13} className="text-gray-400 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search…"
                                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                                onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
                            />
                            <button onClick={() => { setSearchExpanded(false); setSearchQuery(''); }}>
                                <X size={12} className="text-gray-600" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setSearchExpanded(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                        >
                            <Search size={15} />
                            Search
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
                    <SectionLabel>Main</SectionLabel>
                    <NavItem to="/app"       exact icon={<Inbox       size={15} />} label="Inbox"       badge={4} onClick={close} />
                    <NavItem to="/app/today"    icon={<Calendar      size={15} />} label="Today"       onClick={close} />
                    <NavItem to="/app/upcoming" icon={<CalendarDays  size={15} />} label="Upcoming"    onClick={close} />

                    <SectionLabel>Work</SectionLabel>
                    <NavItem to="/app/calls"     icon={<Phone         size={15} />} label="Calls"       onClick={close} />
                    <NavItem to="/app/completed" icon={<CheckCircle2  size={15} />} label="Tasks"       onClick={close} />
                    <NavItem to="/app/assigned"  icon={<UserCheck     size={15} />} label="Assigned to me" onClick={close} />
                    <NavItem to="/app/contacts"  icon={<Users         size={15} />} label="Contacts"    onClick={close} />

                    <SectionLabel>Spaces</SectionLabel>
                    <NavItem to="/app/workspaces" icon={<Building2 size={15} />} label="Workspaces" onClick={close} />

                    {/* Projects collapsible */}
                    <div className="pt-1">
                        <div className="flex items-center justify-between px-3 py-1 group">
                            <button
                                onClick={() => setProjectsOpen(o => !o)}
                                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-300"
                            >
                                {projectsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                Projects
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { onOpenCreateFolder?.(); close(); }}
                                    className="p-0.5 text-gray-600 hover:text-gray-300 rounded"
                                    title="New folder"
                                >
                                    <FolderPlus size={12} />
                                </button>
                                <button
                                    onClick={() => { onOpenCreateProject?.(); close(); }}
                                    className="p-0.5 text-gray-600 hover:text-gray-300 rounded"
                                    title="New project"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                        {projectsOpen && (
                            <div className="space-y-0.5 mt-0.5">
                                <NavItem to="/app/project/1" icon={<Hash size={13} className="text-red-400" />}  label="Personal"  onClick={close} />
                                <NavItem to="/app/project/2" icon={<Hash size={13} className="text-blue-400" />} label="Work"      onClick={close} />
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-t border-gray-800 space-y-0.5">
                    <NavItem to="/app/settings" icon={<Settings size={15} />} label="Settings" onClick={close} />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={15} />
                        Log out
                    </button>
                </div>
            </aside>
        </>
    );
}
