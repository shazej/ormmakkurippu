import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const TOKEN = 'e2e-magic-token';

async function runTests() {
    console.log('🧪 Starting Extended Account Tests...');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    };

    // 0. Login & Seed (Ensure user exists and has password)
    console.log('\n--- 0. Login & Seed ---');
    await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'mock-code' })
    });
    console.log('User Seeded.');

    // 1. Linked Accounts
    console.log('\n--- 1. Link Account (Mock) ---');
    let res = await fetch(`${BASE_URL}/api/account/linked-accounts/link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ provider: 'github', token: 'mock-gh-token' })
    });
    let data = await res.json();
    console.log('Status:', res.status, 'Link:', data.id);
    const linkId = data.id;

    console.log('--- 1b. Unlink Account ---');
    if (linkId) {
        res = await fetch(`${BASE_URL}/api/account/linked-accounts/${linkId}/unlink`, { method: 'POST', headers });
        console.log('Status:', res.status);
    }

    // 2. Groups
    console.log('\n--- 2. Create Group ---');
    res = await fetch(`${BASE_URL}/api/account/groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Project Alpha' })
    });
    data = await res.json();
    console.log('Status:', res.status, 'Group:', data.name);
    const groupId = data.id;

    if (groupId) {
        console.log('--- 2b. Add Member ---');
        res = await fetch(`${BASE_URL}/api/account/groups/${groupId}/members`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email: 'alice@example.com' })
        });
        console.log('Status:', res.status);
    }

    // 3. Privacy (DPA)
    console.log('\n--- 3. Initiate DPA ---');
    res = await fetch(`${BASE_URL}/api/privacy/dpa/initiate?org_id=org-123`, {
        method: 'POST',
        headers
    });
    data = await res.json();
    console.log('Status:', res.status, 'DPA:', data.status);

    // 4. Activity
    console.log('\n--- 4. List Activity ---');
    res = await fetch(`${BASE_URL}/api/account/activity?limit=5`, { headers });
    data = await res.json();
    console.log('Status:', res.status, 'Activity Count:', data.length);

    // 5. Compliance
    console.log('\n--- 5. Get Certifications ---');
    res = await fetch(`${BASE_URL}/api/compliance/certifications`, { headers });
    data = await res.json();
    console.log('Status:', res.status, 'Certs:', data.length);

    // 6. Account Closure
    console.log('\n--- 6. Request Account Closure ---');
    res = await fetch(`${BASE_URL}/api/account/close/request`, {
        method: 'POST',
        headers
    });
    data = await res.json();
    console.log('Status:', res.status, 'Token:', data.confirmation_token);
    const token = data.confirmation_token;

    if (token) {
        console.log('--- 6b. Confirm Closure ---');
        res = await fetch(`${BASE_URL}/api/account/close/confirm`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token, password: 'password123' })
        });
        data = await res.json();
        console.log('Status:', res.status, 'Result:', data.message);
    }

    console.log('\n✅ Extended Tests Completed');
}

runTests().catch(console.error);
