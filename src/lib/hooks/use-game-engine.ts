'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface GameEngineState {
  currentRound: any | null;
  isLoading: boolean;
  error: string | null;
  placeBet: (amount: number, accountType: 'demo' | 'live') => Promise<void>;
  cashOut: () => Promise<void>;
  userBet: any | null;
}

/**
 * Game Engine Hook
 * Manages real-time crash game logic with Supabase
 */
export function useGameEngine(): GameEngineState {
  const [currentRound, setCurrentRound] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBet, setUserBet] = useState<any | null>(null);
  
  const store = useStore();
  const { setMultiplier, setGameStatus, setCurrentRound: setStoreRound, user } = store;
  
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Fetch current active round
  const fetchCurrentRound = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No active round, create a new one
        const response = await fetch('/api/rounds', {
          method: 'POST',
        });

        if (response.ok) {
          const { round } = await response.json();
          setCurrentRound(round);
          setStoreRound(round);
          setGameStatus('betting'); // New round starts with betting phase
        }
      } else {
        setCurrentRound(data);
        setStoreRound(data as any);
        // Map database status to game status
        if (data.status === 'pending') {
          setGameStatus('betting');
        } else if (data.status === 'active') {
          setGameStatus('active');
        } else {
          setGameStatus('waiting');
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching round:', err);
      setError('Failed to load game');
      setIsLoading(false);
    }
  }, [supabase, setGameStatus, setStoreRound]);

  // Calculate current multiplier based on round start time
  const calculateCurrentMultiplier = useCallback((round: any) => {
    if (!round || round.status !== 'active') {
      return 1.0;
    }

    const startTime = new Date(round.started_at).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / 1000; // seconds

    // Multiplier increases exponentially
    // Formula: 1.00 + (elapsed * 0.01) gives roughly linear increase
    // Adjust for exponential feel
    const multiplier = Math.pow(1.01, elapsed * 20);
    
    return Math.min(multiplier, round.crash_point || 100);
  }, []);

  // Update multiplier in real-time for active rounds
  useEffect(() => {
    if (currentRound?.status === 'active') {
      intervalRef.current = setInterval(() => {
        const mult = calculateCurrentMultiplier(currentRound);
        setMultiplier(mult);

        // Check if we've reached crash point
        if (mult >= currentRound.crash_point) {
          setGameStatus('crashed');
          setMultiplier(currentRound.crash_point);
          
          // Update round status to crashed
          fetch('/api/rounds', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roundId: currentRound.id,
              status: 'crashed',
              endedAt: new Date().toISOString(),
            }),
          });

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          // Start new round after 3 seconds
          setTimeout(() => {
            fetchCurrentRound();
          }, 3000);
        }
      }, 50); // Update every 50ms for smooth animation
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentRound, calculateCurrentMultiplier, setMultiplier, setGameStatus, fetchCurrentRound]);

  // Subscribe to Supabase Realtime for round updates
  useEffect(() => {
    channelRef.current = supabase
      .channel('rounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
        },
        (payload) => {
          console.log('Round update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setCurrentRound(payload.new);
            setStoreRound(payload.new as any);
            
            if (payload.new.status === 'pending') {
              setGameStatus('betting');
              setMultiplier(1.0);
            } else if (payload.new.status === 'active') {
              setGameStatus('active');
            } else if (payload.new.status === 'crashed') {
              setGameStatus('crashed');
              setMultiplier(payload.new.crash_point);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, setGameStatus, setMultiplier, setStoreRound]);

  // Place bet
  const placeBet = useCallback(async (amount: number, accountType: 'demo' | 'live') => {
    if (!currentRound) {
      toast.error('No active round');
      return;
    }

    // For live mode, require authentication
    if (!user && accountType === 'live') {
      toast.error('Please sign in to place live bets');
      return;
    }

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: currentRound.id,
          amount,
          accountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to place bet');
        return;
      }

      setUserBet(data.bet);
      toast.success(`Bet placed: ${amount.toFixed(2)} TND`);

      // Update balance in store
      if (accountType === 'demo' && !user) {
        // Demo mode without authentication - deduct from local balance
        const currentBalance = useStore.getState().balance;
        useStore.getState().updateBalance(currentBalance - amount);
      } else if (user) {
        // Authenticated user - update from API response
        const newUser = { ...user };
        if (accountType === 'demo') {
          newUser.demo_balance = data.newBalance;
        } else {
          newUser.live_balance = data.newBalance;
        }
        useStore.getState().setUser(newUser);
      }
    } catch (err) {
      console.error('Error placing bet:', err);
      toast.error('Failed to place bet');
    }
  }, [currentRound, user]);

  // Cash out
  const cashOut = useCallback(async () => {
    if (!userBet) {
      toast.error('No active bet');
      return;
    }

    if (!currentRound || currentRound.status !== 'active') {
      toast.error('Cannot cash out now');
      return;
    }

    const currentMultiplier = calculateCurrentMultiplier(currentRound);

    try {
      const response = await fetch('/api/bets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId: userBet.id,
          cashoutAt: currentMultiplier,
          amount: userBet.amount, // Needed for demo mode profit calculation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to cash out');
        return;
      }

      toast.success(`Cashed out at ${currentMultiplier.toFixed(2)}x! Won ${data.profit.toFixed(2)} TND`);
      setUserBet(null);

      // Update balance in store
      if (userBet.account_type === 'demo' && !user) {
        // Demo mode without authentication - add winnings to local balance
        const currentBalance = useStore.getState().balance;
        useStore.getState().updateBalance(currentBalance + data.totalPayout);
      } else if (user) {
        // Authenticated user - update from API response
        const newUser = { ...user };
        if (userBet.account_type === 'demo') {
          newUser.demo_balance = data.newBalance;
        } else {
          newUser.live_balance = data.newBalance;
        }
        useStore.getState().setUser(newUser);
      }
    } catch (err) {
      console.error('Error cashing out:', err);
      toast.error('Failed to cash out');
    }
  }, [userBet, currentRound, calculateCurrentMultiplier]);

  // Initial load
  useEffect(() => {
    fetchCurrentRound();
  }, [fetchCurrentRound]);

  return {
    currentRound,
    isLoading,
    error,
    placeBet,
    cashOut,
    userBet,
  };
}
