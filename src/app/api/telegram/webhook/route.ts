import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '@/lib/telegram/bot';

// Types for Telegram (if package not installed, use any)
type TelegramUpdate = any;
type TelegramMessage = any;
type TelegramCallbackQuery = any;
import {
  handleStartCommand,
  handleBalanceCommand,
  handleStatsCommand,
  handlePlayCommand,
  handleHelpCommand,
  handleDepositCommand,
  handleWithdrawCommand,
  handleCallbackQuery,
} from '@/lib/telegram/commands/user-commands';
import {
  handleBroadcastCommand,
  handleAdminStatsCommand,
  handleUsersCommand,
  handleRevenueCommand,
  handleBotStatsCommand,
} from '@/lib/telegram/commands/admin-commands';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST handler for Telegram webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const update: TelegramUpdate = body;

    // Process the update
    await processUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process Telegram update
 */
async function processUpdate(update: TelegramUpdate) {
  try {
    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      await updateBotStats();
      return;
    }

    // Handle messages
    if (update.message) {
      const msg = update.message;

      // Update bot stats
      await updateBotStats(msg.text?.startsWith('/') ? msg.text.split(' ')[0].substring(1) : undefined);

      // Handle commands
      if (msg.text?.startsWith('/')) {
        const command = msg.text.split(' ')[0].toLowerCase();

        switch (command) {
          // User commands
          case '/start':
            await handleStartCommand(msg);
            break;
          case '/balance':
            await handleBalanceCommand(msg);
            break;
          case '/stats':
            await handleStatsCommand(msg);
            break;
          case '/play':
            await handlePlayCommand(msg);
            break;
          case '/deposit':
            await handleDepositCommand(msg);
            break;
          case '/withdraw':
            await handleWithdrawCommand(msg);
            break;
          case '/help':
            await handleHelpCommand(msg);
            break;

          // Admin commands
          case '/broadcast':
            await handleBroadcastCommand(msg);
            break;
          case '/adminstats':
            await handleAdminStatsCommand(msg);
            break;
          case '/users':
            await handleUsersCommand(msg);
            break;
          case '/revenue':
            await handleRevenueCommand(msg);
            break;
          case '/botstats':
            await handleBotStatsCommand(msg);
            break;

          default:
            // Unknown command
            const bot = getBot();
            await bot.sendMessage(
              msg.chat.id,
              '❌ Commande inconnue.\n\nUtilisez /help pour voir les commandes disponibles.'
            );
        }
      }
    }
  } catch (error) {
    console.error('Error processing update:', error);
  }
}

/**
 * Update bot statistics
 */
async function updateBotStats(command?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's stats
    const { data: existingStats } = await supabase
      .from('bot_stats')
      .select('*')
      .eq('date', today)
      .single();

    const commandBreakdown = existingStats?.command_breakdown || {};

    if (command) {
      commandBreakdown[command] = (commandBreakdown[command] || 0) + 1;
    }

    if (existingStats) {
      // Update existing
      await supabase
        .from('bot_stats')
        .update({
          total_messages: existingStats.total_messages + 1,
          total_commands: existingStats.total_commands + (command ? 1 : 0),
          command_breakdown: commandBreakdown,
          updated_at: new Date().toISOString(),
        })
        .eq('date', today);
    } else {
      // Create new
      await supabase.from('bot_stats').insert({
        date: today,
        total_messages: 1,
        total_commands: command ? 1 : 0,
        command_breakdown: commandBreakdown,
      });
    }
  } catch (error) {
    console.error('Error updating bot stats:', error);
  }
}

/**
 * GET handler - webhook info
 */
export async function GET() {
  try {
    const bot = getBot();
    const info = await bot.getWebHookInfo();

    return NextResponse.json({
      webhook: info,
      status: 'active',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get webhook info' },
      { status: 500 }
    );
  }
}
