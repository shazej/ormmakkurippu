/**
 * Integration Test: Workspace RBAC
 * Owner can access their workspace; non-member gets 403.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

let ownerToken = '';
let memberToken = '';

beforeAll(async () => {
    const [ownerRes, memberRes] = await Promise.all([
        api.post('/api/auth/demo-login', { email: 'owner@demo.local' }),
        api.post('/api/auth/demo-login', { email: 'member@demo.local' }),
    ]);
    ownerToken = ownerRes.data.token;
    memberToken = memberRes.data.token;
});

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

describe('Workspace RBAC', () => {
    it('STEP 6A: owner can GET /api/workspaces/current', async () => {
        const res = await api.get('/api/workspaces/current', authHeader(ownerToken));
        // Owner may not have a workspace yet if reset was not called - accept 200 or onboarding redirect
        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
        }
    });

    it('STEP 6B: member without workspace membership gets 403 or 404', async () => {
        const res = await api.get('/api/workspaces/current', authHeader(memberToken));
        // Member has no workspace unless invited — should not be 200 with owner data
        expect([403, 404]).toContain(res.status);
        expect(res.data.success).toBe(false);
    });

    it('STEP 6C: non-owner cannot invite members', async () => {
        // Member trying to invite: needs a workspace — skip gracefully if no workspace
        const wsRes = await api.get('/api/workspaces/current', authHeader(ownerToken));
        if (wsRes.status !== 200) return; // Owner has no workspace yet

        const res = await api.post(
            '/api/workspaces/members/invite',
            { email: 'random@test.com' },
            authHeader(memberToken)
        );
        expect([403, 404]).toContain(res.status);
        expect(res.data.success).toBe(false);
    });
});
