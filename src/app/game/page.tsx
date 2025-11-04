'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useGameEngine } from '@/lib/hooks/use-game-engine';
import { GameCanvas } from '@/components/game/game-canvas';
import { BettingPanel } from '@/components/game/betting-panel';
import { RoundsHistory } from '@/components/game/rounds-history';
import { AnonymousBanner } from '@/components/game/anonymous-banner';
import { SignUpPrompt } from '@/components/modals/sign-up-prompt';
import { GameLoader } from '@/components/loading/game-loader';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { motion } from 'framer-motion';
import {
  getRemainingGames,
  getGamesPlayed,
  incrementGameCount,
  hasHitLimit,
  clearAnonymousSession,
} from '@/lib/anonymous-play';

export default function GamePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentRound, isLoading: gameLoading, error } = useGameEngine();
  
  // Anonymous play state
  const [remainingGames, setRemainingGames] = useState(getRemainingGames());
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  const [showHardBlock, setShowHardBlock] = useState(false);
  const [hasShownSoftPrompt, setHasShownSoftPrompt] = useState(false);
  
  const isAnonymous = !user;
  const gamesPlayed = getGamesPlayed();

  useEffect(() => {
    // Clear anonymous session if user signed in
    if (user && !authLoading) {
      clearAnonymousSession();
      setRemainingGames(999); // Unlimited for authenticated users
    } else if (!user) {
      // Update remaining games for anonymous users
      setRemainingGames(getRemainingGames());
      
      // Show hard block if limit reached
      if (hasHitLimit()) {
        setShowHardBlock(true);
      }
    }
  }, [user, authLoading]);

  // Handle game completion for anonymous users
  const handleAnonymousGameComplete = () => {
    if (isAnonymous) {
      const session = incrementGameCount();
      setRemainingGames(getRemainingGames());
      
      // Show soft prompt after 3rd game
      if (session.gamesPlayed === 3 && !hasShownSoftPrompt) {
        setShowSoftPrompt(true);
        setHasShownSoftPrompt(true);
      }
      
      // Show hard block after 5th game
      if (session.gamesPlayed >= 5) {
        setShowHardBlock(true);
      }
    }
  };

  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <GameLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-crash text-lg font-bold">Loading Error</p>
            <p className="text-cream/70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sign-Up Prompts */}
      <SignUpPrompt
        isOpen={showSoftPrompt}
        onClose={() => setShowSoftPrompt(false)}
        type="soft"
        gamesPlayed={gamesPlayed}
        canDismiss={true}
      />

      <SignUpPrompt
        isOpen={showHardBlock}
        onClose={() => {}}
        type="hard"
        gamesPlayed={gamesPlayed}
        canDismiss={false}
      />

      <main className="min-h-screen relative py-8">
        <FuturisticBackground />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Page Header */}
            <div className="text-center space-y-2">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-cream">
                Crash Game
              </h1>
              <p className="text-lg text-cream/70">
                Cash out before the crash and multiply your wins!
              </p>
            </div>

            {/* Anonymous Banner */}
            {isAnonymous && remainingGames < 999 && (
              <AnonymousBanner gamesRemaining={remainingGames} />
            )}

          {/* Main Game Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Game Canvas */}
            <div className="lg:col-span-2 space-y-6">
              <GameCanvas />
              <RoundsHistory />
            </div>

            {/* Right Column - Betting Panel */}
            <div className="lg:col-span-1">
              <BettingPanel />
            </div>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-gold/10 border-2 border-gold/30 p-6 backdrop-blur-sm"
          >
            <div className="flex items-start space-x-4">
              <span className="text-3xl">💡</span>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-cream">
                  How to Play?
                </h3>
                <ul className="text-sm text-cream/80 space-y-1">
                  <li>1. Place your bet during the betting phase</li>
                  <li>2. Watch the multiplier increase</li>
                  <li>3. Click "Cash Out" before the crash!</li>
                  <li>4. The longer you wait, the more you win... but beware of the crash!</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
    </> // Fix JSX fragment closing tag
  );
}
