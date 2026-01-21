const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramService {
  /**
   * Sends a message to a Telegram chat
   */
  async sendMessage(chatId, text, options = {}) {
    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        ...options
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram sendMessage error:', data);
      throw new Error(data.description || 'Failed to send message');
    }

    return data.result;
  }

  /**
   * Edits the reply markup of a message
   */
  async editMessageReplyMarkup(chatId, messageId, replyMarkup) {
    const response = await fetch(`${API_URL}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      })
    });

    const data = await response.json();

    if (!data.ok && !data.description?.includes('message is not modified')) {
      console.error('Telegram editMessageReplyMarkup error:', data);
    }

    return data.result;
  }

  /**
   * Answers a callback query
   */
  async answerCallbackQuery(callbackQueryId, text, showAlert = false) {
    const response = await fetch(`${API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      })
    });

    return response.json();
  }

  /**
   * Sets the webhook URL for the bot
   */
  async setWebhook(webhookUrl) {
    const response = await fetch(`${API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    });

    const data = await response.json();
    console.log('Set webhook result:', data);
    return data;
  }

  /**
   * Gets current webhook info
   */
  async getWebhookInfo() {
    const response = await fetch(`${API_URL}/getWebhookInfo`);
    return response.json();
  }

  /**
   * Deletes the webhook
   */
  async deleteWebhook() {
    const response = await fetch(`${API_URL}/deleteWebhook`, {
      method: 'POST'
    });
    return response.json();
  }
}

module.exports = new TelegramService();
