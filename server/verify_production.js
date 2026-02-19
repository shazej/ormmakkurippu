const BASE_URL = 'http://127.0.0.1:4000/api';
const TOKEN_USER_1 = 'e2e-magic-token';
const TOKEN_USER_2 = 'e2e-magic-token-2';

async function runVerification() {
    console.log('🚀 Starting Verification Script (using fetch)...');

    try {
        // 1. User 1: Create Task and Assign to User 2 (by email)
        console.log('\n--- Step 1: User 1 creates task assigned to colleague ---');
        const createRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN_USER_1}`
            },
            body: JSON.stringify({
                title: 'Production Readiness Review',
                description: 'Verify all systems are go.',
                assignedToEmail: 'colleague@example.com'
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create Task Failed: ${createRes.status} ${err}`);
        }

        const createJson = await createRes.json();
        const taskData = createJson.data || createJson;

        console.log('✅ Task Created:', taskData.id);
        console.log('   Assigned To Email:', taskData.assigned_to_email);
        console.log('   Assigned To User ID:', taskData.assigned_to_user_id);

        const taskId = taskData.id;

        // 2. User 2: Login and Check Assigned Tasks
        // Note: The middleware logic will create User 2 if not exists.
        console.log('\n--- Step 2: User 2 logs in (First Request triggers creation/link) ---');
        const listRes = await fetch(`${BASE_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${TOKEN_USER_2}` }
        });

        if (!listRes.ok) {
            const err = await listRes.text();
            throw new Error(`List Tasks Failed: ${listRes.status} ${err}`);
        }

        const listJson = await listRes.json();
        const user2Tasks = listJson.data || listJson;

        console.log(`✅ User 2 fetched ${user2Tasks.length} tasks.`);

        // Find our task
        const assignedTask = user2Tasks.find(t => t.id === taskId);

        if (assignedTask) {
            console.log('✅ FOUND assigned task for User 2!');
            console.log('   Task ID:', assignedTask.id);
            console.log('   Owner:', assignedTask.uid || assignedTask.user_id);
            console.log('   Assigned To User ID:', assignedTask.assigned_to_user_id);

            if (assignedTask.assigned_to_user_id === 'test-e2e-user-2') {
                console.log('🎉 SUCCESS: Task was correctly linked to User 2 ID!');
            } else {
                console.log('⚠️ WARNING: Task found but assigned_to_user_id does not match User 2 ID?');
                console.log('   Expected: test-e2e-user-2');
                console.log('   Actual:  ', assignedTask.assigned_to_user_id);
            }
        } else {
            console.error('❌ FAILURE: User 2 did not see the assigned task.');
            console.log('User 2 Tasks:', JSON.stringify(user2Tasks, null, 2));
        }

        // 3. User 1: Verify Task Update
        console.log('\n--- Step 3: User 1 checks task status ---');
        const getRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN_USER_1}` }
        });

        if (!getRes.ok) {
            throw new Error(`Get Task Failed: ${getRes.status}`);
        }

        const getJson = await getRes.json();
        const user1Task = getJson.data || getJson;

        console.log('✅ User 1 sees updated task:');
        console.log('   Assigned To User ID:', user1Task.assigned_to_user_id);
        console.log('   Assigned To Email:', user1Task.assigned_to_email); // Should be null

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
    }
}

runVerification();
