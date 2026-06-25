import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import { isTokenBlacklisted } from '../services/auth.service.js';
import { asyncHandler, unauthorized } from '../lib/errors.js';

function extractToken(req) {
    return req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];
}

export const authUser = asyncHandler(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        throw unauthorized('Unauthorized user');
    }

    if (await isTokenBlacklisted(token)) {
        res.clearCookie('token');
        throw unauthorized('Unauthorized user');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded._id).select('-password');

    if (!user) {
        throw unauthorized('Unauthorized user');
    }

    req.user = user;
    req.token = token;
    next();
});
