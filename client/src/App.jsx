import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import CallsPage from './pages/CallsPage';
import AssignedToMePage from './pages/AssignedToMePage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import WelcomeStep from './pages/onboarding/WelcomeStep';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SharedTaskPage from './pages/SharedTaskPage';
import AuthLoadingScreen from './pages/AuthLoadingScreen';
import { useLocation } from 'react-router-dom';

// Redirects authenticated users away from guest-only pages
function GuestOnlyRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <AuthLoadingScreen />;
    if (user) return <Navigate to={user.is_onboarded ? '/app' : '/onboarding'} replace />;
    return children;
}

// Redirects unauthenticated users to login
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    // Enforce onboarding
    if (!user.is_onboarded && !location.pathname.startsWith('/onboarding') && location.pathname !== '/app/onboard/welcome') {
        return <Navigate to="/onboarding" replace />;
    }

    // Redirect already-onboarded users away from onboarding
    if (user.is_onboarded && location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/app" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Guest-only auth routes */}
            <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
            <Route path="/signup" element={<GuestOnlyRoute><SignupPage /></GuestOnlyRoute>} />
            <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
            {/* Reset password — allow regardless of auth state (token link from email) */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public shared-task viewer — no auth required */}
            <Route path="/shared/task/:token" element={<SharedTaskPage />} />

            <Route element={<MarketingLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Protected: Onboarding */}
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <OnboardingWizard />
                </ProtectedRoute>
            } />

            {/* Protected: App */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }>
                <Route index element={<HomePage />} />
                <Route path="today" element={<HomePage />} />
                <Route path="upcoming" element={<HomePage />} />
                <Route path="completed" element={<HomePage />} />
                <Route path="project/:id" element={<HomePage />} />
                <Route path="calls" element={<CallsPage />} />
                <Route path="assigned" element={<AssignedToMePage />} />
                <Route path="tasks/:id" element={<TaskDetailsPage />} />
                <Route path="onboard/welcome" element={<WelcomeStep />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
