const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Setup redis connection configuration for BullMQ
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

const parseQueue = new Queue('parseQueue', { connection });

module.exports = { parseQueue, connection };