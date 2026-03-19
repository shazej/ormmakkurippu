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
                create: vi.fn()
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

describe('TasksService Recurrence', () => {
    let service;
    let mockRepo;

    beforeEach(() => {
        service = new TasksService();
        mockRepo = service.repository;
    });

    describe('_calculateNextDueDate', () => {
        it('should calculate daily recurrence correctly', () => {
            const date = new Date('2024-01-01T10:00:00Z');
            const next = service._calculateNextDueDate(date, 'daily');
            expect(next.toISOString()).toBe('2024-01-02T10:00:00.000Z');
        });

        it('should calculate weekly recurrence correctly', () => {
            const date = new Date('2024-01-01T10:00:00Z');
            const next = service._calculateNextDueDate(date, 'weekly');
            expect(next.toISOString()).toBe('2024-01-08T10:00:00.000Z');
        });

        it('should calculate monthly recurrence correctly', () => {
            const date = new Date('2024-01-01T10:00:00Z');
            const next = service._calculateNextDueDate(date, 'monthly');
            expect(next.toISOString()).toBe('2024-02-01T10:00:00.000Z');
        });
    });

    describe('updateTask completion recurrence', () => {
        const user = { uid: 'owner-id' };

        it('should create next instance on completion', async () => {
            const task = {
                id: 'task-1',
                user_id: 'owner-id',
                status: 'Pending',
                recurrence_rule: 'daily',
                due_date: new Date('2024-01-01T10:00:00Z'),
                title: 'Recurring Task'
            };

            mockRepo.findById.mockResolvedValue(task);
            mockRepo.update.mockResolvedValue({ ...task, status: 'Completed' });
            mockRepo.create.mockResolvedValue({ id: 'task-2' });

            await service.updateTask('task-1', user, { status: 'Completed' });

            expect(mockRepo.create).toHaveBeenCalled();
            const createCallArgs = mockRepo.create.mock.calls[0][0];
            expect(createCallArgs.title).toBe('Recurring Task');
            expect(createCallArgs.dueDate).toBe('2024-01-02T10:00:00.000Z');

            // Should link them
            expect(mockRepo.update).toHaveBeenCalledWith('task-1', { nextInstanceId: 'task-2' });
        });

        it('should not create duplicate instances (idempotency)', async () => {
            const task = {
                id: 'task-1',
                user_id: 'owner-id',
                status: 'Completed',
                recurrence_rule: 'daily',
                next_instance_id: 'task-2'
            };

            mockRepo.findById.mockResolvedValue(task);
            mockRepo.update.mockResolvedValue(task);

            await service.updateTask('task-1', user, { status: 'Completed' });

            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should only allow owner to trigger recurrence', async () => {
            const assignee = { uid: 'assignee-id' };
            const task = {
                id: 'task-1',
                user_id: 'owner-id',
                assigned_to_user_id: 'assignee-id',
                status: 'Pending',
                recurrence_rule: 'daily'
            };

            mockRepo.findById.mockResolvedValue(task);
            mockRepo.update.mockResolvedValue({ ...task, status: 'Completed' });

            await service.updateTask('task-1', assignee, { status: 'Completed' });

            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });
});
