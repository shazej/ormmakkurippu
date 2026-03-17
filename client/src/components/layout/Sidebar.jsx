/**
 * Sidebar — dark-themed navigation panel
 * Design principles: compact, dense, scannable (Todoist/Linear-inspired)
 */
import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Inbox, Sun, CalendarDays, Phone, CheckSquare, UserCheck,
    Users, LayoutGrid, Settings, Plus, Search, LogOut,
    ChevronDown, ChevronRight, X, FolderPlus,
} from 'lucide-react';

function SectionLabel({ children }) {
    return (
        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
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
    isOpen,
    onClose,
    onOpenCreateTask,
    onOpenCreateProject,
    onOpenCreateFolder,
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projectsOpen, setProjectsOpen] = useState(true);
    const [searchOpen, setSearchOpen]     = useState(false);

    const mobile = () => { if (window.innerWidth < 1024) onClose(); };
    const handleLogout = () => { logout(); navigate('/'); };

    const projects = [
        { id: 1, name: 'Personal',   color: 'bg-red-500'   },
        { id: 2, name: 'Work',       color: 'bg-blue-500'  },
        { id: 3, name: 'Follow-ups', color: 'bg-amber-500' },
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
            )}

            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-gray-900 flex flex-col h-screen shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800 min-h-[52px]">
                    <button className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-gray-800 rounded-lg px-1.5 py-1 transition-colors text-left">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full shrink-0 object-cover" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {(user?.name || 'U')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.display_name || user?.name || 'My Workspace'}</p>
                            <p className="text-[10px] text-gray-500 leading-tight">Free plan</p>
                        </div>
                    </button>
                    <button onClick={onClose} className="lg:hidden p-1 text-gray-600 hover:text-gray-300 rounded ml-1 shrink-0"><X size={15} /></button>
                </div>

                {/* Nav body */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="space-y-0.5 mb-2">
                        <button onClick={() => { onOpenCreateTask?.(); mobile(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
                            <span className="w-[18px] h-[18px] rounded-full border border-dashed border-gray-600 flex items-center justify-center shrink-0"><Plus size={10} /></span>
                            Add task
                        </button>
                        <button onClick={() => setSearchOpen(o => !o)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
                            <Search size={15} className="shrink-0" />
                            Search
                        </button>
                        {searchOpen && (
                            <div className="px-1 py-1">
                                <input autoFocus placeholder="Search tasks…" className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-1.5 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-gray-500" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-0.5">
                        <NavItem to="/app"          exact icon={<Inbox size={15} />}        label="Inbox"    badge="4" onClick={mobile} />
                        <NavItem to="/app/today"          icon={<Sun size={15} />}           label="Today"             onClick={mobile} />
                        <NavItem to="/app/upcoming"       icon={<CalendarDays size={15} />}  label="Upcoming"          onClick={mobile} />
                    </div>

                    <SectionLabel>Work</SectionLabel>
                    <div className="space-y-0.5">
                        <NavItem to="/app/calls"     icon={<Phone size={15} />}       label="Calls"          onClick={mobile} />
                        <NavItem to="/app/completed" icon={<CheckSquare size={15} />} label="Tasks"          onClick={mobile} />
                        <NavItem to="/app/assigned"  icon={<UserCheck size={15} />}   label="Assigned to me" onClick={mobile} />
                        <NavItem to="/app/contacts"  icon={<Users size={15} />}       label="Contacts"       onClick={mobile} />
                    </div>

                    <SectionLabel>Spaces</SectionLabel>
                    <div className="space-y-0.5">
                        <NavItem to="/app/workspaces" icon={<LayoutGrid size={15} />} label="Workspaces" onClick={mobile} />
                    </div>

                    <div className="mt-2">
                        <div className="flex items-center justify-between px-3 py-1.5">
                            <button onClick={() => setProjectsOpen(o => !o)} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors">
                                {projectsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                Projects
                            </button>
                            <div className="flex gap-0.5">
                                <button title="New folder" onClick={() => onOpenCreateFolder?.()} className="p-1 text-gray-600 hover:text-gray-400 rounded transition-colors"><FolderPlus size={12} /></button>
                                <button title="New project" onClick={() => onOpenCreateProject?.()} className="p-1 text-gray-600 hover:text-gray-400 rounded transition-colors"><Plus size={12} /></button>
                            </div>
                        </div>

                        {projectsOpen && (
                            <div className="space-y-0.5">
                                {projects.map(p => (
                                    <Link key={p.id} to={`/app/project/${p.id}`} onClick={mobile} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
                                        <span className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${p.color}`} />
                                        <span className="truncate">{p.name}</span>
                                    </Link>
                                ))}
                                <button onClick={() => onOpenCreateProject?.()} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors">
                                    <Plus size={12} />
                                    Add project
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-800 px-2 py-2 space-y-0.5">
                    <NavItem to="/app/settings" icon={<Settings size={15} />} label="Settings" onClick={mobile} />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors">
                        <LogOut size={15} className="shrink-0" />
                        Log out
                    </button>
                </div>
            </aside>
        </>
    );
}
