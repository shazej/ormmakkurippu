import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx'
import './index.css'

// GoogleOAuthProvider must ALWAYS wrap the app because useGoogleLogin() hook
// is called unconditionally in AuthContext — removing the provider crashes React.
// In demo mode we just never call login(), so the placeholder clientId is fine.
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "DEMO_PLACEHOLDER";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <GoogleOAuthProvider clientId={clientId}>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
