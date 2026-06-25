import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/errors.js';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [ 6, 'Email must be at least 6 characters long' ],
            maxlength: [ 80, 'Email must not be longer than 80 characters' ],
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.statics.hashPassword = function hashPassword(password) {
    return bcrypt.hash(password, 10);
};

userSchema.methods.isValidPassword = function isValidPassword(password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function generateJWT() {
    if (!process.env.JWT_SECRET) {
        throw new AppError('JWT_SECRET is required in backend/.env', 500, 'CONFIG_ERROR');
    }

    return jwt.sign(
        {
            _id: this._id.toString(),
            email: this.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

userSchema.methods.toSafeObject = function toSafeObject() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('user', userSchema);

export default User;
