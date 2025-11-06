export type GamePhase = 
  | 'setup'        // User sets bet parameters
  | 'loading'      // Game engine loading animation
  | 'betting'      // Waiting for round to start
  | 'active'       // Game in progress
  | 'result'       // Win/loss result with motivation
  | 'transition';  // Brief pause before next round

export interface BetParameters {
  amount: number;
  autoCashout: number | null;
  leverage?: number;
}

export interface GameResult {
  type: 'win' | 'loss';
  multiplier: number;
  profit: number;
  motivationMessage: string;
}
