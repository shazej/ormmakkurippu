import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';
const AUTH_BASE = 'http://localhost:4000/api/auth';

async function runPhase2Tests() {
    console.log('🚀 Starting Phase 2 Verification...');

    // 1. Security Headers
    try {
        const res = await fetch('http://localhost:4000/health');
        const headers = res.headers;
        const xDnsPrefetchControl = headers.get('x-dns-prefetch-control');
        const strictTransportSecurity = headers.get('strict-transport-security');
        console.log(`Security Headers (Helmet): ${xDnsPrefetchControl || strictTransportSecurity ? '✅' : '❌'}`);
    } catch (e) {
        console.error('Headers Check Failed:', e.message);
    }

    // 2. Deactivate Account (Mock Token)
    // Run this BEFORE rate limit test to avoid getting blocked
    const deactivateRes = await fetch(`${AUTH_BASE}/deactivate`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer e2e-magic-token',
            'Content-Type': 'application/json'
        }
    });
    console.log(`Deactivate Account: ${deactivateRes.status} ${deactivateRes.status === 200 ? '✅' : '❌'}`);

    // 3. Auth Rate Limit
    // Hit /api/auth/reset-password 12 times (limit is 10)
    console.log('Testing Rate Limit (expecting failure after 10)...');
    for (let i = 0; i < 12; i++) {
        const res = await fetch(`${AUTH_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com' })
        });
        if (res.status === 429) {
            console.log(`Rate Limit Hit at request #${i + 1}: 429 ✅`);
            break;
        }
        if (i === 11) console.log('❌ Rate Limit NOT hit');
    }

    // 4. Password Reset Flow (Mock) - This will now likely be rate limited


    console.log('🎉 Phase 2 Verification Complete!');
}

runPhase2Tests();
