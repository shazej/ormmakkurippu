import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const BASE = `${API}/api/notifications`;

export async function fetchNotifications({ page = 1, limit = 30, unreadOnly = false } = {}) {
    const params = { page, limit };
    if (unreadOnly) params.unread_only = 'true';
    const res = await axios.get(BASE, { params });
    return res.data?.data || res.data;
}

export async function fetchUnreadCount() {
    const res = await axios.get(`${BASE}/unread-count`);
    const data = res.data?.data || res.data;
    return data.unreadCount ?? 0;
}

export async function markNotificationRead(id) {
    const res = await axios.post(`${BASE}/${id}/read`);
    return res.data?.data || res.data;
}

export async function markAllNotificationsRead() {
    const res = await axios.post(`${BASE}/read-all`);
    return res.data?.data || res.data;
}

export async function fetchNotificationPreferences() {
    const res = await axios.get(`${BASE}/preferences`);
    return res.data?.data || res.data;
}

export async function updateNotificationPreferences(prefs) {
    const res = await axios.patch(`${BASE}/preferences`, prefs);
    return res.data?.data || res.data;
}
