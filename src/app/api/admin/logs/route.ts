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

    // Fetch logs with admin info
    const { data: logs, error: logsError } = await supabase
      .from('admin_logs')
      .select(`
        *,
        admin:users!admin_logs_admin_id_fkey (
          email,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error in logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
