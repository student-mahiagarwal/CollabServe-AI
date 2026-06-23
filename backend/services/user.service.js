import userModel from '../models/user.model.js';

export const createUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: cleanEmail });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await userModel.hashPassword(password);

    return userModel.create({
        email: cleanEmail,
        password: hashedPassword,
    });
};

export const getAllUsers = async ({ userId }) => {
    return userModel.find({ _id: { $ne: userId } }).select('-password').sort({ email: 1 });
};
