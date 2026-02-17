import { auth } from '../firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
    console.log('[DEBUG AUTH] verifyFirebaseToken called');
    console.log('[DEBUG AUTH] Headers:', JSON.stringify(req.headers));
    console.log('[DEBUG AUTH] Cookies:', req.cookies);

    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.session) {
        token = req.cookies.session;
    }

    if (!token) {
        console.log('[DEBUG AUTH] No token found. Returning 401.');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // MOCK FOR E2E VERIFICATION ONLY
    if (process.env.E2E_TEST_MODE === 'true') {
        if (token === 'e2e-magic-token') {
            req.user = { uid: 'test-e2e-user', role: 'SUPER_ADMIN' };
            return next();
        }
        if (token === 'e2e-magic-token-2') {
            req.user = { uid: 'test-e2e-user-2', role: 'USER' };
            return next();
        }
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = { uid: decodedToken.uid, email: decodedToken.email };
        next();
    } catch (error) {
        console.error('[DEBUG AUTH] Error verifying token:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
