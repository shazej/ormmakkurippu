/**
 * Integration Test: Auth Gating
 * Verifies that protected routes require a valid token.
 */
import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

describe('Auth Gating', () => {
    it('STEP 3A: no token → 401 on /api/me', async () => {
        const res = await api.get('/api/me');
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
        expect(res.data.error).toMatch(/Unauthorized/i);
    });

    it('STEP 3B: malformed token → 401', async () => {
        const res = await api.get('/api/me', {
            headers: { Authorization: 'Bearer this-is-not-a-valid-token' }
        });
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
    });

    it('STEP 3C: no token → 401 on /api/tasks', async () => {
        const res = await api.get('/api/tasks');
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
    });

    it('STEP 3D: no token → 401 on /api/workspaces/current', async () => {
        const res = await api.get('/api/workspaces/current');
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
    });

    it('STEP 26B: all 401 errors have correct format', async () => {
        const endpoints = ['/api/me', '/api/tasks', '/api/workspaces/current'];
        for (const endpoint of endpoints) {
            const res = await api.get(endpoint);
            expect(res.data).not.toHaveProperty('stack');
            expect(res.data.success).toBe(false);
            expect(typeof res.data.error).toBe('string');
        }
    });
});
