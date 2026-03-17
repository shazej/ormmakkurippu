import { CallLogsService } from './calls.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';
import { normalizePhone } from '../../utils/phone-utils.js';

const service = new CallLogsService();

export class CallLogsController {

    getCallLogs = async (req, res) => {
        try {
            const result = await service.getCallLogs(req.user, req.query);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    };

    createCallLog = async (req, res) => {
        try {
            const schema = z.object({
                caller_phone_e164: z.string().optional(),
                caller_name:       z.string().optional(),
                direction:         z.enum(['INCOMING', 'OUTGOING']).default('OUTGOING'),
                outcome:           z.enum(['ANSWERED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY']).optional(),
                duration_sec:      z.number().int().nonnegative().optional(),
                notes:             z.string().optional(),
                call_time:         z.string().datetime().optional(),
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Invalid input.', errors: result.error.errors });
            }

            // Normalise phone only if provided
            if (result.data.caller_phone_e164) {
                try {
                    result.data.caller_phone_e164 = normalizePhone(result.data.caller_phone_e164);
                } catch (err) {
                    return res.status(400).json({ success: false, message: err.message });
                }
            }

            const callLog = await service.createCallLog(req.user, result.data);
            sendSuccess(res, callLog, 'Call log created', 201);
        } catch (error) {
            sendError(res, error);
        }
    };

    createTaskFromCall = async (req, res) => {
        try {
            const schema = z.object({
                callLogId:      z.string(),
                title:          z.string().optional(),
                description:    z.string().optional(),
                assignToEmail:  z.string().email().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Invalid input.', errors: result.error.errors });
            }

            const task = await service.createTaskFromCall(req.user, result.data.callLogId, result.data);
            sendSuccess(res, task, 'Task created from call', 201);
        } catch (error) {
            sendError(res, error);
        }
    };
}
