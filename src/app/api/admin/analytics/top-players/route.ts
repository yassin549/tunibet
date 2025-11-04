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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '24h';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top players from database function
    const { data: topPlayers, error: playersError } = await supabase.rpc(
      'get_top_players',
      {
        p_limit: limit,
        p_time_period: period,
      }
    );

    if (playersError) {
      console.error('Error fetching top players:', playersError);
      return NextResponse.json(
        { error: 'Failed to fetch top players' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedPlayers = topPlayers.map((player: any, index: number) => ({
      rank: index + 1,
      userId: player.user_id,
      email: player.email,
      displayName: player.display_name || player.email.split('@')[0],
      totalWagered: parseFloat(player.total_wagered),
      totalProfit: parseFloat(player.total_profit),
      netProfit: parseFloat(player.total_profit),
      betCount: parseInt(player.bet_count),
      winRate: parseFloat(player.win_rate || 0),
      avgBet:
        parseInt(player.bet_count) > 0
          ? parseFloat(player.total_wagered) / parseInt(player.bet_count)
          : 0,
    }));

    return NextResponse.json(
      {
        period,
        players: formattedPlayers,
        totalPlayers: formattedPlayers.length,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Error in top players API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
