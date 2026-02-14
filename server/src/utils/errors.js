export class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

export const ErrorCodes = {
    // Auth & Permissions
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
    ACCESS_DENIED: 'ACCESS_DENIED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    STEP_UP_REQUIRED: 'STEP_UP_REQUIRED',

    // Resource
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',

    // Account/Profile
    EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
    PRIMARY_EMAIL_CANNOT_BE_REMOVED: 'PRIMARY_EMAIL_CANNOT_BE_REMOVED',

    // Security
    IP_NOT_ALLOWED: 'IP_NOT_ALLOWED',
    GEOFENCE_BLOCK: 'GEOFENCE_BLOCK',
    PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
    OLD_PASSWORD_INCORRECT: 'OLD_PASSWORD_INCORRECT',
    MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
    MFA_REQUIRED: 'MFA_REQUIRED',
    INVALID_OTP: 'INVALID_OTP',

    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED'
};

export const errorResponse = (res, error) => {
    console.error('API Error:', error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        });
    }

    if (error.name === 'ZodError') {
        return res.status(400).json({
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: 'Invalid input data',
                details: error.errors
            }
        });
    }

    // Default 500
    res.status(500).json({
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Internal Server Error'
        }
    });
};
