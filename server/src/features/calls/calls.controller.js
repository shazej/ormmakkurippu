import { CallLogsService } from './calls.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';
import { normalizePhone } from '../../utils/phone-utils.js';

export class CallLogsController {
    constructor() {
        this.service = new CallLogsService();
    }

    getCallLogs = async (req, res) => {
        try {
            const result = await this.service.getCallLogs(req.user, req.query);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    getCallLog = async (req, res) => {
        try {
            const callLog = await this.service.getCallLog(req.user, req.params.id);
            sendSuccess(res, callLog);
        } catch (error) {
            sendError(res, error);
        }
    }

    createCallLog = async (req, res) => {
        try {
            const schema = z.object({
                caller_phone_e164: z.string().min(5),
                caller_name: z.string().optional(),
                direction: z.enum(['INCOMING', 'OUTGOING']).default('INCOMING'),
                duration_sec: z.number().int().min(0).optional(),
                notes: z.string().optional(),
                call_time: z.string().datetime().optional(),
                contact_id: z.string().uuid().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error);

            try {
                result.data.caller_phone_e164 = normalizePhone(result.data.caller_phone_e164);
            } catch (err) {
                return sendError(res, { message: err.message, statusCode: 400, isOperational: true });
            }

            const callLog = await this.service.createCallLog(req.user, result.data);
            sendSuccess(res, callLog, 'Call log created', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    updateCallLog = async (req, res) => {
        try {
            const schema = z.object({
                caller_phone_e164: z.string().min(5).optional(),
                caller_name: z.string().optional(),
                direction: z.enum(['INCOMING', 'OUTGOING']).optional(),
                duration_sec: z.number().int().min(0).optional(),
                notes: z.string().optional(),
                call_time: z.string().datetime().optional(),
                contact_id: z.string().uuid().nullable().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error);

            if (result.data.caller_phone_e164) {
                try {
                    result.data.caller_phone_e164 = normalizePhone(result.data.caller_phone_e164);
                } catch (err) {
                    return sendError(res, { message: err.message, statusCode: 400, isOperational: true });
                }
            }

            const callLog = await this.service.updateCallLog(req.user, req.params.id, result.data);
            sendSuccess(res, callLog, 'Call log updated');
        } catch (error) {
            sendError(res, error);
        }
    }

    deleteCallLog = async (req, res) => {
        try {
            await this.service.deleteCallLog(req.user, req.params.id);
            sendSuccess(res, null, 'Call log deleted');
        } catch (error) {
            sendError(res, error);
        }
    }

    createTaskFromCall = async (req, res) => {
        try {
            const schema = z.object({
                callLogId: z.string(),
                title: z.string().optional(),
                description: z.string().optional(),
                assignToEmail: z.string().email().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error);

            const task = await this.service.createTaskFromCall(req.user, result.data.callLogId, result.data);
            sendSuccess(res, task, 'Task created from call', 201);
        } catch (error) {
            sendError(res, error);
        }
    }
}
