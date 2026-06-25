import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDatabase from '../src/db/db.js';

let connectionPromise;

async function ensureDatabase() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!connectionPromise) {
        connectionPromise = connectDatabase().catch(error => {
            connectionPromise = null;
            throw error;
        });
    }

    await connectionPromise;
}

export default async function handler(req, res) {
    await ensureDatabase();
    return app(req, res);
}
