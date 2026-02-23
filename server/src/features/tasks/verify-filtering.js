import { TasksService } from './tasks.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const service = new TasksService();

async function runVerification() {
    console.log('--- Starting Verification ---');

    const testUser = { uid: 'test-user-id' }; // Replace with a valid test user UID if necessary

    try {
        console.log('Testing getTodayTasks...');
        const todayTasks = await service.getTodayTasks(testUser);
        console.log('Today Tasks Count:', todayTasks.length);

        console.log('Testing getUpcomingTasks...');
        const upcomingTasks = await service.getUpcomingTasks(testUser, 14);
        console.log('Upcoming Tasks Count:', upcomingTasks.length);

        console.log('Verification successful!');
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runVerification();
