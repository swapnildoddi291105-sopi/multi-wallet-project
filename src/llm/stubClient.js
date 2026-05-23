module.exports = {
  parsePayment: async (raw_text) => {
    const amountMatch = raw_text.match(/([\d,.]+)\s*(USDT|ETH|INR|USD|EUR)?/i);
    const amount = amountMatch ? Number(amountMatch[1].replace(',', '')) : null;
    const currency = amountMatch && amountMatch[2] ? amountMatch[2].toUpperCase() : null;
    const merchantMatch = raw_text.match(/to\s+([A-Za-z0-9\-\s]+)/i) || raw_text.match(/from\s+([A-Za-z0-9\-\s]+)/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : null;

    const normalizedMerchant = merchant ? merchant.replace(/\s+/g, ' ').trim() : null;
    const confidence = (amount ? 0.95 : 0.6);

    return {
      amount,
      currency,
      merchant: normalizedMerchant,
      method: null,
      timestamp: new Date().toISOString(),
      confidence
    };
  }
};