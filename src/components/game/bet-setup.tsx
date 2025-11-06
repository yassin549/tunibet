'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BetParameters } from '@/types/game-phases';
import { useStore } from '@/stores/useStore';

interface BetSetupProps {
  onStart: (params: BetParameters) => void;
}

export function BetSetup({ onStart }: BetSetupProps) {
  const { balance } = useStore();
  const [amount, setAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState<number | null>(2.0);

  const quickAmounts = [5, 10, 25, 50, 100];
  const quickMultipliers = [1.5, 2.0, 3.0, 5.0, null];

  const handleStart = () => {
    if (amount > balance) return;
    onStart({ amount, autoCashout });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      {/* Balance Display */}
      <div className="text-center space-y-2">
        <p className="text-sm text-cream/60">Your Balance</p>
        <p className="text-4xl font-bold text-gold">{balance.toFixed(2)} TND</p>
      </div>

      {/* Bet Amount */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-cream">Bet Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-4 bg-navy/50 border-2 border-gold/30 rounded-xl text-center text-2xl font-bold text-gold focus:border-gold focus:outline-none"
            min="1"
            max={balance}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/60 font-semibold">TND</span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          {quickAmounts.map((qty) => (
            <button
              key={qty}
              onClick={() => setAmount(qty)}
              disabled={qty > balance}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                amount === qty
                  ? 'bg-gold text-navy'
                  : 'bg-navy/50 text-cream/60 hover:bg-navy/70'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Cash-out */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-cream">Auto Cash-out Multiplier</label>
        <div className="flex gap-2">
          {quickMultipliers.map((mult) => (
            <button
              key={mult ?? 'manual'}
              onClick={() => setAutoCashout(mult)}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                autoCashout === mult
                  ? 'bg-gold text-navy'
                  : 'bg-navy/50 text-cream/60 hover:bg-navy/70'
              }`}
            >
              {mult ? `${mult}x` : 'Manual'}
            </button>
          ))}
        </div>
        {autoCashout && (
          <p className="text-xs text-center text-cream/60">
            Auto cash-out at {autoCashout}x = {(amount * autoCashout).toFixed(2)} TND
          </p>
        )}
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        disabled={amount > balance || amount < 1}
        className="w-full py-5 bg-gradient-to-r from-gold to-yellow-500 text-navy text-xl font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-gold/50"
      >
        Start Game
      </motion.button>
    </motion.div>
  );
}
