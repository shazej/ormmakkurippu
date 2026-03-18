/**
 * Strip sensitive server-only fields before returning user data to the client.
 * Add any new sensitive fields here as they are introduced to the schema.
 */
const SENSITIVE_FIELDS = [
    'password_hash',
    'password_reset_token_hash',
    'password_reset_expires_at',
    'password_updated_at',
];

export function sanitizeUser(user) {
    if (!user || typeof user !== 'object') return user;
    const clean = { ...user };
    for (const field of SENSITIVE_FIELDS) {
        delete clean[field];
    }
    return clean;
}
