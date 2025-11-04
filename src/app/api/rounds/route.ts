import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateProvablyFairRound } from '@/lib/provably-fair';

/**
 * GET /api/rounds
 * Fetch current and recent rounds
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent rounds (limit to prevent abuse)
    const { data: rounds, error } = await supabase
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (error) {
      console.error('Error fetching rounds:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rounds' },
        { status: 500 }
      );
    }

    // Don't expose server_seed for active/pending rounds
    const safeRounds = rounds?.map((round) => {
      if (round.status === 'pending' || round.status === 'active') {
        const { server_seed, ...safeRound } = round;
        return safeRound;
      }
      return round;
    });

    return NextResponse.json({ rounds: safeRounds });
  } catch (error) {
    console.error('Rounds API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rounds
 * Create a new round (server-only, called by game engine)
 * 
 * Note: In production, this should be protected and only callable by
 * the game engine server process, not by clients
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the latest round number
    const { data: latestRound } = await supabase
      .from('rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1)
      .single();

    const nextRoundNumber = (latestRound?.round_number || 0) + 1;

    // Generate provably fair round
    const roundData = generateProvablyFairRound(nextRoundNumber);

    // Insert new round into database
    const { data: newRound, error } = await supabase
      .from('rounds')
      .insert([
        {
          round_number: nextRoundNumber,
          server_seed: roundData.serverSeed,
          server_seed_hash: roundData.serverSeedHash,
          client_seed: roundData.clientSeed,
          crash_point: roundData.crashPoint,
          started_at: new Date().toISOString(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating round:', error);
      return NextResponse.json(
        { error: 'Failed to create round' },
        { status: 500 }
      );
    }

    // Return round without server_seed (it's secret until round ends)
    const { server_seed, ...safeRound } = newRound;

    return NextResponse.json({ round: safeRound });
  } catch (error) {
    console.error('Create round error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rounds/:id
 * Update round status (start, crash)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { roundId, status, endedAt } = body;

    if (!roundId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'active', 'crashed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update round status
    const updateData: any = { status };
    if (endedAt) {
      updateData.ended_at = endedAt;
    }

    const { data: updatedRound, error } = await supabase
      .from('rounds')
      .update(updateData)
      .eq('id', roundId)
      .select()
      .single();

    if (error) {
      console.error('Error updating round:', error);
      return NextResponse.json(
        { error: 'Failed to update round' },
        { status: 500 }
      );
    }

    // If round is crashed, reveal server_seed
    if (status === 'crashed') {
      return NextResponse.json({ round: updatedRound });
    }

    // Otherwise, hide server_seed
    const { server_seed, ...safeRound } = updatedRound;
    return NextResponse.json({ round: safeRound });
  } catch (error) {
    console.error('Update round error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
