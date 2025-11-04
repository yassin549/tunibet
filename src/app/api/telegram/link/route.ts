import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST - Generate linking code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate linking code
    const { data: code, error: codeError } = await supabase.rpc(
      'generate_telegram_linking_code',
      {
        p_user_id: user.id,
      }
    );

    if (codeError) {
      console.error('Error generating linking code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code,
      expiresIn: 900, // 15 minutes in seconds
      instructions: [
        'Ouvrez Telegram',
        'Recherchez @TunibetBot',
        'Envoyez /start',
        'Entrez ce code quand demandé',
      ],
    });
  } catch (error) {
    console.error('Error in link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if account is linked
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if telegram is linked
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('telegram_id, telegram_username, linked_at, notifications_enabled')
      .eq('user_id', user.id)
      .single();

    if (!telegramUser || !telegramUser.telegram_id) {
      return NextResponse.json({
        linked: false,
      });
    }

    return NextResponse.json({
      linked: true,
      telegramUsername: telegramUser.telegram_username,
      linkedAt: telegramUser.linked_at,
      notificationsEnabled: telegramUser.notifications_enabled,
    });
  } catch (error) {
    console.error('Error in link check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unlink Telegram account
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Unlink telegram
    const { error: unlinkError } = await supabase
      .from('telegram_users')
      .delete()
      .eq('user_id', user.id);

    if (unlinkError) {
      console.error('Error unlinking telegram:', unlinkError);
      return NextResponse.json(
        { error: 'Failed to unlink' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account unlinked',
    });
  } catch (error) {
    console.error('Error in unlink API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update notification settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationsEnabled } = await request.json();

    if (typeof notificationsEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update notification settings
    const { error: updateError } = await supabase
      .from('telegram_users')
      .update({ notifications_enabled: notificationsEnabled })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationsEnabled,
    });
  } catch (error) {
    console.error('Error in notification settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
