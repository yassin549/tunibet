import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCryptoPayment, getEstimate } from '@/lib/nowpayments';
import type {
  CreateDepositRequest,
  CreateDepositResponse,
  Transaction,
} from '@/types/payment';

/**
 * POST /api/deposits
 * Create a new deposit transaction
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

    const body: CreateDepositRequest = await request.json();
    const { amount, currency, cryptoCurrency } = body;

    // Validation
    if (!amount || !currency || !cryptoCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 5) {
      return NextResponse.json(
        { error: 'Minimum deposit is 5 USD' },
        { status: 400 }
      );
    }

    if (amount > 10000) {
      return NextResponse.json(
        { error: 'Maximum deposit is 10,000 USD' },
        { status: 400 }
      );
    }

    // Get estimate from NOWPayments
    const estimate = await getEstimate(amount, currency, cryptoCurrency);

    if (!estimate) {
      return NextResponse.json(
        { error: 'Failed to get crypto estimate' },
        { status: 500 }
      );
    }

    // Create transaction in database first
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'deposit',
          status: 'pending',
          amount,
          currency: currency.toLowerCase(),
          crypto_currency: cryptoCurrency.toLowerCase(),
          crypto_amount: estimate.estimated_amount,
        },
      ])
      .select()
      .single();

    if (dbError || !transaction) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Create payment with NOWPayments
    try {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ipn`;
      
      const payment = await createCryptoPayment(
        amount,
        cryptoCurrency,
        transaction.id,
        callbackUrl
      );

      // Update transaction with payment details
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          payment_id: payment.payment_id,
          payment_url: `https://nowpayments.io/payment/?iid=${payment.payment_id}`,
          crypto_address: payment.pay_address,
          crypto_amount: payment.pay_amount,
          network: payment.network,
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Failed to update transaction:', updateError);
      }

      // Fetch updated transaction
      const { data: updatedTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();

      const response: CreateDepositResponse = {
        transaction: (updatedTransaction || transaction) as Transaction,
        paymentUrl: `https://nowpayments.io/payment/?iid=${payment.payment_id}`,
        paymentAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
      };

      return NextResponse.json(response);
    } catch (paymentError) {
      console.error('NOWPayments error:', paymentError);
      
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          note: 'Failed to create payment with NOWPayments',
        })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deposits
 * Get user's deposit history
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

    // Fetch deposits
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deposits' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'deposit');

    return NextResponse.json({
      transactions,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (error) {
    console.error('Deposits GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
