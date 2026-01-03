import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));

    useEffect(() => {
        if (token) {
            // Restore user session if token exists (optional: verify token with backend)
            // For simplicity, we just assume logged in if token exists, or fetch profile
            // fetchUserProfile(token);
            // Decoding JWT on client side or checking storage for user info
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) setUser(JSON.parse(storedUser));
        }
    }, [token]);

    const login = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
        onSuccess: async (codeResponse) => {
            try {
                const { code } = codeResponse;
                const res = await axios.post('/api/auth/google', { code });

                const { user: userData, tokens } = res.data;

                // We use the ID Token as our session bearer for backend requests
                const idToken = tokens.id_token;

                setToken(idToken);
                setUser(userData);

                localStorage.setItem('auth_token', idToken);
                localStorage.setItem('auth_user', JSON.stringify(userData));
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

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
