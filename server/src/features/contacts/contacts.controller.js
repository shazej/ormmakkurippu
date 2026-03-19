import { ContactsService } from './contacts.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';
import { normalizePhone } from '../../utils/phone-utils.js';

export class ContactsController {
    constructor() {
        this.service = new ContactsService();
    }

    getContacts = async (req, res) => {
        try {
            const contacts = await this.service.getContacts(req.user, req.query);
            sendSuccess(res, contacts);
        } catch (error) {
            sendError(res, error);
        }
    };

    createContact = async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().optional(),
                phone_e164: z.string().min(5),
                email: z.string().email().optional().or(z.literal('')),
                company: z.string().optional(),
                tags: z.array(z.string()).optional()
            });
            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            // Normalize Phone
            try {
                result.data.phone_e164 = normalizePhone(result.data.phone_e164);
            } catch (err) {
                return sendError(res, { message: err.message, statusCode: 400, isOperational: true });
            }

            const contact = await this.service.createContact(req.user, result.data);
            sendSuccess(res, contact, 'Contact created', 201);
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                return sendError(res, { message: error.message, statusCode: 409, isOperational: true });
            }
            sendError(res, error);
        }
    };
}
