/**
 * Integration Test: Demo Auth (POST /api/auth/demo-login)
 * Requires a live server at http://localhost:4000 with DEMO_AUTH=true
 */
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

describe('DEMO Auth - POST /api/auth/demo-login', () => {
    it('STEP 2A: returns token + user for owner@demo.local', async () => {
        const res = await api.post('/api/auth/demo-login', { email: 'owner@demo.local' });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.token).toBeTruthy();
        expect(res.data.user.email).toBe('owner@demo.local');
        expect(res.data.user.name).toBe('Demo Owner');
    });

    it('STEP 2B: returns token + user for member@demo.local', async () => {
        const res = await api.post('/api/auth/demo-login', { email: 'member@demo.local' });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.token).toBeTruthy();
        expect(res.data.user.email).toBe('member@demo.local');
    });

    it('STEP 2C: returns 401 for invalid demo email', async () => {
        const res = await api.post('/api/auth/demo-login', { email: 'hacker@evil.com' });
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
        expect(res.data.error).toBe('Invalid demo user');
    });

    it('STEP 2D: /api/me works with returned token', async () => {
        const loginRes = await api.post('/api/auth/demo-login', { email: 'owner@demo.local' });
        const token = loginRes.data.token;

        const meRes = await api.get('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(meRes.status).toBe(200);
        expect(meRes.data.data?.primary_email_id || meRes.data.email).toBeTruthy();
    });

    it('STEP 3: re-login returns same user ID (idempotent)', async () => {
        const r1 = await api.post('/api/auth/demo-login', { email: 'owner@demo.local' });
        const r2 = await api.post('/api/auth/demo-login', { email: 'owner@demo.local' });
        expect(r1.data.user.id).toBe(r2.data.user.id);
    });

    it('STEP 26A: error response has no stack trace', async () => {
        const res = await api.post('/api/auth/demo-login', { email: 'bad@bad.com' });
        expect(res.data).not.toHaveProperty('stack');
        expect(res.data.success).toBe(false);
        expect(typeof res.data.error).toBe('string');
    });
});
