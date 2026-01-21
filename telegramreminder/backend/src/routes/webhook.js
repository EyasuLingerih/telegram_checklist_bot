const express = require('express');
const telegramService = require('../services/telegramService');

const router = express.Router();

/**
 * POST /api/telegram/webhook
 * Handles incoming Telegram webhook events
 */
router.post('/webhook', async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const update = req.body;

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, prisma);
      return res.json({ ok: true });
    }

    // Handle messages
    if (update.message) {
      await handleMessage(update.message, prisma);
      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to Telegram to prevent retries
    res.json({ ok: true });
  }
});

/**
 * Handles callback queries (inline button presses)
 */
async function handleCallbackQuery(callbackQuery, prisma) {
  const { id, data, from, message } = callbackQuery;

  // Check if user is authorized
  const user = await prisma.user.findUnique({
    where: { telegramId: String(from.id) }
  });

  if (!user?.isAuthorized) {
    await telegramService.answerCallbackQuery(id, 'You are not authorized');
    return;
  }

  // Handle toggle commands
  if (data.startsWith('toggle_')) {
    const itemId = parseInt(data.replace('toggle_', ''), 10);

    // Get and toggle the item
    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      await telegramService.answerCallbackQuery(id, 'Item not found');
      return;
    }

    // Toggle completion
    const updatedItem = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { completed: !item.completed }
    });

    // Answer the callback
    await telegramService.answerCallbackQuery(
      id,
      updatedItem.completed ? 'Marked as completed' : 'Marked as incomplete'
    );

    // Update the message with new button state
    const allItems = await prisma.checklistItem.findMany({
      orderBy: { order: 'asc' }
    });

    const keyboard = allItems.map(item => [{
      text: `${item.completed ? '✅' : '⬜'} ${item.text}`,
      callback_data: `toggle_${item.id}`
    }]);

    await telegramService.editMessageReplyMarkup(
      message.chat.id,
      message.message_id,
      { inline_keyboard: keyboard }
    );
  }
}

/**
 * Handles incoming messages (commands)
 */
async function handleMessage(message, prisma) {
  const { text, from, chat } = message;
  const telegramId = String(from.id);

  if (!text) return;

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { telegramId }
  });

  // Handle /start command - always respond
  if (text === '/start') {
    const helpText = `
Welcome to the Checklist Bot!

Use the Mini App button in the menu to access the full checklist interface.

Available commands:
/show_checklist - View the checklist
/start - Show this help message

Admin commands (if authorized):
/add_item <text> - Add a new item
/remove_item <number> - Remove an item
    `.trim();

    await telegramService.sendMessage(chat.id, helpText);
    return;
  }

  // For other commands, check authorization
  if (!user?.isAuthorized) {
    await telegramService.sendMessage(
      chat.id,
      'You are not authorized to use this bot. Please contact an admin.'
    );
    return;
  }

  // Handle /show_checklist
  if (text === '/show_checklist') {
    const items = await prisma.checklistItem.findMany({
      orderBy: { order: 'asc' }
    });

    if (items.length === 0) {
      await telegramService.sendMessage(chat.id, 'No items in the checklist.');
      return;
    }

    const keyboard = items.map(item => [{
      text: `${item.completed ? '✅' : '⬜'} ${item.text}`,
      callback_data: `toggle_${item.id}`
    }]);

    await telegramService.sendMessage(
      chat.id,
      '🔔 መስራታችውን እባክህ አረጋግጥ',
      { reply_markup: { inline_keyboard: keyboard } }
    );
    return;
  }

  // Admin commands
  if (!user.isAdmin) return;

  // Handle /add_item
  if (text.startsWith('/add_item ')) {
    const itemText = text.replace('/add_item ', '').trim();

    if (!itemText) {
      await telegramService.sendMessage(chat.id, 'Please provide item text: /add_item <text>');
      return;
    }

    const lastItem = await prisma.checklistItem.findFirst({
      orderBy: { order: 'desc' }
    });

    await prisma.checklistItem.create({
      data: {
        text: itemText,
        completed: false,
        order: (lastItem?.order ?? -1) + 1
      }
    });

    await telegramService.sendMessage(chat.id, `Item added: ${itemText}`);
    return;
  }

  // Handle /remove_item
  if (text.startsWith('/remove_item ')) {
    const indexStr = text.replace('/remove_item ', '').trim();
    const index = parseInt(indexStr, 10);

    if (isNaN(index) || index < 1) {
      await telegramService.sendMessage(chat.id, 'Please provide a valid item number: /remove_item <number>');
      return;
    }

    const items = await prisma.checklistItem.findMany({
      orderBy: { order: 'asc' }
    });

    if (index > items.length) {
      await telegramService.sendMessage(chat.id, `Invalid item number. You have ${items.length} items.`);
      return;
    }

    const itemToRemove = items[index - 1];

    await prisma.checklistItem.delete({
      where: { id: itemToRemove.id }
    });

    await telegramService.sendMessage(chat.id, `Removed: ${itemToRemove.text}`);
    return;
  }
}

module.exports = router;
