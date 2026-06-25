import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import connectDatabase from './db/db.js';
import { env } from './config/env.js';
import { createSocketServer } from './socket/index.js';
import { closeRedis } from './services/redis.service.js';

await connectDatabase();

const server = http.createServer(app);
const io = createSocketServer(server);

let isShuttingDown = false;

async function shutdown(signal) {
    if (isShuttingDown) {
        process.exit(1);
    }

    isShuttingDown = true;

    if (signal === 'SIGTERM' && env.nodeEnv !== 'production') {
        console.log('Dev server restarting...');
    } else {
        console.log('Shutting down...');
    }

    const forceExitTimer = setTimeout(() => {
        console.warn('Forced shutdown after timeout');
        process.exit(1);
    }, 3000);
    forceExitTimer.unref();

    try {
        io.disconnectSockets(true);
        await new Promise((resolve, reject) => {
            io.close(error => (error ? reject(error) : resolve()));
        });
    } catch (error) {
        console.warn('Socket.IO shutdown:', error.message);
    }

    await new Promise(resolve => {
        server.close(() => resolve());
        server.closeAllConnections?.();
    });

    try {
        await mongoose.connection.close();
    } catch {
        // Connection may already be closed during restart.
    }

    try {
        await closeRedis();
    } catch {
        // Redis may already be disconnected.
    }

    clearTimeout(forceExitTimer);
    process.exit(0);
}

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
});
