export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
    res.status(statusCode).json({
        success: true,
        status: 'success',
        message,
        data,
        ...meta
    });
};

export const sendError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const isOperational = error.isOperational || false;

    console.error(`ERROR [${statusCode}]:`, error);

    // STRUCTURED RESPONSE FORMAT
    const response = {
        success: false,
        status: 'error',
        message: error.message || 'Something went wrong',
        errors: null
    };

    if (error.name === 'ZodError') {
        response.message = 'Validation Failed';
        response.errors = error.errors;
        return res.status(400).json(response);
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
        response.code = error.errorCode || 'INTERNAL_ERROR';
        return res.status(statusCode).json(response);
    }

    if (isOperational) {
        response.code = error.errorCode || 'ERROR';
        return res.status(statusCode).json(response);
    }

    // Generic 500
    response.message = 'Internal Server Error';
    response.code = 'INTERNAL_ERROR';
    return res.status(500).json(response);
};
