import { validationResult } from 'express-validator';
import { AppError } from '../lib/errors.js';

export function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
        error.details = { errors: errors.array() };
        return next(error);
    }

    return next();
}
