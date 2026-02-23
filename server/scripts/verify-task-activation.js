import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyTaskActivation() {
    const testEmail = `test.pending.${Date.now()}@example.com`;
    const testUserId = 'f7b1a2c3-d4e5-4f6a-8b9c-d0e1f2a3b4c5'; // Some existing or new ID for test

    try {
        console.log(`Starting verification for email: ${testEmail}`);

        // 1. Create a mock owner user if it doesn't exist
        let owner = await prisma.user.findFirst();
        if (!owner) {
            owner = await prisma.user.create({
                data: {
                    id: 'owner-id',
                    display_name: 'Owner Agent',
                    primary_email_id: 'owner@example.com',
                    role: 'USER'
                }
            });
        }

        // 2. Create a pending task assignment
        const task = await prisma.task.create({
            data: {
                title: 'Test Pending Task',
                description: 'Should be auto-activated',
                user_id: owner.id, // Task owner
                assigned_to_email: testEmail,
                assigned_to_user_id: null,
                status: 'Pending'
            }
        });
        console.log(`Created pending task: ${task.id}`);

        // 3. Create the user that will "login"
        const loggingInUser = await prisma.user.create({
            data: {
                id: `user-${Date.now()}`,
                display_name: 'Test User',
                primary_email_id: testEmail,
                role: 'USER'
            }
        });
        console.log(`Created user logging in: ${loggingInUser.id}`);

        // 4. Simulate the logic from loginWithGoogle
        await prisma.$transaction(async (tx) => {
            const pendingTasks = await tx.task.findMany({
                where: {
                    assigned_to_email: testEmail,
                    assigned_to_user_id: null,
                    deleted_at: null
                }
            });

            console.log(`Found ${pendingTasks.length} pending tasks`);

            if (pendingTasks.length > 0) {
                await tx.task.updateMany({
                    where: {
                        assigned_to_email: testEmail,
                        assigned_to_user_id: null,
                        deleted_at: null
                    },
                    data: {
                        assigned_to_user_id: loggingInUser.id,
                        assigned_to_email: null
                    }
                });
            }
        });

        // 5. Verify the updates
        const updatedTask = await prisma.task.findUnique({
            where: { id: task.id }
        });

        if (updatedTask.assigned_to_user_id === loggingInUser.id && updatedTask.assigned_to_email === null) {
            console.log('✅ SUCCESS: Task assignment activated correctly.');
        } else {
            console.error('❌ FAILURE: Task assignment not updated as expected.');
            console.log('Task state:', updatedTask);
        }

        // 6. Idempotency check: run it again for same email
        await prisma.$transaction(async (tx) => {
            const pendingTasks = await tx.task.findMany({
                where: {
                    assigned_to_email: testEmail,
                    assigned_to_user_id: null,
                    deleted_at: null
                }
            });
            console.log(`Found ${pendingTasks.length} pending tasks on second run (should be 0)`);
        });
        console.log('✅ SUCCESS: Idempotency check passed.');

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTaskActivation();
