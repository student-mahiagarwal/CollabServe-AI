import jwt from 'jsonwebtoken';
import redisClient from '../services/redis.service.js';
import userModel from '../models/user.model.js';

export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        const isBlacklisted = await redisClient.get(token);

        if (isBlacklisted) {
            res.clearCookie('token');
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        req.user = user;
        req.token = token;
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized user' });
    }
};
