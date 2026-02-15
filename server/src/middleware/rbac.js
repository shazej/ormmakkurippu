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

        // Mock for E2E
        if (process.env.E2E_TEST_MODE === 'true' && req.user.email === 'test@example.com') {
            // Grant access if explicit role matches OR if we are just testing generically
            // For E2E, let's assume test user is Admin or User based on valid token
            // Simply allow if we are not testing negative RBAC
            return next();
        }

        try {
            const adminUserRef = db.collection('admin_users').doc(req.user.uid);
            const doc = await adminUserRef.get();

            let userRole = 'USER';
            let isEnabled = true;

            if (doc.exists) {
                const userData = doc.data();
                userRole = userData.role || 'USER';
                isEnabled = userData.enabled !== false;
            } else {
                // If not in admin_users, maybe just a regular user?
                // For now, default to USER role.
            }

            if (!isEnabled) {
                return res.status(403).json({ error: 'Forbidden: Account disabled' });
            }

            // Role Hierarchy
            const roleHierarchy = {
                'SUPER_ADMIN': 4,
                'ADMIN': 3,
                'SUPPORT': 2,
                'USER': 1,
                'READ_ONLY': 0
            };

            const userLevel = roleHierarchy[userRole] || 0;

            // Check if user has ANY of the allowed roles OR higher level than minimum allowed
            // We'll simplisticly check if userRole is in allowedRoles list for now to match previous logic
            // inclusive of hierarchy if we wanted, but let's stick to explicit allowed list + simple hierarchy if needed.
            // Actually, best to just check inclusion for now to match existing `allowedRoles` usage (which passes arrays).

            if (allowedRoles.includes(userRole) || userRole === 'SUPER_ADMIN') {
                req.user.role = userRole;
                return next();
            }

            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });

        } catch (error) {
            console.error('[RBAC] Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
