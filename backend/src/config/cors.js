import { env } from './env.js';

const LOCAL_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

const DEPLOYMENT_ORIGINS = [
    'https://collab-serve-ai.vercel.app',
];

function normalizeOrigin(origin) {
    return origin?.trim().replace(/\/+$/, '') || '';
}

export function getAllowedOrigins() {
    const configuredOrigins = env.clientUrl
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    const deploymentOrigin = env.vercelUrl
        ? normalizeOrigin(`https://${env.vercelUrl}`)
        : null;

    return [
        ...new Set([
            ...configuredOrigins,
            ...LOCAL_ORIGINS,
            ...DEPLOYMENT_ORIGINS,
            deploymentOrigin,
        ].filter(Boolean)),
    ];
}

export function createCorsOptions() {
    const allowedOrigins = new Set(getAllowedOrigins());

    return {
        origin(origin, callback) {
            const normalizedOrigin = normalizeOrigin(origin);

            if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
                return callback(null, true);
            }

            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
    };
}
