import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyIPNSignature, mapPaymentStatus } from '@/lib/nowpayments';
import type { NOWPaymentsIPN } from '@/types/payment';

/**
 * POST /api/ipn
 * Handle NOWPayments IPN (Instant Payment Notification) callbacks
 * 
 * This endpoint receives payment status updates from NOWPayments
 * Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38#9998079f-dcc8-4e07-9ac7-3d52f0fd733a
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get IPN signature from headers
    const signature = request.headers.get('x-nowpayments-sig');

    if (!signature) {
      console.error('Missing IPN signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyIPNSignature(rawBody, signature);

    if (!isValid) {
      console.error('Invalid IPN signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse IPN data
    const ipnData: NOWPaymentsIPN = JSON.parse(rawBody);

    console.log('Received IPN:', {
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      order_id: ipnData.order_id,
    });

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    // Find transaction by payment_id or order_id (order_id = transaction.id)
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .or(`payment_id.eq.${ipnData.payment_id},id.eq.${ipnData.order_id}`)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      // Return 200 to prevent NOWPayments from retrying
      return NextResponse.json({ message: 'Transaction not found' });
    }

    // Map NOWPayments status to our status
    const newStatus = mapPaymentStatus(ipnData.payment_status);

    // Only update if status changed
    if (transaction.status === newStatus) {
      return NextResponse.json({ message: 'Status unchanged' });
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If payment completed, update additional fields
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.crypto_amount = ipnData.actually_paid;
      
      // Update user's live balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          live_balance: supabase.raw(`live_balance + ${transaction.amount}`),
        })
        .eq('id', transaction.user_id);

      if (balanceError) {
        console.error('Failed to update user balance:', balanceError);
      } else {
        console.log(`Added ${transaction.amount} USD to user ${transaction.user_id}`);
      }
    }

    // If payment failed, add note
    if (newStatus === 'failed') {
      updateData.note = `Payment ${ipnData.payment_status}`;
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    console.log(`Transaction ${transaction.id} updated to ${newStatus}`);

    return NextResponse.json({ message: 'IPN processed successfully' });
  } catch (error) {
    console.error('IPN processing error:', error);
    // Return 200 even on error to prevent NOWPayments from retrying indefinitely
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 200 }
    );
  }
}

/**
 * GET /api/ipn
 * Return basic info (not meant to be called directly)
 */
export async function GET() {
  return NextResponse.json({
    message: 'NOWPayments IPN webhook endpoint',
    method: 'POST',
  });
}
