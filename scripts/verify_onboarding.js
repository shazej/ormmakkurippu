// import fetch from 'node-fetch'; // specific version for node < 18

const BASE_URL = 'http://localhost:4001/api';
const TOKEN = 'e2e-magic-token'; // Requires E2E_TEST_MODE=true on server

async function runTest() {
    console.log('Starting Onboarding Verification...');

    // 1. Check Status (Should be default)
    console.log('\n--- 1. Check Initial Status ---');
    let res = await fetch(`${BASE_URL}/onboarding/status`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (!res.ok) {
        console.error('Failed to get status:', res.status, await res.text());
        return;
    }
    let data = await res.json();
    console.log('Status:', data);

    // 2. Advance Step
    console.log('\n--- 2. Advance to Step 2 ---');
    res = await fetch(`${BASE_URL}/onboarding/step`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ step: 2 })
    });
    data = await res.json();
    console.log('Update Result:', data);

    // 3. Check Status Again
    console.log('\n--- 3. Verify Step 2 ---');
    res = await fetch(`${BASE_URL}/onboarding/status`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    data = await res.json();
    console.log('Status:', data);

    // 4. Complete Onboarding
    console.log('\n--- 4. Complete Onboarding ---');
    res = await fetch(`${BASE_URL}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    data = await res.json();
    console.log('Completion Result:', data);

    // 5. Verify User Profile Updated
    console.log('\n--- 5. Verify User Profile ---');
    res = await fetch(`${BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    data = await res.json();
    console.log('is_onboarded:', data.data.is_onboarded);

    if (data.data.is_onboarded === true) {
        console.log('\nSUCCESS: Onboarding flow verified!');
    } else {
        console.log('\nFAILURE: User not marked as onboarded.');
    }
}

runTest().catch(console.error);
