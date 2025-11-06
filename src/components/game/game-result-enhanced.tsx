'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameResult } from '@/types/game-phases';
import { Trophy, TrendingUp, Target, Sparkles, Zap } from 'lucide-react';

interface GameResultEnhancedProps {
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

export function GameResultEnhanced({ result, onContinue }: GameResultEnhancedProps) {
  const isWin = result.type === 'win';
  
  // Trigger confetti for wins
  useEffect(() => {
    if (isWin && typeof window !== 'undefined') {
      // Create multiple confetti bursts
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Create confetti from random positions
        if (window.confetti) {
          window.confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          window.confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isWin]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="w-full max-w-2xl mx-auto space-y-8 relative"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {isWin ? (
          <>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/20 rounded-full blur-3xl"
            />
          </>
        ) : (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-3xl"
          />
        )}
      </div>

      {/* Result Animation */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 10 }}
        className="text-center space-y-6"
      >
        {/* Icon with Particles */}
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: isWin ? [0, 10, -10, 0] : [0, -5, 5, 0]
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-2xl ${
              isWin 
                ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-green-600' 
                : 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600'
            }`}
          >
            {isWin ? (
              <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
            ) : (
              <Target className="w-16 h-16 text-white drop-shadow-lg" />
            )}
          </motion.div>

          {/* Floating particles around icon */}
          {isWin && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [-20, -40, -20],
                    x: [
                      Math.cos((i * 60 * Math.PI) / 180) * 60,
                      Math.cos((i * 60 * Math.PI) / 180) * 80,
                      Math.cos((i * 60 * Math.PI) / 180) * 60,
                    ],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <Sparkles className="w-6 h-6 text-gold" />
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Result Text */}
        <div>
          <motion.h2
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 10 }}
            className={`text-6xl md:text-7xl font-black mb-4 ${
              isWin ? 'text-green-500' : 'text-orange-500'
            }`}
            style={{
              textShadow: isWin 
                ? '0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5)' 
                : '0 0 30px rgba(249, 115, 22, 0.8)',
            }}
          >
            {isWin ? '🎉 YOU WON! 🎉' : '💥 CRASHED! 💥'}
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.p
              animate={isWin ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-5xl font-black text-cream"
            >
              {result.multiplier.toFixed(2)}x
            </motion.p>
            {isWin && (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-10 h-10 text-gold" fill="currentColor" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Profit/Loss Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className={`p-8 rounded-2xl shadow-2xl ${
            isWin 
              ? 'bg-gradient-to-br from-green-500/30 via-green-500/20 to-emerald-500/30 border-4 border-green-500/50' 
              : 'bg-gradient-to-br from-orange-500/30 via-red-500/20 to-red-500/30 border-4 border-orange-500/50'
          }`}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-sm text-cream/80 mb-2 font-semibold uppercase tracking-wider"
          >
            {isWin ? '💰 Profit' : '💸 Loss'}
          </motion.p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', damping: 8 }}
            className={`text-6xl font-black ${
              isWin ? 'text-green-400' : 'text-orange-400'
            }`}
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {isWin ? '+' : ''}{Math.abs(result.profit).toFixed(2)} TND
          </motion.p>

          {/* Percentage gain/loss */}
          {isWin && result.profit > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-4 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                +{((result.multiplier - 1) * 100).toFixed(0)}% gain
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Motivation Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className={`p-6 rounded-xl border-2 ${
            isWin
              ? 'bg-gold/20 border-gold/50'
              : 'bg-blue-500/20 border-blue-500/50'
          }`}
        >
          <motion.p
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-xl font-bold ${
              isWin ? 'text-gold' : 'text-blue-400'
            }`}
          >
            {result.motivationMessage}
          </motion.p>
        </motion.div>

        {/* Streak Indicator */}
        {isWin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center justify-center gap-2"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="text-3xl"
              >
                🔥
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(212, 175, 55, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full py-6 bg-gradient-to-r from-gold via-yellow-500 to-gold text-navy text-2xl font-black rounded-2xl shadow-2xl hover:shadow-gold/50 relative overflow-hidden group"
      >
        {/* Shine effect */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        />
        
        <span className="relative">
          🎮 Play Again
        </span>
      </motion.button>
    </motion.div>
  );
}

export function getRandomMotivation(type: 'win' | 'loss'): string {
  const messages = motivationMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
