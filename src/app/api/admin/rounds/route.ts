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

    // Fetch rounds with bet counts
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select(`
        *,
        bets (count)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      return NextResponse.json(
        { error: 'Failed to fetch rounds' },
        { status: 500 }
      );
    }

    // Transform the data to include bet count
    const transformedRounds = rounds?.map((round: any) => ({
      ...round,
      _count: {
        bets: round.bets?.[0]?.count || 0,
      },
      bets: undefined, // Remove the raw bets array
    }));

    return NextResponse.json({ rounds: transformedRounds });
  } catch (error) {
    console.error('Error in rounds API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
