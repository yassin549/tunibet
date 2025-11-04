import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/user/switch-mode
 * Switch between virtual and real balance modes
 */
export async function POST(request: Request) {
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
    const { mode } = body;

    if (!mode || !['virtual', 'real'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "virtual" or "real"' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updates: any = {
      balance_type: mode,
    };

    // If switching from virtual to real, save current virtual balance
    if (userData.balance_type === 'virtual' && mode === 'real') {
      updates.virtual_balance_saved = userData.demo_balance;
      
      // Check if user has real balance
      if (userData.live_balance <= 0) {
        return NextResponse.json(
          { error: 'No real balance. Please deposit first.' },
          { status: 400 }
        );
      }
    }

    // If switching from real to virtual, restore saved virtual balance
    if (userData.balance_type === 'real' && mode === 'virtual') {
      // Restore saved virtual balance or use default
      const restoredBalance = userData.virtual_balance_saved || 1000;
      updates.demo_balance = restoredBalance;
    }

    // Update user's balance type
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error switching mode:', updateError);
      return NextResponse.json(
        { error: 'Failed to switch mode' },
        { status: 500 }
      );
    }

    // Fetch updated user data
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ 
      message: `Switched to ${mode} mode`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Mode switch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
