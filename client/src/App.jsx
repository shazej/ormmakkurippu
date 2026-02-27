import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProjectsProvider } from './context/ProjectsContext';
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import CallsPage from './pages/CallsPage';
import AssignedToMePage from './pages/AssignedToMePage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import ProjectPage from './pages/ProjectPage';
import SettingsDataPage from './pages/SettingsDataPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import WelcomeStep from './pages/onboarding/WelcomeStep';
import LoginPage from './pages/LoginPage';
import { useLocation } from 'react-router-dom';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught:', error.message, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fff0f0', minHeight: '100vh' }}>
                    <h2 style={{ color: '#c00' }}>⚠️ App Crashed</h2>
                    <p><strong>{this.state.error?.name}:</strong> {this.state.error?.message}</p>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '1rem', background: '#fff', padding: '1rem', border: '1px solid #fcc', borderRadius: '6px', overflow: 'auto' }}>
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/login'; }}
                        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Go to Login
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    // Enforce onboarding (allow welcome step even if not onboarded)
    if (!user.is_onboarded && !location.pathname.startsWith('/onboarding') && location.pathname !== '/app/onboard/welcome') {
        return <Navigate to="/onboarding" replace />;
    }

    // Skip onboarding if already done
    if (user.is_onboarded && location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/app" replace />;
    }

    return children;
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<MarketingLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>

            <Route path="/onboarding" element={
                <ProtectedRoute><OnboardingWizard /></ProtectedRoute>
            } />

            <Route path="/app" element={
                <ProtectedRoute>
                    <ProjectsProvider>
                        <AppLayout />
                    </ProjectsProvider>
                </ProtectedRoute>
            }>
                <Route index element={<HomePage />} />
                <Route path="today" element={<HomePage />} />
                <Route path="upcoming" element={<HomePage />} />
                <Route path="completed" element={<HomePage />} />
                <Route path="projects/:id" element={<ProjectPage />} />
                <Route path="calls" element={<CallsPage />} />
                <Route path="assigned" element={<AssignedToMePage />} />
                <Route path="tasks/:id" element={<TaskDetailsPage />} />
                <Route path="settings/data" element={<SettingsDataPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="onboard/welcome" element={<WelcomeStep />} />
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
    return (
        <ErrorBoundary>
            <AppRoutes />
        </ErrorBoundary>
    );
}

export default App;
