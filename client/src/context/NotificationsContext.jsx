import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

const POLL_INTERVAL = parseInt(import.meta.env.VITE_NOTIFICATIONS_POLL_INTERVAL_MS || '30000', 10);

export function NotificationsProvider({ children }) {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);

    const loadNotifications = useCallback(async () => {
        if (!user || !token) return;
        try {
            setLoading(true);
            setError(null);
            const result = await fetchNotifications({ limit: 30 });
            setNotifications(result.notifications || []);
            setUnreadCount(result.unreadCount ?? 0);
        } catch (err) {
            console.error('[Notifications] Failed to load:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    const refreshUnreadCount = useCallback(async () => {
        if (!user || !token) return;
        try {
            const count = await fetchUnreadCount();
            setUnreadCount(count);
        } catch {
            // Silent fail for polling
        }
    }, [user, token]);

    const markRead = useCallback(async (id) => {
        try {
            // Only decrement if the notification was actually unread
            const wasUnread = notifications.find(n => n.id === id && !n.is_read);
            await markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('[Notifications] Failed to mark read:', err);
        }
    }, [notifications]);

    const markAllRead = useCallback(async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (err) {
            console.error('[Notifications] Failed to mark all read:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        if (user && token) {
            loadNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, token, loadNotifications]);

    // Polling for unread count
    useEffect(() => {
        if (!user || !token) return;

        pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [user, token, refreshUnreadCount]);

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            error,
            loadNotifications,
            markRead,
            markAllRead,
            refreshUnreadCount,
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}
