import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, UserPlus, FileText, CreditCard, Save } from 'lucide-react';
import { fetchNotificationPreferences, updateNotificationPreferences } from '../api/notifications';

const PREF_GROUPS = [
    {
        label: 'Channels',
        items: [
            { key: 'in_app_enabled', label: 'In-app notifications', desc: 'Show notifications inside the app', icon: Bell },
            { key: 'email_enabled', label: 'Email notifications', desc: 'Receive important notifications by email', icon: Mail },
        ],
    },
    {
        label: 'Notification Types',
        items: [
            { key: 'task_due_enabled', label: 'Task due reminders', desc: 'Notify when tasks are due soon or overdue', icon: Clock },
            { key: 'task_assigned_enabled', label: 'Task assignments', desc: 'Notify when a task is assigned to you', icon: UserPlus },
            { key: 'shared_task_updates_enabled', label: 'Shared task updates', desc: 'Notify when a shared task is updated', icon: FileText },
            { key: 'subscription_alerts_enabled', label: 'Subscription alerts', desc: 'Billing and subscription notifications', icon: CreditCard },
        ],
    },
];

export default function NotificationPreferences() {
    const [prefs, setPrefs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPrefs();
    }, []);

    const loadPrefs = async () => {
        try {
            setLoading(true);
            const data = await fetchNotificationPreferences();
            setPrefs(data);
        } catch (err) {
            setError('Failed to load notification preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        setMessage(null);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            setError(null);
            const { id, user_id, created_at, updated_at, ...toSave } = prefs;
            await updateNotificationPreferences(toSave);
            setMessage('Notification preferences saved');
        } catch (err) {
            setError('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm mt-2">Loading preferences...</p>
            </div>
        );
    }

    if (error && !prefs) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={loadPrefs} className="text-sm text-blue-600 mt-2 hover:underline">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <Save size={16} /> {message}
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {PREF_GROUPS.map((group) => (
                <div key={group.label}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.label}</h3>
                    <div className="space-y-1 border border-gray-100 rounded-xl overflow-hidden">
                        {group.items.map(({ key, label, desc, icon: Icon }) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-400">
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{label}</p>
                                        <p className="text-xs text-gray-500">{desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle(key)}
                                    className={`relative w-10 h-6 rounded-full transition-colors ${
                                        prefs[key] ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                    role="switch"
                                    aria-checked={prefs[key]}
                                    aria-label={label}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            prefs[key] ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Preferences'}
            </button>
        </div>
    );
}
