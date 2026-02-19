import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasksService } from './tasks.service.js';
import { AppError } from '../../utils/app-error.js';

// Mock Dependencies
vi.mock('./tasks.repository.js', () => {
    return {
        TasksRepository: vi.fn().mockImplementation(() => ({
            findById: vi.fn(),
            update: vi.fn(),
            find: vi.fn(),
            create: vi.fn()
        }))
    };
});

vi.mock('../users/users.repository.js', () => {
    return {
        UsersRepository: vi.fn().mockImplementation(() => ({
            findByEmail: vi.fn()
        }))
    };
});

describe('TasksService.updateTask', () => {
    let service;
    let mockRepo;
    let mockUsersRepo;

    beforeEach(() => {
        service = new TasksService();
        mockRepo = service.repository;
        mockUsersRepo = service.usersRepository;
    });

    it('should allow Owner to update title', async () => {
        const user = { uid: 'owner-id' };
        const task = { id: 'task-1', user_id: 'owner-id', title: 'Old Title' };

        mockRepo.findById.mockResolvedValue(task);
        mockRepo.update.mockResolvedValue({ ...task, title: 'New Title' });

        const result = await service.updateTask('task-1', user, { title: 'New Title' });

        expect(mockRepo.update).toHaveBeenCalledWith('task-1', { title: 'New Title' });
        expect(result.title).toBe('New Title');
    });

    it('should allow Assignee to update status', async () => {
        const user = { uid: 'assignee-id' };
        // Owner is someone else, Assignee is current user
        const task = { id: 'task-1', user_id: 'owner-id', assigned_to_user_id: 'assignee-id', status: 'Pending' };

        mockRepo.findById.mockResolvedValue(task);
        mockRepo.update.mockResolvedValue({ ...task, status: 'Completed' });

        const result = await service.updateTask('task-1', user, { status: 'Completed' });

        expect(mockRepo.update).toHaveBeenCalledWith('task-1', { status: 'Completed' });
    });

    it('should ignore Title update from Assignee', async () => {
        const user = { uid: 'assignee-id' };
        const task = { id: 'task-1', user_id: 'owner-id', assigned_to_user_id: 'assignee-id', title: 'Old Title' };

        mockRepo.findById.mockResolvedValue(task);
        // Should call update but with EMPTY object if only 'title' was passed?
        // Wait, if object keys are empty, service returns task early without calling repo.update.

        const result = await service.updateTask('task-1', user, { title: 'Hacked Title' });

        expect(mockRepo.update).not.toHaveBeenCalled();
        expect(result).toBe(task); // Returns original task
    });

    it('should allow Assignee to update notes', async () => {
        const user = { uid: 'assignee-id' };
        const task = { id: 'task-1', user_id: 'owner-id', assigned_to_user_id: 'assignee-id' };

        mockRepo.findById.mockResolvedValue(task);
        mockRepo.update.mockResolvedValue({ ...task, notes: 'New Note' });

        await service.updateTask('task-1', user, { notes: 'New Note' });

        expect(mockRepo.update).toHaveBeenCalledWith('task-1', { notes: 'New Note' });
    });

    it('should forbid Random user', async () => {
        const user = { uid: 'random-id' };
        const task = { id: 'task-1', user_id: 'owner-id', assigned_to_user_id: 'assignee-id' };

        mockRepo.findById.mockResolvedValue(task);

        await expect(service.updateTask('task-1', user, { status: 'Completed' }))
            .rejects.toThrow(AppError);
    });
});
