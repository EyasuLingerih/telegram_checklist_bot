const crypto = require('crypto');

/**
 * Validates Telegram Web App initData
 * @param {string} initData - The initData string from Telegram WebApp
 * @param {string} botToken - The bot token from BotFather
 * @returns {boolean} - Whether the initData is valid
 */
function validateTelegramInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return false;

    urlParams.delete('hash');

    // Sort parameters alphabetically and create data check string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating initData:', error);
    return false;
  }
}

/**
 * Parses Telegram initData into structured object
 * @param {string} initData - The initData string from Telegram WebApp
 * @returns {Object} - Parsed initData object
 */
function parseInitData(initData) {
  const urlParams = new URLSearchParams(initData);
  const userJson = urlParams.get('user');
  const user = userJson ? JSON.parse(userJson) : null;

  return {
    queryId: urlParams.get('query_id'),
    user,
    authDate: parseInt(urlParams.get('auth_date') || '0', 10),
    hash: urlParams.get('hash'),
  };
}

/**
 * Checks if initData is not expired (within 24 hours)
 * @param {number} authDate - Unix timestamp of authentication
 * @returns {boolean} - Whether the auth is still valid
 */
function isAuthDateValid(authDate) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 hours in seconds
  return (now - authDate) < maxAge;
}

module.exports = {
  validateTelegramInitData,
  parseInitData,
  isAuthDateValid
};
