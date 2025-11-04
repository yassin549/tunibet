import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/bets
 * Fetch user's bets
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const roundId = searchParams.get('roundId');

    let query = supabase
      .from('bets')
      .select('*, rounds(round_number, crash_point, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    // Filter by round if specified
    if (roundId) {
      query = query.eq('round_id', roundId);
    }

    const { data: bets, error } = await query;

    if (error) {
      console.error('Error fetching bets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bets });
  } catch (error) {
    console.error('Bets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bets
 * Place a new bet
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { roundId, amount, accountType } = body;

    // Guest demo mode - return mock success without saving to DB
    if (!user && accountType === 'demo') {
      return NextResponse.json({
        bet: {
          id: `demo-${Date.now()}`,
          amount,
          account_type: 'demo',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        newBalance: 0, // Client will manage balance via localStorage
      });
    }

    // Real user mode - require authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validation
    if (!roundId || !amount || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum bet is 1 TND' },
        { status: 400 }
      );
    }

    if (accountType !== 'demo' && accountType !== 'live') {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Check if round exists and is in betting phase
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    if (round.status !== 'pending' && round.status !== 'active') {
      return NextResponse.json(
        { error: 'Betting is closed for this round' },
        { status: 400 }
      );
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('demo_balance, live_balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentBalance =
      accountType === 'demo' ? userData.demo_balance : userData.live_balance;

    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Start transaction-like operation
    // 1. Deduct balance
    const balanceField = accountType === 'demo' ? 'demo_balance' : 'live_balance';
    const { error: balanceError } = await supabase
      .from('users')
      .update({ [balanceField]: currentBalance - amount })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to place bet' },
        { status: 500 }
      );
    }

    // 2. Create bet record
    const { data: newBet, error: betError } = await supabase
      .from('bets')
      .insert([
        {
          user_id: user.id,
          round_id: roundId,
          amount,
          account_type: accountType,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (betError) {
      // Rollback balance if bet creation fails
      await supabase
        .from('users')
        .update({ [balanceField]: currentBalance })
        .eq('id', user.id);

      console.error('Error creating bet:', betError);
      return NextResponse.json(
        { error: 'Failed to place bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bet: newBet,
      newBalance: currentBalance - amount,
    });
  } catch (error) {
    console.error('Place bet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bets/:id
 * Cash out a bet
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { betId, cashoutAt, amount } = body;

    // Guest demo mode - return mock cash out success
    if (!user && betId?.startsWith('demo-')) {
      const profit = (amount || 10) * cashoutAt - (amount || 10);
      const totalPayout = (amount || 10) + profit;
      
      return NextResponse.json({
        success: true,
        profit,
        totalPayout,
        cashoutAt,
        newBalance: 0, // Client will manage balance via localStorage
      });
    }

    // Real user mode - require authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!betId || !cashoutAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get bet details
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*, rounds(crash_point, status)')
      .eq('id', betId)
      .eq('user_id', user.id)
      .single();

    if (betError || !bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    if (bet.status !== 'active') {
      return NextResponse.json(
        { error: 'Bet is not active' },
        { status: 400 }
      );
    }

    // Verify round is still active
    if (bet.rounds.status !== 'active') {
      return NextResponse.json(
        { error: 'Round is not active' },
        { status: 400 }
      );
    }

    // Calculate profit
    const profit = bet.amount * cashoutAt - bet.amount;
    const totalPayout = bet.amount + profit;

    // Update bet status
    const { error: updateBetError } = await supabase
      .from('bets')
      .update({
        cashout_at: cashoutAt,
        profit,
        status: 'won',
        cashed_out_at: new Date().toISOString(),
      })
      .eq('id', betId);

    if (updateBetError) {
      console.error('Error updating bet:', updateBetError);
      return NextResponse.json(
        { error: 'Failed to cash out' },
        { status: 500 }
      );
    }

    // Add winnings to balance
    const balanceField = bet.account_type === 'demo' ? 'demo_balance' : 'live_balance';
    
    const { data: userData } = await supabase
      .from('users')
      .select('demo_balance, live_balance')
      .eq('id', user.id)
      .single();

    const currentBalance = (bet.account_type === 'demo' 
      ? userData?.demo_balance 
      : userData?.live_balance) || 0;
    const newBalance = currentBalance + totalPayout;

    const { error: balanceError } = await supabase
      .from('users')
      .update({ [balanceField]: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profit,
      totalPayout,
      cashoutAt,
      newBalance,
    });
  } catch (error) {
    console.error('Cash out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
