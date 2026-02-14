
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function verify() {
    console.log('Starting Account Closure Verification...');

    // 1. Login (E2E Mock)
    console.log('1. Authenticating...');
    const authRes = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'mock-code' })
    });
    const authData = await authRes.json();

    if (!authData.tokens || !authData.tokens.id_token) {
        console.error('Authentication failed:', authData);
        process.exit(1);
    }
    const token = authData.tokens.id_token;
    console.log('   Authenticated as:', authData.user.email);

    // 2. Request Closure
    console.log('2. Requesting Closure...');
    const reqRes = await fetch(`${BASE_URL}/api/account/close/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const reqData = await reqRes.json();

    // Check if already pending (idempotency check)
    if (reqData.message && reqData.message.includes('already pending')) {
        console.log('   Request already pending. Proceeding with clean up first? No, we will try to cancel it.');
        // Try to cancel first to ensure clean state
        await fetch(`${BASE_URL}/api/account/close/cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   Cancelled existing request. Retrying request...');
        // Retry request
        const retryRes = await fetch(`${BASE_URL}/api/account/close/request`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const retryData = await retryRes.json();
        console.log('   Request Data:', retryData);
        if (!retryData.confirmation_token) {
            console.error('Failed to get confirmation token:', retryData);
            process.exit(1);
        }
        processConfirmation(retryData.confirmation_token, token);
    } else {
        console.log('   Request sent. Data:', reqData);
        if (!reqData.confirmation_token) {
            console.error('Failed to get confirmation token:', reqData);
            process.exit(1);
        }
        processConfirmation(reqData.confirmation_token, token);
    }
}

async function processConfirmation(confirmationToken, authToken) {
    // 3. Confirm Closure
    console.log('3. Confirming Closure...');
    const confirmRes = await fetch(`${BASE_URL}/api/account/close/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            token: confirmationToken,
            password: 'password123' // Mock password used in E2E seed
        })
    });
    const confirmData = await confirmRes.json();
    console.log('   Confirmation Response:', confirmData);

    if (confirmData.success) {
        console.log('✅ Account Closure Verified Successfully!');
    } else {
        console.error('❌ Verification Failed:', confirmData);
        process.exit(1);
    }
}

verify().catch(err => console.error(err));
