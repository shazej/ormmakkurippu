/**
 * Integration Test: Structured Error Format (STEP 26)
 * All error responses must have { success: false, error: "..." } — no stack traces.
 */
import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

describe('Structured Errors', () => {
    const errorScenarios = [
        {
            name: 'STEP 26A: invalid demo user → 401',
            req: () => api.post('/api/auth/demo-login', { email: 'notreal@x.com' }),
            expectedStatus: 401,
        },
        {
            name: 'STEP 26B: no token on protected route → 401',
            req: () => api.get('/api/me'),
            expectedStatus: 401,
        },
        {
            name: 'STEP 26C: malformed token → 401',
            req: () => api.get('/api/me', { headers: { Authorization: 'Bearer bad-token' } }),
            expectedStatus: 401,
        },
        {
            name: 'STEP 26D: non-admin on /api/admin/reset-demo → 401 or 403',
            req: () => api.post('/api/admin/reset-demo', {}),
            expectedStatus: [401, 403],
        },
    ];

    for (const scenario of errorScenarios) {
        it(scenario.name, async () => {
            const res = await scenario.req();
            const expected = Array.isArray(scenario.expectedStatus)
                ? scenario.expectedStatus
                : [scenario.expectedStatus];
            expect(expected).toContain(res.status);

            // Must have success:false
            expect(res.data.success).toBe(false);

            // Must have error string
            expect(typeof res.data.error).toBe('string');
            expect(res.data.error.length).toBeGreaterThan(0);

            // Must NOT have stack trace
            expect(res.data).not.toHaveProperty('stack');

            // Must be JSON (Content-Type check)
            const ct = res.headers['content-type'] || '';
            expect(ct).toMatch(/application\/json/);
        });
    }

    it('STEP 26E: /health is always 200 with ok:true', async () => {
        const res = await api.get('/health');
        expect(res.status).toBe(200);
        expect(res.data.ok).toBe(true);
    });
});
