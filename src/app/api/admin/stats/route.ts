import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch stats in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      pendingWithdrawalsResult,
      activeRoundsResult,
      todayBetsResult,
      bannedUsersResult,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id', { count: 'exact', head: true }),

      // Active users (logged in last 24h)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Pending withdrawals
      supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'withdrawal')
        .eq('status', 'pending'),

      // Active rounds
      supabase
        .from('rounds')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Today's bets
      supabase
        .from('bets')
        .select('amount, profit')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      // Banned users
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_banned', true),
    ]);

    // Calculate pending withdrawal amount
    const pendingWithdrawals = pendingWithdrawalsResult.data || [];
    const totalWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );

    // Calculate today's revenue (house edge from bets)
    const todayBets = todayBetsResult.data || [];
    const totalWagered = todayBets.reduce(
      (sum, bet) => sum + parseFloat(bet.amount.toString()),
      0
    );
    const totalPayout = todayBets.reduce(
      (sum, bet) => sum + (bet.profit ? parseFloat(bet.profit.toString()) : 0),
      0
    );
    const revenueToday = totalWagered - totalPayout;

    const stats = {
      totalUsers: totalUsersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      pendingWithdrawals: pendingWithdrawals.length,
      totalWithdrawalAmount,
      activeRounds: activeRoundsResult.count || 0,
      totalBetsToday: todayBets.length,
      revenueToday,
      bannedUsers: bannedUsersResult.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
