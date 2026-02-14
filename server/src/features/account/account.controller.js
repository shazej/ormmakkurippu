import { AccountService } from './account.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const accountService = new AccountService();

export class AccountController {
    async getEmails(req, res) {
        try {
            const emails = await accountService.getEmails(req.user.uid);
            res.json(emails);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async addEmail(req, res) {
        try {
            const schema = z.object({ email: z.string().email() });
            const { email } = schema.parse(req.body);

            const result = await accountService.addEmail(req.user, email);
            res.status(201).json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async verifyEmail(req, res) {
        try {
            const schema = z.object({ token: z.string() });
            const { token } = schema.parse(req.body);

            const result = await accountService.verifyEmail(req.user, token);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async setPrimaryEmail(req, res) {
        try {
            const { id } = req.params;
            const result = await accountService.setPrimaryEmail(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async removeEmail(req, res) {
        try {
            const { id } = req.params;
            const result = await accountService.removeEmail(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async resendVerification(req, res) {
        try {
            const { id } = req.params;
            const result = await accountService.resendVerification(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }
}
