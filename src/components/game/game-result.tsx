'use client';

import { motion } from 'framer-motion';
import type { GameResult } from '@/types/game-phases';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface GameResultProps {
  result: GameResult;
  onContinue: () => void;
}

const motivationMessages = {
  win: [
    "Outstanding! Keep riding that wave! 🌊",
    "Incredible timing! You're on fire! 🔥",
    "Perfect cash-out! Trust your instincts! ⭐",
    "What a win! Fortune favors the bold! 💎",
    "Brilliant play! You're mastering this! 🎯"
  ],
  loss: [
    "Almost there! Next round is yours! 💪",
    "Great attempt! Success is just ahead! 🚀",
    "Keep going! Every legend faces setbacks! 🌟",
    "So close! Your big win is coming! ⚡",
    "Don't stop now! Victory awaits! 🎯"
  ]
};

export function GameResult({ result, onContinue }: GameResultProps) {
  const isWin = result.type === 'win';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      {/* Result Animation */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 10 }}
        className="text-center space-y-4"
      >
        {/* Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: isWin ? [0, 10, -10, 0] : [0, -5, 5, 0]
          }}
          transition={{ duration: 0.5, repeat: 3 }}
          className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            isWin 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : 'bg-gradient-to-br from-orange-500 to-red-600'
          }`}
        >
          {isWin ? (
            <Trophy className="w-12 h-12 text-white" />
          ) : (
            <Target className="w-12 h-12 text-white" />
          )}
        </motion.div>

        {/* Result Text */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-bold ${
              isWin ? 'text-green-500' : 'text-orange-500'
            }`}
          >
            {isWin ? 'YOU WON!' : 'CRASHED!'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-cream mt-2"
          >
            {result.multiplier.toFixed(2)}x
          </motion.p>
        </div>

        {/* Profit/Loss */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-6 rounded-xl ${
            isWin 
              ? 'bg-green-500/20 border-2 border-green-500/50' 
              : 'bg-orange-500/20 border-2 border-orange-500/50'
          }`}
        >
          <p className="text-sm text-cream/60 mb-1">
            {isWin ? 'Profit' : 'Loss'}
          </p>
          <p className={`text-3xl font-bold ${
            isWin ? 'text-green-500' : 'text-orange-500'
          }`}>
            {isWin ? '+' : ''}{result.profit.toFixed(2)} TND
          </p>
        </motion.div>

        {/* Motivation Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="p-4 bg-gold/10 border border-gold/30 rounded-lg"
        >
          <p className="text-gold font-semibold">
            {result.motivationMessage}
          </p>
        </motion.div>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="w-full py-5 bg-gradient-to-r from-gold to-yellow-500 text-navy text-xl font-bold rounded-xl shadow-lg hover:shadow-gold/50"
      >
        Play Again
      </motion.button>
    </motion.div>
  );
}

export function getRandomMotivation(type: 'win' | 'loss'): string {
  const messages = motivationMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
