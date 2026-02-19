import { OnboardingService } from './onboarding.service.js';

const onboardingService = new OnboardingService();

export class OnboardingController {
    async createWorkspace(req, res) {
        try {
            const userId = req.user.uid;
            const { name } = req.body;
            const result = await onboardingService.createWorkspace(userId, name);
            res.json(result);
        } catch (error) {
            console.error('Error creating workspace in onboarding:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getStatus(req, res) {
        try {
            const userId = req.user.uid;
            const status = await onboardingService.getStatus(userId);
            res.json({ success: true, data: status });
        } catch (error) {
            console.error('Error fetching onboarding status:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch status' });
        }
    }

    async updateStep(req, res) {
        try {
            const userId = req.user.uid;
            const { step } = req.body;

            if (typeof step !== 'number') {
                return res.status(400).json({ success: false, error: 'Invalid step' });
            }

            const result = await onboardingService.updateStep(userId, step);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Error updating onboarding step:', error);
            res.status(500).json({ success: false, error: 'Failed to update step' });
        }
    }

    async complete(req, res) {
        try {
            const userId = req.user.uid;
            const result = await onboardingService.completeOnboarding(userId);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Error completing onboarding:', error);
            res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
        }
    }
}
