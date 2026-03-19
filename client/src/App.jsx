import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage'; // This is "Inbox" now
import CallsPage from './pages/CallsPage';
import AssignedToMePage from './pages/AssignedToMePage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

import WelcomeStep from './pages/onboarding/WelcomeStep';

import LoginPage from './pages/LoginPage';
import SharedTaskPage from './pages/SharedTaskPage';
import { useLocation } from 'react-router-dom';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;

    // Enforce onboarding
    // Allow access to /app/onboard/welcome even if not onboarded
    if (!user.is_onboarded && !location.pathname.startsWith('/onboarding') && location.pathname !== '/app/onboard/welcome') {
        return <Navigate to="/onboarding" replace />;
    }

    // Redirect to app if already onboarded and trying to access onboarding (except welcome step)
    if (user.is_onboarded && location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/app" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            {/* Public shared-task viewer — no auth required */}
            <Route path="/shared/task/:token" element={<SharedTaskPage />} />

            <Route element={<MarketingLayout />}>
                <Route path="/" element={<LandingPage />} />
                {/* <Route path="/about" element={<AboutPage />} /> */}
            </Route>

            {/* App Routes (Protected) */}
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <OnboardingWizard />
                </ProtectedRoute>
            } />

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
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="contacts/:id" element={<ContactDetailPage />} />
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
