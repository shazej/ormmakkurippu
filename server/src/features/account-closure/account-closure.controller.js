import { AccountClosureService } from './account-closure.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const service = new AccountClosureService();

export class AccountClosureController {

    async request(req, res) {
        try {
            const result = await service.requestClosure(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async confirm(req, res) {
        try {
            const schema = z.object({
                token: z.string(),
                password: z.string().optional()
            });
            const { token, password } = schema.parse(req.body);

            const result = await service.confirmClosure(req.user, { token, password });
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async cancel(req, res) {
        try {
            const result = await service.cancelClosure(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
