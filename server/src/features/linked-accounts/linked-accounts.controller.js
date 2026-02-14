import { LinkedAccountsService } from './linked-accounts.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const service = new LinkedAccountsService();

export class LinkedAccountsController {

    async list(req, res) {
        try {
            const result = await service.listLinkedAccounts(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async link(req, res) {
        try {
            const schema = z.object({
                provider: z.enum(['google', 'microsoft', 'apple', 'github']),
                auth_code: z.string().optional(),
                token: z.string().optional()
            });
            const { provider, auth_code, token } = schema.parse(req.body);

            const result = await service.linkAccount(req.user, provider, { auth_code, token });
            res.status(201).json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async unlink(req, res) {
        try {
            const { id } = req.params;
            const result = await service.unlinkAccount(req.user, id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
