// src/llm/realClient.js
const axios = require('axios');
const Bottleneck = require('bottleneck');
const axiosRetry = require('axios-retry');
const logger = require('../utils/logger');

const PROVIDER = process.env.LLM_PROVIDER || 'GEMINI';
const API_KEY = process.env.LLM_API_KEY || '';
const BASE_URL = process.env.LLM_BASE_URL || '';

// Rate limiter reservoir settings (Cost & Concurrency guardrails)
const limiter = new Bottleneck({
  maxConcurrent: Number(process.env.LLM_MAX_CONCURRENT || 2),
  reservoir: Number(process.env.LLM_RESERVOIR || 60), 
  reservoirRefreshAmount: Number(process.env.LLM_RESERVOIR_REFRESH || 60),
  reservoirRefreshInterval: Number(process.env.LLM_RESERVOIR_INTERVAL_MS || 60000), 
  minTime: Number(process.env.LLM_MIN_TIME_MS || 50)
});

const http = axios.create({
  timeout: Number(process.env.LLM_TIMEOUT_MS || 15000),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Auto-retry configuration with exponential backoff on network failures or HTTP 429/5xx status
axiosRetry(http, {
  retries: Number(process.env.LLM_RETRIES || 3),
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(err) || err.response?.status === 429 || err.response?.status >= 500;
  }
});

async function callGemini(prompt) {
  const url = BASE_URL || 'https://gemini.googleapis.com/v1/models/gemini-proto:predict';
  const body = { prompt };
  const resp = await http.post(url, body);
  return resp.data;
}

async function callClaude(prompt) {
  const url = BASE_URL || 'https://api.anthropic.com/v1/complete';
  const body = { prompt, max_tokens: 300 };
  const resp = await http.post(url, body);
  return resp.data;
}

async function callLLM(prompt) {
  return limiter.schedule(async () => {
    logger.info({ provider: PROVIDER }, 'LLM request scheduled');
    if (!API_KEY) throw new Error('LLM_API_KEY not set');
    return PROVIDER === 'CLAUDE' ? callClaude(prompt) : callGemini(prompt);
  });
}

async function parsePaymentWithLLM(raw_text) {
  const prompt = `
You are a strict JSON extractor. Given a single payment notification text, return ONLY valid JSON with keys:
amount (number or null), currency (string or null), merchant (string or null), method (string or null), timestamp (ISO 8601 string), confidence (0-1 number).
Text: """${raw_text}"""
Return JSON only.
`.trim();

  const llmResp = await callLLM(prompt);

  let textOut = '';
  if (typeof llmResp === 'string') textOut = llmResp;
  else if (llmResp?.data) textOut = JSON.stringify(llmResp.data);
  else if (llmResp?.completion) textOut = llmResp.completion;
  else textOut = JSON.stringify(llmResp);

  const jsonMatch = textOut.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return JSON');
  
  return JSON.parse(jsonMatch[0]);
}

module.exports = { parsePaymentWithLLM };