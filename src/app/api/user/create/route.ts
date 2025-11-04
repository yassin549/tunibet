import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/user/create
 * Create a new user record in the database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, email, display_name } = body;

    if (!user_id || !email) {
      return NextResponse.json(
        { error: 'user_id and email are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 200 }
      );
    }

    // Create new user record
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user_id,
        email,
        display_name: display_name || email.split('@')[0],
        demo_balance: 1000, // Start with 1000 TND demo balance
        live_balance: 0,
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    console.error('User create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
