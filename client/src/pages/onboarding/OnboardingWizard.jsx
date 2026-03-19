/**
 * OnboardingWizard — 6-step setup flow
 *
 * Steps:
 *  1. Welcome       — animated greeting, no API call
 *  2. Workspace     — POST /api/onboarding/workspace  (WorkspaceStep logic)
 *  3. Use Case      — PATCH /api/users/me             (UseCaseStep logic)
 *  4. Invite Team   — POST /api/workspaces/:id/invite (InviteTeamStep logic, skippable)
 *  5. Profile       — PATCH /api/users/me             (Step1 logic)
 *  6. Done          — POST /api/onboarding/complete → navigate /app
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import WorkspaceStep from './steps/WorkspaceStep';
import UseCaseStep from './steps/UseCaseStep';
import InviteTeamStep from './steps/InviteTeamStep';
import Step1 from './steps/Step1';

const TOTAL       = 6;
const STEP_LABELS = ['Welcome', 'Workspace', 'Use Case', 'Invite', 'Profile', 'Done'];

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => {
                const done   = i < current - 1;
                const active = i === current - 1;
                return (
                    <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                            active ? 'w-6 h-2 bg-red-600' :
                            done   ? 'w-2 h-2 bg-red-300' :
                                     'w-2 h-2 bg-gray-200'
                        }`}
                    />
                );
            })}
        </div>
    );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function WelcomeStepInner({ user, onNext }) {
    const firstName = (user?.display_name || user?.name || 'there').split(' ')[0];
    return (
        <div className="text-center space-y-6 py-4">
            <div className="text-5xl select-none">👋</div>
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                    Hey, {firstName}!
                </h2>
                <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
                    Let's get your workspace set up. You'll be logging calls and
                    closing tasks in no time.
                </p>
            </div>
            <button
                onClick={onNext}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm"
            >
                Get started →
            </button>
            <p className="text-xs text-gray-400">Takes about 2 minutes</p>
        </div>
    );
}

// ── Step 6: Done ──────────────────────────────────────────────────────────────
function DoneStepInner({ onFinish, loading }) {
    return (
        <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto border border-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Your workspace is ready. Start logging calls and turning them into tasks.
                </p>
            </div>
            <ul className="text-sm text-gray-600 space-y-2.5 text-left max-w-xs mx-auto bg-gray-50 rounded-xl p-4">
                {['Workspace created', 'Team members invited', 'Profile configured'].map(item => (
                    <li key={item} className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={onFinish}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors shadow-sm"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Opening app…
                    </>
                ) : "Let's go →"}
            </button>
        </div>
    );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [initializing, setInitializing] = useState(true);
    const [finishing, setFinishing] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get('/api/onboarding/status', {
                    withCredentials: true
                });
                if (res.data.success) {
                    const { currentStep: backendStep, isComplete } = res.data.data;
                    if (isComplete) {
                        navigate('/app', { replace: true });
                        return;
                    }
                    // Backend step 1 = Workspace = our wizard step 2 (step 1 is the Welcome screen).
                    // Map backend step n → wizard step n+1, clamped to TOTAL.
                    const wizardStep = backendStep ? Math.min(backendStep + 1, TOTAL) : 1;
                    setCurrentStep(wizardStep);
                }
            } catch {
                setCurrentStep(1);
            } finally {
                setInitializing(false);
            }
        };
        fetchStatus();
    }, [navigate]);

    // Called by step components when they successfully complete their work
    const advance = async () => {
        const next = currentStep + 1;
        if (next <= TOTAL) {
            try {
                // Persist backend step (backend counts workspace creation as step 1)
                await axios.post(
                    '/api/onboarding/step',
                    { step: currentStep },
                    { withCredentials: true }
                );
            } catch {
                // Non-fatal
            }
            setCurrentStep(next);
        }
    };

    const handleFinish = async () => {
        setFinishing(true);
        try {
            await axios.post('/api/onboarding/complete', {}, {
                withCredentials: true
            });
            await refreshUser();
            navigate('/app', { replace: true });
        } catch (err) {
            console.error('Failed to complete onboarding', err);
            setFinishing(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:  return <WelcomeStepInner user={user} onNext={advance} />;
            case 2:  return <WorkspaceStep onNext={advance} />;
            case 3:  return <UseCaseStep onNext={advance} />;
            case 4:  return <InviteTeamStep onNext={advance} />;
            case 5:  return <Step1 onNext={advance} />;
            case 6:  return <DoneStepInner onFinish={handleFinish} loading={finishing} />;
            default: return null;
        }
    };

    const progressPct = ((currentStep - 1) / (TOTAL - 1)) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Top progress bar */}
                <div className="h-1 bg-gray-100">
                    <div
                        className="h-1 bg-red-600 transition-all duration-500 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                <div className="p-8 sm:p-10">
                    {/* Step label + progress dots */}
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            {STEP_LABELS[currentStep - 1]}
                        </span>
                        <ProgressDots current={currentStep} total={TOTAL} />
                    </div>

                    <div className="animate-fade-in">
                        {renderStep()}
                    </div>
                </div>
            </div>

            {/* Brand */}
            <p className="mt-8 text-xs text-gray-400">
                <span className="font-bold text-gray-600">ormmak</span>kurippu
            </p>
        </div>
    );
}
