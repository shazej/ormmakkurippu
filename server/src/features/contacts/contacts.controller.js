import { ContactsService } from './contacts.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';
import { normalizePhone } from '../../utils/phone-utils.js';

const service = new ContactsService();

export class ContactsController {

    getContacts = async (req, res) => {
        try {
            const contacts = await service.getContacts(req.user, req.query);
            sendSuccess(res, contacts);
        } catch (error) {
            sendError(res, error);
        }
    };

    createContact = async (req, res) => {
        try {
            const schema = z.object({
                name:      z.string().min(1).max(200).optional(),
                phone:     z.string().optional(),        // frontend field name
                phone_e164: z.string().optional(),       // also accepted directly
                email:     z.string().email().optional().or(z.literal('')),
                company:   z.string().optional(),
                tags:      z.array(z.string()).optional()
            });
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Invalid input.', errors: result.error.errors });
            }

            const data = result.data;

            // Normalise phone: accept `phone` OR `phone_e164`
            const rawPhone = data.phone || data.phone_e164;
            if (rawPhone) {
                try {
                    data.phone_e164 = normalizePhone(rawPhone);
                } catch (err) {
                    return res.status(400).json({ success: false, message: err.message });
                }
            } else {
                data.phone_e164 = null;
            }
            delete data.phone;

            const contact = await service.createContact(req.user, data);
            sendSuccess(res, contact, 'Contact created', 201);
        } catch (error) {
            if (error.message?.includes('already exists')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            sendError(res, error);
        }
    };
}
