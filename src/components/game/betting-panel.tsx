'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { useGameEngine } from '@/lib/hooks/use-game-engine';
import { ButtonGold } from '@/components/ui/button-gold';
import { BetSlider } from '@/components/ui/bet-slider';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export function BettingPanel() {
  const { balance, gameStatus, multiplier, settings, updateSettings, user } = useStore();
  const { placeBet, cashOut, userBet } = useGameEngine();
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState<number | null>(settings.autoCashout);

  // Auto cash out logic
  useEffect(() => {
    if (autoCashout && userBet && gameStatus === 'active' && multiplier >= autoCashout) {
      handleCashOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCashout, userBet, gameStatus, multiplier]);

  const handlePlaceBet = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }

    if (betAmount < 1) {
      toast.error('Minimum bet: 1 TND');
      return;
    }

    if (gameStatus !== 'betting' && gameStatus !== 'waiting') {
      toast.error('Betting is closed for this round');
      return;
    }

    // Determine account type: if user is authenticated, use their balance_type, otherwise default to 'demo'
    const accountType = user?.balance_type === 'real' ? 'live' : 'demo';
    await placeBet(betAmount, accountType);
  };

  const handleCashOut = async () => {
    if (!userBet) {
      toast.error('No active bet');
      return;
    }

    if (gameStatus !== 'active') {
      toast.error('Round is not active');
      return;
    }

    await cashOut();
  };

  const handleAutoCashoutChange = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 1.01) {
      setAutoCashout(null);
      updateSettings({ autoCashout: null });
    } else {
      setAutoCashout(num);
      updateSettings({ autoCashout: num });
    }
  };

  const canPlaceBet = (gameStatus === 'betting' || gameStatus === 'waiting') && !userBet;
  const canCashOut = gameStatus === 'active' && userBet;

  return (
    <CardClassic variant="glass">
      <CardHeader>
        <CardTitle>Betting Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bet Amount Slider */}
        <div>
          <BetSlider
            value={betAmount}
            onChange={setBetAmount}
            min={1}
            max={Math.min(balance, 1000)}
            multiplier={multiplier}
          />
        </div>

        {/* Auto Cash Out */}
        <div className="space-y-2">
          <Label htmlFor="autoCashout" className="text-sm font-medium text-navy dark:text-cream">
            Auto Cash Out (optional)
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="autoCashout"
              type="number"
              min="1.01"
              step="0.01"
              value={autoCashout || ''}
              onChange={(e) => handleAutoCashoutChange(e.target.value)}
              placeholder="Ex: 2.00"
              className="flex-1"
            />
            <span className="text-sm font-medium text-navy/70 dark:text-cream/70">x</span>
          </div>
          <p className="text-xs text-navy/60 dark:text-cream/60">
            Automatically cash out at this multiplier
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Place Bet Button */}
          <ButtonGold
            variant="primary"
            size="lg"
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
            className="w-full"
          >
            {userBet ? '✓ Bet Placed' : '💰 Place Bet'}
          </ButtonGold>

          {/* Cash Out Button */}
          <ButtonGold
            variant="crash"
            size="lg"
            onClick={handleCashOut}
            disabled={!canCashOut}
            className="w-full"
          >
            {canCashOut ? `💸 Cash Out (${multiplier.toFixed(2)}x)` : '⏳ Waiting...'}
          </ButtonGold>
        </div>

        {/* Current Bet Info */}
        {userBet && (
          <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-navy/70 dark:text-cream/70">Current bet:</span>
              <span className="text-lg font-bold text-navy dark:text-cream">
                {userBet.amount.toFixed(2)} TND
              </span>
            </div>
            {gameStatus === 'active' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/70 dark:text-cream/70">Multiplier:</span>
                  <span className="text-lg font-bold text-gold">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/70 dark:text-cream/70">Potential win:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {(userBet.amount * multiplier).toFixed(2)} TND
                  </span>
                </div>
              </>
            )}
            {autoCashout && (
              <div className="flex justify-between items-center pt-2 border-t border-gold/20">
                <span className="text-xs text-navy/60 dark:text-cream/60">Auto cash out:</span>
                <span className="text-sm font-medium text-gold">
                  {autoCashout.toFixed(2)}x
                </span>
              </div>
            )}
          </div>
        )}

        {/* Balance Display */}
        <div className="rounded-xl bg-navy/5 dark:bg-cream/5 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-navy/70 dark:text-cream/70">
              Available balance:
            </span>
            <span className="text-xl font-bold text-gold">
              {balance.toFixed(2)} TND
            </span>
          </div>
        </div>
      </CardContent>
    </CardClassic>
  );
}
