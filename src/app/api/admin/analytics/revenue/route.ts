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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '24h';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: Date;
    let end: Date = new Date();

    // Calculate date range
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case '24h':
          start = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
    }

    // Get revenue analytics
    const { data: revenueData, error: revenueError } = await supabase.rpc(
      'get_revenue_analytics',
      {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      }
    );

    if (revenueError) {
      console.error('Error fetching revenue analytics:', revenueError);
      return NextResponse.json(
        { error: 'Failed to fetch revenue analytics' },
        { status: 500 }
      );
    }

    // Get hourly breakdown
    const { data: hourlyData, error: hourlyError } = await supabase.rpc(
      'get_hourly_revenue',
      {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      }
    );

    if (hourlyError) {
      console.error('Error fetching hourly revenue:', hourlyError);
    }

    // Get revenue by game mode
    const { data: demoRevenue } = await supabase
      .from('bets')
      .select('amount, profit')
      .eq('account_type', 'demo')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const { data: liveRevenue } = await supabase
      .from('bets')
      .select('amount, profit')
      .eq('account_type', 'live')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Calculate mode-specific revenue
    const demoWagered = demoRevenue?.reduce((sum, bet) => sum + parseFloat(bet.amount.toString()), 0) || 0;
    const demoPayout = demoRevenue?.reduce((sum, bet) => sum + (bet.profit ? parseFloat(bet.profit.toString()) : 0), 0) || 0;
    const demoStats = {
      wagered: demoWagered,
      payout: demoPayout,
      revenue: demoWagered - demoPayout,
    };

    const liveWagered = liveRevenue?.reduce((sum, bet) => sum + parseFloat(bet.amount.toString()), 0) || 0;
    const livePayout = liveRevenue?.reduce((sum, bet) => sum + (bet.profit ? parseFloat(bet.profit.toString()) : 0), 0) || 0;
    const liveStats = {
      wagered: liveWagered,
      payout: livePayout,
      revenue: liveWagered - livePayout,
    };

    // Get comparison data (previous period)
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = start;

    const { data: prevRevenueData } = await supabase.rpc(
      'get_revenue_analytics',
      {
        p_start_date: prevStart.toISOString(),
        p_end_date: prevEnd.toISOString(),
      }
    );

    const response = {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      current: revenueData,
      previous: prevRevenueData,
      hourly: hourlyData || [],
      byMode: {
        demo: demoStats,
        live: liveStats,
      },
      comparison: prevRevenueData
        ? {
            revenueChange:
              ((revenueData.totalRevenue - prevRevenueData.totalRevenue) /
                (prevRevenueData.totalRevenue || 1)) *
              100,
            betsChange:
              ((revenueData.totalBets - prevRevenueData.totalBets) /
                (prevRevenueData.totalBets || 1)) *
              100,
          }
        : null,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error in revenue analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
