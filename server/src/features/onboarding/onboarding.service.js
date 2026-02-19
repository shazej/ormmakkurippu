import { PrismaClient } from '@prisma/client';
import { WorkspacesService } from '../workspaces/workspaces.service.js';

const prisma = new PrismaClient();
const workspacesService = new WorkspacesService();

export class OnboardingService {
    /**
     * Create a workspace and advance onboarding.
     * @param {string} userId
     * @param {string} name
     */
    async createWorkspace(userId, name) {
        if (!name || name.trim().length < 2) throw new Error('Invalid workspace name');

        // Create workspace
        const workspace = await workspacesService.createWorkspace({ uid: userId }, name);

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                default_workspace_id: workspace.id,
                onboarding_step: 2 // Advance to next step (Use Case)
            }
        });

        return { success: true, workspace };
    }

    /**
     * Get the current onboarding status of a user.
     * @param {string} userId
     * @returns {Promise<{currentStep: number, isComplete: boolean}>}
     */
    async getStatus(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { onboarding_step: true, is_onboarded: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            currentStep: user.onboarding_step,
            isComplete: user.is_onboarded
        };
    }

    /**
     * Update the user's onboarding step.
     * @param {string} userId
     * @param {number} step
     * @returns {Promise<{currentStep: number}>}
     */
    async updateStep(userId, step) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { onboarding_step: step },
            select: { onboarding_step: true }
        });

        return { currentStep: user.onboarding_step };
    }

    /**
     * Mark onboarding as complete for a user.
     * @param {string} userId
     * @returns {Promise<{success: boolean}>}
     */
    async completeOnboarding(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { is_onboarded: true, onboarding_step: 4 } // Assuming 3 steps, so 4 is "done" or just keep at max step
        });

        return { success: true };
    }
}
