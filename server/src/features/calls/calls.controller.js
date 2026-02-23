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
    };

    createCallLog = async (req, res) => {
        try {
            const schema = z.object({
                caller_phone_e164: z.string().min(5),
                caller_name: z.string().optional(),
                direction: z.enum(['INCOMING', 'OUTGOING']).default('INCOMING'),
                duration_sec: z.number().optional(),
                notes: z.string().optional(),
                call_time: z.string().datetime().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            // Normalize Phone
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
    };

    createTaskFromCall = async (req, res) => {
        try {
            const schema = z.object({
                callLogId: z.string(),
                title: z.string().optional(),
                description: z.string().optional(),
                assignToEmail: z.string().email().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const task = await this.service.createTaskFromCall(req.user, result.data.callLogId, result.data);
            sendSuccess(res, task, 'Task created from call', 201);
        } catch (error) {
            sendError(res, error);
        }
    };
}
