import fetch from 'node-fetch';
import { logAudit } from './src/admin/audit.js';

const API_BASE = 'http://localhost:4000/api/account/activity';
// E2E Mock Token (Matches verifyFirebaseToken mock)
const TOKEN = 'e2e-magic-token';

async function runActivityTests() {
    console.log('🚀 Starting Activity Logs Verification...');

    // 1. Create a log entry directly using the server-side helper (simulating an action)
    // We need to import the helper... catch: we cant import ES module from src if we run this as standalone script easily 
    // without "type": "module" in package.json (which we have).
    // BUT `audit.js` uses `ActivityRepository` which uses `db`, which might fail if not initialized.
    // So better to Trigger an action that LOGS something.
    // "Create Certification" logs? Currently ComplianceService doesn't call logAudit.
    // "Deactivate Account" logs!
    // Let's call the Deactivate endpoint (mock) which we know calls logAudit.

    // Actually, Deactivate logic:
    // await logAudit(user, 'ACCOUNT_DEACTIVATION', 'user', uid, ...);

    console.log('1. Triggering an action to generate a log (Deactivate)...');
    const authBase = 'http://localhost:4000/api/auth';
    const deactivateRes = await fetch(`${authBase}/deactivate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    console.log(`Trigger Action: ${deactivateRes.status}`);

    // 2. Fetch Logs
    console.log('2. Fetching Activity Logs...');
    const listRes = await fetch(`${API_BASE}?limit=10`, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        }
    });

    if (listRes.status !== 200) {
        console.error(`❌ Failed to fetch logs: ${listRes.status}`);
        const text = await listRes.text();
        console.error(text);
        return;
    }

    const body = await listRes.json();
    const logs = body.data || body; // Handle standard or raw

    console.log(`Logs Found: ${logs.length}`);

    const found = logs.find(l => l.action === 'ACCOUNT_DEACTIVATION');
    console.log(`Found 'ACCOUNT_DEACTIVATION': ${found ? '✅' : '❌'}`);

    if (found) {
        console.log('Log Details:', found);
    }

    console.log('🎉 Activity Verification Complete!');
}

runActivityTests();
