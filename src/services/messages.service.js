const db = require('../db');

exports.saveRawMessage = async ({ raw_text, source, wallet_id }) => {
  const [record] = await db('transactions')
    .insert({
      raw_text,
      source: source || 'unknown',
      wallet_id: wallet_id || null,
      status: 'new'
    })
    .returning(['id', 'raw_text', 'source', 'wallet_id', 'parsed_at']);
  
  return record;
};

exports.getAllMessages = async () => {
  return await db('transactions')
    .select('*')
    .orderBy('id', 'desc') // Changed from 'parsed_at' to 'id' to test safe sorting
    .limit(100);
};