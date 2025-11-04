/**
 * Telegram Admin Commands
 * Handlers for admin-only bot commands
 */

import TelegramBot from 'node-telegram-bot-api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  sendMessage,
  broadcastMessage,
  formatCurrency,
  formatPercentage,
} from '../bot';

/**
 * Check if user is admin
 */
async function isAdmin(telegramId: number): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('telegram_users')
      .select('user_id, users(is_admin)')
      .eq('telegram_id', telegramId)
      .single();

    return (data?.users as any)?.is_admin === true;
  } catch (error) {
    return false;
  }
}

/**
 * /broadcast command - Send message to all users
 */
export async function handleBroadcastCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  // Check admin
  if (!(await isAdmin(telegramId))) {
    await sendMessage(chatId, '❌ Commande réservée aux administrateurs.');
    return;
  }

  // Extract message text
  const text = msg.text?.replace('/broadcast', '').trim();

  if (!text) {
    await sendMessage(
      chatId,
      '📢 *Broadcast*\n\n' +
        'Usage: `/broadcast [message]`\n\n' +
        'Exemple:\n' +
        '`/broadcast 🎉 Nouveau tournoi ce weekend!`'
    );
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get all telegram users with notifications enabled
    const { data: users } = await supabase
      .from('telegram_users')
      .select('telegram_id')
      .eq('notifications_enabled', true);

    if (!users || users.length === 0) {
      await sendMessage(chatId, '❌ Aucun utilisateur à notifier.');
      return;
    }

    await sendMessage(
      chatId,
      `📤 Envoi en cours à ${users.length} utilisateurs...`
    );

    const chatIds = users.map((u) => Number(u.telegram_id));
    const result = await broadcastMessage(chatIds, `📢 *Annonce*\n\n${text}`);

    await sendMessage(
      chatId,
      `✅ *Broadcast terminé*\n\n` +
        `Envoyés: ${result.success}\n` +
        `Échoués: ${result.failed}\n` +
        `Total: ${users.length}`
    );
  } catch (error) {
    console.error('Error in /broadcast command:', error);
    await sendMessage(chatId, '❌ Erreur lors du broadcast.');
  }
}

/**
 * /adminstats command - Platform statistics
 */
export async function handleAdminStatsCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  // Check admin
  if (!(await isAdmin(telegramId))) {
    await sendMessage(chatId, '❌ Commande réservée aux administrateurs.');
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get platform stats
    const [
      { count: totalUsers },
      { count: activeUsers24h },
      { count: newUsers7d },
      { data: revenueData },
      { count: totalBets24h },
      { count: totalRounds24h },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('bets')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.rpc('get_revenue_analytics', {
        p_start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      }),
      supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const revenue24h = revenueData?.totalRevenue || 0;
    const houseEdge = revenueData?.houseEdge || 0;

    // Get unique active users
    const { data: uniqueUsers } = await supabase
      .from('bets')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const uniqueActiveUsers = uniqueUsers
      ? new Set(uniqueUsers.map((b) => b.user_id)).size
      : 0;

    await sendMessage(
      chatId,
      `📈 *Statistiques Plateforme*\n\n` +
        `👥 *Utilisateurs*\n` +
        `Total: ${totalUsers || 0}\n` +
        `Actifs (24h): ${uniqueActiveUsers}\n` +
        `Nouveaux (7j): ${newUsers7d || 0}\n\n` +
        `💰 *Revenus (24h)*\n` +
        `Revenus: ${formatCurrency(revenue24h)}\n` +
        `House Edge: ${formatPercentage(houseEdge)}\n\n` +
        `🎲 *Activité (24h)*\n` +
        `Paris: ${totalBets24h || 0}\n` +
        `Rounds: ${totalRounds24h || 0}\n\n` +
        `⏰ Mis à jour: ${new Date().toLocaleTimeString('fr-FR')}`
    );
  } catch (error) {
    console.error('Error in /adminstats command:', error);
    await sendMessage(chatId, '❌ Erreur lors de la récupération des stats.');
  }
}

/**
 * /users command - User count and activity
 */
export async function handleUsersCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  // Check admin
  if (!(await isAdmin(telegramId))) {
    await sendMessage(chatId, '❌ Commande réservée aux administrateurs.');
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();

    const [
      { count: totalUsers },
      { count: linkedTelegram },
      { count: bannedUsers },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('telegram_users')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', true),
      supabase
        .from('users')
        .select('email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    let recentUsersText = '';
    if (recentUsers && recentUsers.length > 0) {
      recentUsersText = recentUsers
        .map((u, i) => {
          const date = new Date(u.created_at);
          return `${i + 1}. ${u.email} - ${date.toLocaleDateString('fr-FR')}`;
        })
        .join('\n');
    }

    await sendMessage(
      chatId,
      `👥 *Gestion Utilisateurs*\n\n` +
        `📊 *Statistiques*\n` +
        `Total: ${totalUsers || 0}\n` +
        `Telegram liés: ${linkedTelegram || 0}\n` +
        `Bannis: ${bannedUsers || 0}\n\n` +
        `🆕 *Derniers inscrits*\n` +
        `${recentUsersText || 'Aucun'}`
    );
  } catch (error) {
    console.error('Error in /users command:', error);
    await sendMessage(chatId, '❌ Erreur lors de la récupération des users.');
  }
}

/**
 * /revenue command - Revenue report
 */
export async function handleRevenueCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  // Check admin
  if (!(await isAdmin(telegramId))) {
    await sendMessage(chatId, '❌ Commande réservée aux administrateurs.');
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get revenue for different periods
    const [{ data: revenue24h }, { data: revenue7d }, { data: revenue30d }] =
      await Promise.all([
        supabase.rpc('get_revenue_analytics', {
          p_start_date: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(),
          p_end_date: new Date().toISOString(),
        }),
        supabase.rpc('get_revenue_analytics', {
          p_start_date: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          p_end_date: new Date().toISOString(),
        }),
        supabase.rpc('get_revenue_analytics', {
          p_start_date: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          p_end_date: new Date().toISOString(),
        }),
      ]);

    await sendMessage(
      chatId,
      `💰 *Rapport Revenus*\n\n` +
        `📅 *24 heures*\n` +
        `Revenus: ${formatCurrency(revenue24h?.totalRevenue || 0)}\n` +
        `Misé: ${formatCurrency(revenue24h?.totalWagered || 0)}\n` +
        `Paris: ${revenue24h?.totalBets || 0}\n` +
        `House Edge: ${formatPercentage(revenue24h?.houseEdge || 0)}\n\n` +
        `📅 *7 jours*\n` +
        `Revenus: ${formatCurrency(revenue7d?.totalRevenue || 0)}\n` +
        `Misé: ${formatCurrency(revenue7d?.totalWagered || 0)}\n` +
        `Paris: ${revenue7d?.totalBets || 0}\n\n` +
        `📅 *30 jours*\n` +
        `Revenus: ${formatCurrency(revenue30d?.totalRevenue || 0)}\n` +
        `Misé: ${formatCurrency(revenue30d?.totalWagered || 0)}\n` +
        `Paris: ${revenue30d?.totalBets || 0}`
    );
  } catch (error) {
    console.error('Error in /revenue command:', error);
    await sendMessage(chatId, '❌ Erreur lors de la récupération des revenus.');
  }
}

/**
 * /botstats command - Bot usage statistics
 */
export async function handleBotStatsCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  // Check admin
  if (!(await isAdmin(telegramId))) {
    await sendMessage(chatId, '❌ Commande réservée aux administrateurs.');
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get bot stats for today
    const { data: todayStats } = await supabase
      .from('bot_stats')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    // Get total telegram users
    const { count: totalLinked } = await supabase
      .from('telegram_users')
      .select('*', { count: 'exact', head: true });

    // Get notifications sent today
    const { count: notificationsSent } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte(
        'sent_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const commandBreakdown = todayStats?.command_breakdown || {};
    let topCommands = '';
    if (Object.keys(commandBreakdown).length > 0) {
      topCommands = Object.entries(commandBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([cmd, count]) => `/${cmd}: ${count}`)
        .join('\n');
    }

    await sendMessage(
      chatId,
      `🤖 *Statistiques Bot*\n\n` +
        `📊 *Aujourd'hui*\n` +
        `Messages: ${todayStats?.total_messages || 0}\n` +
        `Commandes: ${todayStats?.total_commands || 0}\n` +
        `Utilisateurs: ${todayStats?.unique_users || 0}\n\n` +
        `📱 *Telegram*\n` +
        `Comptes liés: ${totalLinked || 0}\n` +
        `Notifications (24h): ${notificationsSent || 0}\n\n` +
        `🔝 *Top Commandes*\n` +
        `${topCommands || 'Aucune commande'}`
    );
  } catch (error) {
    console.error('Error in /botstats command:', error);
    await sendMessage(chatId, '❌ Erreur lors de la récupération des stats bot.');
  }
}
