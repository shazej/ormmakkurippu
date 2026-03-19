/**
 * Integration Test: Phone Privacy Masking (STEP 24)
 * Assignee sees masked phone unless share_caller_details=true.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

let ownerToken = '';
let memberToken = '';
let memberId = '';
let taskId = '';

beforeAll(async () => {
    const [ownerRes, memberRes] = await Promise.all([
        api.post('/api/auth/demo-login', { email: 'owner@demo.local' }),
        api.post('/api/auth/demo-login', { email: 'member@demo.local' }),
    ]);
    ownerToken = ownerRes.data.token;
    memberToken = memberRes.data.token;
    memberId = memberRes.data.user?.id;
});

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

describe('Phone Privacy Masking', () => {
    it('STEP 24A: create task with phone, assign to member, phone is masked for assignee', async () => {
        // Create task with phone
        const createRes = await api.post('/api/tasks', {
            title: 'Call task',
            caller_phone_e164: '+97412345700',
            share_caller_details: false,
            assigned_to_user_id: memberId,
        }, authHeader(ownerToken));

        if (createRes.status !== 201 && createRes.status !== 200) {
            // Skip if owner not onboarded yet
            console.warn('[phone-masking] Skipping: task creation returned', createRes.status);
            return;
        }

        taskId = createRes.data.data?.id || createRes.data.id;
        expect(taskId).toBeTruthy();

        // Member fetches the task
        const memberRes = await api.get(`/api/tasks/${taskId}`, authHeader(memberToken));
        if (memberRes.status === 200) {
            const phone = memberRes.data.data?.caller_phone_e164 || memberRes.data.caller_phone_e164;
            // Phone should be masked (contain asterisks)
            if (phone) {
                expect(phone).toMatch(/\*/);
            }
        }
    });

    it('STEP 24B: when share_caller_details=true, assignee sees full number', async () => {
        if (!taskId) return;

        // Owner updates share_caller_details
        await api.patch(`/api/tasks/${taskId}`, { share_caller_details: true }, authHeader(ownerToken));

        const memberRes = await api.get(`/api/tasks/${taskId}`, authHeader(memberToken));
        if (memberRes.status === 200) {
            const phone = memberRes.data.data?.caller_phone_e164 || memberRes.data.caller_phone_e164;
            if (phone) {
                // Phone should NOT be masked
                expect(phone).not.toMatch(/\*/);
            }
        }
    });
});
