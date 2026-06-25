import mongoose from 'mongoose';
import { badRequest } from './errors.js';

export function isValidObjectId(value) {
    if (value == null || value === '') {
        return false;
    }

    if (!mongoose.Types.ObjectId.isValid(value)) {
        return false;
    }

    return String(new mongoose.Types.ObjectId(value)) === String(value);
}

export function assertObjectId(value, name = 'id') {
    if (!isValidObjectId(value)) {
        throw badRequest(`Invalid ${name}`);
    }
}
