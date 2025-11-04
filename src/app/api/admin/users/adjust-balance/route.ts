import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const { userId, accountType, amount, reason } = body;

    if (!userId || !accountType || typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    if (accountType !== 'demo' && accountType !== 'live') {
      return NextResponse.json(
        { error: 'Account type must be demo or live' },
        { status: 400 }
      );
    }

    // Get current balance for audit
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('demo_balance, live_balance')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const balanceField = accountType === 'demo' ? 'demo_balance' : 'live_balance';
    const currentBalance = parseFloat(
      targetUser[balanceField]?.toString() || '0'
    );
    const newBalance = currentBalance + amount;

    // Prevent negative balances
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Resulting balance cannot be negative' },
        { status: 400 }
      );
    }

    // Get before state for audit
    const beforeState = {
      [balanceField]: currentBalance,
    };

    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        [balanceField]: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Create audit log
    const { error: logError } = await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'adjust_balance',
      target_type: 'user',
      target_id: userId,
      before_state: beforeState,
      after_state: { [balanceField]: newBalance },
      reason: reason || `Balance adjusted by ${amount > 0 ? '+' : ''}${amount} TND`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    if (logError) {
      console.error('Error creating audit log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Balance adjusted successfully',
      user: {
        id: userId,
        [balanceField]: newBalance,
        adjustment: amount,
      },
    });
  } catch (error) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
