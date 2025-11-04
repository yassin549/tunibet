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
    const { withdrawalId, reason } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID required' },
        { status: 400 }
      );
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', withdrawalId)
      .eq('type', 'withdrawal')
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal already processed' },
        { status: 400 }
      );
    }

    // Get before state for audit
    const beforeState = {
      status: withdrawal.status,
      amount: withdrawal.amount,
    };

    // Calculate refund amount (original amount + fee)
    const fee = Math.max(parseFloat(withdrawal.amount.toString()) * 0.02, 2);
    const refundAmount = parseFloat(withdrawal.amount.toString()) + fee;

    // Start transaction: update withdrawal and refund user
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Error updating withdrawal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update withdrawal' },
        { status: 500 }
      );
    }

    // Refund user balance
    const { error: refundError } = await supabase.rpc('increment_balance', {
      user_id: withdrawal.user_id,
      amount: refundAmount,
    });

    if (refundError) {
      console.error('Error refunding balance:', refundError);
      // Try direct update as fallback
      const { error: directUpdateError } = await supabase
        .from('users')
        .update({
          live_balance: supabase.raw(`live_balance + ${refundAmount}`),
        })
        .eq('id', withdrawal.user_id);

      if (directUpdateError) {
        console.error('Error in direct balance update:', directUpdateError);
      }
    }

    // Create audit log
    const { error: logError } = await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'reject_withdrawal',
      target_type: 'transaction',
      target_id: withdrawalId,
      before_state: beforeState,
      after_state: { status: 'cancelled', refunded: refundAmount },
      reason: reason || 'Withdrawal rejected by admin',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    if (logError) {
      console.error('Error creating audit log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected and refunded',
      withdrawal: {
        id: withdrawalId,
        status: 'cancelled',
        refunded: refundAmount,
      },
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
