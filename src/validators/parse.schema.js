const Joi = require('joi');

const parseSchema = Joi.object({
  amount: Joi.number().precision(8).allow(null),
  currency: Joi.string().max(10).allow(null),
  merchant: Joi.string().max(255).allow(null),
  method: Joi.string().max(100).allow(null),
  timestamp: Joi.date().iso().required(),
  confidence: Joi.number().min(0).max(1).required()
});

module.exports = parseSchema;