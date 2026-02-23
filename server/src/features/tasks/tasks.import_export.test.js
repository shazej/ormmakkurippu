import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasksService } from './tasks.service.js';
import { AppError } from '../../utils/app-error.js';
import * as fastcsv from 'fast-csv';

// Mock Dependencies
vi.mock('./tasks.repository.js', () => ({
    TasksRepository: vi.fn().mockImplementation(function () {
        return {
            find: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            setLabels: vi.fn()
        };
    })
}));

vi.mock('../projects/projects.repository.js', () => ({
    ProjectsRepository: vi.fn().mockImplementation(function () {
        return {
            findByWorkspaceId: vi.fn()
        };
    })
}));

vi.mock('../labels/labels.repository.js', () => ({
    LabelsRepository: vi.fn().mockImplementation(function () {
        return {
            findByOwner: vi.fn(),
            create: vi.fn()
        };
    })
}));

vi.mock('../users/users.repository.js', () => ({
    UsersRepository: vi.fn().mockImplementation(function () {
        return {
            findWorkspaces: vi.fn()
        };
    })
}));

describe('TasksService CSV Export/Import', () => {
    let service;
    beforeEach(() => {
        service = new TasksService();
    });

    describe('exportTasksCsv', () => {
        it('should format tasks as CSV string', async () => {
            const user = { uid: 'u1' };
            const tasks = [
                { title: 'T1', description: 'D1', due_date: new Date('2024-01-01'), status: 'Pending', project_id: 'p1', labels: [{ name: 'L1' }] }
            ];
            service.repository.find.mockResolvedValue(tasks);
            service.usersRepository.findWorkspaces.mockResolvedValue([{ id: 'w1' }]);
            service.projectsRepository.findByWorkspaceId.mockResolvedValue([{ id: 'p1', name: 'Project 1' }]);

            const csv = await service.exportTasksCsv(user);
            expect(csv).toContain('title,description,due_date,status,project,labels');
            expect(csv).toContain('T1,D1,2024-01-01T00:00:00.000Z,Pending,Project 1,L1');
        });
    });

    describe('importTasksCsv', () => {
        it('should import tasks from buffer', async () => {
            const user = { uid: 'u1' };
            const csvContent = 'title,description,due_date,status,project,labels\nTask 1,Desc 1,2024-02-01,Pending,Project 1,Label1';
            const buffer = Buffer.from(csvContent);

            service.usersRepository.findWorkspaces.mockResolvedValue([{ id: 'w1' }]);
            service.projectsRepository.findByWorkspaceId.mockResolvedValue([{ id: 'p1', name: 'Project 1' }]);
            service.labelsRepository.findByOwner.mockResolvedValue([]);
            service.labelsRepository.create.mockResolvedValue({ id: 'l1' });
            service.repository.create.mockResolvedValue({ id: 'new-t1' });

            const results = await service.importTasksCsv(user, buffer);
            expect(results.successCount).toBe(1);
            expect(results.total).toBe(1);
            expect(service.repository.create).toHaveBeenCalled();
            expect(service.repository.setLabels).toHaveBeenCalledWith('new-t1', ['l1']);
        });

        it('should throw error if rows exceed 5000', async () => {
            const user = { uid: 'u1' };
            const rows = 'title\n' + 'test\n'.repeat(5001);
            const buffer = Buffer.from(rows);

            await expect(service.importTasksCsv(user, buffer))
                .rejects.toThrow('Import limit exceeded');
        });
    });
});
