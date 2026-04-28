import mongoose from 'mongoose';

export default async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required in backend/.env');
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
}
