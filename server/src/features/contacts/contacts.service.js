import { ContactsRepository } from './contacts.repository.js';
import { AppError } from '../../utils/app-error.js';

export class ContactsService {
    constructor() {
        this.repository = new ContactsRepository();
    }

    async getContacts(user, filters) {
        return this.repository.find(user.uid, filters);
    }

    async getContact(id, user) {
        const contact = await this.repository.findWithHistory(id, user.uid);
        if (!contact) throw new AppError('Contact not found', 404);
        return contact;
    }

    async createContact(user, data) {
        // Check if a contact (active or soft-deleted) already occupies this phone+owner slot
        const existingByPhone = await this.repository.findByPhone(user.uid, data.phone_e164);
        if (existingByPhone) {
            if (existingByPhone.deleted_at) {
                // Slot occupied by a soft-deleted contact — hard delete it to free the unique slot
                await this.repository.hardDelete(existingByPhone.id);
            } else {
                throw new AppError('A contact with this phone number already exists.', 409);
            }
        }

        // Enforce email uniqueness against non-deleted contacts
        if (data.email) {
            const existingByEmail = await this.repository.findByEmail(user.uid, data.email);
            if (existingByEmail) {
                throw new AppError('A contact with this email already exists.', 409);
            }
        }

        const contact = await this.repository.create({
            ...data,
            owner_user_id: user.uid
        });

        // Retroactively link existing unlinked call logs for this phone
        await this.repository.relinkCallsByPhone(user.uid, data.phone_e164, contact.id);

        return contact;
    }

    async updateContact(id, user, data) {
        // findById already excludes soft-deleted contacts
        const existing = await this.repository.findById(id);
        if (!existing || existing.owner_user_id !== user.uid) {
            throw new AppError('Contact not found or access denied', 404);
        }

        // If phone is changing, check for conflicts with other active contacts
        if (data.phone_e164 && data.phone_e164 !== existing.phone_e164) {
            const duplicate = await this.repository.findByPhone(user.uid, data.phone_e164);
            // Only block if duplicate is active (not soft-deleted) and is a different contact
            if (duplicate && !duplicate.deleted_at && duplicate.id !== id) {
                throw new AppError('A contact with this phone number already exists.', 409);
            }
            // If duplicate is soft-deleted, hard delete it to free the unique slot
            if (duplicate && duplicate.deleted_at && duplicate.id !== id) {
                await this.repository.hardDelete(duplicate.id);
            }
        }

        // If email is changing, check for conflicts with other active contacts
        if (data.email && data.email !== existing.email) {
            const duplicate = await this.repository.findByEmail(user.uid, data.email);
            if (duplicate && duplicate.id !== id) {
                throw new AppError('A contact with this email already exists.', 409);
            }
        }

        const updated = await this.repository.update(id, data);

        // Re-link unlinked calls to this contact if phone changed
        if (data.phone_e164 && data.phone_e164 !== existing.phone_e164) {
            await this.repository.relinkCallsByPhone(user.uid, data.phone_e164, id);
        }

        return updated;
    }

    async deleteContact(id, user) {
        // findById already excludes soft-deleted contacts
        const existing = await this.repository.findById(id);
        if (!existing || existing.owner_user_id !== user.uid) {
            throw new AppError('Contact not found or access denied', 404);
        }
        return this.repository.softDelete(id);
    }
}
