import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const AuthProvider = ({ children }) => {
    const [user, setUser]               = useState(null);
    const [token, setToken]             = useState(() => localStorage.getItem('auth_token'));
    const [loading, setLoading]         = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError]     = useState(null);

    // Restore session on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser  = localStorage.getItem('auth_user');

            if (storedToken && storedUser) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                try {
                    // Validate token by fetching fresh user data
                    const res = await axios.get(`${API}/api/users/me`);
                    if (res.data.success) {
                        const freshUser = res.data.data;
                        setUser(freshUser);
                        setToken(storedToken);
                        localStorage.setItem('auth_user', JSON.stringify(freshUser));
                    } else {
                        clearAuthState();
                    }
                } catch (_) {
                    // Token is invalid/expired — clear state
                    clearAuthState();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const clearAuthState = () => {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const applyAuth = (userData, tokenValue) => {
        setToken(tokenValue);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`;
        localStorage.setItem('auth_token', tokenValue);
        localStorage.setItem('auth_user', JSON.stringify(userData));
    };

    // Google OAuth login
    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            setAuthLoading(true);
            setAuthError(null);
            try {
                const { code } = codeResponse;
                const res = await axios.post(`${API}/api/auth/google`, { code });
                const { user: userData, tokens } = res.data.data || res.data;
                const idToken = tokens.id_token;
                applyAuth(userData, idToken);
            } catch (error) {
                const msg = error.response?.data?.message || 'Google sign-in failed. Please try again.';
                setAuthError(msg);
                console.error('Google Login Failed:', error);
            } finally {
                setAuthLoading(false);
            }
        },
        onError: (err) => {
            setAuthError('Google sign-in was cancelled or failed.');
            setAuthLoading(false);
            console.error('Google Login Error:', err);
        },
    });

    // Email/password login
    const loginWithPassword = async (email, password) => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await axios.post(`${API}/api/auth/login`, { email, password });
            const { user: userData, token: jwtToken } = res.data.data || res.data;
            applyAuth(userData, jwtToken);
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
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
            const { user: userData, token: jwtToken } = res.data.data || res.data;
            applyAuth(userData, jwtToken);
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Signup failed. Please try again.';
            const code = error.response?.data?.code;
            setAuthError(msg);
            return { success: false, message: msg, code };
        } finally {
            setAuthLoading(false);
        }
    };

    // Check what auth provider an email uses
    const checkProvider = async (email) => {
        try {
            const res = await axios.get(`${API}/api/auth/check-provider`, { params: { email } });
            return res.data.data || res.data;
        } catch (_) {
            return { exists: false, provider: null };
        }
    };

    const logout = useCallback(async () => {
        try {
            if (token) {
                await axios.post(`${API}/api/auth/logout`).catch(() => {});
            }
        } finally {
            googleLogout();
            clearAuthState();
        }
    }, [token]);

    const refreshUser = async () => {
        try {
            const res = await axios.get(`${API}/api/users/me`);
            if (res.data.success) {
                const fresh = res.data.data;
                setUser(fresh);
                localStorage.setItem('auth_user', JSON.stringify(fresh));
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
