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
    const { userId, ban } = body;

    if (!userId || typeof ban !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and ban status required' },
        { status: 400 }
      );
    }

    // Prevent banning admins
    const { data: targetUser } = await supabase
      .from('users')
      .select('is_admin, is_banned')
      .eq('id', userId)
      .single();

    if (targetUser?.is_admin) {
      return NextResponse.json(
        { error: 'Cannot ban admin users' },
        { status: 400 }
      );
    }

    // Get before state for audit
    const beforeState = {
      is_banned: targetUser?.is_banned || false,
    };

    // Update user ban status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_banned: ban,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Create audit log
    const { error: logError } = await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: ban ? 'ban_user' : 'unban_user',
      target_type: 'user',
      target_id: userId,
      before_state: beforeState,
      after_state: { is_banned: ban },
      reason: ban ? 'User banned by admin' : 'User unbanned by admin',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    if (logError) {
      console.error('Error creating audit log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: ban ? 'User banned successfully' : 'User unbanned successfully',
      user: {
        id: userId,
        is_banned: ban,
      },
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
