import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/bets/cashout
 * Cash out an active bet
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { betId, multiplier } = body;

    // Guest demo mode - return mock cash out success
    if (!user && betId?.startsWith('demo-')) {
      const mockAmount = 100; // Default demo bet amount
      const profit = mockAmount * multiplier - mockAmount;
      const payout = mockAmount * multiplier;
      
      return NextResponse.json({
        success: true,
        profit,
        payout,
        multiplier,
        newBalance: 0, // Client will manage balance via localStorage
      });
    }

    // Real user mode - require authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!betId || !multiplier) {
      return NextResponse.json(
        { error: 'Missing required fields: betId and multiplier' },
        { status: 400 }
      );
    }

    if (multiplier < 1) {
      return NextResponse.json(
        { error: 'Invalid multiplier' },
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
      console.error('Bet fetch error:', betError);
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
    const round = bet.rounds;
    if (!round || round.status !== 'active') {
      return NextResponse.json(
        { error: 'Round is not active' },
        { status: 400 }
      );
    }

    // Verify multiplier hasn't exceeded crash point
    if (multiplier > round.crash_point) {
      return NextResponse.json(
        { error: 'Cannot cash out after crash' },
        { status: 400 }
      );
    }

    // Calculate winnings
    const profit = bet.amount * multiplier - bet.amount;
    const payout = bet.amount * multiplier;

    console.log('Cashout calculation:', {
      betAmount: bet.amount,
      multiplier,
      profit,
      payout,
      betId,
    });

    // Update bet status
    const { error: updateBetError } = await supabase
      .from('bets')
      .update({
        cashout_at: multiplier,
        profit,
        status: 'cashed_out',
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
    
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('demo_balance, live_balance')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json(
        { error: 'Failed to fetch user balance' },
        { status: 500 }
      );
    }

    const currentBalance = bet.account_type === 'demo' 
      ? userData.demo_balance 
      : userData.live_balance;
    
    const newBalance = currentBalance + payout;

    console.log('Balance update:', {
      accountType: bet.account_type,
      currentBalance,
      payout,
      newBalance,
    });

    const { error: balanceError } = await supabase
      .from('users')
      .update({ [balanceField]: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      // Try to rollback bet status
      await supabase
        .from('bets')
        .update({ status: 'active', cashout_at: null, profit: null })
        .eq('id', betId);
      
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profit,
      payout,
      multiplier,
      newBalance,
      message: 'Successfully cashed out!',
    });
  } catch (error) {
    console.error('Cash out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
