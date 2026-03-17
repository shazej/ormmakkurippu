/**
 * Task Sharing — Unit Tests
 *
 * Tests are written at the service layer with mocked repositories.
 * Pattern matches the existing tasks.updates.test.js in this repo.
 *
 * Run: cd server && npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskSharingService } from './task-sharing.service.js';
import { AppError } from '../../utils/app-error.js';

// ── Mock the repository so we never hit the DB ────────────────────────────────
vi.mock('./task-sharing.repository.js', () => ({
    TaskSharingRepository: class {
        constructor() {
            this.create             = vi.fn();
            this.findActiveByToken  = vi.fn();
            this.recordAccess       = vi.fn().mockResolvedValue(undefined);
            this.findByTaskId       = vi.fn();
            this.revokeByToken      = vi.fn();
        }
    }
}));

// Also mock the tasks.service.js sharing methods via repository
// (tested separately via TasksService tests below)
vi.mock('../tasks/tasks.repository.js', () => ({
    TasksRepository: class {
        constructor() {
            this.findById = vi.fn();
            this.update   = vi.fn();
            this.find     = vi.fn();
            this.create   = vi.fn();
        }
    }
}));

vi.mock('../users/users.repository.js', () => ({
    UsersRepository: class {
        constructor() {
            this.findByEmail = vi.fn();
        }
    }
}));

// ── TaskSharingService ────────────────────────────────────────────────────────
describe('TaskSharingService.getTaskByToken', () => {
    let service;
    let mockRepo;

    beforeEach(() => {
        service  = new TaskSharingService();
        mockRepo = service.repository;
    });

    it('returns the safe task projection for a valid active token', async () => {
        const fakeLink = {
            token: 'abc123',
            expires_at: null,
            revoked_at: null,
            permissions: { view: true },
            task: {
                id: 'task-1',
                title: 'Fix the login page',
                description: 'Users cannot log in on mobile.',
                category: 'Bug',
                priority: 'High',
                status: 'Pending',
                due_date: new Date('2030-01-01'),
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: null
            }
        };

        mockRepo.findActiveByToken.mockResolvedValue(fakeLink);

        const result = await service.getTaskByToken('abc123');

        expect(result.id).toBe('task-1');
        expect(result.title).toBe('Fix the login page');
        expect(result.status).toBe('Pending');
        // Sensitive fields must NOT be present
        expect(result.from_name).toBeUndefined();
        expect(result.from_phone).toBeUndefined();
        expect(result.notes).toBeUndefined();
        expect(result.user_id).toBeUndefined();
        expect(result.assigned_to_user_id).toBeUndefined();
        expect(result.assigned_to_email).toBeUndefined();
        // Share metadata should be attached
        expect(result.share).toEqual({ expires_at: null, permissions: { view: true } });
    });

    it('throws 404 when token is not found or already expired/revoked', async () => {
        mockRepo.findActiveByToken.mockResolvedValue(null);

        await expect(service.getTaskByToken('invalid-token'))
            .rejects.toThrow(AppError);

        await expect(service.getTaskByToken('invalid-token'))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('fires recordAccess without awaiting (fire-and-forget)', async () => {
        const fakeLink = {
            token: 't1', expires_at: null, revoked_at: null,
            permissions: { view: true },
            task: {
                id: 'x', title: 'T', description: null, category: 'G',
                priority: 'Low', status: 'Pending', due_date: null,
                created_at: new Date(), updated_at: new Date(), deleted_at: null
            }
        };
        mockRepo.findActiveByToken.mockResolvedValue(fakeLink);

        await service.getTaskByToken('t1');

        // recordAccess is called but its result is not awaited by the service
        expect(mockRepo.recordAccess).toHaveBeenCalledWith('t1');
    });

    it('does not throw when recordAccess fails', async () => {
        const fakeLink = {
            token: 't2', expires_at: null, revoked_at: null,
            permissions: { view: true },
            task: {
                id: 'y', title: 'T2', description: null, category: 'G',
                priority: 'Low', status: 'Pending', due_date: null,
                created_at: new Date(), updated_at: new Date(), deleted_at: null
            }
        };
        mockRepo.findActiveByToken.mockResolvedValue(fakeLink);
        mockRepo.recordAccess.mockRejectedValue(new Error('DB timeout'));

        // Should still resolve — recordAccess failure must not surface
        await expect(service.getTaskByToken('t2')).resolves.toBeTruthy();
    });
});

// ── TasksService sharing methods ──────────────────────────────────────────────
import { TasksService } from '../tasks/tasks.service.js';

// Note: vi.mock('./task-sharing.repository.js') is already defined above with the factory.
// Do NOT add a second bare vi.mock() call — it would replace the factory with an auto-mock
// whose methods return undefined (not a Promise), breaking .catch() calls.

describe('TasksService.shareTask', () => {
    let service;
    let mockRepo;
    let mockSharingRepo;

    beforeEach(() => {
        service         = new TasksService();
        mockRepo        = service.repository;
        mockSharingRepo = service.sharingRepository;
    });

    it('creates a share link for the task owner', async () => {
        const owner  = { uid: 'owner-uid' };
        const task   = { id: 'task-1', user_id: 'owner-uid', deleted_at: null };
        const fakeLink = {
            id: 'link-1', token: 'tok123',
            expires_at: null, created_at: new Date()
        };

        mockRepo.findById.mockResolvedValue(task);
        mockSharingRepo.create.mockResolvedValue(fakeLink);

        const result = await service.shareTask('task-1', owner, { expiresIn: 'never' });

        expect(mockSharingRepo.create).toHaveBeenCalledWith('task-1', 'owner-uid', null);
        expect(result.token).toBe('tok123');
        expect(result.shareUrl).toMatch(/\/shared\/task\/tok123$/);
    });

    it('throws 403 when a non-owner tries to create a share link', async () => {
        const nonOwner = { uid: 'other-uid' };
        const task     = { id: 'task-1', user_id: 'owner-uid', deleted_at: null };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.shareTask('task-1', nonOwner, {}))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 400 when attempting to share a deleted task', async () => {
        const owner = { uid: 'owner-uid' };
        const task  = { id: 'task-1', user_id: 'owner-uid', deleted_at: new Date() };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.shareTask('task-1', owner, {}))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 404 when the task does not exist', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(service.shareTask('nonexistent', { uid: 'u' }, {}))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 for an unknown expiresIn value', async () => {
        const owner = { uid: 'owner-uid' };
        const task  = { id: 'task-1', user_id: 'owner-uid', deleted_at: null };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.shareTask('task-1', owner, { expiresIn: 'bogus' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('computes expiresAt correctly for "24h"', async () => {
        const owner    = { uid: 'owner-uid' };
        const task     = { id: 'task-1', user_id: 'owner-uid', deleted_at: null };
        const fakeLink = { id: 'l', token: 't', expires_at: null, created_at: new Date() };

        mockRepo.findById.mockResolvedValue(task);
        mockSharingRepo.create.mockResolvedValue(fakeLink);

        const before = Date.now();
        await service.shareTask('task-1', owner, { expiresIn: '24h' });
        const after  = Date.now();

        const [, , expiresAt] = mockSharingRepo.create.mock.calls[0];
        const expected24h = 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeInstanceOf(Date);
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + expected24h - 100);
        expect(expiresAt.getTime()).toBeLessThanOrEqual(after  + expected24h + 100);
    });
});

describe('TasksService.listShareLinks', () => {
    let service;
    let mockRepo;
    let mockSharingRepo;

    beforeEach(() => {
        service         = new TasksService();
        mockRepo        = service.repository;
        mockSharingRepo = service.sharingRepository;
    });

    it('returns links with isActive derived correctly', async () => {
        const owner = { uid: 'owner-uid' };
        const task  = { id: 'task-1', user_id: 'owner-uid' };
        const links = [
            {
                id: 'l1', token: 'active-tok', expires_at: null,
                revoked_at: null, access_count: 5,
                last_accessed_at: new Date(), created_at: new Date()
            },
            {
                id: 'l2', token: 'revoked-tok', expires_at: null,
                revoked_at: new Date(), access_count: 2,
                last_accessed_at: null, created_at: new Date()
            }
        ];

        mockRepo.findById.mockResolvedValue(task);
        mockSharingRepo.findByTaskId.mockResolvedValue(links);

        const result = await service.listShareLinks('task-1', owner);

        expect(result).toHaveLength(2);
        expect(result.find(l => l.token === 'active-tok').isActive).toBe(true);
        expect(result.find(l => l.token === 'revoked-tok').isActive).toBe(false);
    });

    it('throws 403 for non-owner', async () => {
        const nonOwner = { uid: 'other-uid' };
        const task     = { id: 'task-1', user_id: 'owner-uid' };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.listShareLinks('task-1', nonOwner))
            .rejects.toMatchObject({ statusCode: 403 });
    });
});

describe('TasksService.revokeShareLink', () => {
    let service;
    let mockRepo;
    let mockSharingRepo;

    beforeEach(() => {
        service         = new TasksService();
        mockRepo        = service.repository;
        mockSharingRepo = service.sharingRepository;
    });

    it('revokes a link successfully for the task owner', async () => {
        const owner = { uid: 'owner-uid' };
        const task  = { id: 'task-1', user_id: 'owner-uid' };

        mockRepo.findById.mockResolvedValue(task);
        mockSharingRepo.revokeByToken.mockResolvedValue({ token: 'tok', revokedAt: new Date() });

        const result = await service.revokeShareLink('task-1', 'tok', owner);
        expect(result.revoked).toBe(true);
    });

    it('throws 404 when the token does not belong to the task', async () => {
        const owner = { uid: 'owner-uid' };
        const task  = { id: 'task-1', user_id: 'owner-uid' };

        mockRepo.findById.mockResolvedValue(task);
        mockSharingRepo.revokeByToken.mockResolvedValue(null);  // nothing matched

        await expect(service.revokeShareLink('task-1', 'unknown-tok', owner))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 for a non-owner', async () => {
        const nonOwner = { uid: 'other-uid' };
        const task     = { id: 'task-1', user_id: 'owner-uid' };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.revokeShareLink('task-1', 'tok', nonOwner))
            .rejects.toMatchObject({ statusCode: 403 });
    });
});
