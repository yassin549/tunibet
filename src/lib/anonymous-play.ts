/**
 * Anonymous Play Manager
 * Tracks anonymous user play sessions and enforces 5-game limit
 */

const STORAGE_KEY = 'tunibet_anonymous_session';
const MAX_GAMES = 5;

export interface AnonymousSession {
  id: string;
  gamesPlayed: number;
  createdAt: string;
  lastPlayedAt: string;
}

/**
 * Generate a unique anonymous session ID
 */
function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current anonymous session
 */
export function getAnonymousSession(): AnonymousSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading anonymous session:', error);
    return null;
  }
}

/**
 * Create a new anonymous session
 */
export function createAnonymousSession(): AnonymousSession {
  const session: AnonymousSession = {
    id: generateSessionId(),
    gamesPlayed: 0,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Get or create anonymous session
 */
export function getOrCreateAnonymousSession(): AnonymousSession {
  let session = getAnonymousSession();
  
  if (!session) {
    session = createAnonymousSession();
  }

  return session;
}

/**
 * Increment game count
 */
export function incrementGameCount(): AnonymousSession {
  const session = getOrCreateAnonymousSession();
  
  session.gamesPlayed += 1;
  session.lastPlayedAt = new Date().toISOString();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Check if user can play more games
 */
export function canPlayGame(): boolean {
  const session = getAnonymousSession();
  
  if (!session) {
    return true; // New user, can play
  }

  return session.gamesPlayed < MAX_GAMES;
}

/**
 * Get remaining games count
 */
export function getRemainingGames(): number {
  const session = getAnonymousSession();
  
  if (!session) {
    return MAX_GAMES;
  }

  const remaining = MAX_GAMES - session.gamesPlayed;
  return Math.max(0, remaining);
}

/**
 * Get total games played
 */
export function getGamesPlayed(): number {
  const session = getAnonymousSession();
  return session?.gamesPlayed || 0;
}

/**
 * Clear anonymous session (after sign-up)
 */
export function clearAnonymousSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get max games allowed
 */
export function getMaxGames(): number {
  return MAX_GAMES;
}

/**
 * Check if this is a new anonymous user (0 games played)
 */
export function isNewAnonymousUser(): boolean {
  const session = getAnonymousSession();
  return !session || session.gamesPlayed === 0;
}

/**
 * Check if user has hit the limit
 */
export function hasHitLimit(): boolean {
  const session = getAnonymousSession();
  return session ? session.gamesPlayed >= MAX_GAMES : false;
}
