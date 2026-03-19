import { CallLogsRepository } from './calls.repository.js';
import { ContactsRepository } from '../contacts/contacts.repository.js';
import { TasksRepository } from '../tasks/tasks.repository.js';

export class CallLogsService {
    constructor() {
        this.repository = new CallLogsRepository();
        this.contactsRepo = new ContactsRepository();
        this.tasksRepo = new TasksRepository();
    }

    async getCallLogs(user, filters) {
        return this.repository.find(user.uid, filters);
    }

    async getCallLog(user, callLogId) {
        const callLog = await this.repository.findById(callLogId);
        if (!callLog || callLog.owner_user_id !== user.uid || callLog.deleted_at) {
            const err = new Error('Call log not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return callLog;
    }

    async createCallLog(user, data) {
        // auto-link contact if exists by phone
        let contactId = data.contact_id || null;
        if (!contactId && data.caller_phone_e164) {
            const existingContact = await this.contactsRepo.findByPhone(user.uid, data.caller_phone_e164);
            if (existingContact) {
                contactId = existingContact.id;
            }
        }

        return this.repository.create({
            ...data,
            owner_user_id: user.uid,
            contact_id: contactId
        });
    }

    async updateCallLog(user, callLogId, data) {
        const callLog = await this.repository.findById(callLogId);
        if (!callLog || callLog.owner_user_id !== user.uid || callLog.deleted_at) {
            const err = new Error('Call log not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // If phone changed, re-run auto-link
        if (data.caller_phone_e164 && data.caller_phone_e164 !== callLog.caller_phone_e164) {
            const existingContact = await this.contactsRepo.findByPhone(user.uid, data.caller_phone_e164);
            if (existingContact && !data.contact_id) {
                data.contact_id = existingContact.id;
            }
        }

        return this.repository.update(callLogId, data);
    }

    async deleteCallLog(user, callLogId) {
        const callLog = await this.repository.findById(callLogId);
        if (!callLog || callLog.owner_user_id !== user.uid || callLog.deleted_at) {
            const err = new Error('Call log not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return this.repository.softDelete(callLogId);
    }

    async createTaskFromCall(user, callLogId, taskData) {
        const callLog = await this.repository.findById(callLogId);
        if (!callLog || callLog.owner_user_id !== user.uid) {
            const err = new Error('Call log not found or access denied');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // Prevent duplicate task creation — check if a non-deleted task already exists for this call
        const existingTasks = (callLog.tasks || []).filter(t => !t.deleted_at);
        if (existingTasks.length > 0) {
            const err = new Error('A task already exists for this call');
            err.statusCode = 409;
            err.isOperational = true;
            throw err;
        }

        const task = await this.tasksRepo.create({
            title: taskData.title || `Follow-up: ${callLog.caller_name || callLog.caller_phone_e164}`,
            description: taskData.description || callLog.notes || `Follow-up from call on ${new Date(callLog.call_time).toLocaleDateString()}`,
            priority: 'Medium',
            uid: user.uid,
            related_call_log_id: callLog.id,
            related_contact_id: callLog.contact_id,
            caller_phone_e164: callLog.caller_phone_e164,
            fromName: callLog.caller_name || undefined,
            fromPhone: callLog.caller_phone_e164,
            assigned_to_email: taskData.assignToEmail || undefined
        });

        return task;
    }
}
