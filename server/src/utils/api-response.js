export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
    res.status(statusCode).json({
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

    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            status: 'error',
            message: error.message,
            code: error.errorCode || 'INTERNAL_ERROR',
            stack: error.stack,
            error
        });
    }

    if (isOperational) {
        return res.status(statusCode).json({
            status: 'error',
            message: error.message,
            code: error.errorCode || 'ERROR'
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR'
    });
};
