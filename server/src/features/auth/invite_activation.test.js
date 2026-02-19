import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { logAudit } from '../../admin/audit.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { PrismaClient } from '@prisma/client';

const { mockTx, mockPrisma, mockUsersRepo, mockWorkspacesService } = vi.hoisted(() => {
    const mockTx = {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        workspaceMember: {
            findMany: vi.fn(),
            updateMany: vi.fn()
        },
        task: {
            updateMany: vi.fn()
        }
    };

    const mockPrisma = {
        $transaction: vi.fn(async (callback) => await callback(mockTx)),
        ...mockTx
    };

    const mockUsersRepo = {
        createOrUpdateGoogleUser: vi.fn()
    };

    const mockWorkspacesService = {
        ensureDefaultWorkspace: vi.fn().mockResolvedValue({})
    };

    return { mockTx, mockPrisma, mockUsersRepo, mockWorkspacesService };
});

// Mocks
vi.mock('../../firebase.js', () => ({
    auth: {},
    db: {}
}));

vi.mock('../../drive.js', () => ({
    getOAuthClient: vi.fn(() => ({
        getToken: vi.fn().mockResolvedValue({ tokens: {} }),
        setCredentials: vi.fn()
    }))
}));

vi.mock('googleapis', () => ({
    google: {
        oauth2: vi.fn(() => ({
            userinfo: {
                get: vi.fn().mockResolvedValue({
                    data: {
                        id: 'google-123',
                        email: 'test@example.com',
                        name: 'Test User',
                        picture: 'pic.jpg',
                        verified_email: true
                    }
                })
            }
        }))
    }
}));

vi.mock('../../admin/audit.js', () => ({
    logAudit: vi.fn()
}));

vi.mock('../workspaces/workspaces.service.js', () => ({
    WorkspacesService: class {
        constructor() { return mockWorkspacesService; }
    }
}));

vi.mock('../users/users.repository.js', () => ({
    UsersRepository: class {
        constructor() { return mockUsersRepo; }
    }
}));

vi.mock('@prisma/client', () => ({
    PrismaClient: class {
        constructor() {
            return mockPrisma;
        }
    }
}));

describe('AuthService - Invite Auto-Activation', () => {
    let authService;

    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService();
    });

    it('should activate pending invites upon login', async () => {
        // Setup: Mock User Linkage/Creation
        const mockUser = { id: 'user-123', primary_email_id: 'test@example.com', role: 'USER' };

        // Mock UsersRepository response
        mockUsersRepo.createOrUpdateGoogleUser.mockResolvedValue(mockUser);

        // Setup: Mock Pending Invites
        const mockInvites = [
            { id: 'invite-1', workspace_id: 'ws-1', email: 'test@example.com', status: 'PENDING' },
            { id: 'invite-2', workspace_id: 'ws-2', email: 'test@example.com', status: 'PENDING' }
        ];
        mockTx.workspaceMember.findMany.mockResolvedValue(mockInvites);

        // Execute
        const result = await authService.loginWithGoogle('mock-code');

        // Assert: User Created (via Repository)
        expect(result.user).toEqual(mockUser);
        expect(mockUsersRepo.createOrUpdateGoogleUser).toHaveBeenCalled();

        // Assert: Pending Invites Found
        expect(mockTx.workspaceMember.findMany).toHaveBeenCalledWith({
            where: { email: 'test@example.com', status: 'PENDING' }
        });

        // Assert: Invites Activated
        expect(mockTx.workspaceMember.updateMany).toHaveBeenCalledWith({
            where: { email: 'test@example.com', status: 'PENDING' },
            data: {
                status: 'ACTIVE',
                user_id: 'user-123',
                joined_at: expect.any(Date)
            }
        });

        // Assert: Audit Log Called
        expect(logAudit).toHaveBeenCalledTimes(2);
        expect(logAudit).toHaveBeenCalledWith(
            expect.objectContaining({ uid: 'user-123' }),
            'WORKSPACE_INVITE_ACCEPTED',
            'workspace',
            'ws-1',
            expect.objectContaining({ memberId: 'invite-1' })
        );
    });

    it('should handle no pending invites gracefully', async () => {
        // Setup: Mock User
        const mockUser = { id: 'user-123', primary_email_id: 'test@example.com' };
        mockUsersRepo.createOrUpdateGoogleUser.mockResolvedValue(mockUser);

        // Setup: No Invites
        mockTx.workspaceMember.findMany.mockResolvedValue([]);

        // Execute
        await authService.loginWithGoogle('mock-code');

        // Assert: No Update Called
        expect(mockTx.workspaceMember.updateMany).not.toHaveBeenCalled();
        expect(logAudit).not.toHaveBeenCalled();
    });
});
