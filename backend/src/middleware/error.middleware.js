import { AppError } from '../lib/errors.js';

function isValidationError(err) {
    return err.name === 'ValidationError' && err.errors;
}

function isCastError(err) {
    return err.name === 'CastError';
}

function isDuplicateKeyError(err) {
    return err.code === 11000;
}

function isJsonWebTokenError(err) {
    return err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError';
}

function formatValidationErrors(err) {
    return Object.values(err.errors).map(fieldError => ({
        field: fieldError.path,
        message: fieldError.message,
    }));
}

function formatDuplicateKeyError(err) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return `${field} already exists`;
}

function sendError(res, statusCode, payload) {
    return res.status(statusCode).json(payload);
}

export function notFoundHandler(req, res, next) {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        const payload = {
            error: err.message,
            ...(err.code ? { code: err.code } : {}),
        };

        if (err.details) {
            Object.assign(payload, err.details);
        }

        return sendError(res, err.statusCode, payload);
    }

    if (isValidationError(err)) {
        return sendError(res, 400, {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: formatValidationErrors(err),
        });
    }

    if (isCastError(err)) {
        return sendError(res, 400, {
            error: 'Invalid identifier',
            code: 'INVALID_ID',
        });
    }

    if (isDuplicateKeyError(err)) {
        return sendError(res, 409, {
            error: formatDuplicateKeyError(err),
            code: 'DUPLICATE_KEY',
        });
    }

    if (isJsonWebTokenError(err)) {
        return sendError(res, 401, {
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
    }

    console.error(err);

    return sendError(res, 500, {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
}
