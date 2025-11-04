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

    // Get real-time metrics from database function
    const { data: metrics, error: metricsError } = await supabase.rpc(
      'get_realtime_metrics'
    );

    if (metricsError) {
      console.error('Error fetching realtime metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Get additional metrics
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent bets for BPM calculation
    const { data: recentBets, error: betsError } = await supabase
      .from('bets')
      .select('created_at, amount')
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });

    if (betsError) {
      console.error('Error fetching recent bets:', betsError);
    }

    // Calculate bets per minute for last 5 minutes
    const bpmData: Array<{ minute: string; count: number }> = [];
    for (let i = 4; i >= 0; i--) {
      const minuteStart = new Date(now.getTime() - i * 60 * 1000);
      const minuteEnd = new Date(minuteStart.getTime() + 60 * 1000);
      const count =
        recentBets?.filter((bet) => {
          const betTime = new Date(bet.created_at);
          return betTime >= minuteStart && betTime < minuteEnd;
        }).length || 0;

      bpmData.push({
        minute: minuteStart.toISOString(),
        count,
      });
    }

    // Get top crash points from recent rounds
    const { data: recentRounds } = await supabase
      .from('rounds')
      .select('crash_point, created_at')
      .eq('status', 'completed')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    const avgCrashPoint = recentRounds
      ? recentRounds.reduce(
          (sum, round) => sum + parseFloat(round.crash_point.toString()),
          0
        ) / recentRounds.length
      : 0;

    // Get online users (active in last 5 minutes)
    const { data: onlineUsers, error: usersError } = await supabase
      .from('bets')
      .select('user_id')
      .gte('created_at', fiveMinutesAgo.toISOString());

    const uniqueOnlineUsers = onlineUsers
      ? new Set(onlineUsers.map((bet) => bet.user_id)).size
      : 0;

    const response = {
      ...metrics,
      onlineUsers: uniqueOnlineUsers,
      bpmData,
      avgCrashPoint: avgCrashPoint.toFixed(2),
      recentRoundsCount: recentRounds?.length || 0,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
