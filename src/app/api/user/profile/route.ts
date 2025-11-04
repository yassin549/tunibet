import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * PATCH /api/user/profile
 * Update user profile (display_name)
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
    const { display_name } = body;

    // Validation
    if (!display_name || display_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name cannot be empty' },
        { status: 400 }
      );
    }

    if (display_name.length > 50) {
      return NextResponse.json(
        { error: 'Display name too long (max 50 characters)' },
        { status: 400 }
      );
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ display_name: display_name.trim() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
