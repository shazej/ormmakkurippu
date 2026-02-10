import { db } from '../firebase.js';

/**
 * Middleware to restrict access based on user roles.
 * Assumes req.user is already populated by verifyFirebaseToken.
 * @param {string[]} allowedRoles - Array of allowed roles (e.g. ['SUPER_ADMIN', 'ADMIN'])
 */
export const verifyRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        // 1. Check if user has a role in their token (if custom claims are used)
        // For now, we fetch from Firestore/LocalDb 'admin_users' collection to be safe and realtime.
        try {
            // MOCK for Demo Mode Super Admin (already set in auth middleware)
            if (process.env.E2E_TEST_MODE === 'true' && req.user.role) {
                if (allowedRoles.includes(req.user.role)) {
                    return next();
                }
            }

            const adminUserRef = db.collection('admin_users').doc(req.user.uid);
            const doc = await adminUserRef.get();

            if (!doc.exists) {
                console.warn(`[RBAC] Access denied for user ${req.user.uid}: Not an admin.`);
                return res.status(403).json({ error: 'Forbidden: You do not have admin access' });
            }

            const userData = doc.data();

            if (!userData.enabled) {
                console.warn(`[RBAC] Access denied for user ${req.user.uid}: Account disabled.`);
                return res.status(403).json({ error: 'Forbidden: Account disabled' });
            }

            if (!allowedRoles.includes(userData.role)) {
                console.warn(`[RBAC] Access denied for user ${req.user.uid}. Required: ${allowedRoles}, Found: ${userData.role}`);
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            // Attach role to request for audit logging
            req.user.role = userData.role;
            next();
        } catch (error) {
            console.error('[RBAC] Error checking role:', error);
            res.status(500).json({ error: 'Internal Server Error during authorization' });
        }
    };
};
