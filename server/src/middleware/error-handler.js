export const errorHandler = (err, req, res, next) => {
    // Standard error structure
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error (specifically unexpected ones)
    if (statusCode === 500) {
        console.error(`[ERROR] ${statusCode} - ${message}`, err, req.originalUrl, req.method);
    }

    // JSON response
    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || null, // Detailed field errors if any
        code: err.code || 'INTERNAL_ERROR',
        // Stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
