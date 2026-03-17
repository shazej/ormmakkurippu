/**
 * TaskSharePanel
 *
 * Authenticated UI for managing share links on a task.
 * Designed to be embedded in TaskDetailsPage.
 *
 * Capabilities:
 *   - Create a share link (with expiry choice)
 *   - List existing links (active + revoked, for audit)
 *   - Copy a link URL to clipboard
 *   - Revoke an active link
 *
 * The panel is self-contained: it makes its own API calls and handles
 * all loading/error states internally. If the current user is not the
 * task owner the backend returns 403, which is handled gracefully.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const EXPIRY_OPTIONS = [
    { value: '1h',    label: '1 hour' },
    { value: '24h',   label: '24 hours' },
    { value: '7d',    label: '7 days' },
    { value: '30d',   label: '30 days' },
    { value: 'never', label: 'Never expires' },
];

function formatDate(iso) {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function isLinkActive(link) {
    if (link.revokedAt) return false;
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return false;
    return true;
}

// ── Copy to clipboard with visual feedback ────────────────────────────────────
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API may be unavailable in some contexts; fallback
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            title="Copy link"
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition shrink-0"
        >
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TaskSharePanel({ taskId }) {
    const [links, setLinks]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [creating, setCreating]   = useState(false);
    const [error, setError]         = useState(null);
    const [expiresIn, setExpiresIn] = useState('7d');
    // Track which token is mid-revocation to show per-row loading state
    const [revoking, setRevoking]   = useState(null);

    const fetchLinks = useCallback(async () => {
        try {
            setError(null);
            const { data } = await axios.get(`/api/tasks/${taskId}/shares`);
            setLinks(data.data ?? data);
        } catch (err) {
            const status = err.response?.status;
            if (status === 403) {
                // Not the owner — panel should not be shown at all, but handle gracefully
                setLinks(null);
            } else {
                setError('Failed to load share links.');
            }
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleCreate = async () => {
        try {
            setCreating(true);
            setError(null);
            const { data } = await axios.post(`/api/tasks/${taskId}/share`, { expiresIn });
            // Prepend the new link without re-fetching the whole list
            const newLink = data.data ?? data;
            setLinks(prev => [
                {
                    id:             newLink.id,
                    token:          newLink.token,
                    shareUrl:       newLink.shareUrl,
                    expiresAt:      newLink.expiresAt,
                    revokedAt:      null,
                    accessCount:    0,
                    lastAccessedAt: null,
                    createdAt:      newLink.createdAt,
                    isActive:       true
                },
                ...(prev || [])
            ]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create share link.');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (token) => {
        if (!window.confirm('Revoke this link? Anyone with it will lose access immediately.')) return;
        try {
            setRevoking(token);
            setError(null);
            await axios.delete(`/api/tasks/${taskId}/shares/${token}`);
            // Update the link in-place: mark as revoked without re-fetching
            setLinks(prev => prev.map(l =>
                l.token === token ? { ...l, revokedAt: new Date().toISOString(), isActive: false } : l
            ));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to revoke link.');
        } finally {
            setRevoking(null);
        }
    };

    // ── Not the owner ──────────────────────────────────────────────────────
    if (!loading && links === null) return null;

    // ── Loading skeleton ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse mb-4" />
                <div className="h-3 bg-gray-100 rounded w-48 animate-pulse" />
            </div>
        );
    }

    const activeLinks   = (links || []).filter(isLinkActive);
    const revokedLinks  = (links || []).filter(l => !isLinkActive(l));

    return (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Share links</h2>
                {activeLinks.length > 0 && (
                    <span className="text-xs text-gray-400">
                        {activeLinks.length} active
                    </span>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                </div>
            )}

            {/* Create new link */}
            <div className="flex items-center gap-2 flex-wrap">
                <select
                    value={expiresIn}
                    onChange={e => setExpiresIn(e.target.value)}
                    disabled={creating}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {EXPIRY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                >
                    {creating ? 'Creating…' : 'Create link'}
                </button>
            </div>

            {/* Active links */}
            {activeLinks.length > 0 && (
                <ul className="space-y-3">
                    {activeLinks.map(link => (
                        <li key={link.id} className="border border-gray-100 rounded-lg p-3 space-y-1.5">
                            {/* URL row */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-700 font-mono truncate flex-1 min-w-0">
                                    {link.shareUrl}
                                </span>
                                <CopyButton text={link.shareUrl} />
                                <button
                                    onClick={() => handleRevoke(link.token)}
                                    disabled={revoking === link.token}
                                    className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 transition shrink-0 disabled:opacity-50"
                                >
                                    {revoking === link.token ? 'Revoking…' : 'Revoke'}
                                </button>
                            </div>
                            {/* Metadata row */}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>Expires: {formatDate(link.expiresAt)}</span>
                                <span>·</span>
                                <span>{link.accessCount} view{link.accessCount !== 1 ? 's' : ''}</span>
                                {link.lastAccessedAt && (
                                    <>
                                        <span>·</span>
                                        <span>Last viewed {formatDate(link.lastAccessedAt)}</span>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Revoked links (collapsed, audit trail) */}
            {revokedLinks.length > 0 && (
                <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer select-none hover:text-gray-600">
                        {revokedLinks.length} revoked / expired link{revokedLinks.length !== 1 ? 's' : ''}
                    </summary>
                    <ul className="mt-2 space-y-1.5 pl-2 border-l border-gray-100">
                        {revokedLinks.map(link => (
                            <li key={link.id} className="text-gray-400 line-through">
                                {link.shareUrl}
                                <span className="no-underline ml-2">
                                    ({link.revokedAt ? 'revoked' : 'expired'})
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {/* Empty state */}
            {activeLinks.length === 0 && revokedLinks.length === 0 && (
                <p className="text-xs text-gray-400">No share links yet. Create one above.</p>
            )}
        </div>
    );
}
