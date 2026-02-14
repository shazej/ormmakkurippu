import express from 'express';
import { MfaService } from './mfa.service.js';
import { errorResponse } from '../../utils/errors.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();
const service = new MfaService();

router.use(verifyFirebaseToken);

router.get('/', async (req, res) => {
    try {
        const result = await service.listMethods(req.user);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

// TOTP
router.post('/totp/setup', async (req, res) => {
    try {
        const result = await service.setupTotp(req.user);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

router.post('/totp/verify', async (req, res) => {
    try {
        const { secret, token } = req.body; // Secret comes from setup response, token is user input
        const result = await service.verifyAndEnableTotp(req.user, secret, token);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

router.post('/totp/disable', async (req, res) => {
    try {
        const result = await service.disableTotp(req.user);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

// WebAuthn
router.post('/webauthn/register/options', async (req, res) => {
    try {
        const result = await service.generateWebAuthnRegistrationOptions(req.user);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

router.post('/webauthn/register/verify', async (req, res) => {
    try {
        const result = await service.verifyWebAuthnRegistration(req.user, req.body);
        res.json(result);
    } catch (error) { errorResponse(res, error); }
});

export default router;
