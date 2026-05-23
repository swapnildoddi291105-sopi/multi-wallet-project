const Joi = require('joi');
const service = require('../services/messages.service');
const logger = require('../utils/logger');
const { parseQueue } = require('../queue');
const { v4: uuidv4 } = require('uuid');

const schema = Joi.object({
  raw_text: Joi.string().min(3).required(),
  source: Joi.string().optional(),
  wallet_id: Joi.string().optional()
});

exports.ingestMessage = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    logger.warn('Validation failed: ' + error.message);
    return res.status(400).json({ error: error.message });
  }

  try {
    const record = await service.saveRawMessage(value);
    const jobId = uuidv4();

    // Add to Redis job queue
    await parseQueue.add(
      'parse', 
      { transactionId: record.id, raw_text: record.raw_text, wallet_id: record.wallet_id }, 
      { jobId }
    );

    return res.status(201).json({ stored: record, parsed: { status: 'queued' } });
  } catch (err) {
    logger.error('Ingest error: ' + err.message);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const transactions = await service.getAllMessages();
    return res.status(200).json(transactions);
  } catch (err) {
    logger.error('Fetch error: ' + err.message);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};