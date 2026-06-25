import * as userService from '../services/user.service.js';
import { blacklistToken } from '../services/auth.service.js';
import { asyncHandler } from '../lib/errors.js';

export const register = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    const token = user.generateJWT();

    res.status(201).json({
        user: user.toSafeObject(),
        token,
    });
});

export const login = asyncHandler(async (req, res) => {
    const user = await userService.authenticateUser(req.body);
    const token = user.generateJWT();

    res.status(200).json({
        user: user.toSafeObject(),
        token,
    });
});

export const profile = asyncHandler(async (req, res) => {
    res.status(200).json({ user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
    await blacklistToken(req.token);
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers({ userId: req.user._id });
    res.status(200).json({ users });
});
