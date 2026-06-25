import mongoose from 'mongoose';
import { validateRequiredEnv } from '../config/env.js';

export default async function connectDatabase() {
    validateRequiredEnv();

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required in backend/.env');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');

    return mongoose.connection;
}
