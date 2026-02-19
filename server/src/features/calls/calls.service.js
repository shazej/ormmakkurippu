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

    async createCallLog(user, data) {
        // 1. auto-link contact if exists
        let contactId = data.contact_id;
        if (!contactId) {
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

    // Create a task FROM a call log
    async createTaskFromCall(user, callLogId, taskData) {
        const callLog = await this.repository.findById(callLogId);
        if (!callLog || callLog.owner_user_id !== user.uid) {
            throw new Error('Call log not found or access denied');
        }

        const task = await this.tasksRepo.create({
            title: taskData.title || `Call from ${callLog.caller_name || callLog.caller_phone_e164}`,
            description: taskData.description || callLog.notes,
            priority: 'Medium',
            uid: user.uid, // owner
            related_call_log_id: callLog.id,
            related_contact_id: callLog.contact_id,
            caller_phone_e164: callLog.caller_phone_e164,
            fromName: callLog.caller_name || undefined,
            fromPhone: callLog.caller_phone_e164
            // assigned_to_email could be passed in taskData if needed
        });

        return task;
    }
}
