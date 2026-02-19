import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import UseCaseStep from './steps/UseCaseStep';
import WorkspaceStep from './steps/WorkspaceStep';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';


const STEPS = [
    { component: WorkspaceStep, title: "Workspace" }, // Step 1
    { component: UseCaseStep, title: "Use Case" },    // Step 2
    { component: Step1, title: "Profile Setup" },     // Step 3
    { component: Step2, title: "Preferences" },       // Step 4
    { component: Step3, title: "Completion" }         // Step 5
];

export default function OnboardingWizard() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/onboarding/status', {
                withCredentials: true
            });
            if (res.data.success) {
                const { currentStep, isComplete } = res.data.data;
                // If complete, redirect (though App.jsx protects this too)
                if (isComplete) {
                    navigate('/app');
                } else {
                    // Check if workspace already exists (skip step 1 if so)
                    // If the user has a default workspace, and they are on step 1, move them to step 2
                    if (user?.default_workspace_id && (currentStep === 1 || !currentStep)) {
                        // Decide whether to auto-advance backend step or just show step 2 locally.
                        // It's safer to trust the backend step, but if provided step is 1 and we have workspace,
                        // it implies state drift. Let's respect backend step unless it's 1.
                        setCurrentStep(currentStep > 1 ? currentStep : 2);
                    } else {
                        setCurrentStep(currentStep || 1);
                    }
                }
            } else {
                // Determine step from scratch or error?
                // If we have default workspace, start at 2
                if (user?.default_workspace_id) {
                    setCurrentStep(2);
                } else {
                    setCurrentStep(1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch onboarding status", error);
            // Fallback
            setCurrentStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const nextStep = currentStep + 1;

        // If we are at the last step, complete it
        if (currentStep >= STEPS.length) {
            await handleComplete();
            return;
        }

        try {
            await axios.post('http://localhost:4000/api/onboarding/step', { step: nextStep }, {
                withCredentials: true
            });
            setCurrentStep(nextStep);
        } catch (error) {
            console.error("Failed to save progress", error);
        }
    };

    const handleComplete = async () => {
        try {
            await axios.post('http://localhost:4000/api/onboarding/complete', {}, {
                withCredentials: true
            });
            await refreshUser(); // Update context to reflect completed status
            navigate('/app');
        } catch (error) {
            console.error("Failed to complete onboarding", error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const StepComponent = STEPS[currentStep - 1]?.component || Step1;
    const progress = ((currentStep) / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-2">
                    <div
                        className="bg-indigo-600 h-2 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
                        </h2>
                    </div>

                    <StepComponent onNext={handleNext} />
                </div>
            </div>
        </div>
    );
}
