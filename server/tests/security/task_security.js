
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const USER1_TOKEN = 'e2e-magic-token';
const USER2_TOKEN = 'e2e-magic-token-2';

async function verifySecurity() {
    console.log('🚀 Starting Task Security Verification...');

    try {
        // 1. Create a task as User 1
        console.log('\n1. User 1: Creating a private task...');
        const createRes = await fetch(`${BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${USER1_TOKEN}`
            },
            body: JSON.stringify({
                title: 'Security Test Task',
                description: 'Private task for User 1'
            })
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error('Failed to create task: ' + JSON.stringify(createData));

        const taskId = createData.data.id;
        console.log(`✅ Task created with ID: ${taskId}`);

        // 2. User 2 tries to access User 1's task (Should be 403)
        console.log('\n2. User 2: Trying to access User 1\'s private task...');
        const accessCheckRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${USER2_TOKEN}` }
        });

        if (accessCheckRes.status === 403) {
            console.log('✅ Access correctly denied (403 Forbidden)');
        } else {
            console.error(`❌ Security failure! Access should have been denied but got ${accessCheckRes.status}`);
            process.exit(1);
        }

        // 3. User 1 assigns the task to User 2
        console.log('\n3. User 1: Assigning task to User 2 (colleague@example.com)...');
        // Note: updateTask handles assignment update
        const assignRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${USER1_TOKEN}`
            },
            body: JSON.stringify({
                assignedToEmail: 'colleague@example.com'
            })
        });
        const assignData = await assignRes.json();
        if (!assignData.success) throw new Error('Failed to assign task: ' + JSON.stringify(assignData));
        console.log('✅ Task assigned successfully');

        // 4. User 2 tries to access User 1's task (Should now be 200)
        console.log('\n4. User 2: Trying to access the assigned task...');
        const accessCheck2Res = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${USER2_TOKEN}` }
        });

        if (accessCheck2Res.status === 200) {
            console.log('✅ Access correctly granted (200 OK)');
        } else {
            const data = await accessCheck2Res.json();
            console.error(`❌ Access should have been granted but got ${accessCheck2Res.status}`, data);
            process.exit(1);
        }

        // 5. User 2 tries to DELETE User 1's task (Should be 403 - Owner Only)
        console.log('\n5. User 2 (Assignee): Trying to delete the task...');
        const deleteCheckRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${USER2_TOKEN}` }
        });

        if (deleteCheckRes.status === 403) {
            console.log('✅ Deletion correctly denied (403 Forbidden)');
        } else {
            console.error(`❌ Security failure! Deletion should have been denied but got ${deleteCheckRes.status}`);
            process.exit(1);
        }

        // 6. User 1 deletes their own task (Should be 200)
        console.log('\n6. User 1 (Owner): Deleting the task...');
        const deleteRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${USER1_TOKEN}` }
        });

        if (deleteRes.status === 200) {
            console.log('✅ Task deleted successfully (200 OK)');
        } else {
            console.error(`❌ Failed to delete task as owner: ${deleteRes.status}`);
            process.exit(1);
        }

        console.log('\n💯 ALL SECURITY TESTS PASSED!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification script crashed:', error);
        process.exit(1);
    }
}

verifySecurity();
