import Redis from 'ioredis';

const memoryStore = new Map();

function getFromMemory(key) {
    const record = memoryStore.get(key);

    if (!record) {
        return null;
    }

    if (record.expiresAt && record.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
    }

    return record.value;
}

function createMemoryClient() {
    return {
        async get(key) {
            return getFromMemory(key);
        },
        async set(key, value, mode, ttl) {
            const expiresAt = mode === 'EX' && ttl ? Date.now() + ttl * 1000 : null;
            memoryStore.set(key, { value, expiresAt });
            return 'OK';
        },
    };
}

function createRedisClient() {
    const options = {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 1000,
        retryStrategy: () => null,
    };

    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL, options);
    }

    if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
        return new Redis({
            ...options,
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD || undefined,
        });
    }

    return null;
}

const redis = createRedisClient();
const fallback = createMemoryClient();

if (redis) {
    redis.connect()
        .then(() => {
            console.log('Redis connected');
        })
        .catch(error => {
            console.warn(`Redis unavailable, using in-memory token blacklist: ${error.message}`);
        });

    redis.on('error', error => {
        console.warn(`Redis unavailable, using in-memory token blacklist: ${error.message}`);
    });
} else {
    console.log('Redis not configured, using in-memory token blacklist');
}

const redisClient = {
    async get(key) {
        if (!redis) {
            return fallback.get(key);
        }

        try {
            return await redis.get(key);
        } catch (error) {
            return fallback.get(key);
        }
    },
    async set(key, value, mode, ttl) {
        if (!redis) {
            return fallback.set(key, value, mode, ttl);
        }

        try {
            return await redis.set(key, value, mode, ttl);
        } catch (error) {
            return fallback.set(key, value, mode, ttl);
        }
    },
};

export default redisClient;
