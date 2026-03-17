import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import CallsPage from './pages/CallsPage';
import ContactsPage from './pages/ContactsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import SettingsPage from './pages/SettingsPage';
import AssignedToMePage from './pages/AssignedToMePage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import WelcomeStep from './pages/onboarding/WelcomeStep';
import SharedTaskPage from './pages/SharedTaskPage';

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
            {/* Public — unauthenticated */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* Public shared-task viewer — no auth required */}
            <Route path="/shared/task/:token" element={<SharedTaskPage />} />

            {/* Marketing site */}
            <Route element={<MarketingLayout />}>
                <Route path="/"        element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
            </Route>

            {/* Onboarding (protected) */}
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <OnboardingWizard />
                </ProtectedRoute>
            } />

            {/* App (protected) */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }>
                <Route index             element={<HomePage />} />
                <Route path="today"      element={<HomePage />} />
                <Route path="upcoming"   element={<HomePage />} />
                <Route path="completed"  element={<HomePage />} />
                <Route path="project/:id" element={<HomePage />} />
                <Route path="calls"      element={<CallsPage />} />
                <Route path="contacts"   element={<ContactsPage />} />
                <Route path="workspaces" element={<WorkspacesPage />} />
                <Route path="settings"   element={<SettingsPage />} />
                <Route path="assigned"   element={<AssignedToMePage />} />
                <Route path="tasks/:id"  element={<TaskDetailsPage />} />
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
            <ToastProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ToastProvider>
        </Router>
    );
}

export default App;
