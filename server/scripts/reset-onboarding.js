import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Resetting onboarding status for all users...');
        const updateResult = await prisma.user.updateMany({
            data: {
                is_onboarded: false,
                onboarding_step: 1
            }
        });
        console.log(`Successfully reset onboarding for ${updateResult.count} users.`);

        // Also log the users to see who was updated
        const users = await prisma.user.findMany({
            select: { id: true, primary_email_id: true, is_onboarded: true, onboarding_step: true }
        });
        console.log('Current user states:', users);

    } catch (e) {
        console.error('Error resetting onboarding:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
