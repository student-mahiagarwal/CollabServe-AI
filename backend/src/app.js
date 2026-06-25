import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { createCorsOptions } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import redisClient from './services/redis.service.js';

const app = express();

app.use(cors(createCorsOptions()));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        app: 'CollabServe AI API',
        checks: {
            auth: '/users',
            projects: '/projects',
            ai: '/ai',
            realtime: 'socket.io',
        },
    });
});

app.get('/health', async (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    let redisStatus = 'not_configured';

    try {
        const ping = await redisClient.get('__health_check__');

        if (ping === null) {
            redisStatus = 'available';
        }
    } catch {
        redisStatus = 'unavailable';
    }

    const status = dbConnected ? 'ok' : 'degraded';

    res.status(dbConnected ? 200 : 503).json({
        status,
        checks: {
            database: dbConnected ? 'connected' : 'disconnected',
            redis: redisStatus,
        },
    });
});

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
