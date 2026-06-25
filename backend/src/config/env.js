function requireEnv(name) {
    const value = process.env[name];

    if (!value?.trim()) {
        throw new Error(`${name} is required in backend/.env`);
    }

    return value.trim();
}

function optionalEnv(name, fallback = undefined) {
    const value = process.env[name]?.trim();
    return value || fallback;
}

export const env = {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: Number(optionalEnv('PORT', '3000')),
    clientUrl: optionalEnv('CLIENT_URL', 'http://localhost:5173'),
    mongodbUri: optionalEnv('MONGODB_URI'),
    jwtSecret: optionalEnv('JWT_SECRET'),
    geminiApiKey: optionalEnv('GEMINI_API_KEY') || optionalEnv('GOOGLE_AI_API_KEY'),
    geminiModel: optionalEnv('GEMINI_MODEL', 'gemini-2.5-flash-preview'),
    redisUrl: optionalEnv('REDIS_URL'),
    redisHost: optionalEnv('REDIS_HOST'),
    redisPort: optionalEnv('REDIS_PORT'),
    redisPassword: optionalEnv('REDIS_PASSWORD'),
    vercelUrl: optionalEnv('VERCEL_URL'),
    isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
};

export function validateRequiredEnv() {
    requireEnv('MONGODB_URI');
    requireEnv('JWT_SECRET');
}
