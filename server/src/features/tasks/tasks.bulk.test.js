import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasksService } from './tasks.service.js';
import { AppError } from '../../utils/app-error.js';

// Mock Dependencies
vi.mock('./tasks.repository.js', () => {
    return {
        TasksRepository: vi.fn().mockImplementation(function () {
            return {
                findById: vi.fn(),
                update: vi.fn(),
                find: vi.fn(),
                create: vi.fn(),
                softDelete: vi.fn()
            };
        })
    };
});

vi.mock('../users/users.repository.js', () => {
    return {
        UsersRepository: vi.fn().mockImplementation(function () {
            return {
                findByEmail: vi.fn()
            };
        })
    };
});

describe('TasksService.bulkTasks', () => {
    let service;
    let mockRepo;
    let mockUsersRepo;

    beforeEach(() => {
        service = new TasksService();
        mockRepo = service.repository;
        mockUsersRepo = service.usersRepository;
    });

    it('should complete multiple tasks', async () => {
        const user = { uid: 'owner-id' };
        const task1 = { id: 'task-1', user_id: 'owner-id', status: 'Pending' };
        const task2 = { id: 'task-2', user_id: 'owner-id', status: 'Pending' };

        mockRepo.findById.mockResolvedValueOnce(task1).mockResolvedValueOnce(task2);
        mockRepo.update.mockResolvedValue({ status: 'Completed' });

        const result = await service.bulkTasks(user, { action: 'complete', taskIds: ['task-1', 'task-2'] });

        expect(result.successCount).toBe(2);
        expect(result.failed.length).toBe(0);
        expect(mockRepo.update).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures due to authorization', async () => {
        const user = { uid: 'user-id' };
        const ownTask = { id: 'task-1', user_id: 'user-id', status: 'Pending' };
        const otherTask = { id: 'task-2', user_id: 'other-id', status: 'Pending' };

        mockRepo.findById.mockResolvedValueOnce(ownTask).mockResolvedValueOnce(otherTask);
        mockRepo.update.mockResolvedValueOnce({ status: 'Completed' });

        const result = await service.bulkTasks(user, { action: 'delete', taskIds: ['task-1', 'task-2'] });

        expect(result.successCount).toBe(1);
        expect(result.failed.length).toBe(1);
        expect(result.failed[0].id).toBe('task-2');
        expect(result.failed[0].reason).toContain('Forbidden');
    });

    it('should assign tasks to a new email', async () => {
        const user = { uid: 'owner-id' };
        const task = { id: 'task-1', user_id: 'owner-id' };
        const targetEmail = 'new@example.com';
        const mockAssignee = { id: 'assignee-id', primary_email_id: targetEmail };

        mockRepo.findById.mockResolvedValue(task);
        mockUsersRepo.findByEmail.mockResolvedValue(mockAssignee);
        mockRepo.update.mockResolvedValue({ ...task, assigned_to_user_id: mockAssignee.id });

        const result = await service.bulkTasks(user, { action: 'assign', taskIds: ['task-1'], email: targetEmail });

        expect(result.successCount).toBe(1);
        expect(mockRepo.update).toHaveBeenCalledWith('task-1', expect.objectContaining({ assigned_to_user_id: mockAssignee.id }));
    });
});
