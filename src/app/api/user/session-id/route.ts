import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create session ID
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('session_id')
      .eq('id', user.id)
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to fetch session ID' }, { status: 500 });
    }

    // If no session ID exists, generate one
    if (!userData.session_id) {
      const sessionId = generateSessionId();
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ session_id: sessionId })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to create session ID' }, { status: 500 });
      }

      return NextResponse.json({ sessionId });
    }

    return NextResponse.json({ sessionId: userData.session_id });
  } catch (error) {
    console.error('Session ID GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new session ID
    const sessionId = generateSessionId();

    const { error: updateError } = await supabase
      .from('users')
      .update({ session_id: sessionId })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to regenerate session ID' }, { status: 500 });
    }

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Session ID POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSessionId(): string {
  // Generate a secure random session ID
  return randomBytes(16).toString('hex').toUpperCase();
}
