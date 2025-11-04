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
    const { withdrawalId } = body;

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

    // Update withdrawal status to completed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
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

    // Create audit log
    const { error: logError } = await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'approve_withdrawal',
      target_type: 'transaction',
      target_id: withdrawalId,
      before_state: beforeState,
      after_state: { status: 'completed' },
      reason: 'Withdrawal approved by admin',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    if (logError) {
      console.error('Error creating audit log:', logError);
    }

    // TODO: In production, trigger NOWPayments payout API here
    // Example:
    // await createPayout({
    //   address: withdrawal.crypto_address,
    //   currency: withdrawal.crypto_currency,
    //   amount: withdrawal.crypto_amount,
    // });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved successfully',
      withdrawal: {
        id: withdrawalId,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
