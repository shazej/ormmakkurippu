import { auth } from '../firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.session) {
        token = req.cookies.session;
    }

    if (!token) {
        // If it's an API call, return JSON. If it's a view render request (e.g. /admin), redirect to login?
        // For now, consistent JSON 401 is safer for API. 
        // Admin views should handle this by redirection middleware or client-side check.
        // But since we are strictly middleware here:
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // MOCK FOR E2E VERIFICATION ONLY
    if (process.env.E2E_TEST_MODE === 'true') {
        if (token === 'e2e-magic-token') {
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
            // Role will be fetched in RBAC middleware or we can attach it here if using Custom Claims
        };
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
