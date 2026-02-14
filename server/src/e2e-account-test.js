import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const TOKEN = 'e2e-magic-token';
// In src/index.js, 'e2e-magic-token' -> uid: 'test-e2e-user'

async function runTests() {
    console.log('🧪 Starting E2E Account Tests...');

    // 0. Login (Seeds the user)
    console.log('\n--- 0. Login & Seed ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'mock-code' })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    // console.log('Login Data:', loginData);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    };

    // 1. Get Profile (Emails)
    console.log('\n--- 1. Get Emails ---');
    let res = await fetch(`${BASE_URL}/api/account/emails`, { headers });
    let data = await res.json();
    console.log('Status:', res.status, 'Data:', data);

    // 2. Add Email
    console.log('\n--- 2. Add Email ---');
    const newEmail = `test-${Date.now()}@example.com`;
    res = await fetch(`${BASE_URL}/api/account/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: newEmail })
    });
    data = await res.json();
    console.log('Status:', res.status, 'Added:', data);
    const emailId = data.id;

    // 3. Set Primary (Should fail if unverified)
    console.log('\n--- 3. Set Primary (Expect Failure) ---');
    res = await fetch(`${BASE_URL}/api/account/emails/${emailId}/set-primary`, {
        method: 'POST',
        headers
    });
    data = await res.json();
    console.log('Status:', res.status, 'Response:', data);

    // 4. Security - Get Sessions
    console.log('\n--- 4. Get Sessions ---');
    res = await fetch(`${BASE_URL}/api/account/security/sessions`, { headers });
    data = await res.json();
    console.log('Status:', res.status, 'Sessions:', data.length);

    // 5. Security - Allowed IPs
    console.log('\n--- 5. Add Allowed IP ---');
    res = await fetch(`${BASE_URL}/api/account/security/allowed-ips`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cidr: '127.0.0.1/32', label: 'Localhost' })
    });
    data = await res.json();
    console.log('Status:', res.status, 'IP Added:', data);

    // 6. Settings - Update Preferences
    console.log('\n--- 6. Update Preferences ---');
    res = await fetch(`${BASE_URL}/api/account/settings/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ theme: 'dark', lang: 'en' })
    });
    data = await res.json();
    console.log('Status:', res.status, 'Prefs:', data);

    // 7. Change Password
    console.log('\n--- 7. Change Password ---');
    res = await fetch(`${BASE_URL}/api/account/security/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ current_password: 'password123', new_password: 'new-secure-password-123' })
    });
    data = await res.json();
    console.log('Status:', res.status, 'Result:', data);

    // 8. Generate App Password
    console.log('\n--- 8. Generate App Password ---');
    res = await fetch(`${BASE_URL}/api/account/security/app-passwords`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Mail Client' })
    });
    data = await res.json();
    console.log('Status:', res.status, 'App Password:', data);

    console.log('\n✅ Tests Completed');
}

runTests().catch(console.error);
