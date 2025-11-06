import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/stats/user
 * Get user statistics (total bets, win rate, etc.)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('amount, cashout_at, profit, status, created_at')
      .eq('user_id', user.id);

    if (betsError) {
      console.error('Error fetching bets:', betsError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalBets = bets?.length || 0;
    const cashedOutBets = bets?.filter(b => b.status === 'cashed_out') || [];
    const lostBets = bets?.filter(b => b.status === 'lost') || [];

    const totalWagered = bets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
    const totalWon = cashedOutBets.reduce((sum, b) => sum + (b.profit || 0), 0);
    const winRate = totalBets > 0 ? (cashedOutBets.length / totalBets) * 100 : 0;
    
    const biggestWin = cashedOutBets.length > 0
      ? Math.max(...cashedOutBets.map(b => b.profit || 0))
      : 0;

    // Calculate current streak (consecutive wins/losses)
    let currentStreak = 0;
    if (bets && bets.length > 0) {
      const sortedBets = [...bets].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const firstStatus = sortedBets[0]?.status;
      for (const bet of sortedBets) {
        if (bet.status === firstStatus) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const stats = {
      totalBets,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      biggestWin: Math.round(biggestWin * 100) / 100,
      currentStreak,
      wonBets: cashedOutBets.length,
      lostBets: lostBets.length,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
