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
import { SimplifiedCanvas } from '@/components/game/simplified-canvas';
import { GameResult, getRandomMotivation } from '@/components/game/game-result';
import { ModeBadge } from '@/components/game/mode-badge';
import { GamePhase, BetParameters, GameResult as GameResultType } from '@/types/game-phases';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function GamePageRedesigned() {
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

    // Show loading for 1.5 seconds
    setTimeout(async () => {
      const round = await fetchRound();
      if (!round) {
        toast.error('Failed to start game');
        setPhase('setup');
        return;
      }

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
        const waitTime = Math.max(0, 5000 - pendingTime);
        
        setTimeout(() => {
          startRound(round.id);
        }, waitTime);
      } else {
        startActivePhase(round);
      }
    }, 1500);
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
    if (!userBet || !currentRound) return;

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
      const profit = data.payout - betParams!.amount;
      
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
        profit: profit,
        motivationMessage: getRandomMotivation('win'),
      });
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
                <SimplifiedCanvas
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
                <GameResult result={gameResult} onContinue={handleContinue} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
