import { z } from 'zod';

// --- Shared Schemas ---

export const TimestampSchema = z.string().datetime().optional();

// --- User Core ---

export const UserSchema = z.object({
    id: z.string().optional(),
    password_hash: z.string(),
    password_updated_at: TimestampSchema,
    primary_email_id: z.string().optional(),
    marketing_mobile: z.string().nullable().optional(),
    preferences: z.record(z.any()).default({}), // formatted json
    created_at: TimestampSchema,
    updated_at: TimestampSchema
});

// --- User Emails ---

export const UserEmailSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    email: z.string().email(),
    is_primary: z.boolean().default(false),
    is_verified: z.boolean().default(false),
    verification_token_hash: z.string().nullable().optional(),
    verification_expires_at: TimestampSchema,
    created_at: TimestampSchema
});

// --- MFA ---

export const MfaMethodSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    type: z.enum(['totp', 'webauthn', 'email_otp']),
    status: z.enum(['enabled', 'disabled']),
    secret_encrypted: z.string().nullable().optional(), // For TOTP
    name: z.string().optional(), // For WebAuthn key name
    created_at: TimestampSchema,
    last_used_at: TimestampSchema
});

export const WebAuthnCredentialSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    credential_id: z.string(),
    public_key: z.string(), // Base64 or specific format
    counter: z.number(),
    device_name: z.string().optional(),
    created_at: TimestampSchema,
    last_used_at: TimestampSchema
});

// --- Security ---

export const AllowedIpSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    cidr: z.string(), // e.g. "192.168.1.1/32"
    label: z.string().optional(),
    created_at: TimestampSchema
});

export const GeofenceSchema = z.object({
    user_id: z.string(),
    enabled: z.boolean().default(false),
    allowed_countries: z.array(z.string().length(2)), // ISO 3166-1 alpha-2
    updated_at: TimestampSchema
});

export const AppPasswordSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    name: z.string(),
    password_hash: z.string(),
    last_used_at: TimestampSchema,
    created_at: TimestampSchema,
    revoked_at: TimestampSchema // If present, it's revoked
});

export const SessionSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    refresh_token_hash: z.string().optional(), // If implementing refresh tokens
    user_agent: z.string().optional(),
    ip: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    device_label: z.string().optional(), // "Chrome on Windows"
    created_at: TimestampSchema,
    last_seen_at: TimestampSchema,
    revoked_at: TimestampSchema,
    is_current: z.boolean().optional() // Computed field for responses
});

// --- Settings & Consents ---

export const OAuthConsentSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    client_id: z.string(),
    client_name: z.string(),
    scopes: z.array(z.string()),
    created_at: TimestampSchema,
    last_used_at: TimestampSchema,
    revoked_at: TimestampSchema
});

export const NotificationSettingsSchema = z.object({
    user_id: z.string(),
    new_signin_alert: z.boolean().default(true),
    third_party_access_alert: z.boolean().default(true),
    newsletter_subscription: z.boolean().default(false),
    updated_at: TimestampSchema
});

// --- Audit ---

export const AuditLogSchema = z.object({
    id: z.string().optional(),
    user_id: z.string().optional(), // Can be null if system action or unauthenticated (though rare for this scope)
    action: z.enum([
        'CHANGE_PASSWORD', 'ADD_EMAIL', 'VERIFY_EMAIL', 'SET_PRIMARY_EMAIL', 'REMOVE_EMAIL',
        'ENABLE_MFA', 'DISABLE_MFA', 'ADD_ALLOWED_IP', 'REMOVE_ALLOWED_IP',
        'ENABLE_GEOFENCE', 'DISABLE_GEOFENCE', 'UPDATE_GEOFENCE_COUNTRIES',
        'GENERATE_APP_PASSWORD', 'REVOKE_APP_PASSWORD',
        'REVOKE_SESSION', 'REVOKE_OAUTH_CONSENT', 'UPDATE_NOTIFICATION_SETTINGS',
        'UPDATE_PREFERENCES', 'UPDATE_MARKETING_MOBILE',
        'LOGIN_SUCCESS', 'LOGIN_FAILED', 'STEP_UP_CHALLENGE', 'STEP_UP_VERIFIED',
        'DELETE_TASK', 'CREATE_TASK', 'UPDATE_TASK' // Added existing ones
    ]),
    entity_type: z.string(), // "user", "email", "session", "task"
    entity_id: z.string().optional(),
    ip: z.string().optional(),
    user_agent: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    created_at: TimestampSchema
});
