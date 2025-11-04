'use client';

import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { Trophy, TrendingUp, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  username: string;
  profit: number;
  wins: number;
}

export function GameStats() {
  // Mock leaderboard data (will be replaced with real data in Prompt 5)
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'CryptoKing', profit: 15420.50, wins: 234 },
    { rank: 2, username: 'LuckyPlayer', profit: 12890.25, wins: 189 },
    { rank: 3, username: 'ProGamer', profit: 10567.80, wins: 156 },
    { rank: 4, username: 'MoonShot', profit: 8934.15, wins: 142 },
    { rank: 5, username: 'DiamondHands', profit: 7821.90, wins: 128 },
  ];

  const stats = [
    {
      icon: Users,
      label: 'Joueurs en ligne',
      value: '47',
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      label: 'Plus gros gain',
      value: '25,430 TND',
      color: 'text-green-500',
    },
    {
      icon: Target,
      label: 'Rounds aujourd\'hui',
      value: '1,234',
      color: 'text-gold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CardClassic variant="glass">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-navy/60 dark:text-cream/60">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-navy dark:text-cream">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </CardClassic>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <CardClassic variant="cream">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-gold" />
            <CardTitle>Classement du Jour</CardTitle>
          </div>
          <CardDescription>
            Top 5 des joueurs avec les meilleurs profits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center justify-between p-4 rounded-xl
                  ${entry.rank === 1 ? 'bg-gold/20 border-2 border-gold' : 'bg-navy/5 dark:bg-cream/5'}
                  hover:scale-102 transition-transform
                `}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center font-bold
                    ${entry.rank === 1 ? 'bg-gold text-navy' : ''}
                    ${entry.rank === 2 ? 'bg-gray-400 text-white' : ''}
                    ${entry.rank === 3 ? 'bg-amber-600 text-white' : ''}
                    ${entry.rank > 3 ? 'bg-navy/20 dark:bg-cream/20 text-navy dark:text-cream' : ''}
                  `}>
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                    {entry.rank > 3 && entry.rank}
                  </div>

                  {/* Username */}
                  <div>
                    <p className="font-bold text-navy dark:text-cream">
                      {entry.username}
                    </p>
                    <p className="text-sm text-navy/60 dark:text-cream/60">
                      {entry.wins} victoires
                    </p>
                  </div>
                </div>

                {/* Profit */}
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{entry.profit.toFixed(2)} TND
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View Full Leaderboard */}
          <div className="mt-4 text-center">
            <button className="text-sm font-medium text-gold hover:text-gold/80 transition-colors">
              Voir le classement complet →
            </button>
          </div>
        </CardContent>
      </CardClassic>
    </div>
  );
}
