#!/usr/bin/env node
/**
 * Demo Test Runner
 * 1. Signs an owner demo JWT
 * 2. Resets demo data via POST /api/admin/reset-demo
 * 3. Runs integration tests
 * 4. Prints PASS/FAIL summary
 *
 * Usage:
 *   DEMO_JWT_SECRET=your-secret node scripts/run-demo-tests.js
 */
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const API = process.env.API_URL || 'http://localhost:4000';
const SECRET = process.env.DEMO_JWT_SECRET || 'demo-secret-change-me';

async function main() {
    console.log('\n🧪 DEMO TEST RUNNER\n');
    console.log(`  API: ${API}`);
    console.log(`  Time: ${new Date().toISOString()}\n`);

    // Step 1: Generate owner token
    const token = jwt.sign(
        { user_id: 'demo-owner-00000000-0000-0000-0000-000000000001', email: 'owner@demo.local', demo: true },
        SECRET,
        { expiresIn: '1h' }
    );
    console.log('✅ Generated owner demo token');

    // Step 2: Reset demo data
    console.log('\n🔄 Resetting demo data...');
    try {
        const { default: fetch } = await import('node-fetch');
        const resetRes = await fetch(`${API}/api/admin/reset-demo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const resetData = await resetRes.json();
        if (resetData.success) {
            console.log('✅ Demo data reset complete');
        } else {
            console.error('❌ Reset failed:', resetData.error);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Could not reach server at', API);
        console.error('   Make sure the server is running with DEMO_AUTH=true');
        process.exit(1);
    }

    // Step 3: Run integration tests
    console.log('\n🧪 Running integration tests...\n');
    try {
        execSync(
            `DEMO_AUTH=true DEMO_JWT_SECRET=${SECRET} API_URL=${API} npx vitest run src/tests --reporter=verbose`,
            { stdio: 'inherit', cwd: process.cwd() }
        );
        console.log('\n✅ ALL TESTS PASSED');
    } catch {
        console.log('\n❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

main();
