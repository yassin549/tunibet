/**
 * Telegram Notification System
 * Handles sending notifications to users
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendMessage, formatCurrency } from './bot';

export type NotificationType =
  | 'deposit_confirmed'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'big_win'
  | 'account_banned'
  | 'account_unbanned'
  | 'balance_adjusted';

/**
 * Queue a notification for a user
 */
export async function queueNotification(
  userId: string,
  type: NotificationType,
  message: string,
  data?: any
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.rpc('queue_notification', {
      p_user_id: userId,
      p_type: type,
      p_message: message,
      p_data: data || null,
    });

    if (error) {
      console.error('Error queueing notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error queueing notification:', error);
    return false;
  }
}

/**
 * Send pending notifications
 */
export async function sendPendingNotifications(limit: number = 10): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    const supabase = await createServerSupabaseClient();

    // Get pending notifications
    const { data: notifications } = await supabase.rpc(
      'get_pending_notifications',
      { p_limit: limit }
    );

    if (!notifications || notifications.length === 0) {
      return { sent, failed };
    }

    // Send each notification
    for (const notification of notifications) {
      const success = await sendMessage(
        Number(notification.telegram_id),
        notification.message
      );

      // Mark as sent or failed
      await supabase.rpc('mark_notification_sent', {
        p_notification_id: notification.id,
        p_success: success,
        p_error_message: success ? null : 'Failed to send message',
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }

  return { sent, failed };
}

/**
 * Notify deposit confirmed
 */
export async function notifyDepositConfirmed(
  userId: string,
  amount: number,
  transactionId: string,
  newBalance: number
): Promise<boolean> {
  const message =
    `✅ *Dépôt Confirmé*\n\n` +
    `Montant: ${formatCurrency(amount)}\n` +
    `Nouveau solde: ${formatCurrency(newBalance)}\n\n` +
    `Transaction ID: #${transactionId.substring(0, 8)}\n\n` +
    `Bon jeu! 🎰`;

  return queueNotification(userId, 'deposit_confirmed', message, {
    amount,
    transactionId,
    newBalance,
  });
}

/**
 * Notify withdrawal approved
 */
export async function notifyWithdrawalApproved(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const message =
    `✅ *Retrait Approuvé*\n\n` +
    `Montant: ${formatCurrency(amount)}\n\n` +
    `Le paiement sera traité sous 24-48h.\n\n` +
    `Transaction ID: #${transactionId.substring(0, 8)}`;

  return queueNotification(userId, 'withdrawal_approved', message, {
    amount,
    transactionId,
  });
}

/**
 * Notify withdrawal rejected
 */
export async function notifyWithdrawalRejected(
  userId: string,
  amount: number,
  reason: string,
  transactionId: string
): Promise<boolean> {
  const message =
    `❌ *Retrait Rejeté*\n\n` +
    `Montant: ${formatCurrency(amount)}\n` +
    `Raison: ${reason}\n\n` +
    `Le montant a été remboursé sur votre compte.\n\n` +
    `Transaction ID: #${transactionId.substring(0, 8)}`;

  return queueNotification(userId, 'withdrawal_rejected', message, {
    amount,
    reason,
    transactionId,
  });
}

/**
 * Notify big win
 */
export async function notifyBigWin(
  userId: string,
  amount: number,
  multiplier: number,
  betAmount: number
): Promise<boolean> {
  const message =
    `🎉 *GROS GAIN!*\n\n` +
    `Vous avez gagné ${formatCurrency(amount)}!\n` +
    `Multiplicateur: ${multiplier.toFixed(2)}x\n` +
    `Mise: ${formatCurrency(betAmount)}\n\n` +
    `Félicitations! 🔥`;

  return queueNotification(userId, 'big_win', message, {
    amount,
    multiplier,
    betAmount,
  });
}

/**
 * Notify account banned
 */
export async function notifyAccountBanned(
  userId: string,
  reason: string
): Promise<boolean> {
  const message =
    `⚠️ *Compte Suspendu*\n\n` +
    `Votre compte a été temporairement suspendu.\n\n` +
    `Raison: ${reason}\n\n` +
    `Pour plus d'informations, contactez le support.`;

  return queueNotification(userId, 'account_banned', message, { reason });
}

/**
 * Notify account unbanned
 */
export async function notifyAccountUnbanned(userId: string): Promise<boolean> {
  const message =
    `✅ *Compte Réactivé*\n\n` +
    `Votre compte a été réactivé.\n\n` +
    `Vous pouvez maintenant accéder à tous les services.\n\n` +
    `Bon jeu! 🎰`;

  return queueNotification(userId, 'account_unbanned', message);
}

/**
 * Notify balance adjusted
 */
export async function notifyBalanceAdjusted(
  userId: string,
  amount: number,
  accountType: 'demo' | 'live',
  reason: string,
  newBalance: number
): Promise<boolean> {
  const isPositive = amount > 0;
  const emoji = isPositive ? '➕' : '➖';
  const action = isPositive ? 'Ajout' : 'Retrait';

  const message =
    `${emoji} *${action} de Solde*\n\n` +
    `Compte: ${accountType === 'demo' ? 'Demo' : 'Live'}\n` +
    `Montant: ${formatCurrency(Math.abs(amount))}\n` +
    `Nouveau solde: ${formatCurrency(newBalance)}\n\n` +
    `Raison: ${reason}`;

  return queueNotification(userId, 'balance_adjusted', message, {
    amount,
    accountType,
    reason,
    newBalance,
  });
}

/**
 * Check for big wins and notify
 */
export async function checkAndNotifyBigWins(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get recent big wins (last 5 minutes, multiplier >= 5x, amount >= 100 TND)
    const { data: bigWins } = await supabase
      .from('bets')
      .select('user_id, amount, profit, multiplier')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .gte('multiplier', 5)
      .gte('profit', 100)
      .is('notified', null);

    if (!bigWins || bigWins.length === 0) return;

    // Notify each big win
    for (const win of bigWins) {
      await notifyBigWin(
        win.user_id,
        parseFloat(win.profit.toString()),
        parseFloat(win.multiplier.toString()),
        parseFloat(win.amount.toString())
      );

      // Mark as notified (if column exists)
      // await supabase
      //   .from('bets')
      //   .update({ notified: true })
      //   .eq('id', win.id);
    }
  } catch (error) {
    console.error('Error checking big wins:', error);
  }
}

/**
 * Start notification worker (call this periodically)
 */
export async function processNotificationQueue(): Promise<void> {
  try {
    // Send pending notifications
    const result = await sendPendingNotifications(10);
    
    if (result.sent > 0 || result.failed > 0) {
      console.log(
        `Notifications processed: ${result.sent} sent, ${result.failed} failed`
      );
    }

    // Check for big wins
    await checkAndNotifyBigWins();
  } catch (error) {
    console.error('Error processing notification queue:', error);
  }
}
