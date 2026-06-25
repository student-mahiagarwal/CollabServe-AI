export class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

export function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

export function notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
}

export function badRequest(message = 'Bad request') {
    return new AppError(message, 400, 'BAD_REQUEST');
}

export function unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
}

export function forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
}

export function conflict(message = 'Conflict') {
    return new AppError(message, 409, 'CONFLICT');
}
