import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import connectDatabase from './db/db.js';
import { env } from './config/env.js';
import { createSocketServer } from './socket/index.js';

await connectDatabase();

const server = http.createServer(app);
createSocketServer(server);

function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully`);

    server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
});
