import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/bets/history
 * Get user's bet history with pagination and filters
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'cashed_out' or 'lost'
    const accountType = searchParams.get('account_type'); // 'demo' or 'live'

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('bets')
      .select('*, rounds(crash_point)', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (accountType) {
      query = query.eq('account_type', accountType);
    }

    // Fetch bets
    const { data: bets, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bet history' },
        { status: 500 }
      );
    }

    // Transform bets to include crash_point from rounds
    const transformedBets = bets?.map((bet: any) => ({
      ...bet,
      crash_point: bet.rounds?.crash_point || null,
      rounds: undefined, // Remove nested rounds object
    })) || [];

    return NextResponse.json({
      bets: transformedBets,
      total: count || 0,
      page,
      limit,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (error) {
    console.error('Bet history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
