'use client';

import { motion } from 'framer-motion';
import { User } from '@/stores/useStore';

interface ModeBadgeProps {
  user: User | null;
  balance: number;
}

export function ModeBadge({ user, balance }: ModeBadgeProps) {
  if (!user) return null;

  const isVirtual = user.balance_type === 'virtual';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div
        className={`rounded-2xl border-2 p-4 backdrop-blur-sm shadow-xl ${
          isVirtual
            ? 'bg-green-500/90 border-green-400'
            : 'bg-gold/90 border-yellow-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-3xl">
            {isVirtual ? '🎮' : '💰'}
          </span>
          <div>
            <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              {isVirtual ? 'Mode Virtuel' : 'Mode Réel'}
            </p>
            <p className="text-2xl font-bold text-white">
              {balance.toFixed(2)} <span className="text-sm">TND</span>
            </p>
          </div>
        </div>
        
        {isVirtual && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-2"
          >
            <p className="text-xs text-white/90 text-center">
              Cliquez pour passer en mode réel
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
