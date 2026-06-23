import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

function getAllowedOrigins() {
    const configuredOrigins = (process.env.CLIENT_URL || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const deploymentOrigin = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;

    return new Set([
        ...configuredOrigins,
        deploymentOrigin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://collab-serve-ai-fcn3.vercel.app',
    ].filter(Boolean));
}

const allowedOrigins = new Set([
    ...getAllowedOrigins(),
    'https://collab-serve-ai-fcn3.vercel.app',
    'https://collab-serve-ai.vercel.app',
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
}));
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

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

export default app;
