/**
 * AuthContext — supports email/password login (always enabled) and
 * Google OAuth (gated behind VITE_ENABLE_GOOGLE_AUTH=true).
 *
 * Token lifecycle:
 *  - On login/signup → JWT stored in localStorage + sent in Authorization header
 *  - On app mount    → token reloaded from localStorage, user refreshed from /api/users/me
 *  - On logout       → localStorage cleared, cookie cleared via POST /api/auth/logout
 *
 * TODO[google-auth]: When re-enabling Google, set VITE_ENABLE_GOOGLE_AUTH=true in .env
 *   and restore the useGoogleLogin() hook call below.
 */
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Feature flag — set VITE_ENABLE_GOOGLE_AUTH=true in client/.env to re-enable
export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

const API = '/api';   // proxied to http://localhost:4000 in dev (see vite.config.js)

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [token,   setToken]   = useState(() => localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    // ── hydrate on mount ──────────────────────────────────────────────────────
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Try to restore cached user immediately so UI doesn't flash
            const cached = localStorage.getItem('auth_user');
            if (cached) {
                try { setUser(JSON.parse(cached)); } catch {}
            }
            // Refresh from server to pick up any changes
            refreshUser().finally(() => setLoading(false));
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    // ── helpers ───────────────────────────────────────────────────────────────
    const _setSession = (userData, jwt) => {
        setToken(jwt);
        setUser(userData);
        localStorage.setItem('auth_token', jwt);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    };

    const _clearSession = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
    };

    // ── email/password login ──────────────────────────────────────────────────
    const login = useCallback(async ({ email, password }) => {
        const res = await axios.post(`${API}/auth/login`, { email, password });
        const { user: userData, token: jwt } = res.data.data;
        _setSession(userData, jwt);
        return userData;
    }, []);

    // ── email/password signup ─────────────────────────────────────────────────
    const signup = useCallback(async ({ name, email, password, confirm_password }) => {
        const res = await axios.post(`${API}/auth/signup`, { name, email, password, confirm_password });
        const { user: userData, token: jwt } = res.data.data;
        _setSession(userData, jwt);
        return userData;
    }, []);

    // ── logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        try { await axios.post(`${API}/auth/logout`); } catch {}
        _clearSession();
    }, []);

    // ── refresh user from server ──────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/users/me`);
            const userData = res.data?.data || res.data;
            if (userData?.id) {
                setUser(userData);
                localStorage.setItem('auth_user', JSON.stringify(userData));
            }
        } catch (err) {
            // Clear session if server says the token/user is invalid:
            //   401 → token expired or not recognised
            //   404 → user was deleted from DB but token still valid
            //   5xx → server error; better to force re-login than stay in a broken state
            const status = err.response?.status;
            if (status === 401 || status === 404 || status >= 500) {
                _clearSession();
            }
        }
    }, []);

    // ── TODO[google-auth] — restore useGoogleLogin() here ────────────────────
    // When GOOGLE_AUTH_ENABLED is true, add a `googleLogin` function that calls
    // POST /api/auth/google with { code } and then _setSession(userData, idToken).

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading, refreshUser, GOOGLE_AUTH_ENABLED }}>
            {children}
        </AuthContext.Provider>
    );
}
