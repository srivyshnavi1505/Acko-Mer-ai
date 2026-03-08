const { createClient } = require('redis');
const logger = require('./logger');

let client = null;

const connectRedis = async () => {
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { reconnectStrategy: (r) => Math.min(r * 50, 2000) },
    });
    client.on('error', (err) => logger.error('Redis error:', err.message));
    client.on('connect', () => logger.info('Redis connected'));
    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis failed (degraded mode):', error.message);
    return null;
  }
};

const getClient = () => client;

const cache = {
  async get(key) {
    if (!client) return null;
    try {
      const v = await client.get(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  async set(key, value, ttl = 3600) {
    if (!client) return false;
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  async del(key) {
    if (!client) return false;
    try { await client.del(key); return true; } catch { return false; }
  },
  async delPattern(pattern) {
    if (!client) return false;
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(keys);
      return true;
    } catch { return false; }
  },
};

module.exports = { connectRedis, getClient, cache };
