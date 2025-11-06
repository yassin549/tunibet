import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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

    // Fetch withdrawals with user info
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users!transactions_user_id_fkey (
          email,
          display_name
        )
      `)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(100);

    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Error in withdrawals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
