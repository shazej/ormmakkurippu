import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const DEMO_AUTH = import.meta.env.VITE_DEMO_AUTH === 'true';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Always fetch fresh from server — localStorage may have stale is_onboarded=false
            axios.get(`${API}/api/users/me`)
                .then(res => {
                    const profile = res.data?.data || res.data;
                    if (profile?.id || profile?.primary_email_id) {
                        setUser(profile);
                        localStorage.setItem('auth_user', JSON.stringify(profile));
                    } else {
                        // Fix for 204 or unexpected success with no user
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        delete axios.defaults.headers.common['Authorization'];
                    }
                })
                .catch(() => {
                    // Token invalid — clear it
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    delete axios.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    // ── Demo Login (DEMO_AUTH=true only) ──────────────────────────────────────
    const demoLogin = async (email) => {
        try {
            // Always clear stale session first so old is_onboarded=false can't interfere
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            delete axios.defaults.headers.common['Authorization'];

            const res = await axios.post(`${API}/api/auth/demo-login`, { email });
            const { token: newToken, user: userData } = res.data;

            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            localStorage.setItem('auth_token', newToken);

            // Fetch full profile
            let profile = userData;
            try {
                const meRes = await axios.get(`${API}/api/users/me`);
                if (meRes.data?.success) profile = meRes.data.data;
            } catch { /* use profile from login response */ }

            setUser(profile);
            localStorage.setItem('auth_user', JSON.stringify(profile));

            if (profile.is_onboarded) {
                navigate('/app');
            } else {
                navigate('/onboarding');
            }
        } catch (error) {
            const msg = error?.response?.data?.error || 'Demo login failed. Please try again.';
            console.error('[DEMO_AUTH] demoLogin error:', error);
            alert(msg);
        }
    };

    // ── Google Login (DEMO_AUTH=false only) ────────────────────────────────
    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            try {
                const { code } = codeResponse;
                const res = await axios.post(`${API}/api/auth/google`, { code });

                const { user: userData, tokens } = res.data;
                const idToken = tokens.id_token;

                setToken(idToken);
                setUser(userData);

                localStorage.setItem('auth_token', idToken);
                localStorage.setItem('auth_user', JSON.stringify(userData));

                if (userData.is_onboarded) {
                    navigate('/app');
                } else {
                    navigate('/onboarding');
                }
            } catch (error) {
                console.error('Login Failed:', error);
                alert('Login failed. Please try again.');
            }
        },
        onError: errorResponse => console.error('Login Error:', errorResponse),
    });

    const logout = () => {
        if (!DEMO_AUTH) googleLogout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            const res = await axios.get(`${API}/api/users/me`);
            if (res.data.success) {
                setUser(res.data.data);
                localStorage.setItem('auth_user', JSON.stringify(res.data.data));
            }
        } catch (error) {
            console.error("Failed to refresh user", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, demoLogin, logout, loading, refreshUser, isDemoAuth: DEMO_AUTH }}>
            {children}
        </AuthContext.Provider>
    );
};
