import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AdminCheckResult {
  isAdmin: boolean;
  user: any | null;
  error: string | null;
  supabase?: any;
}

/**
 * Checks if the current user is an admin
 * Reusable across all admin API routes
 */
export async function checkAdminAuth(
  request?: NextRequest
): Promise<AdminCheckResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        error: 'Unauthorized',
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        isAdmin: false,
        user,
        error: 'User not found',
      };
    }

    if (!userData.is_admin) {
      return {
        isAdmin: false,
        user,
        error: 'Forbidden - Admin access required',
      };
    }

    return {
      isAdmin: true,
      user,
      error: null,
      supabase, // Return supabase client for reuse
    };
  } catch (error) {
    console.error('Error in checkAdminAuth:', error);
    return {
      isAdmin: false,
      user: null,
      error: 'Internal server error',
    };
  }
}

/**
 * Middleware-style admin check with automatic error response
 * Returns supabase client and user if authorized, or null if not
 */
export async function requireAdmin(request?: NextRequest) {
  const result = await checkAdminAuth(request);

  if (!result.isAdmin) {
    return {
      authorized: false,
      response: {
        error: result.error,
        isAdmin: false,
      },
      status: result.error === 'Unauthorized' ? 401 : 403,
    };
  }

  return {
    authorized: true,
    user: result.user,
    supabase: result.supabase,
  };
}
