require('dotenv').config();
const { Worker } = require('bullmq');
const db = require('../db');
const IORedis = require('ioredis');
const llm = require('../llm/stubClient');
const parseSchema = require('../validators/parse.schema');
const logger = require('../utils/logger');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

const worker = new Worker('parseQueue', async job => {
  const { transactionId, raw_text } = job.data;
  logger.info({ jobId: job.id, transactionId }, 'Processing job');

  const tx = await db('transactions').where({ id: transactionId }).first();
  if (!tx) throw new Error(`Transaction ${transactionId} not found`);
  if (tx.status && tx.status !== 'new') {
    logger.info({ transactionId, status: tx.status }, 'Skipping already processed transaction');
    return;
  }

  await db('transactions').where({ id: transactionId }).update({ status: 'parsing' });

  try {
    const parsed = await llm.parsePayment(raw_text);

    const { error, value } = parseSchema.validate(parsed);
    if (error) {
      await db('transactions').where({ id: transactionId }).update({
        status: 'failed',
        error_message: `validation_error: ${error.message}`
      });
      throw new Error(`Parsed output validation failed: ${error.message}`);
    }

    await db('transactions').where({ id: transactionId }).update({
      amount: value.amount,
      currency: value.currency,
      merchant: value.merchant,
      method: value.method,
      timestamp: value.timestamp,
      status: 'parsed',
      parsed_at: db.fn.now()
    });

    logger.info({ transactionId, parsed: value }, 'Parsed transaction successfully');
  } catch (err) {
    logger.error({ err, transactionId }, 'Worker error');
    await db('transactions').where({ id: transactionId }).update({
      status: 'failed',
      error_message: err.message
    });
    throw err;
  }
}, { connection });

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, err }, 'Job failed');
});

console.log('Parser worker engine running and waiting for jobs...');