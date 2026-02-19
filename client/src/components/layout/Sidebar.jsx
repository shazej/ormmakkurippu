import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Inbox,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Search,
    Plus,
    LogOut,
    Hash,
    ChevronDown,
    X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/app', label: 'Inbox', icon: <Inbox size={20} />, exact: true },
        { path: '/app/today', label: 'Today', icon: <Calendar size={20} /> },
        { path: '/app/upcoming', label: 'Upcoming', icon: <CalendarDays size={20} /> },
        { path: '/app/completed', label: 'Completed', icon: <CheckCircle2 size={20} /> },
    ];

    const projects = [
        // Placeholder projects
        { id: 1, name: 'Personal', color: 'text-red-500' },
        { id: 2, name: 'Work', color: 'text-blue-500' },
        { id: 3, name: 'Shopping', color: 'text-green-500' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30
                w-72 bg-gray-50 border-r border-gray-200 
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}>
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                {user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{user?.name}</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="lg:hidden p-1 text-gray-500 hover:bg-gray-200 rounded">
                        <X size={20} />
                    </button>

                    <div className="hidden lg:flex gap-1 text-gray-400">
                        {/* Desktop only icons if needed */}
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

                    {/* Quick Actions */}
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-left">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            Add task
                        </button>
                        <button className="w-full flex items-center gap-3 px-2 py-1.5 text-gray-700 hover:bg-gray-200 rounded-md transition-colors text-left text-sm">
                            <Search size={20} className="text-gray-500" />
                            Search
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="space-y-0.5">
                        {navItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors
                                    ${isActive
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-200'}
                                `}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className={({ isActive }) => isActive ? 'text-blue-600' : 'text-gray-500'}>
                                    {item.icon}
                                </span>
                                {item.label}
                                {item.label === 'Inbox' && (
                                    <span className="ml-auto text-xs text-gray-400">4</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Projects */}
                    <div>
                        <div className="flex items-center justify-between px-2 py-1 text-gray-500 hover:text-gray-700 cursor-pointer group">
                            <h3 className="text-xs font-semibold uppercase tracking-wider">My Projects</h3>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Plus size={14} className="hover:bg-gray-200 rounded" />
                                <ChevronDown size={14} className="hover:bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="mt-1 space-y-0.5">
                            {projects.map(project => (
                                <Link
                                    key={project.id}
                                    to={`/app/project/${project.id}`}
                                    className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <Hash size={18} className={project.color} />
                                    {project.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={18} />
                        Log out
                    </button>
                </div>
            </aside>
        </>
    );
}
