import { ContactsRepository } from './contacts.repository.js';

export class ContactsService {
    constructor() {
        this.repository = new ContactsRepository();
    }

    async getContacts(user, filters) {
        return this.repository.find(user.uid, filters);
    }

    async createContact(user, data) {
        // Check uniqueness only if phone provided
        if (data.phone_e164) {
            const existing = await this.repository.findByPhone(user.uid, data.phone_e164);
            if (existing) throw Object.assign(new Error('Contact with this phone number already exists.'), { statusCode: 409, isOperational: true });
        }

        return this.repository.create({
            ...data,
            owner_user_id: user.uid
        });
    }

    async updateContact(id, user, data) {
        const contact = await this.repository.findById(id);
        if (!contact || contact.owner_user_id !== user.uid) {
            throw Object.assign(new Error('Contact not found or access denied.'), { statusCode: 404, isOperational: true });
        }
        return this.repository.update(id, data);
    }
}
