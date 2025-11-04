import crypto from 'crypto';

/**
 * Provably Fair System for Tunibet Crash Game
 * Industry-standard implementation using HMAC-SHA256
 */

/**
 * Generate a cryptographically secure server seed
 * @returns 64-character hex string
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a client seed (can be user-provided or auto-generated)
 * @param userSeed Optional user-provided seed
 * @returns Client seed string
 */
export function generateClientSeed(userSeed?: string): string {
  if (userSeed && userSeed.length > 0) {
    return userSeed;
  }
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate HMAC-SHA256 hash of server seed
 * This is shown to users BEFORE the round starts
 * @param serverSeed The server seed to hash
 * @returns SHA256 hash in hex format
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto
    .createHmac('sha256', 'tunibet-salt')
    .update(serverSeed)
    .digest('hex');
}

/**
 * Calculate crash point using provably fair algorithm
 * This is the core algorithm that determines when the game crashes
 * 
 * @param serverSeed Server-generated random seed
 * @param clientSeed Client-generated or user-provided seed
 * @param nonce Round number or incrementing counter
 * @returns Crash point between 1.00 and 100.00
 */
export function calculateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  // Create HMAC-SHA256 hash combining server seed, client seed, and nonce
  const hash = crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');

  // Convert first 8 hex characters to a number
  const h = parseInt(hash.substr(0, 8), 16);
  
  // Use 2^32 as the maximum value
  const e = Math.pow(2, 32);

  // Calculate crash point using the formula
  // This ensures fair distribution across the range
  const result = Math.floor((100 * e - h) / (e - h)) / 100;

  // Clamp between 1.00 and 100.00
  return Math.max(1.00, Math.min(result, 100.00));
}

/**
 * Verify a crash point calculation
 * Used by the fair verifier to check if a round was fair
 * 
 * @param serverSeed The revealed server seed
 * @param serverSeedHash The hash that was shown before the round
 * @param clientSeed The client seed used
 * @param nonce The nonce (round number)
 * @param expectedCrash The crash point that occurred
 * @returns Object with verification result
 */
export function verifyCrashPoint(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number,
  expectedCrash: number
): {
  isValid: boolean;
  calculatedCrash: number;
  hashMatches: boolean;
  crashMatches: boolean;
} {
  // Verify the server seed hash matches
  const calculatedHash = hashServerSeed(serverSeed);
  const hashMatches = calculatedHash === serverSeedHash;

  // Calculate the crash point with the revealed seed
  const calculatedCrash = calculateCrashPoint(serverSeed, clientSeed, nonce);
  
  // Check if calculated crash matches expected (with small tolerance for floating point)
  const crashMatches = Math.abs(calculatedCrash - expectedCrash) < 0.01;

  return {
    isValid: hashMatches && crashMatches,
    calculatedCrash,
    hashMatches,
    crashMatches,
  };
}

/**
 * Generate a complete round with provably fair seeds
 * @param nonce The round number
 * @param clientSeed Optional client seed
 * @returns Complete round data
 */
export function generateProvablyFairRound(
  nonce: number,
  clientSeed?: string
): {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
} {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const finalClientSeed = generateClientSeed(clientSeed);
  const crashPoint = calculateCrashPoint(serverSeed, finalClientSeed, nonce);

  return {
    serverSeed,
    serverSeedHash,
    clientSeed: finalClientSeed,
    nonce,
    crashPoint,
  };
}

/**
 * Calculate house edge percentage
 * The game is designed to have a ~1% house edge
 * @param totalBets Total amount wagered
 * @param totalPayouts Total amount paid out
 * @returns House edge as percentage
 */
export function calculateHouseEdge(totalBets: number, totalPayouts: number): number {
  if (totalBets === 0) return 0;
  return ((totalBets - totalPayouts) / totalBets) * 100;
}
