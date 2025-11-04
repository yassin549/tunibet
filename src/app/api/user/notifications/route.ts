import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * PATCH /api/user/notifications
 * Update user notification preferences
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

    const body = await request.json();
    const {
      email_notifications,
      bet_notifications,
      transaction_notifications,
    } = body;

    // For now, we'll just return success
    // In production, you'd store these preferences in the database
    console.log('Notification preferences updated:', {
      user_id: user.id,
      email_notifications,
      bet_notifications,
      transaction_notifications,
    });

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
