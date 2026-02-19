
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyOnboarding() {
    console.log('🚀 Starting Verification: Onboarding Workspace Step');

    // 1. Create a fresh test user
    const testEmail = `test.onboard.${Date.now()}@example.com`;
    const googleUid = `test-uid-${Date.now()}`;

    try {
        console.log(`Creating test user: ${testEmail}`);
        const user = await prisma.user.create({
            data: {
                primary_email_id: testEmail,
                google_uid: googleUid,
                onboarding_step: 2, // Simulate being on the Workspace step
                role: 'USER',
                is_onboarded: false
            }
        });

        // Mock Auth Header? 
        // We need a way to authenticate as this user.
        // The endpoint uses `authorize` middleware which likely checks connection/session.
        // For E2E test, we often set a cookie or use a backdoor.
        // `server/src/index.js` has `demo-login` which sets a cookie `e2e-magic-token`.
        // But `authorize` middleware verifies firebase token or session cookie.
        // We probably need to generate a valid token or bypass.

        // Let's assume we can use a "dev" token if enabled, or maybe we just check the logic unit-test style if we can't easily auth.
        // BUT, `OnboardingController` uses `req.user.uid`.

        // Let's rely on manual verification OR use the existing `verify_e2e.js` pattern if available.
        // Checking `server/verify.sh` or `server/tests` might reveal how they test.
        // I see `server/e2e-account-test.js` in file list earlier.

        // Plan B: Use a simple axios call with a mocked token if we can, or just update the DB and verify the Service method directly?
        // Service method test is easier and reliable for logic verification.

        console.log('Verifying via Service Logic (skipping HTTP auth complexity for now)...');

        // Import Service dynamically
        const { OnboardingService } = await import('./src/features/onboarding/onboarding.service.js');
        const service = new OnboardingService();

        // Test 1: Invalid Name
        try {
            await service.createWorkspace(user.id, 'ab');
            console.error('❌ Failed: Should have rejected short name');
        } catch (e) {
            console.log('✅ Correctly rejected short name');
        }

        // Test 2: Valid Creation
        const workspaceName = "Test Corp " + Date.now();
        const result = await service.createWorkspace(user.id, workspaceName);

        if (result.success && result.workspace.name === workspaceName) {
            console.log('✅ Workspace created successfully');
        } else {
            console.error('❌ Failed to create workspace', result);
        }

        // Verify User Update
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (updatedUser.default_workspace_id === result.workspace.id) {
            console.log('✅ User default_workspace_id updated');
        } else {
            console.error('❌ User default_workspace_id NOT updated');
        }

        if (updatedUser.onboarding_step === 3) {
            console.log('✅ User onboarding_step advanced to 3');
        } else {
            console.error(`❌ User onboarding_step is ${updatedUser.onboarding_step}, expected 3`);
        }

        // Cleanup
        await prisma.workspace.delete({ where: { id: result.workspace.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('🧹 Cleanup done');

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

verifyOnboarding();
