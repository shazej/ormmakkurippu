import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, UserPlus, FileText, CreditCard } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';

const TYPE_ICONS = {
    TASK_DUE_REMINDER: Clock,
    TASK_ASSIGNED: UserPlus,
    SHARED_TASK_UPDATE: FileText,
    SUBSCRIPTION_ALERT: CreditCard,
};

const TYPE_COLORS = {
    TASK_DUE_REMINDER: 'text-amber-500',
    TASK_ASSIGNED: 'text-blue-500',
    SHARED_TASK_UPDATE: 'text-purple-500',
    SUBSCRIPTION_ALERT: 'text-green-500',
};

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationBell() {
    const { notifications, unreadCount, loading, error, markRead, markAllRead, loadNotifications } = useNotifications();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    const handleToggle = () => {
        if (!open) loadNotifications();
        setOpen(o => !o);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markRead(notification.id);
        }
        if (notification.link_url) {
            navigate(notification.link_url);
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-xs text-gray-400 mt-2">Loading...</p>
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-red-500">{error}</p>
                                <button onClick={loadNotifications} className="text-xs text-blue-600 mt-2 hover:underline">
                                    Retry
                                </button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={28} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No notifications yet</p>
                                <p className="text-xs text-gray-300 mt-1">You'll see updates here</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const Icon = TYPE_ICONS[n.type] || Bell;
                                const iconColor = TYPE_COLORS[n.type] || 'text-gray-400';

                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                                            !n.is_read ? 'bg-blue-50/40' : ''
                                        }`}
                                    >
                                        <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.is_read && (
                                            <div className="shrink-0 mt-1.5">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
