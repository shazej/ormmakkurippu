import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const AuthProvider = ({ children }) => {
    const [user, setUser]               = useState(null);
    const [token, setToken]             = useState(null);
    const [loading, setLoading]         = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError]     = useState(null);

    // Validate stored session on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            if (!storedToken) {
                setLoading(false);
                return;
            }

            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            try {
                const res = await axios.get(`${API}/api/users/me`);
                if (res.data?.success && res.data?.data) {
                    setUser(res.data.data);
                    setToken(storedToken);
                    localStorage.setItem('auth_user', JSON.stringify(res.data.data));
                } else {
                    _clearAuthState();
                }
            } catch (_) {
                // 401 / network error — clear stale session
                _clearAuthState();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const _clearAuthState = () => {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const _applyAuth = (userData, tokenValue) => {
        setToken(tokenValue);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`;
        localStorage.setItem('auth_token', tokenValue);
        localStorage.setItem('auth_user', JSON.stringify(userData));
    };

    // Google OAuth login (auth-code flow → server exchange)
    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            setAuthLoading(true);
            setAuthError(null);
            try {
                const res = await axios.post(`${API}/api/auth/google`, { code: codeResponse.code });
                const { user: userData, tokens } = res.data?.data || res.data;
                _applyAuth(userData, tokens.id_token);
            } catch (error) {
                const msg = error.response?.data?.message || 'Google sign-in failed. Please try again.';
                setAuthError(msg);
                console.error('Google Login Failed:', error);
            } finally {
                setAuthLoading(false);
            }
        },
        onError: (err) => {
            // popup_closed_by_user is a normal user action — don't show error
            if (err?.type !== 'popup_closed_by_user') {
                setAuthError('Google sign-in failed. Please try again.');
            }
            setAuthLoading(false);
        },
    });

    // Email/password login
    const loginWithPassword = async (email, password) => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await axios.post(`${API}/api/auth/login`, { email, password });
            const { user: userData, token: jwtToken } = res.data?.data || res.data;
            _applyAuth(userData, jwtToken);
            return { success: true };
        } catch (error) {
            const msg  = error.response?.data?.message || 'Login failed. Please check your credentials.';
            const code = error.response?.data?.code;
            setAuthError(msg);
            return { success: false, message: msg, code };
        } finally {
            setAuthLoading(false);
        }
    };

    // Email/password signup
    const signupWithPassword = async (name, email, password, confirmPassword) => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await axios.post(`${API}/api/auth/signup`, { name, email, password, confirmPassword });
            const { user: userData, token: jwtToken } = res.data?.data || res.data;
            _applyAuth(userData, jwtToken);
            return { success: true };
        } catch (error) {
            const msg  = error.response?.data?.message || 'Signup failed. Please try again.';
            const code = error.response?.data?.code;
            setAuthError(msg);
            return { success: false, message: msg, code };
        } finally {
            setAuthLoading(false);
        }
    };

    // Check what auth provider an email uses (for conditional login UI)
    const checkProvider = async (email) => {
        try {
            const res = await axios.get(`${API}/api/auth/check-provider`, { params: { email } });
            return res.data?.data ?? { exists: false, provider: null };
        } catch (_) {
            return { exists: false, provider: null };
        }
    };

    const logout = useCallback(async () => {
        // Always clear client-side state regardless of server response
        try {
            // Fire-and-forget — server clears session cookie and logs event
            await axios.post(`${API}/api/auth/logout`).catch(() => {});
        } finally {
            googleLogout();
            _clearAuthState();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshUser = async () => {
        try {
            const res = await axios.get(`${API}/api/users/me`);
            if (res.data?.success && res.data?.data) {
                setUser(res.data.data);
                localStorage.setItem('auth_user', JSON.stringify(res.data.data));
            }
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            authLoading,
            authError,
            setAuthError,
            login,
            loginWithPassword,
            signupWithPassword,
            checkProvider,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
