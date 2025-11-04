'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/analytics/calculations';
import { motion } from 'framer-motion';

interface Player {
  rank: number;
  userId: string;
  email: string;
  displayName: string;
  totalWagered: number;
  totalProfit: number;
  netProfit: number;
  betCount: number;
  winRate: number;
  avgBet: number;
}

interface TopPlayersTableProps {
  period: string;
}

export default function TopPlayersTable({ period }: TopPlayersTableProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, [period]);

  async function fetchPlayers() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/analytics/top-players?period=${period}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Error fetching top players:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-cream/40">
        Aucun joueur actif
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => (
        <motion.div
          key={player.userId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-3 bg-navy/30 rounded-lg hover:bg-navy/50 transition-colors"
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
            {player.rank === 1 ? (
              <Trophy className="w-6 h-6 text-yellow-400" />
            ) : player.rank === 2 ? (
              <Trophy className="w-6 h-6 text-gray-400" />
            ) : player.rank === 3 ? (
              <Trophy className="w-6 h-6 text-amber-600" />
            ) : (
              <span className="text-cream/60 font-semibold">
                #{player.rank}
              </span>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-cream font-medium truncate">
                {player.displayName}
              </p>
              {player.netProfit > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-cream/40 truncate">{player.email}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            {/* Total Wagered */}
            <div className="text-right">
              <p className="text-cream font-semibold">
                {formatCurrency(player.totalWagered)}
              </p>
              <p className="text-xs text-cream/40">Misé</p>
            </div>

            {/* Win Rate */}
            <div className="text-right">
              <p
                className={`font-semibold ${
                  player.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatPercentage(player.winRate, 1)}
              </p>
              <p className="text-xs text-cream/40">Victoires</p>
            </div>

            {/* Bet Count */}
            <div className="text-right">
              <p className="text-cream font-semibold">{player.betCount}</p>
              <p className="text-xs text-cream/40">Paris</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
