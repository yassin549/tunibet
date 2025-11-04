import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { TransactionHistoryResponse } from '@/types/payment';

/**
 * GET /api/transactions
 * Get user's transaction history (deposits + withdrawals)
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
    const type = searchParams.get('type'); // 'deposit' or 'withdrawal'
    const status = searchParams.get('status'); // 'pending', 'completed', etc.
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Fetch transactions
    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    const response: TransactionHistoryResponse = {
      transactions: transactions || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
