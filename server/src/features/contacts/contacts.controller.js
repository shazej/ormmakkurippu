import { ContactsService } from './contacts.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';
import { normalizePhone } from '../../utils/phone-utils.js';

const createSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().min(5).max(30),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    notes: z.string().max(2000).optional(),
    company: z.string().max(200).optional(),
    tags: z.array(z.string()).optional()
});

const updateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().min(5).max(30).optional(),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    notes: z.string().max(2000).optional().nullable(),
    company: z.string().max(200).optional(),
    tags: z.array(z.string()).optional()
});

function parsePhone(phone, res) {
    try {
        return { ok: true, value: normalizePhone(phone) };
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
        return { ok: false };
    }
}

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
    }

    createContact = async (req, res) => {
        try {
            const result = createSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.errors });
            }

            const parsed = parsePhone(result.data.phone, res);
            if (!parsed.ok) return;

            const { phone, ...rest } = result.data;
            const contact = await this.service.createContact(req.user, { ...rest, phone_e164: parsed.value });
            sendSuccess(res, contact, 'Contact created', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    getContact = async (req, res) => {
        try {
            const contact = await this.service.getContact(req.params.id, req.user);
            sendSuccess(res, contact);
        } catch (error) {
            sendError(res, error);
        }
    }

    updateContact = async (req, res) => {
        try {
            const result = updateSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.errors });
            }

            const data = { ...result.data };

            if (data.phone) {
                const parsed = parsePhone(data.phone, res);
                if (!parsed.ok) return;
                data.phone_e164 = parsed.value;
                delete data.phone;
            } else {
                delete data.phone;
            }

            // Strip undefined to avoid unintentional nulls
            Object.keys(data).forEach(k => {
                if (data[k] === undefined) delete data[k];
            });

            const contact = await this.service.updateContact(req.params.id, req.user, data);
            sendSuccess(res, contact, 'Contact updated');
        } catch (error) {
            sendError(res, error);
        }
    }

    deleteContact = async (req, res) => {
        try {
            await this.service.deleteContact(req.params.id, req.user);
            sendSuccess(res, null, 'Contact deleted');
        } catch (error) {
            sendError(res, error);
        }
    }
}
