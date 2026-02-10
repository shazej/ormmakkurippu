import { db } from '../firebase.js';

/**
 * Logs an audit event to the 'audit_logs' collection.
 * @param {object} actor - user object { uid, email, role }
 * @param {string} action - action name (e.g., 'CREATE_TASK', 'DELETE_TASK')
 * @param {string} targetType - e.g., 'task', 'user'
 * @param {string} targetId - ID of the target object
 * @param {object} details - Additional details (diff, reason, etc.)
 */
export const logAudit = async (actor, action, targetType, targetId, details = {}) => {
    try {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            actorUid: actor?.uid || 'system',
            actorEmail: actor?.email || 'unknown',
            actorRole: actor?.role || 'unknown',
            action,
            targetType,
            targetId,
            details,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown'
        };

        if (process.env.E2E_TEST_MODE === 'true') {
            try {
                // @ts-ignore
                await db.collection('audit_logs').add(auditEntry);
                console.log('🛡️ [Audit (Demo)]:', action, targetType, targetId);
            } catch (e) {
                console.warn('⚠️ Could not log audit in Demo Mode:', e.message);
            }
        } else {
            await db.collection('audit_logs').add(auditEntry);
            // console.log('🛡️ [Audit]:', action);
        }
    } catch (error) {
        console.error('❌ Failed to log audit event:', error);
    }
};
