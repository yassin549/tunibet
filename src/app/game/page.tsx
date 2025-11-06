'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores/useStore';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { GameLoader } from '@/components/loading/game-loader';
import { BetSetup } from '@/components/game/bet-setup';
import { LoadingAnimation } from '@/components/game/loading-animation';
import { PlaneCanvas3D } from '@/components/game/plane-canvas-3d';
import { GameResultEnhanced, getRandomMotivation } from '@/components/game/game-result-enhanced';
import { GameHistoryPanel } from '@/components/game/game-history-panel';
import { ModeBadge } from '@/components/game/mode-badge';
import { GamePhase, BetParameters, GameResult as GameResultType } from '@/types/game-phases';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function GamePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, multiplier, setMultiplier, setGameStatus, updateBalance, setUser } = useStore();
  
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [betParams, setBetParams] = useState<BetParameters | null>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [userBet, setUserBet] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResultType | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const supabase = createClient();

  // Fetch or create round
  const fetchRound = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Create new round
        const response = await fetch('/api/rounds', { method: 'POST' });
        if (response.ok) {
          const { round } = await response.json();
          setCurrentRound(round);
          return round;
        }
      } else {
        setCurrentRound(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching round:', err);
      return null;
    }
  }, [supabase]);

  // Start game flow
  const handleStart = async (params: BetParameters) => {
    setBetParams(params);
    setPhase('loading');

    // Show loading for 0.8 seconds (reduced from 1.5s)
    setTimeout(async () => {
      const round = await fetchRound();
      if (!round) {
        toast.error('Failed to start game. Creating new round...');
        // Try one more time
        const retryRound = await fetchRound();
        if (!retryRound) {
          setPhase('setup');
          return;
        }
        // Use the retry round
        proceedWithRound(retryRound, params);
        return;
      }
      proceedWithRound(round, params);
    }, 800);
  };

  // Process bet placement and round start
  const proceedWithRound = async (round: any, params: BetParameters) => {
    try {

      // Place bet
      const accountType = user?.balance_type === 'real' ? 'live' : 'demo';
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: round.id,
          amount: params.amount,
          accountType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to place bet');
        setPhase('setup');
        return;
      }

      setUserBet(data.bet);
      
      // Update balance
      if (user) {
        const newUser = { ...user };
        if (accountType === 'demo') {
          newUser.demo_balance = data.newBalance;
        } else {
          newUser.live_balance = data.newBalance;
        }
        setUser(newUser);
      } else {
        updateBalance(balance - params.amount);
      }

      // Wait for round to start
      if (round.status === 'pending') {
        setPhase('betting');
        const pendingTime = Date.now() - new Date(round.started_at).getTime();
        const waitTime = Math.max(0, 3000 - pendingTime); // Reduced from 5000 to 3000
        
        setTimeout(() => {
          startRound(round.id);
        }, waitTime);
      } else if (round.status === 'active') {
        // Round already active, start immediately
        startActivePhase(round);
      } else {
        // For any other status, activate the round
        console.log('Round status:', round.status, '- activating now');
        await startRound(round.id);
      }
    } catch (error) {
      console.error('Error in proceedWithRound:', error);
      toast.error('Game initialization error');
      setPhase('setup');
    }
  };

  // Start round
  const startRound = async (roundId: string) => {
    await fetch('/api/rounds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, status: 'active' }),
    });
    
    const { data } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();
      
    if (data) {
      startActivePhase(data);
    }
  };

  // Start active phase
  const startActivePhase = (round: any) => {
    setCurrentRound(round);
    setPhase('active');
    setStartTime(Date.now());
    setGameStatus('active');
  };

  // Manual cash-out
  const handleCashout = async () => {
    if (!userBet || !currentRound) {
      console.warn('Cannot cashout: userBet or currentRound is null', { userBet, currentRound });
      return;
    }

    console.log('Cashing out:', { betId: userBet.id, multiplier, currentRound: currentRound.id });

    const response = await fetch('/api/bets/cashout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        betId: userBet.id,
        multiplier: multiplier,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      // Update bet status to prevent double cashout
      setUserBet({ ...userBet, status: 'cashed_out' });
      
      // Update balance
      if (user) {
        const newUser = { ...user };
        const accountType = user.balance_type === 'real' ? 'live' : 'demo';
        if (accountType === 'demo') {
          newUser.demo_balance = data.newBalance;
        } else {
          newUser.live_balance = data.newBalance;
        }
        setUser(newUser);
      } else {
        updateBalance(balance + data.payout);
      }

      showResult({
        type: 'win',
        multiplier: multiplier,
        profit: data.profit,
        motivationMessage: getRandomMotivation('win'),
      });
    } else {
      toast.error(data.error || 'Failed to cash out');
      console.error('Cashout failed:', data);
    }
  };

  // Show result
  const showResult = (result: GameResultType) => {
    setGameResult(result);
    setPhase('result');
    setGameStatus('waiting');
  };

  // Continue to next game
  const handleContinue = () => {
    setPhase('setup');
    setBetParams(null);
    setUserBet(null);
    setGameResult(null);
    setMultiplier(1.0);
  };

  // Multiplier update effect
  useEffect(() => {
    if (phase !== 'active' || !currentRound) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newMultiplier = Math.pow(1.01, elapsed * 20);
      
      if (newMultiplier >= currentRound.crash_point) {
        // Crashed
        setMultiplier(currentRound.crash_point);
        clearInterval(interval);
        
        // End round
        fetch('/api/rounds', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundId: currentRound.id,
            status: 'crashed',
            endedAt: new Date().toISOString(),
          }),
        });

        // Check if user has active bet
        if (userBet && userBet.status === 'active') {
          // User lost
          setTimeout(() => {
            showResult({
              type: 'loss',
              multiplier: currentRound.crash_point,
              profit: -betParams!.amount,
              motivationMessage: getRandomMotivation('loss'),
            });
          }, 1000);
        }
      } else {
        setMultiplier(newMultiplier);
        
        // Auto cash-out check
        if (betParams?.autoCashout && newMultiplier >= betParams.autoCashout && userBet?.status === 'active') {
          handleCashout();
          clearInterval(interval);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, currentRound, startTime, userBet, betParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <GameLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />
      
      {/* Mode Badge */}
      <ModeBadge user={user} balance={balance} />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <motion.div 
          className="w-full max-w-4xl"
          layout
        >
          <AnimatePresence mode="wait">
            {/* Setup Phase */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BetSetup onStart={handleStart} />
              </motion.div>
            )}

            {/* Loading Phase */}
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[500px] flex items-center justify-center"
              >
                <LoadingAnimation />
              </motion.div>
            )}

            {/* Betting Phase */}
            {phase === 'betting' && (
              <motion.div
                key="betting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl font-bold text-gold"
                  >
                    Starting in a moment...
                  </motion.p>
                  <p className="text-cream/60 mt-2">Bet placed: {betParams?.amount} TND</p>
                </div>
              </motion.div>
            )}

            {/* Active Phase */}
            {phase === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <PlaneCanvas3D
                  multiplier={multiplier}
                  isActive={true}
                  isCrashed={false}
                  onManualCashout={betParams?.autoCashout ? undefined : handleCashout}
                  canCashout={userBet?.status === 'active'}
                />
              </motion.div>
            )}

            {/* Result Phase */}
            {phase === 'result' && gameResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GameResultEnhanced result={gameResult} onContinue={handleContinue} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Game History Panel */}
      {user && <GameHistoryPanel userId={user.id} />}
    </div>
  );
}
