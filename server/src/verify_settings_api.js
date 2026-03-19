import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const TOKEN = 'e2e-magic-token';

async function runTests() {
    console.log('🧪 Starting E2E Settings API Tests...');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    };

    // 1. Update Profile (Display Name)
    console.log('\n--- 1. Update Profile ---');
    let res = await fetch(`${BASE_URL}/api/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ display_name: 'E2E Tester' })
    });
    let data = await res.json();
    console.log('Status:', res.status, 'Response:', data);

    // 2. Get Current Workspace
    console.log('\n--- 2. Get Current Workspace ---');
    res = await fetch(`${BASE_URL}/api/workspaces/current`, { headers });
    const workspace = (await res.json()).data;
    console.log('Status:', res.status, 'Current Workspace:', workspace?.name);

    if (!workspace) {
        console.error('No workspace found for test user');
        process.exit(1);
    }

    // 3. Rename Workspace
    console.log('\n--- 3. Rename Workspace ---');
    const newName = `E2E Workspace ${Date.now()}`;
    res = await fetch(`${BASE_URL}/api/workspaces/current`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: newName })
    });
    data = await res.json();
    console.log('Status:', res.status, 'Response:', data);

    // 4. Try removing self (Should fail)
    console.log('\n--- 4. Remove Self (Expect Failure) ---');
    res = await fetch(`${BASE_URL}/api/workspaces/current/members/test-e2e-user`, {
        method: 'DELETE',
        headers
    });
    data = await res.json();
    console.log('Status:', res.status, 'Response:', data);

    console.log('\n✅ Tests Completed');
}

runTests().catch(console.error);
