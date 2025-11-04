/**
 * Telegram Bot Initialization
 * Handles bot setup and configuration
 */

import TelegramBot from 'node-telegram-bot-api';

// Bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8403365999:AAGhAS9XQ1AP0MmM2m8WUZr-waudY146kbQ';

// Webhook URL (set in production)
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || '';

let botInstance: TelegramBot | null = null;

/**
 * Get or create bot instance
 */
export function getBot(): TelegramBot {
  if (!botInstance) {
    // In production, use webhook mode
    // In development, use polling mode
    const useWebhook = process.env.NODE_ENV === 'production' && WEBHOOK_URL;

    botInstance = new TelegramBot(BOT_TOKEN, {
      polling: !useWebhook,
      webHook: useWebhook
        ? {
            port: undefined, // Next.js handles the port
          }
        : false,
    });

    console.log(
      `Telegram bot initialized in ${useWebhook ? 'webhook' : 'polling'} mode`
    );
  }

  return botInstance;
}

/**
 * Set webhook for production
 */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const bot = getBot();
    await bot.setWebHook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}

/**
 * Delete webhook (for development)
 */
export async function deleteWebhook(): Promise<boolean> {
  try {
    const bot = getBot();
    await bot.deleteWebHook();
    console.log('Webhook deleted');
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return false;
  }
}

/**
 * Get webhook info
 */
export async function getWebhookInfo() {
  try {
    const bot = getBot();
    return await bot.getWebHookInfo();
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return null;
  }
}

/**
 * Send message to user
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options?: TelegramBot.SendMessageOptions
): Promise<boolean> {
  try {
    const bot = getBot();
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

/**
 * Send message with inline keyboard
 */
export async function sendMessageWithKeyboard(
  chatId: number,
  text: string,
  keyboard: TelegramBot.InlineKeyboardButton[][]
): Promise<boolean> {
  return sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

/**
 * Answer callback query
 */
export async function answerCallbackQuery(
  queryId: string,
  text?: string
): Promise<boolean> {
  try {
    const bot = getBot();
    await bot.answerCallbackQuery(queryId, { text });
    return true;
  } catch (error) {
    console.error('Error answering callback query:', error);
    return false;
  }
}

/**
 * Edit message text
 */
export async function editMessageText(
  text: string,
  options: TelegramBot.EditMessageTextOptions
): Promise<boolean> {
  try {
    const bot = getBot();
    await bot.editMessageText(text, options);
    return true;
  } catch (error) {
    console.error('Error editing message:', error);
    return false;
  }
}

/**
 * Get bot info
 */
export async function getBotInfo() {
  try {
    const bot = getBot();
    return await bot.getMe();
  } catch (error) {
    console.error('Error getting bot info:', error);
    return null;
  }
}

/**
 * Broadcast message to multiple users
 */
export async function broadcastMessage(
  chatIds: number[],
  text: string,
  options?: TelegramBot.SendMessageOptions
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    const sent = await sendMessage(chatId, text, options);
    if (sent) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting: wait 50ms between messages
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return { success, failed };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Create inline keyboard button
 */
export function createButton(
  text: string,
  callbackData?: string,
  url?: string
): TelegramBot.InlineKeyboardButton {
  if (url) {
    return { text, url };
  }
  return { text, callback_data: callbackData || text };
}

/**
 * Create keyboard row
 */
export function createKeyboardRow(
  ...buttons: TelegramBot.InlineKeyboardButton[]
): TelegramBot.InlineKeyboardButton[] {
  return buttons;
}
