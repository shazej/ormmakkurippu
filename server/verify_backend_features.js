const BASE_URL = 'http://127.0.0.1:4000/api';
const TOKEN_USER_1 = 'e2e-magic-token';

async function runVerification() {
    console.log('🚀 Starting Backend Feature Verification (Calls & Workspaces)...');

    try {
        // --- 1. Workspaces ---
        console.log('\n--- Step 1: Check Auto-Created Workspace ---');
        const wsRes = await fetch(`${BASE_URL}/workspaces`, {
            headers: { 'Authorization': `Bearer ${TOKEN_USER_1}` }
        });
        if (!wsRes.ok) throw new Error(`Get Workspaces failed: ${wsRes.status}`);
        const wsJson = await wsRes.json();
        const workspaces = wsJson.data || wsJson;

        console.log(`✅ User has ${workspaces.length} workspaces.`);
        if (workspaces.length > 0) {
            console.log(`   Default Workspace: ${workspaces[0].name} (${workspaces[0].id})`);
        } else {
            console.error('❌ FAILURE: No default workspace created.');
        }

        // --- 2. Contacts ---
        console.log('\n--- Step 2: Create Contact ---');
        const contactRes = await fetch(`${BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN_USER_1}`
            },
            body: JSON.stringify({
                name: 'Important Client',
                phone_e164: '+15550199',
                email: 'client@example.com'
            })
        });

        if (!contactRes.ok) {
            // Ignore 400 if already exists (idempotency for dev)
            if (contactRes.status !== 400 && contactRes.status !== 409) throw new Error(`Create Contact failed: ${contactRes.status}`);
            console.log('   (Contact might already exist)');
        } else {
            const contact = await contactRes.json();
            console.log(`✅ Contact Created: ${contact.data?.name || 'Success'}`);
        }

        // --- 3. Call Logs ---
        console.log('\n--- Step 3: Create Call Log ---');
        const callRes = await fetch(`${BASE_URL}/calls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN_USER_1}`
            },
            body: JSON.stringify({
                caller_phone_e164: '+15550199',
                caller_name: 'Important Client',
                direction: 'INCOMING',
                duration_sec: 120,
                notes: 'Discussed project requirements.'
            })
        });

        if (!callRes.ok) throw new Error(`Create Call Log failed: ${callRes.status}`);
        const callJson = await callRes.json();
        const callLog = callJson.data || callJson;
        console.log(`✅ Call Log Created: ${callLog.id}`);

        // --- 4. Task from Call ---
        console.log('\n--- Step 4: Create Task from Call ---');
        const taskRes = await fetch(`${BASE_URL}/calls/task`, { // Check route path!
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN_USER_1}`
            },
            body: JSON.stringify({
                callLogId: callLog.id,
                title: 'Follow up with Client'
            })
        });

        // Wait, route was POST /api/calls (create log) and POST /api/calls/task ? 
        // Let's check calls.routes.js ... createCallLog is POST /
        // createTaskFromCall is ?? I missed adding the route in calls.routes.js! 
        // I need to check calls.routes.js content.

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
    }
}

runVerification();
