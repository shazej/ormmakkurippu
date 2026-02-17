import { auth } from '../firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
    console.log('[AuthDebug] Headers:', JSON.stringify(req.headers));
    console.log('[AuthDebug] Cookies:', req.cookies);
    console.log('[AuthDebug] E2E_TEST_MODE:', process.env.E2E_TEST_MODE);

    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.session) {
        token = req.cookies.session;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            status: 'error',
            message: 'Unauthorized: No token provided'
        });
    }

    // MOCK FOR E2E VERIFICATION ONLY
    if (process.env.E2E_TEST_MODE === 'true') {
        console.log('[AuthDebug] Checking E2E token:', token);
        if (token === 'e2e-magic-token') {
            console.log('[AuthDebug] E2E Token Matched! Calling next()');
            req.user = {
                uid: 'test-e2e-user',
                email: 'test@example.com',
                role: 'SUPER_ADMIN'
            };
            return next();
        }
        if (token === 'e2e-magic-token-2') {
            req.user = {
                uid: 'test-e2e-user-2',
                email: 'test2@example.com',
                role: 'USER'
            };
            return next();
        }
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(401).json({
            success: false,
            status: 'error',
            message: 'Unauthorized: Invalid token'
        });
    }
};
