import { env } from './env.js';

const LOCAL_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

export function getAllowedOrigins() {
    const configuredOrigins = env.clientUrl
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const deploymentOrigin = env.vercelUrl
        ? `https://${env.vercelUrl}`
        : null;

    return [
        ...new Set([
            ...configuredOrigins,
            ...LOCAL_ORIGINS,
            deploymentOrigin,
        ].filter(Boolean)),
    ];
}

export function createCorsOptions() {
    const allowedOrigins = new Set(getAllowedOrigins(), 'https://collab-serve-ai.vercel.app');

    return {
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
    };
}
