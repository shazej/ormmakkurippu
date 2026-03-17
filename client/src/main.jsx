import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * TODO[google-auth]: When re-enabling Google OAuth:
 *   1. Set VITE_ENABLE_GOOGLE_AUTH=true in client/.env
 *   2. Set VITE_GOOGLE_CLIENT_ID=<your-client-id> in client/.env
 *   3. Restore: import { GoogleOAuthProvider } from '@react-oauth/google';
 *   4. Wrap <App /> with <GoogleOAuthProvider clientId={...}>
 */

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
