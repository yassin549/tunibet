/**
 * Telegram User Commands
 * Handlers for user-facing bot commands
 */

import TelegramBot from 'node-telegram-bot-api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  sendMessage,
  sendMessageWithKeyboard,
  formatCurrency,
  formatPercentage,
  createButton,
  createKeyboardRow,
} from '../bot';

/**
 * /start command - Welcome message and account linking
 */
export async function handleStartCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;
  const username = msg.from?.username;
  const firstName = msg.from?.first_name || '';
  const lastName = msg.from?.last_name || '';

  if (!telegramId) return;

  try {
    const supabase = await createServerSupabaseClient();

    // Check if already linked
    const { data: existingLink } = await supabase
      .from('telegram_users')
      .select('user_id, users(email, display_name)')
      .eq('telegram_id', telegramId)
      .single();

    if (existingLink) {
      const user = existingLink.users as any;
      const keyboard = [
        createKeyboardRow(
          createButton('💰 Solde', 'balance'),
          createButton('📊 Stats', 'stats')
        ),
        createKeyboardRow(
          createButton('🎮 Jouer', undefined, process.env.NEXT_PUBLIC_APP_URL || 'https://tunibet.com')
        ),
      ];

      await sendMessageWithKeyboard(
        chatId,
        `👋 Bienvenue ${firstName}!\n\n` +
          `Votre compte est déjà lié à:\n` +
          `📧 ${user.email}\n\n` +
          `Utilisez les boutons ci-dessous pour accéder rapidement à vos informations.`,
        keyboard
      );
    } else {
      const keyboard = [
        createKeyboardRow(
          createButton('🔗 Lier mon compte', undefined, `${process.env.NEXT_PUBLIC_APP_URL}/profil?tab=settings`)
        ),
      ];

      await sendMessageWithKeyboard(
        chatId,
        `👋 Bienvenue sur Tunibet Crash!\n\n` +
          `🎰 Le jeu de crash le plus excitant de Tunisie!\n\n` +
          `Pour lier votre compte Telegram:\n` +
          `1️⃣ Connectez-vous sur tunibet.com\n` +
          `2️⃣ Allez dans Profil > Paramètres\n` +
          `3️⃣ Cliquez sur "Lier Telegram"\n` +
          `4️⃣ Entrez le code généré\n\n` +
          `Une fois lié, vous recevrez:\n` +
          `✅ Notifications de dépôts\n` +
          `✅ Alertes de retraits\n` +
          `✅ Notifications de gros gains\n` +
          `✅ Accès rapide à vos stats\n\n` +
          `Commandes disponibles:\n` +
          `/balance - Voir vos soldes\n` +
          `/stats - Vos statistiques\n` +
          `/play - Jouer maintenant\n` +
          `/help - Liste des commandes`,
        keyboard
      );
    }
  } catch (error) {
    console.error('Error in /start command:', error);
    await sendMessage(
      chatId,
      '❌ Une erreur est survenue. Veuillez réessayer plus tard.'
    );
  }
}

/**
 * /balance command - Check balances
 */
export async function handleBalanceCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  try {
    const supabase = await createServerSupabaseClient();

    // Get user from telegram link
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('user_id, users(demo_balance, live_balance)')
      .eq('telegram_id', telegramId)
      .single();

    if (!telegramUser) {
      await sendMessage(
        chatId,
        '❌ Compte non lié.\n\nUtilisez /start pour lier votre compte.'
      );
      return;
    }

    const user = telegramUser.users as any;
    const demoBalance = parseFloat(user.demo_balance || 0);
    const liveBalance = parseFloat(user.live_balance || 0);
    const totalBalance = demoBalance + liveBalance;

    const keyboard = [
      createKeyboardRow(
        createButton('💳 Déposer', undefined, `${process.env.NEXT_PUBLIC_APP_URL}/wallet?action=deposit`),
        createButton('💸 Retirer', undefined, `${process.env.NEXT_PUBLIC_APP_URL}/wallet?action=withdraw`)
      ),
      createKeyboardRow(
        createButton('🎮 Jouer', undefined, process.env.NEXT_PUBLIC_APP_URL || 'https://tunibet.com')
      ),
    ];

    await sendMessageWithKeyboard(
      chatId,
      `💰 *Vos Soldes*\n\n` +
        `🎮 Demo: ${formatCurrency(demoBalance)}\n` +
        `💎 Live: ${formatCurrency(liveBalance)}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `📊 Total: ${formatCurrency(totalBalance)}`,
      keyboard
    );

    // Update last interaction
    await supabase
      .from('telegram_users')
      .update({ last_interaction: new Date().toISOString() })
      .eq('telegram_id', telegramId);
  } catch (error) {
    console.error('Error in /balance command:', error);
    await sendMessage(
      chatId,
      '❌ Impossible de récupérer vos soldes. Veuillez réessayer.'
    );
  }
}

/**
 * /stats command - View statistics
 */
export async function handleStatsCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  try {
    const supabase = await createServerSupabaseClient();

    // Get user from telegram link
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (!telegramUser) {
      await sendMessage(
        chatId,
        '❌ Compte non lié.\n\nUtilisez /start pour lier votre compte.'
      );
      return;
    }

    // Get user stats
    const { data: stats } = await supabase.rpc('get_user_stats', {
      p_user_id: telegramUser.user_id,
    });

    if (!stats) {
      await sendMessage(
        chatId,
        '📊 *Vos Statistiques*\n\n' +
          'Aucune activité pour le moment.\n\n' +
          'Commencez à jouer pour voir vos stats!'
      );
      return;
    }

    const totalBets = stats.total_bets || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const totalWagered = parseFloat(stats.total_wagered || 0);
    const totalWon = parseFloat(stats.total_won || 0);
    const netProfit = totalWon - totalWagered;
    const biggestWin = parseFloat(stats.biggest_win || 0);
    const biggestMultiplier = parseFloat(stats.biggest_multiplier || 0);
    const currentStreak = stats.current_streak || 0;

    const profitEmoji = netProfit >= 0 ? '📈' : '📉';
    const streakEmoji = currentStreak > 0 ? '🔥' : '❄️';

    const keyboard = [
      createKeyboardRow(
        createButton('🎮 Jouer', undefined, process.env.NEXT_PUBLIC_APP_URL || 'https://tunibet.com'),
        createButton('💰 Solde', 'balance')
      ),
    ];

    await sendMessageWithKeyboard(
      chatId,
      `📊 *Vos Statistiques*\n\n` +
        `🎲 Paris totaux: ${totalBets}\n` +
        `✅ Gains: ${wins} (${formatPercentage(winRate)})\n` +
        `❌ Pertes: ${losses} (${formatPercentage(100 - winRate)})\n\n` +
        `💵 Misé total: ${formatCurrency(totalWagered)}\n` +
        `💰 Gains totaux: ${formatCurrency(totalWon)}\n` +
        `${profitEmoji} Profit net: ${formatCurrency(netProfit)}\n\n` +
        `🏆 Plus gros gain: ${formatCurrency(biggestWin)}\n` +
        `🚀 Meilleur multi: ${biggestMultiplier.toFixed(2)}x\n` +
        `${streakEmoji} Série actuelle: ${Math.abs(currentStreak)} ${currentStreak > 0 ? 'victoires' : 'défaites'}`,
      keyboard
    );

    // Update last interaction
    await supabase
      .from('telegram_users')
      .update({ last_interaction: new Date().toISOString() })
      .eq('telegram_id', telegramId);
  } catch (error) {
    console.error('Error in /stats command:', error);
    await sendMessage(
      chatId,
      '❌ Impossible de récupérer vos statistiques. Veuillez réessayer.'
    );
  }
}

/**
 * /play command - Quick link to game
 */
export async function handlePlayCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  try {
    const supabase = await createServerSupabaseClient();

    // Check if linked
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    const keyboard = [
      createKeyboardRow(
        createButton('🎮 Jouer Maintenant', undefined, process.env.NEXT_PUBLIC_APP_URL || 'https://tunibet.com')
      ),
    ];

    if (telegramUser) {
      await sendMessageWithKeyboard(
        chatId,
        `🎰 *Prêt à jouer?*\n\n` +
          `Cliquez sur le bouton ci-dessous pour accéder au jeu!\n\n` +
          `💡 Astuce: Commencez en mode Demo pour vous entraîner.`,
        keyboard
      );

      // Update last interaction
      await supabase
        .from('telegram_users')
        .update({ last_interaction: new Date().toISOString() })
        .eq('telegram_id', telegramId);
    } else {
      await sendMessageWithKeyboard(
        chatId,
        `🎰 *Tunibet Crash*\n\n` +
          `Le jeu de crash le plus excitant!\n\n` +
          `⚠️ Liez votre compte avec /start pour recevoir des notifications.`,
        keyboard
      );
    }
  } catch (error) {
    console.error('Error in /play command:', error);
    await sendMessage(chatId, '❌ Une erreur est survenue.');
  }
}

/**
 * /help command - List all commands
 */
export async function handleHelpCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;

  await sendMessage(
    chatId,
    `📚 *Commandes Disponibles*\n\n` +
      `👤 *Commandes Utilisateur:*\n` +
      `/start - Lier votre compte\n` +
      `/balance - Voir vos soldes\n` +
      `/stats - Vos statistiques\n` +
      `/play - Jouer maintenant\n` +
      `/deposit - Instructions de dépôt\n` +
      `/withdraw - Demande de retrait\n` +
      `/help - Cette aide\n\n` +
      `💡 *Astuces:*\n` +
      `• Liez votre compte pour recevoir des notifications\n` +
      `• Utilisez le mode Demo pour vous entraîner\n` +
      `• Définissez un auto-cashout pour sécuriser vos gains\n\n` +
      `❓ *Besoin d'aide?*\n` +
      `Contactez le support sur tunibet.com`
  );
}

/**
 * /deposit command - Deposit instructions
 */
export async function handleDepositCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;

  const keyboard = [
    createKeyboardRow(
      createButton('💳 Déposer Maintenant', undefined, `${process.env.NEXT_PUBLIC_APP_URL}/wallet?action=deposit`)
    ),
  ];

  await sendMessageWithKeyboard(
    chatId,
    `💳 *Déposer des Fonds*\n\n` +
      `Pour déposer sur votre compte:\n\n` +
      `1️⃣ Cliquez sur le bouton ci-dessous\n` +
      `2️⃣ Choisissez le montant\n` +
      `3️⃣ Sélectionnez votre méthode de paiement\n` +
      `4️⃣ Suivez les instructions\n\n` +
      `✅ Dépôt minimum: 10 TND\n` +
      `⚡ Confirmation instantanée\n` +
      `🔒 Paiement 100% sécurisé`,
    keyboard
  );
}

/**
 * /withdraw command - Withdrawal instructions
 */
export async function handleWithdrawCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;

  if (!telegramId) return;

  try {
    const supabase = await createServerSupabaseClient();

    // Check if linked
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('user_id, users(live_balance)')
      .eq('telegram_id', telegramId)
      .single();

    if (!telegramUser) {
      await sendMessage(
        chatId,
        '❌ Compte non lié.\n\nUtilisez /start pour lier votre compte.'
      );
      return;
    }

    const user = telegramUser.users as any;
    const liveBalance = parseFloat(user.live_balance || 0);

    const keyboard = [
      createKeyboardRow(
        createButton('💸 Retirer Maintenant', undefined, `${process.env.NEXT_PUBLIC_APP_URL}/wallet?action=withdraw`)
      ),
    ];

    await sendMessageWithKeyboard(
      chatId,
      `💸 *Retirer des Fonds*\n\n` +
        `Solde disponible: ${formatCurrency(liveBalance)}\n\n` +
        `Pour retirer:\n\n` +
        `1️⃣ Cliquez sur le bouton ci-dessous\n` +
        `2️⃣ Entrez le montant\n` +
        `3️⃣ Fournissez votre adresse crypto\n` +
        `4️⃣ Confirmez la demande\n\n` +
        `✅ Retrait minimum: 20 TND\n` +
        `⏱️ Traitement: 24-48h\n` +
        `💰 Frais: 2%`,
      keyboard
    );
  } catch (error) {
    console.error('Error in /withdraw command:', error);
    await sendMessage(chatId, '❌ Une erreur est survenue.');
  }
}

/**
 * Handle callback queries (button clicks)
 */
export async function handleCallbackQuery(
  query: TelegramBot.CallbackQuery
): Promise<void> {
  const chatId = query.message?.chat.id;
  const data = query.data;

  if (!chatId || !data) return;

  // Route to appropriate handler
  switch (data) {
    case 'balance':
      if (query.message) {
        await handleBalanceCommand(query.message);
      }
      break;
    case 'stats':
      if (query.message) {
        await handleStatsCommand(query.message);
      }
      break;
    default:
      await sendMessage(chatId, '❌ Action non reconnue.');
  }
}
