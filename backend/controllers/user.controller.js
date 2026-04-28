import { validationResult } from 'express-validator';
import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import redisClient from '../services/redis.service.js';

function handleValidation(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return false;
    }

    return true;
}

export const register = async (req, res) => {
    if (!handleValidation(req, res)) {
        return;
    }

    try {
        const user = await userService.createUser(req.body);
        const token = user.generateJWT();
        const safeUser = user.toObject();
        delete safeUser.password;

        res.status(201).json({ user: safeUser, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    if (!handleValidation(req, res)) {
        return;
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');

        if (!user || !(await user.isValidPassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = user.generateJWT();
        const safeUser = user.toObject();
        delete safeUser.password;

        return res.status(200).json({ user: safeUser, token });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const profile = async (req, res) => {
    res.status(200).json({ user: req.user });
};

export const logout = async (req, res) => {
    await redisClient.set(req.token, 'logout', 'EX', 60 * 60 * 24);
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers({ userId: req.user._id });
        res.status(200).json({ users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
