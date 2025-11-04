'use client';

import { motion } from 'framer-motion';
import { Rocket, TrendingUp, Zap } from 'lucide-react';

interface GameLoaderProps {
  message?: string;
}

export function GameLoader({ message = 'Loading Game Engine...' }: GameLoaderProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Rocket */}
        <div className="relative">
          <motion.div
            animate={{
              y: [-10, 10, -10],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <Rocket className="h-24 w-24 text-gold" />
            
            {/* Rocket Trail */}
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-b from-yellow-400/50 to-transparent blur-md" />
            </motion.div>
          </motion.div>

          {/* Orbiting Icons */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <TrendingUp className="absolute -top-8 left-1/2 -translate-x-1/2 h-6 w-6 text-green-400" />
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Zap className="absolute top-1/2 -right-8 -translate-y-1/2 h-6 w-6 text-yellow-400" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <motion.p
            className="text-lg font-semibold text-cream"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            {message}
          </motion.p>
          
          {/* Loading Bar */}
          <div className="w-64 h-1 bg-yellow-500/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gold"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -60],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-6 py-3"
        >
          <p className="text-xs text-cream/60 text-center">
            💡 Tip: Set an auto cash-out to secure your winnings!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
