import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

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

    // ... login logic ...

    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            try {
                const { code } = codeResponse;
                // Use full URL to avoid proxy issues during dev if needed, or rely on proxy
                const res = await axios.post('http://localhost:4000/api/auth/google', { code });

                const { user: userData, tokens } = res.data;

                // We use the ID Token as our session bearer for backend requests
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
        googleLogout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const refreshUser = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/users/me');
            if (res.data.success) {
                setUser(res.data.data);
                localStorage.setItem('auth_user', JSON.stringify(res.data.data));
            }
        } catch (error) {
            console.error("Failed to refresh user", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
