'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface AnonymousBannerProps {
  gamesRemaining: number;
}

export function AnonymousBanner({ gamesRemaining }: AnonymousBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="rounded-xl border-2 border-gold/30 bg-gradient-to-r from-gold/10 to-yellow-500/10 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="font-bold text-navy dark:text-cream">
                Anonymous Mode
              </p>
              <p className="text-sm text-navy/70 dark:text-cream/70">
                {gamesRemaining > 0 ? (
                  <>
                    <span className="font-semibold text-gold">{gamesRemaining}</span>{' '}
                    {gamesRemaining === 1 ? 'game remaining' : 'games remaining'}
                  </>
                ) : (
                  'Limit reached'
                )}
              </p>
            </div>
          </div>

          <Link
            href="/auth/signup"
            className="px-4 py-2 rounded-lg bg-gold hover:bg-gold/90 text-navy font-semibold text-sm transition-colors whitespace-nowrap"
          >
            Create Account
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
