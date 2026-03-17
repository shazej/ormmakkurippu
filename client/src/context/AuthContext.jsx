import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser]           = useState(null);
    const [token, setToken]         = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading]     = useState(true);
    // Separate state: true only while the OAuth code exchange is in flight
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
        setLoading(false);
    }, [token]);

    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            setAuthLoading(true);
            try {
                const { code } = codeResponse;
                const res = await axios.post('http://localhost:4000/api/auth/google', { code });
                const { user: userData, tokens } = res.data;
                const idToken = tokens.id_token;

                axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
                setToken(idToken);
                setUser(userData);
                localStorage.setItem('auth_token', idToken);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                // Navigation is handled by LoginPage's useEffect watching `user`
            } catch (error) {
                console.error('Login Failed:', error);
            } finally {
                setAuthLoading(false);
            }
        },
        onError: (err) => {
            console.error('Google Login Error:', err);
            setAuthLoading(false);
        },
    });

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const refreshUser = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/users/me');
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
        <AuthContext.Provider value={{ user, token, login, logout, loading, authLoading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
