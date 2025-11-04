import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  CreateWithdrawalRequest,
  CreateWithdrawalResponse,
  Transaction,
} from '@/types/payment';

/**
 * POST /api/withdrawals
 * Create a new withdrawal request
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateWithdrawalRequest = await request.json();
    const { amount, cryptoCurrency, cryptoAddress, network } = body;

    // Validation
    if (!amount || !cryptoCurrency || !cryptoAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal is 10 USD' },
        { status: 400 }
      );
    }

    // Validate crypto address format (basic validation)
    if (cryptoAddress.length < 20) {
      return NextResponse.json(
        { error: 'Invalid crypto address' },
        { status: 400 }
      );
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('live_balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Check if user has sufficient balance
    if (userData.live_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Calculate withdrawal fee (2% or minimum $2)
    const feePercent = 0.02;
    const minFee = 2;
    const fee = Math.max(amount * feePercent, minFee);
    const totalDeduction = amount + fee;

    if (userData.live_balance < totalDeduction) {
      return NextResponse.json(
        { error: `Insufficient balance. Total needed: ${totalDeduction.toFixed(2)} USD (including ${fee.toFixed(2)} USD fee)` },
        { status: 400 }
      );
    }

    // Deduct amount + fee from user's balance immediately
    const { error: balanceError } = await supabase
      .from('users')
      .update({ live_balance: userData.live_balance - totalDeduction })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // Create withdrawal transaction
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'withdrawal',
          status: 'pending',
          amount,
          currency: 'usd',
          crypto_currency: cryptoCurrency.toLowerCase(),
          crypto_address: cryptoAddress,
          network: network || cryptoCurrency.toLowerCase(),
          fee,
          note: 'Withdrawal request pending admin approval',
        },
      ])
      .select()
      .single();

    if (dbError || !transaction) {
      console.error('Database error:', dbError);
      
      // Rollback balance deduction
      await supabase
        .from('users')
        .update({ live_balance: userData.live_balance })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    const response: CreateWithdrawalResponse = {
      transaction: transaction as Transaction,
      message: 'Withdrawal request created. It will be processed within 24-48 hours.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Withdrawal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/withdrawals
 * Get user's withdrawal history
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
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch withdrawals
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'withdrawal');

    return NextResponse.json({
      transactions,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (error) {
    console.error('Withdrawals GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/withdrawals
 * Cancel a pending withdrawal (user can cancel before processing)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transaction ID' },
        { status: 400 }
      );
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Can only cancel pending withdrawals
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending withdrawals' },
        { status: 400 }
      );
    }

    // Refund amount + fee to user
    const refundAmount = transaction.amount + (transaction.fee || 0);

    const { error: balanceError } = await supabase
      .from('users')
      .update({
        live_balance: supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: refundAmount,
        }),
      })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Failed to refund balance:', balanceError);
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        note: 'Cancelled by user',
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel withdrawal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Withdrawal cancelled and balance refunded',
    });
  } catch (error) {
    console.error('Withdrawal cancel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
