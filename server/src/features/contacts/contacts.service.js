import { ContactsRepository } from './contacts.repository.js';
import { z } from 'zod';

export class ContactsService {
    constructor() {
        this.repository = new ContactsRepository();
    }

    async getContacts(user, filters) {
        return this.repository.find(user.uid, filters);
    }

    async createContact(user, data) {
        // Check uniqueness
        const existing = await this.repository.findByPhone(user.uid, data.phone_e164);
        if (existing) throw new Error('Contact with this phone number already exists.');

        return this.repository.create({
            ...data,
            owner_user_id: user.uid
        });
    }

    async updateContact(id, user, data) {
        const contact = await this.repository.findById(id);
        if (!contact || contact.owner_user_id !== user.uid) {
            throw new Error('Contact not found or access denied');
        }
        return this.repository.update(id, data);
    }
}
