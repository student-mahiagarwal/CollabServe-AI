import userModel from '../models/user.model.js';
import { badRequest, conflict, unauthorized } from '../lib/errors.js';

export async function createUser({ email, password }) {
    if (!email || !password) {
        throw badRequest('Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: cleanEmail });

    if (existingUser) {
        throw conflict('User already exists');
    }

    const hashedPassword = await userModel.hashPassword(password);

    return userModel.create({
        email: cleanEmail,
        password: hashedPassword,
    });
}

export async function authenticateUser({ email, password }) {
    if (!email || !password) {
        throw badRequest('Email and password are required');
    }

    const user = await userModel.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user || !(await user.isValidPassword(password))) {
        throw unauthorized('Invalid credentials');
    }

    return user;
}

export async function getAllUsers({ userId }) {
    return userModel.find({ _id: { $ne: userId } }).select('-password').sort({ email: 1 });
}
