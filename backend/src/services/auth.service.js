import redisClient from './redis.service.js';

const LOGOUT_TTL_SECONDS = 60 * 60 * 24;

export async function blacklistToken(token) {
    await redisClient.set(token, 'logout', 'EX', LOGOUT_TTL_SECONDS);
}

export async function isTokenBlacklisted(token) {
    const value = await redisClient.get(token);
    return Boolean(value);
}
